import fs from 'fs';
let file = fs.readFileSync('server.ts', 'utf-8');

// Add pageContext to req.body in api/chat/message
file = file.replace(
  `const { sessionId, text, sender = 'user' } = req.body;`,
  `const { sessionId, text, sender = 'user', pageContext } = req.body;`
);

// Add context append before API call
file = file.replace(
  `const systemInstruction = buildSystemKnowledgeContext(DB);`,
  `let systemInstruction = buildSystemKnowledgeContext(DB);
      if (pageContext) {
        systemInstruction += \`\\n\\nCURRENT PAGE CONTEXT:\\nThe user is currently browsing this page on the website:\\nURL: \${pageContext.url}\\nTitle: \${pageContext.title}\\nContent Extract: \${pageContext.content}\\n\\n-> INSTRUCTION: Use this context to understand what the user is looking at and help them accordingly (e.g. if they are on a checkout page, guide them on what fields to fill). Do NOT mention the raw URL unless necessary.\`;
      }`
);

// Update buildSystemKnowledgeContext CRITICAL RULES
const targetRules = `CRITICAL RULES ABOUT PRODUCTS:
- You ONLY sell: Bags, Wallets, Purses, and Churi (Bangles).
- If the customer explicitly asks for customized gifts, politely inform them that customized gifts are NOT available. Otherwise, DO NOT mention customized gifts proactively.
- All items (Bags, Wallets, Purses) are available on the website.
- Exception: "Churi" (Bangles) is NOT on the website. Customers must order Churi directly through this message chat.`;

const replacementRules = `CRITICAL RULES ABOUT PRODUCTS (STRICT KNOWLEDGE ENFORCEMENT):
- DO NOT invent, suggest, or mention ANY product that is not strictly listed in the CATALOG below or allowed categories.
- You ONLY sell: Bags, Wallets, Purses, and Churi (Bangles).
- STRICT RULE: If the customer asks for ANY product outside these categories or not found in your knowledge base (e.g., customized gifts, electronics, clothes), you MUST politely inform them that it is NOT available at Gift Ghor.
- All items (Bags, Wallets, Purses) are available on the website.
- Exception: "Churi" (Bangles) is NOT on the website. Customers must order Churi directly through this message chat.`;

if (file.includes(targetRules)) {
  file = file.replace(targetRules, replacementRules);
}

fs.writeFileSync('server.ts', file);
console.log('Fixed server.ts');
