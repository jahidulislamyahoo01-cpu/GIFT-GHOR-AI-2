const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.split('const settings = DB.adminSettings || {} as any;').join('');
fs.writeFileSync('server.ts', content);
