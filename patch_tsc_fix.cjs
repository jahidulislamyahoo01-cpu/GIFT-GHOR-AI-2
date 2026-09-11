const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /iconst settings = DB\.adminSettings \|\| \{\} as any;/g,
  `const settings = DB.adminSettings || {} as any;`
);
content = content.replace(
  /const settings = DB\.adminSettings \|\| \{\} as any;const settings = DB\.adminSettings \|\| \{\} as any;/g,
  `const settings = DB.adminSettings || {} as any;`
);

fs.writeFileSync('server.ts', content);
