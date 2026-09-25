const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "const settings = DB.adminSettings || {};",
  "const settings = DB.adminSettings || {} as any;"
);

fs.writeFileSync('server.ts', content);
