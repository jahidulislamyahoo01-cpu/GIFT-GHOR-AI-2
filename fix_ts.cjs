const fs = require('fs');

// Fix GiftGhorChatWidget.tsx
let chatWidget = fs.readFileSync('src/components/GiftGhorChatWidget.tsx', 'utf8');
chatWidget = chatWidget.replace('headerTextColor: branding.primaryColor,', '');
fs.writeFileSync('src/components/GiftGhorChatWidget.tsx', chatWidget);

// Fix AdminDashboard.tsx
let dashboard = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
dashboard = dashboard.replace(/stats\.trainingVersion/g, 'stats.trainingVersion || "v1"');
dashboard = dashboard.replace(/selectedOrder\.steadfastStatus/g, 'selectedOrder.steadfastStatus || "N/A"');
dashboard = dashboard.replace(/selectedOrder\.trackingCode/g, 'selectedOrder.steadfastTrackingCode');

fs.writeFileSync('src/components/AdminDashboard.tsx', dashboard);
console.log('Fixed TS errors');
