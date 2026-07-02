const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html');
const backendIndexPath = path.resolve(__dirname, '..', '..', 'backend', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const staticManifestPattern = /\s*<link\s+rel=["']manifest["']\s+href=["']\.\/manifest\.webmanifest["']\s*\/?>/gi;
const next = html.replace(staticManifestPattern, '');

if (next !== html) {
  fs.writeFileSync(indexPath, next);
  console.log('prepare-gas-build: removed static manifest.webmanifest link for GAS deployment.');
} else {
  console.log('prepare-gas-build: no static manifest.webmanifest link found.');
}

fs.copyFileSync(indexPath, backendIndexPath);
console.log(`prepare-gas-build: copied dist/index.html to ${backendIndexPath}`);
