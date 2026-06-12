/**
 * Post-build script: Replace \uXXXX escapes with actual UTF-8 characters
 */
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'public', 'assets');

if (!fs.existsSync(distPath)) {
  console.log('[fix-unicode] dist/public/assets not found, skipping');
  process.exit(0);
}

const files = fs.readdirSync(distPath).filter(f => f.endsWith('.js'));
let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(distPath, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  content = content.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const count = (original.match(/\\u[0-9a-fA-F]{4}/g) || []).length;
    console.log(`[fix-unicode] Fixed ${count} escapes in ${file}`);
    totalFixed += count;
  }
});

console.log(`[fix-unicode] Total escapes fixed: ${totalFixed}`);