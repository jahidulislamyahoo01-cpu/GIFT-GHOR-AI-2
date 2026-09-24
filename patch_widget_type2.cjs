const fs = require('fs');
let code = fs.readFileSync('src/components/GiftGhorChatWidget.tsx', 'utf8');
code = code.replace("style={{ color: branding.headerTextColor }}", "style={{ color: (branding as any).headerTextColor || '#ffffff' }}");
fs.writeFileSync('src/components/GiftGhorChatWidget.tsx', code);
