const fs = require('fs');
let code = fs.readFileSync('server/analyticsService.ts', 'utf8');

code = code.replace(
  "import fsNative from 'fs';",
  "// removed import inside function"
);

// Add import at the top
code = "import fs from 'fs';\n" + code;

// Replace fsNative with fs
code = code.replace(/fsNative/g, "fs");

fs.writeFileSync('server/analyticsService.ts', code);
console.log("Patched fs correctly");
