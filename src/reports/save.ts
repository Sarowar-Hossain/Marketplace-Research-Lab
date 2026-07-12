import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Report export (Doc 010 §10): writes the generated HTML into the local
// reports directory and returns the full file path. The directory is supplied
// by the caller; a write failure propagates so no metadata record is created
// for a report that does not exist on disk (Doc 010 §11, §13).
export function saveReportFile(html: string, reportsDirectory: string, fileName: string): string {
  const filePath = join(reportsDirectory, fileName);
  writeFileSync(filePath, html, 'utf8');
  return filePath;
}
