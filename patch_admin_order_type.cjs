const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The OrderDetails interface does not have status or steadfastTrackingCode,
// so we cast to any or check the properties carefully.
code = code.replace("order.status === 'steadfast_booked'", "(order as any).status === 'steadfast_booked'");
code = code.replace("order.steadfastTrackingCode", "(order as any).steadfastTrackingCode");
code = code.replace("order.steadfastTrackingCode", "(order as any).steadfastTrackingCode");

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
