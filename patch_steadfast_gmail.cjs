const fs = require('fs');

// 1. Patch Steadfast in server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');

// First instance (book-steadfast)
serverContent = serverContent.replace(
  /'Content-Type': 'application\/json',\n\s*\},/g,
  `'Content-Type': 'application/json',
      },
      validateStatus: () => true,`
);

fs.writeFileSync('server.ts', serverContent);

// 2. Patch Gmail in emailService.ts
let emailContent = fs.readFileSync('server/emailService.ts', 'utf8');

emailContent = emailContent.replace(
  /from: process\.env\.SMTP_FROM \|\| `"Gift Ghor Orders" <no-reply@giftghor\.world>`,/g,
  'from: config?.gmailUser || process.env.SMTP_FROM || `"Gift Ghor Orders" <no-reply@giftghor.world>`,'
);
emailContent = emailContent.replace(
  /from: process\.env\.SMTP_FROM \|\| `"Gift Ghor Alerts" <alerts@giftghor\.world>`,/g,
  'from: config?.gmailUser || process.env.SMTP_FROM || `"Gift Ghor Alerts" <alerts@giftghor.world>`,'
);
emailContent = emailContent.replace(
  /from: process\.env\.SMTP_FROM \|\| `"Gift Ghor Security" <security@giftghor\.world>`,/g,
  'from: config?.gmailUser || process.env.SMTP_FROM || `"Gift Ghor Security" <security@giftghor.world>`,'
);

// We need to return error specifics in Steadfast error block.
// Wait, I already added validateStatus to server.ts. Let's refine the Steadfast error block in server.ts
serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(
  /error: 'Steadfast booking failed',/g,
  `error: sfRes.data?.errors ? JSON.stringify(sfRes.data.errors) : (sfRes.data?.message || 'Steadfast booking failed'),`
);
fs.writeFileSync('server.ts', serverContent);

fs.writeFileSync('server/emailService.ts', emailContent);

