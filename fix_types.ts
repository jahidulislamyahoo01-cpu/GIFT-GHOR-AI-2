import fs from 'fs';
let file = fs.readFileSync('server.ts', 'utf-8');

file = file.replace(
  'collectedAt: string;',
  'collectedAt: string; steadfastStatus?: string; trackingCode?: string;'
);

fs.writeFileSync('server.ts', file);
console.log('Fixed types in server.ts');
