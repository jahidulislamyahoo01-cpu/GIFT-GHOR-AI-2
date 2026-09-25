const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const importTarget = `import { AdminOrdersView } from './AdminOrdersView';`;
const newImport = `import { AdminOrdersView } from './AdminOrdersView';
import { AdminInsightsView } from './AdminInsightsView';`;

if (!code.includes('AdminInsightsView')) {
  code = code.replace(importTarget, newImport);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log('Imported AdminInsightsView');
}
