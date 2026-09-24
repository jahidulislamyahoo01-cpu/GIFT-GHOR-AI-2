import fs from 'fs';

let file = fs.readFileSync('server.ts', 'utf-8');

file = file.replace(/"In Stock"/g, '"in_stock"');
file = file.replace(/"Check Website"/g, '"out_of_stock"');

// Fix imageUrl missing
// We can just add imageUrl: 'https://giftghor.world/assets/logo.png' to all objects that have `id: "`
file = file.replace(/"url": "https:\/\/giftghor\.world\/products\//g, '"imageUrl": "https://giftghor.world/assets/logo.png",\n      "url": "https://giftghor.world/products/');

fs.writeFileSync('server.ts', file);
console.log('Fixed stock status and imageUrl');
