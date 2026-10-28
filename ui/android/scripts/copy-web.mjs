import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', 'web', 'out');
const dest = join(here, '..', 'www');

if (!existsSync(src)) {
  console.error(`[copy-web] Web build not found at: ${src}`);
  console.error('[copy-web] Build it first:  cd apps/web && npm run build');
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`[copy-web] Copied ${src} -> ${dest}`);
