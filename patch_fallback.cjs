const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /timestamp: new Date\(\)\.toISOString\(\),\n\s*\}\);\n\s*saveDB\(DB\);\n\s*res\.json\(\{/g,
  `timestamp: new Date().toISOString(),
    });
    saveDB(DB);
    saveSessionToFirestore(session).catch((e) => console.warn('[Firestore] Session cloud sync failed:', e));
    res.json({`
);

fs.writeFileSync('server.ts', content);
