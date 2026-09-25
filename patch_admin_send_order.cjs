const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /session\.orderExtracted\.trackingCode = (.*);\n\s*saveDB\(DB\);\n\s*return res\.json/g,
  `session.orderExtracted.trackingCode = $1;
      saveDB(DB);
      saveSessionToFirestore(session).catch(e => console.warn('Sync failed:', e));
      return res.json`
);

// also live agent alert on 858
content = content.replace(
  /session\.mode = 'admin_takeover';\n\s*saveDB\(DB\);\n\s*sendLiveAgentAlertEmail/g,
  `session.mode = 'admin_takeover';
    saveDB(DB);
    saveSessionToFirestore(session).catch(e => console.warn('Sync failed:', e));
    sendLiveAgentAlertEmail`
);

fs.writeFileSync('server.ts', content);
