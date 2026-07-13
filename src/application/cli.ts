// Headless data-only CLI: the bridge surface consumed by POD OS.
//
//   node dist-electron/src/application/cli.js research "<keyword>" \
//        [--iaCode u-tees] [--sort "top selling"] [--max 24] [--no-velocity]
//
// Emits NDJSON on stdout:
//   {"t":"progress","stage":"searching"} …
//   {"t":"result","data":{…}}            (exit 0)
//   {"t":"error","message":"…"}          (exit 1)
//
// Runs NO AI (the caller owns interpretation), but DOES persist the collected
// session into MRL's own database so the research remains visible in MRL's
// History for future reference. Persistence is best-effort: the native SQLite
// module is loaded lazily, and any failure (e.g. an ABI mismatch) degrades to
// a "warning" event — collected data is always delivered regardless.
import { join } from 'node:path';
import { collectProducts, PRODUCT_CATEGORIES, type SortOrder } from '../marketplace/collect';
import { scoutProducts } from '../marketplace/scout';
import { computeTrendVelocity } from '../research/velocity';
import { validateKeyword } from '../research/keyword';
import { createResearchSession, completeResearchSession } from '../research/session';
import type { NormalizedProduct } from '../marketplace/normalization';
import { createLogger, flushLogger } from '../shared/logger';
import type { Logger } from 'pino';

const emit = (event: object): void => {
  process.stdout.write(`${JSON.stringify(event)}\n`);
};

function parseArgs(argv: string[]): {
  command: string;
  keyword: string;
  iaCode: string;
  sortOrder: SortOrder;
  maxProducts: number | undefined;
  velocity: boolean;
} {
  const [command, keyword, ...rest] = argv;
  const flags = new Map<string, string>();
  let velocity = true;
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === '--no-velocity') {
      velocity = false;
    } else if (rest[i].startsWith('--')) {
      flags.set(rest[i].slice(2), rest[i + 1] ?? '');
      i += 1;
    }
  }
  const max = flags.get('max');
  return {
    command: command ?? '',
    keyword: keyword ?? '',
    iaCode: flags.get('iaCode') ?? 'all-departments',
    sortOrder: (flags.get('sort') as SortOrder) ?? 'top selling',
    maxProducts: max ? Number(max) : undefined,
    velocity,
  };
}

// Saves the collected session into MRL's history (status 'completed', marked
// as a POD OS bridge run via the ai_provider/ai_model columns). Lazy-requires
// the storage layer so a native-module failure never loses the collection.
function tryPersistHistory(
  mrlRoot: string,
  keyword: string,
  productTypeLabel: string,
  sortOrder: string,
  products: NormalizedProduct[],
  logger: Logger,
): { sessionId: string | null; warning: string | null } {
  try {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const { initializeDatabase } = require('../storage/initialize') as typeof import('../storage/initialize');
    const { closeDatabase } = require('../storage/database') as typeof import('../storage/database');
    const { saveResearchData } = require('../storage/persistence') as typeof import('../storage/persistence');
    /* eslint-enable @typescript-eslint/no-var-requires */

    const db = initializeDatabase(join(mrlRoot, 'storage', 'marketplace-research-lab.db'), logger);
    try {
      const session = completeResearchSession(
        createResearchSession(keyword, 'Redbubble', 'pod-os', 'bridge', productTypeLabel, sortOrder),
      );
      saveResearchData(db, session, products, logger);
      return { sessionId: session.id, warning: null };
    } finally {
      closeDatabase(db);
    }
  } catch (error) {
    return {
      sessionId: null,
      warning: `history not saved: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`,
    };
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.command !== 'research' || !args.keyword) {
    emit({ t: 'error', message: 'Usage: cli.js research "<keyword>" [--iaCode <code>] [--sort <order>] [--max <n>] [--no-velocity]' });
    process.exit(1);
  }

  const validation = validateKeyword(args.keyword);
  if (!validation.valid) {
    emit({ t: 'error', message: `Invalid keyword: ${validation.reason}` });
    process.exit(1);
  }

  // Logs go to MRL's own logs directory regardless of the caller's cwd.
  const mrlRoot = join(__dirname, '..', '..', '..');
  const logger = createLogger('cli', join(mrlRoot, 'logs'));

  try {
    const products = await collectProducts(
      validation.keyword,
      logger,
      { iaCode: args.iaCode, sortOrder: args.sortOrder, maxProducts: args.maxProducts },
      (stage) => emit({ t: 'progress', stage }),
    );

    let velocity = null;
    if (args.velocity && products.length > 0) {
      emit({ t: 'progress', stage: 'assessing-trend' });
      try {
        const recentSample = await scoutProducts(validation.keyword, logger, {
          iaCode: args.iaCode,
          sortOrder: 'recent',
        });
        velocity = computeTrendVelocity(products, recentSample);
      } catch {
        // Velocity is best-effort; the collected data is still delivered.
      }
    }

    const productTypeLabel =
      PRODUCT_CATEGORIES.find((category) => category.iaCode === args.iaCode)?.label ?? args.iaCode;

    emit({ t: 'progress', stage: 'saving-history' });
    const persisted = tryPersistHistory(
      mrlRoot,
      validation.keyword,
      productTypeLabel,
      args.sortOrder,
      products,
      logger,
    );
    if (persisted.warning) {
      emit({ t: 'warning', message: persisted.warning });
    }

    emit({
      t: 'result',
      data: {
        marketplace: 'Redbubble',
        keyword: validation.keyword,
        iaCode: args.iaCode,
        productType: productTypeLabel,
        sortOrder: args.sortOrder,
        collectedAt: new Date().toISOString(),
        sessionId: persisted.sessionId,
        historySaved: persisted.sessionId !== null,
        products: products.map((product) => ({
          rank: product.rank,
          title: product.title,
          url: product.url,
          artistName: product.artistName,
          artistPortfolio: product.artistDesignCount,
          availableOn: product.availableProducts,
          price: product.price,
          currency: product.currency,
          productType: product.productType,
          tags: product.tags,
          imageUrls: product.imageUrls,
          description: product.description,
        })),
        velocity,
      },
    });
    await flushLogger(logger).catch(() => undefined);
    process.exit(0);
  } catch (error) {
    emit({ t: 'error', message: error instanceof Error ? error.message : String(error) });
    await flushLogger(logger).catch(() => undefined);
    process.exit(1);
  }
}

void main();
