const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add import
code = code.replace(
  "import { AdminOrdersView } from './AdminOrdersView';",
  "import { AdminOrdersView } from './AdminOrdersView';\nimport { AdminAIAssistant } from './AdminAIAssistant';"
);

// Update type
code = code.replace(
  "'orders' | 'inbox' | 'knowledge' | 'products' | 'branding' | 'delivery' | 'embed' | 'integrations' | 'security'",
  "'orders' | 'inbox' | 'ai-assistant' | 'knowledge' | 'products' | 'branding' | 'delivery' | 'embed' | 'integrations' | 'security'"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
