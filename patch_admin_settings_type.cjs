const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetType = `  adminSettings: {
    twoFactorEnabled: boolean;
    twoFactorEmail: string;
    lastPasswordChangedAt?: string;
    gmailUser?: string;
    gmailAppPassword?: string;
    steadfastApiKey?: string;
    steadfastSecretKey?: string;
  };`;
  
const newType = `  adminSettings: {
    twoFactorEnabled: boolean;
    twoFactorEmail: string;
    lastPasswordChangedAt?: string;
    gmailUser?: string;
    gmailAppPassword?: string;
    steadfastApiKey?: string;
    steadfastSecretKey?: string;
    paystationMerchantId?: string;
    paystationPassword?: string;
    facebookPageId?: string;
    facebookAccessToken?: string;
  };`;

if (code.includes(targetType)) {
  code = code.replace(targetType, newType);
  fs.writeFileSync('server.ts', code);
  console.log('Patched Admin Settings type in server.ts');
} else {
  console.log('Could not find target block to replace.');
}
