const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../../ui/apps/mobile/dist');
const destDir = path.resolve(__dirname, '../dist');

console.log(`[Desktop] Synchronizing web bundle from: ${srcDir}`);
console.log(`[Desktop] Destination: ${destDir}`);

if (!fs.existsSync(srcDir)) {
  console.error(`[Desktop Error] Web build directory not found at: ${srcDir}`);
  console.error(`Please run 'pnpm --dir ui web:build' first.`);
  process.exit(1);
}

// Clean destination if exists
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

fs.cpSync(srcDir, destDir, { recursive: true });
console.log(`[Desktop] Successfully synchronized web export to desktop/dist!`);
