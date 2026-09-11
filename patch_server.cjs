const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Update SystemDB type
content = content.replace(
  /  adminSettings: \{\n    twoFactorEnabled: boolean;\n    twoFactorEmail: string;\n    lastPasswordChangedAt\?: string;\n  \};/g,
  `  adminSettings: {
    twoFactorEnabled: boolean;
    twoFactorEmail: string;
    lastPasswordChangedAt?: string;
    gmailUser?: string;
    gmailAppPassword?: string;
    steadfastApiKey?: string;
    steadfastSecretKey?: string;
  };`
);

// Update calls to sendNewOrderEmail
content = content.replace(
  /sendNewOrderEmail\(orderRecord\)/g,
  `sendNewOrderEmail(orderRecord, DB.adminSettings)`
);
content = content.replace(
  /sendNewOrderEmail\(newOrder\)/g,
  `sendNewOrderEmail(newOrder, DB.adminSettings)`
);

// Update calls to sendLiveAgentAlertEmail
content = content.replace(
  /sendLiveAgentAlertEmail\(\{([\s\S]*?)\}\)/g,
  `sendLiveAgentAlertEmail({$1}, DB.adminSettings)`
);

// Update calls to sendOtpEmail
content = content.replace(
  /sendOtpEmail\(otpCode, DB\.adminSettings\.twoFactorEmail \|\| 'giftghor6525@gmail\.com'\)/g,
  `sendOtpEmail(otpCode, DB.adminSettings.twoFactorEmail || 'giftghor6525@gmail.com', DB.adminSettings)`
);

// Update Steadfast API keys
content = content.replace(
  /const apiKey = process\.env\.STEADFAST_API_KEY;/g,
  `const apiKey = DB.adminSettings?.steadfastApiKey || process.env.STEADFAST_API_KEY;`
);
content = content.replace(
  /const secretKey = process\.env\.STEADFAST_SECRET_KEY;/g,
  `const secretKey = DB.adminSettings?.steadfastSecretKey || process.env.STEADFAST_SECRET_KEY;`
);

fs.writeFileSync('server.ts', content);
