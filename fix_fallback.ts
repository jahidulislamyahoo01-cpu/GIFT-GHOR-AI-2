import fs from 'fs';

let file = fs.readFileSync('server.ts', 'utf-8');

const oldFallback = `} else if (lower.includes('প্রোডাক্ট') || lower.includes('product') || lower.includes('ক্যাটালগ') || userInput.includes('🛍️')) {
    return \`আমাদের বর্তমান জনপ্রিয় প্রোডাক্টসমূহ:\\n• 2in1 Trifold Wallet (৳550)\\n• Premium Curved Flap Shoulder Bag (৳1150)\\n• Shoulder Crossbody Bucket Bag (৳650)\\n• Cute Bear Mini Ladies Wallet (৳390)\\n\\nকোনটি অর্ডার করতে চান?\`;
  } else {`;

const newFallback = `} else if (lower.includes('প্রোডাক্ট') || lower.includes('product') || lower.includes('ক্যাটালগ') || userInput.includes('🛍️')) {
    const topProducts = db.products.slice(0, 4).map((p: any) => \`• \${p.title} (৳\${p.price})\`).join('\\n');
    return \`আমাদের বর্তমান জনপ্রিয় প্রোডাক্টসমূহ:\\n\${topProducts}\\n\\nকোনটি অর্ডার করতে চান?\`;
  } else {`;

if (file.includes(oldFallback)) {
  file = file.replace(oldFallback, newFallback);
  fs.writeFileSync('server.ts', file);
  console.log('Fixed fallback reply');
} else {
  console.log('Old fallback not found');
}
