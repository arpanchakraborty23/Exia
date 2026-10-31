const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../../ui/apps/mobile/dist');
const destDir = path.resolve(__dirname, '../dist');

console.log(`[Desktop] Synchronizing web bundle from: ${srcDir}`);
console.log(`[Desktop] Destination: ${destDir}`);

if (!fs.existsSync(srcDir)) {
  console.error(`[Desktop Error] Web build directory not found at: ${srcDir}`);
  console.error(`Please run 'pnpm --dir ui web:build' or 'pnpm --dir ui desktop:build' first.`);
  process.exit(1);
}

const indexHtmlPath = path.join(srcDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error(`[Desktop Error] Source index.html not found at: ${indexHtmlPath}`);
  process.exit(1);
}

// Clean destination if exists, with retry logic for Windows file system locks
if (fs.existsSync(destDir)) {
  try {
    fs.rmSync(destDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch (err) {
    console.warn(`[Desktop] Notice: could not remove destination directly (${err.message}). Overwriting files.`);
  }
}

fs.cpSync(srcDir, destDir, { recursive: true });

const copiedIndex = path.join(destDir, 'index.html');
if (fs.existsSync(copiedIndex)) {
  const stat = fs.statSync(copiedIndex);
  console.log(`[Desktop] Successfully synchronized web export to desktop/dist! (index.html: ${stat.size} bytes)`);
} else {
  console.error(`[Desktop Error] Failed to verify desktop/dist/index.html after copy!`);
  process.exit(1);
}
