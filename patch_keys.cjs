const fs = require('fs');
['server/analyticsService.ts', 'server/searchConsoleService.ts'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(
    'private_key: creds.private_key',
    "private_key: creds.private_key.replace(/\\\\n/g, '\\n')"
  );
  fs.writeFileSync(file, code);
});
console.log('Patched newlines for private keys');
