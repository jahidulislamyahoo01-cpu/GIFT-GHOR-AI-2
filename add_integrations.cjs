const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const endpoints = `
// -------------------------------------------------------------
// INTEGRATIONS SETTINGS
// -------------------------------------------------------------

app.get('/api/admin/integrations', authenticateToken, (req, res) => {
  const settings = DB.adminSettings || {};
  res.json({
    hasGmailAppPassword: !!settings.gmailAppPassword,
    gmailUser: settings.gmailUser || '',
    hasSteadfastSecretKey: !!settings.steadfastSecretKey,
    steadfastApiKey: settings.steadfastApiKey || '',
  });
});

app.post('/api/admin/integrations', authenticateToken, (req, res) => {
  const { gmailUser, gmailAppPassword, steadfastApiKey, steadfastSecretKey } = req.body;
  if (!DB.adminSettings) {
    DB.adminSettings = { twoFactorEnabled: false, twoFactorEmail: 'giftghor6525@gmail.com' };
  }
  
  if (gmailUser !== undefined) DB.adminSettings.gmailUser = gmailUser;
  if (gmailAppPassword) DB.adminSettings.gmailAppPassword = gmailAppPassword;
  
  if (steadfastApiKey !== undefined) DB.adminSettings.steadfastApiKey = steadfastApiKey;
  if (steadfastSecretKey) DB.adminSettings.steadfastSecretKey = steadfastSecretKey;

  saveStateToFirestore().catch(e => console.error(e));
  res.json({ success: true, message: 'Integrations updated successfully' });
});

`;

content = content.replace(
  '// DEDICATED ORDERS MANAGEMENT ENDPOINTS',
  endpoints + '// DEDICATED ORDERS MANAGEMENT ENDPOINTS'
);

fs.writeFileSync('server.ts', content);
