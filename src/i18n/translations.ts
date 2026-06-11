const fs = require('fs');
const files = { en: 'src/i18n/en.json', es: 'src/i18n/es.json', pt: 'src/i18n/pt.json' };
let output = '// Auto-generated from JSON files\\n// Using .ts instead of .json to preserve UTF-8 characters in production builds\\n\\n';
for (const [lang, file] of Object.entries(files)) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  output += 'export const ' + lang + ' = ' + JSON.stringify(data, null, 2) + ' as const;\\n\\n';
}
fs.writeFileSync('src/i18n/translations.ts', output);
console.log('Created src/i18n/translations.ts');