const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

if (!code.includes('CreditCard,')) {
  code = code.replace("Settings,", "Settings, CreditCard,");
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("Imported CreditCard");
} else {
  console.log("Already imported");
}
