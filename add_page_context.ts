import fs from 'fs';
let file = fs.readFileSync('src/components/GiftGhorChatWidget.tsx', 'utf-8');

const target = `
        body: JSON.stringify({
          sessionId,
          text: messageText,
          sender: 'user',
        }),
`;

const replacement = `
        body: JSON.stringify({
          sessionId,
          text: messageText,
          sender: 'user',
          pageContext: {
            url: window.location.href,
            title: document.title,
            // Extract some text from the body to give context on what the user is looking at (limit to 1000 chars to avoid huge payloads)
            content: document.body.innerText.substring(0, 1000)
          }
        }),
`;

if (file.includes(target.trim())) {
  file = file.replace(target.trim(), replacement.trim());
  fs.writeFileSync('src/components/GiftGhorChatWidget.tsx', file);
  console.log('Page context added to chat widget payload.');
} else {
  console.log('Target not found in GiftGhorChatWidget.tsx');
}
