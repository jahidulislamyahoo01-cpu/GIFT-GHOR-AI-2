const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace("currentSession.orderExtracted.status === 'steadfast_booked'", "(currentSession.orderExtracted as any).status === 'steadfast_booked'");
code = code.replace("currentSession.orderExtracted.steadfastTrackingCode", "(currentSession.orderExtracted as any).steadfastTrackingCode");
code = code.replace("currentSession.orderExtracted.steadfastTrackingCode", "(currentSession.orderExtracted as any).steadfastTrackingCode");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Fixed OrderDetails types');
