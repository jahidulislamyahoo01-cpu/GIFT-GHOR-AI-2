import fs from 'fs';
import { products } from './src/db/scraped_products';

let file = fs.readFileSync('server.ts', 'utf-8');

// The products array goes from `products: [` to the matching `],` around line 249
// Instead of replacing statically, let's just use string replacement on a known anchor
const startMarker = 'products: [';
const startIdx = file.indexOf(startMarker);
let endIdx = startIdx;
let bracketCount = 0;
let started = false;

for (let i = startIdx; i < file.length; i++) {
  if (file[i] === '[') {
    bracketCount++;
    started = true;
  } else if (file[i] === ']') {
    bracketCount--;
  }
  if (started && bracketCount === 0) {
    endIdx = i;
    break;
  }
}

if (startIdx !== -1 && endIdx > startIdx) {
  const newProductsStr = 'products: ' + JSON.stringify(products, null, 2);
  file = file.substring(0, startIdx) + newProductsStr + file.substring(endIdx + 1);
  fs.writeFileSync('server.ts', file);
  console.log('Successfully injected products into server.ts');
} else {
  console.log('Failed to find products array in server.ts');
}
