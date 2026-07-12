import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Database } from 'better-sqlite3';
import type { Logger } from 'pino';

const DOWNLOAD_TIMEOUT_MS = 20000;

// Maps the response content type to a file extension; Redbubble's CDN serves
// JPEGs, but the fallback keeps other types viewable.
function extensionFor(contentType: string | null): string {
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('gif')) return 'gif';
  return 'jpg';
}

// Downloads the stored image URLs of a session's products into the local
// images directory and records each file's path (Doc 004 §10: images are
// filesystem assets, the database stores references; Doc 010 §9: reports
// reference locally stored images). Every image is best-effort: a failed
// download is logged and skipped, never fatal — the research result does not
// depend on images. Returns the number of images downloaded.
export async function downloadProductImages(
  db: Database,
  sessionId: string,
  imagesDirectory: string,
  logger: Logger,
): Promise<number> {
  const pending = db
    .prepare(
      `SELECT pi.id, pi.image_url FROM product_images pi
       JOIN products p ON p.id = pi.product_id
       WHERE p.session_id = ? AND pi.local_path IS NULL`,
    )
    .all(sessionId) as { id: string; image_url: string }[];

  if (pending.length === 0) {
    return 0;
  }

  mkdirSync(imagesDirectory, { recursive: true });
  const updateLocalPath = db.prepare('UPDATE product_images SET local_path = @localPath WHERE id = @id');

  let downloaded = 0;
  for (const image of pending) {
    try {
      const response = await fetch(image.image_url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const fileName = `${image.id}.${extensionFor(response.headers.get('content-type'))}`;
      writeFileSync(join(imagesDirectory, fileName), Buffer.from(await response.arrayBuffer()));
      // Stored relative to the application root ("images/<file>") so reports
      // and the database stay portable with the data directories.
      updateLocalPath.run({ localPath: `images/${fileName}`, id: image.id });
      downloaded += 1;
    } catch (error) {
      logger.warn(
        { operation: 'images', imageUrl: image.image_url, error: error instanceof Error ? error.message : String(error) },
        'Image download skipped',
      );
    }
  }
  return downloaded;
}
