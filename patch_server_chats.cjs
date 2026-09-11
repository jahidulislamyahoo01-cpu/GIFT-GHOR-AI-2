const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Success bot reply
content = content.replace(
  /orderData: session\.orderExtracted,\n\s*\}\);\n\n\s*saveDB\(DB\);\n\n\s*res\.json\(\{/g,
  `orderData: session.orderExtracted,
    });

    saveDB(DB);
    saveSessionToFirestore(session).catch((e) => console.warn('[Firestore] Session cloud sync failed:', e));

    res.json({`
);

// 2. Error bot reply
content = content.replace(
  /timestamp: new Date\(\)\.toISOString\(\),\n\s*\}\);\n\n\s*saveDB\(DB\);\n\n\s*res\.json\(\{/g,
  `timestamp: new Date().toISOString(),
    });

    saveDB(DB);
    saveSessionToFirestore(session).catch((e) => console.warn('[Firestore] Session cloud sync failed:', e));

    res.json({`
);

// 3. Admin read status
content = content.replace(
  /DB\.sessions\[sessionId\]\.unreadCount = 0;\n\s*saveDB\(DB\);\n\s*\}/g,
  `DB.sessions[sessionId].unreadCount = 0;
    saveDB(DB);
    saveSessionToFirestore(DB.sessions[sessionId]).catch(e => console.warn('Sync failed:', e));
  }`
);

// 4. Admin mode toggle
content = content.replace(
  /DB\.sessions\[sessionId\]\.mode = mode;\n\s*saveDB\(DB\);\n\s*res\.json\(\{ success: true, session: DB\.sessions\[sessionId\] \}\);/g,
  `DB.sessions[sessionId].mode = mode;
  saveDB(DB);
  saveSessionToFirestore(DB.sessions[sessionId]).catch(e => console.warn('Sync failed:', e));
  res.json({ success: true, session: DB.sessions[sessionId] });`
);

// 5. Admin reply
content = content.replace(
  /DB\.sessions\[sessionId\]\.lastActivity = newMsg\.timestamp;\n\s*saveDB\(DB\);\n\s*res\.json\(\{ success: true/g,
  `DB.sessions[sessionId].lastActivity = newMsg.timestamp;
  saveDB(DB);
  saveSessionToFirestore(DB.sessions[sessionId]).catch(e => console.warn('Sync failed:', e));
  res.json({ success: true`
);

fs.writeFileSync('server.ts', content);
