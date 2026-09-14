const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetState = `  const [activeTab, setActiveTab] = useState<
    'orders' | 'inbox' | 'ai-assistant' | 'knowledge' | 'products' | 'branding' | 'delivery' | 'embed' | 'integrations' | 'security'
  >('orders');`;
  
const newState = `  const [activeTab, setActiveTab] = useState<
    'orders' | 'inbox' | 'ai-assistant' | 'knowledge' | 'products' | 'branding' | 'delivery' | 'embed' | 'integrations' | 'security' | 'insights'
  >('orders');`;

code = code.replace(targetState, newState);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Patched activeTab type in AdminDashboard');
