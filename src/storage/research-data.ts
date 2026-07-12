import type { Database } from 'better-sqlite3';

// Read side of the Storage module: loads a complete research session tree for
// report generation (Doc 010 §5 "Load Structured Data / Load AI Analysis").
// Rows are returned as stored; presence validation is the consumer's concern
// (Doc 010 §11).
export type StoredSession = {
  id: string;
  keyword: string;
  marketplace: string;
  status: string;
  aiProvider: string;
  aiModel: string;
  startedAt: string;
  completedAt: string | null;
};

export type StoredProduct = {
  id: string;
  title: string;
  productUrl: string;
  artistName: string | null;
  description: string | null;
  productType: string | null;
  price: number | null;
  currency: string | null;
  images: { imageUrl: string; localPath: string | null; displayOrder: number | null }[];
  tags: string[];
  statistics: { favorites: number | null; availableProducts: number | null } | null;
};

export type StoredAnalysis = {
  provider: string;
  model: string;
  prompt: string;
  response: string;
  generatedAt: string;
};

export type ResearchData = {
  session: StoredSession | null;
  products: StoredProduct[];
  analysis: StoredAnalysis | null;
};

export function loadResearchData(db: Database, sessionId: string): ResearchData {
  const sessionRow = db
    .prepare('SELECT * FROM research_sessions WHERE id = ?')
    .get(sessionId) as Record<string, unknown> | undefined;

  const session: StoredSession | null = sessionRow
    ? {
        id: sessionRow.id as string,
        keyword: sessionRow.keyword as string,
        marketplace: sessionRow.marketplace as string,
        status: sessionRow.status as string,
        aiProvider: sessionRow.ai_provider as string,
        aiModel: sessionRow.ai_model as string,
        startedAt: sessionRow.started_at as string,
        completedAt: (sessionRow.completed_at as string | null) ?? null,
      }
    : null;

  // rowid order preserves insertion order, which is collection order
  // (Doc 010 §6 Section 3: display products in collection order).
  const productRows = db
    .prepare('SELECT * FROM products WHERE session_id = ? ORDER BY rowid')
    .all(sessionId) as Record<string, unknown>[];

  const imageStmt = db.prepare(
    'SELECT image_url, local_path, display_order FROM product_images WHERE product_id = ? ORDER BY display_order',
  );
  const tagStmt = db.prepare('SELECT tag FROM product_tags WHERE product_id = ? ORDER BY rowid');
  const statsStmt = db.prepare(
    'SELECT favorites, available_products FROM product_statistics WHERE product_id = ?',
  );

  const products: StoredProduct[] = productRows.map((row) => {
    const stats = statsStmt.get(row.id) as
      | { favorites: number | null; available_products: number | null }
      | undefined;
    return {
      id: row.id as string,
      title: row.title as string,
      productUrl: row.product_url as string,
      artistName: (row.artist_name as string | null) ?? null,
      description: (row.description as string | null) ?? null,
      productType: (row.product_type as string | null) ?? null,
      price: (row.price as number | null) ?? null,
      currency: (row.currency as string | null) ?? null,
      images: (imageStmt.all(row.id) as { image_url: string; local_path: string | null; display_order: number | null }[]).map(
        (img) => ({ imageUrl: img.image_url, localPath: img.local_path, displayOrder: img.display_order }),
      ),
      tags: (tagStmt.all(row.id) as { tag: string }[]).map((t) => t.tag),
      statistics: stats
        ? { favorites: stats.favorites, availableProducts: stats.available_products }
        : null,
    };
  });

  const analysisRow = db
    .prepare('SELECT * FROM ai_analysis WHERE session_id = ? ORDER BY rowid DESC LIMIT 1')
    .get(sessionId) as Record<string, unknown> | undefined;

  const analysis: StoredAnalysis | null = analysisRow
    ? {
        provider: analysisRow.provider as string,
        model: analysisRow.model as string,
        prompt: analysisRow.prompt as string,
        response: analysisRow.response as string,
        generatedAt: analysisRow.generated_at as string,
      }
    : null;

  return { session, products, analysis };
}
