const fs = require('fs');
let code = fs.readFileSync('src/components/GiftGhorChatWidget.tsx', 'utf8');

const errorLineTarget = `          <span style={{ color: branding.headerTextColor }}>{branding.widgetSubtitle}</span>`;
const fixLineTarget = `          <span style={{ color: branding.headerTextColor || '#ffffff' }}>{branding.widgetSubtitle}</span>`;

code = code.replace(errorLineTarget, fixLineTarget);
fs.writeFileSync('src/components/GiftGhorChatWidget.tsx', code);
