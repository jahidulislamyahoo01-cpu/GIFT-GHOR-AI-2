const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `    let botReplyText = '';

    for (const apiKey of apiKeys) {`;

const newStr = `    // Normalize history to group consecutive roles
    const normalizedHistory = [];
    for (const m of history) {
      if (normalizedHistory.length > 0 && normalizedHistory[normalizedHistory.length - 1].role === m.role) {
        normalizedHistory[normalizedHistory.length - 1].parts.push(...m.parts);
      } else {
        normalizedHistory.push(m);
      }
    }

    let botReplyText = '';

    for (const apiKey of apiKeys) {`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newStr);
    code = code.replace(/contents: history,/g, 'contents: normalizedHistory,');
    console.log("Successfully normalized history in admin AI");
} else {
    console.log("Could not find targetStr");
}

fs.writeFileSync('server.ts', code);
