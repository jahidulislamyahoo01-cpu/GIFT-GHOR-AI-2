const fs = require('fs');

const lines = fs.readFileSync('server.ts', 'utf8').split('\n');

// Find the line index containing "app.get('/api/admin/integrations', adminAuthMiddleware,"
const startIdx = lines.findIndex(l => l.includes("app.get('/api/admin/integrations', adminAuthMiddleware, (req, res) => {"));

if (startIdx !== -1) {
  // Replace the next lines up to "saveDB(DB);" + 1 line
  const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes("  res.json({ success: true, message: 'Integrations updated successfully' });"));
  
  if (endIdx !== -1) {
    const replacement = `app.get('/api/admin/integrations', adminAuthMiddleware, (req, res) => {
  const settings = DB.adminSettings || ({} as any);
  res.json({
    hasGmailAppPassword: !!settings.gmailAppPassword,
    gmailUser: settings.gmailUser || '',
    steadfastApiKey: settings.steadfastApiKey || '',
    steadfastSecretKey: settings.steadfastSecretKey || '',
  });
});

app.post('/api/admin/integrations', adminAuthMiddleware, (req, res) => {
  const { gmailUser, gmailAppPassword, steadfastApiKey, steadfastSecretKey } = req.body;
  if (!DB.adminSettings) {
    DB.adminSettings = { twoFactorEnabled: false, twoFactorEmail: 'giftghor6525@gmail.com' };
  }
  
  if (gmailUser !== undefined) DB.adminSettings.gmailUser = gmailUser;
  if (gmailAppPassword) DB.adminSettings.gmailAppPassword = gmailAppPassword;
  
  if (steadfastApiKey !== undefined) DB.adminSettings.steadfastApiKey = steadfastApiKey;
  if (steadfastSecretKey) DB.adminSettings.steadfastSecretKey = steadfastSecretKey;

  saveDB(DB);
  res.json({ success: true, message: 'Integrations updated successfully' });`;
    
    lines.splice(startIdx, endIdx - startIdx + 1, replacement);
    fs.writeFileSync('server.ts', lines.join('\n'));
    console.log('Recovered successfully.');
  } else {
    console.log('Could not find end index.');
  }
} else {
  console.log('Could not find start index.');
}

