import fs from 'fs';
let file = fs.readFileSync('.env.example', 'utf-8');
if (!file.includes('STEADFAST_API_KEY')) {
  file += '\n# Steadfast Courier Integration\nSTEADFAST_API_KEY=\nSTEADFAST_SECRET_KEY=\n';
  fs.writeFileSync('.env.example', file);
  console.log('Updated .env.example');
}
