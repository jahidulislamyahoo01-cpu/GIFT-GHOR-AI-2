const fs = require('fs');
let code = fs.readFileSync('server/analyticsService.ts', 'utf8');

const oldAuthBlock = `    const propertyId = '518576178';
    const credentialsPath = path.join(process.cwd(), 'ga-credentials.json');
    // removed import inside function
    if (!fs.existsSync(credentialsPath)) {
      console.warn('[Analytics] ga-credentials.json missing, skipping analytics');
      return 'Analytics data currently unavailable.';
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: credentialsPath,
    });`;

const newAuthBlock = `    const propertyId = '518576178';
    
    let authOptions = {};
    const credentialsPath = path.join(process.cwd(), 'ga-credentials.json');
    
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        const creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        authOptions = { 
          credentials: { 
            client_email: creds.client_email, 
            private_key: creds.private_key 
          } 
        };
      } catch (e) {
        console.error('[Analytics] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON', e);
        return 'Analytics configuration error (Invalid JSON).';
      }
    } else if (fs.existsSync(credentialsPath)) {
      authOptions = { keyFilename: credentialsPath };
    } else {
      console.warn('[Analytics] GA credentials missing. Please set GOOGLE_APPLICATION_CREDENTIALS_JSON env var or provide ga-credentials.json');
      return 'Analytics data currently unavailable.';
    }

    const analyticsDataClient = new BetaAnalyticsDataClient(authOptions);`;

code = code.replace(oldAuthBlock, newAuthBlock);
fs.writeFileSync('server/analyticsService.ts', code);
console.log("Patched auth block");
