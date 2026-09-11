const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add integrations to activeTab
content = content.replace(
  /'orders' \| 'inbox' \| 'knowledge' \| 'products' \| 'branding' \| 'delivery' \| 'embed' \| 'security'/g,
  "'orders' | 'inbox' | 'knowledge' | 'products' | 'branding' | 'delivery' | 'embed' | 'integrations' | 'security'"
);

// Add state variables for Integrations
const integrationsState = `
  // Integrations state
  const [hasGmailAppPassword, setHasGmailAppPassword] = useState(false);
  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPasswordInput, setGmailAppPasswordInput] = useState('');
  const [hasSteadfastSecretKey, setHasSteadfastSecretKey] = useState(false);
  const [steadfastApiKey, setSteadfastApiKey] = useState('');
  const [steadfastSecretKeyInput, setSteadfastSecretKeyInput] = useState('');
  const [isUpdatingIntegrations, setIsUpdatingIntegrations] = useState(false);

  // Active Tab`;
content = content.replace('  // Active Tab - Defaulting', integrationsState + '\n  // Active Tab - Defaulting');

// Load Integrations data
const fetchIntegrations = `
        // Fetch Integrations
        fetch('/api/admin/integrations', {
          headers: { Authorization: \`Bearer \${token}\` },
        })
          .then((r) => r.json())
          .then((intData) => {
            if (intData) {
              setHasGmailAppPassword(intData.hasGmailAppPassword);
              setGmailUser(intData.gmailUser);
              setHasSteadfastSecretKey(intData.hasSteadfastSecretKey);
              setSteadfastApiKey(intData.steadfastApiKey);
            }
          })
          .catch(() => {});
`;
content = content.replace(
  '        // Auto-backup to browser localStorage when data is populated',
  fetchIntegrations + '\n        // Auto-backup to browser localStorage when data is populated'
);

// handleSaveIntegrations
const handleSaveIntegrations = `
  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingIntegrations(true);
    try {
      const payload: any = {
        gmailUser,
        steadfastApiKey,
      };
      if (gmailAppPasswordInput) payload.gmailAppPassword = gmailAppPasswordInput;
      if (steadfastSecretKeyInput) payload.steadfastSecretKey = steadfastSecretKeyInput;

      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${authToken}\`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Integrations updated and synced to Firestore successfully!');
        if (gmailAppPasswordInput) {
          setHasGmailAppPassword(true);
          setGmailAppPasswordInput('');
        }
        if (steadfastSecretKeyInput) {
          setHasSteadfastSecretKey(true);
          setSteadfastSecretKeyInput('');
        }
      } else {
        showToast(data.error || 'Failed to update integrations');
      }
    } catch (e) {
      showToast('Network error while saving integrations');
    } finally {
      setIsUpdatingIntegrations(false);
    }
  };

  const handleLogout =`;
content = content.replace('  const handleLogout =', handleSaveIntegrations);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
