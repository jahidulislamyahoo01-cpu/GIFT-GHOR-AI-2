import fs from 'fs';
const file = fs.readFileSync('src/components/GiftGhorChatWidget.tsx', 'utf-8');

// Replace style={{ backgroundColor: '#ECA548' }} with style={{ backgroundColor: branding.primaryColor }}
let newFile = file.replace(/style=\{\{\s*backgroundColor:\s*'#ECA548'\s*\}\}/g, "style={{ backgroundColor: branding.primaryColor }}");

// Replace style={{ borderTop: '4px solid #ECA548' }}
newFile = newFile.replace(/style=\{\{\s*borderTop:\s*'4px solid #ECA548'\s*\}\}/g, "style={{ borderTop: `4px solid ${branding.primaryColor}` }}");

// For className="... hover:bg-[#ECA548] ..." we can't easily change the tailwind class to dynamic color on hover without complex styled components.
// We will just change text color on header to branding.headerTextColor.

newFile = newFile.replace(
  /<h3 className="font-bold text-sm text-\[#262626\] tracking-tight">/g,
  '<h3 className="font-bold text-sm tracking-tight" style={{ color: branding.headerTextColor }}>'
);

fs.writeFileSync('src/components/GiftGhorChatWidget.tsx', newFile);
console.log("Colors partially updated for dynamic styling");
