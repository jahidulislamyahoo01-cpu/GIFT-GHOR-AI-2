const fs = require('fs');
let code = fs.readFileSync('server/analyticsService.ts', 'utf8');

code = code.replace(
  "const fsNative = require('fs');",
  "import fsNative from 'fs';"
);

fs.writeFileSync('server/analyticsService.ts', code);
console.log("Patched fs import");
