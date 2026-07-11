import { randomUUID } from 'node:crypto';
import type { Database } from 'better-sqlite3';
import type { Logger } from 'pino';

// Storage-owned input types. These are structurally compatible with the
// Marketplace NormalizedProduct / research-session shapes, so callers can pass
// their objects directly without Storage importing Marketplace code.
export type ResearchSessionInput = {
  id: string;
  keyword: string;
  marketplace: string;
  status: string;
  aiProvider?: string | null;
  aiModel?: string | null;
  startedAt: string;
  completedAt?: string | null;
  reportId?: string | null;
};

export type ProductInput = {
  title: string;
  url: string;
  artistName: string | null;
  description: string | null;
  productType: string | null;
  price: number | null;
  currency: string | null;
  imageUrls: string[];
  tags: string[];
};

export type SaveResult = {
  sessionId: string;
  productCount: number;
};

// Data Persistence stage (Doc 008 §12, §17): write a research session and its
// products, images, and tags to SQLite atomically. All inserts run inside a
// single transaction so a failure leaves nothing partially stored. Product,
// image, and tag ids are generated here; the session id is supplied by the
// caller. Statistics, AI analysis, and reports are out of scope.
export function saveResearchData(
  db: Database,
  session: ResearchSessionInput,
  products: ProductInput[],
  logger: Logger,
): SaveResult {
  const insertSession = db.prepare(
    `INSERT INTO research_sessions
       (id, keyword, marketplace, status, ai_provider, ai_model, started_at, completed_at, report_id)
     VALUES
       (@id, @keyword, @marketplace, @status, @aiProvider, @aiModel, @startedAt, @completedAt, @reportId)`,
  );
  const insertProduct = db.prepare(
    `INSERT INTO products
       (id, session_id, title, product_url, artist_name, description, product_type, price, currency, created_at)
     VALUES
       (@id, @sessionId, @title, @url, @artistName, @description, @productType, @price, @currency, @createdAt)`,
  );
  const insertImage = db.prepare(
    `INSERT INTO product_images (id, product_id, image_url, local_path, display_order)
     VALUES (@id, @productId, @imageUrl, @localPath, @displayOrder)`,
  );
  const insertTag = db.prepare(
    `INSERT INTO product_tags (id, product_id, tag)
     VALUES (@id, @productId, @tag)`,
  );

  const writeAll = db.transaction(() => {
    insertSession.run({
      id: session.id,
      keyword: session.keyword,
      marketplace: session.marketplace,
      status: session.status,
      aiProvider: session.aiProvider ?? null,
      aiModel: session.aiModel ?? null,
      startedAt: session.startedAt,
      completedAt: session.completedAt ?? null,
      reportId: session.reportId ?? null,
    });

    const createdAt = new Date().toISOString();
    for (const product of products) {
      const productId = randomUUID();
      insertProduct.run({
        id: productId,
        sessionId: session.id,
        title: product.title,
        url: product.url,
        artistName: product.artistName,
        description: product.description,
        productType: product.productType,
        price: product.price,
        currency: product.currency,
        createdAt,
      });

      product.imageUrls.forEach((imageUrl, index) => {
        insertImage.run({
          id: randomUUID(),
          productId,
          imageUrl,
          localPath: null,
          displayOrder: index,
        });
      });

      for (const tag of product.tags) {
        insertTag.run({ id: randomUUID(), productId, tag });
      }
    }
  });

  logger.info({ operation: 'persistence' }, 'Database transaction started');
  try {
    writeAll();
    logger.info({ operation: 'persistence' }, 'Database transaction committed');
    return { sessionId: session.id, productCount: products.length };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    logger.error({ operation: 'persistence', error: detail }, 'Database transaction rolled back');
    logger.error({ operation: 'persistence', error: detail }, 'Database error');
    throw error;
  }
}
