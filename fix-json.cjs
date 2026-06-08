const fs = require('fs');
for (const lang of ['en', 'es', 'pt']) {
    const path = 'src/i18n/' + lang + '.json';
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/<<<<<<< HEAD\n/g, '');
    content = content.replace(/=======\n/g, '');
    content = content.replace(/>>>>>>> [0-9a-f]+\n/g, '');
    content = content.replace(/',/g, ',');
    const data = JSON.parse(content);
    fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
    console.log(path + ': FIXED');
}
console.log('All JSON files fixed');
