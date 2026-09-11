const fs = require('fs');
let content = fs.readFileSync('server/emailService.ts', 'utf8');

content = content.replace(
  /export async function sendLiveAgentAlertEmail\(data: \{([\s\S]*?)\}\) \{/g,
  'export async function sendLiveAgentAlertEmail(data: {$1}, config?: EmailConfig) {'
);

content = content.replace(
  /export async function sendOtpEmail\(data: \{([\s\S]*?)\}\) \{/g,
  'export async function sendOtpEmail(data: {$1}, config?: EmailConfig) {'
);

content = content.replace(/const transporter = getTransporter\(\);/g, 'const transporter = getTransporter(config);');

fs.writeFileSync('server/emailService.ts', content);
