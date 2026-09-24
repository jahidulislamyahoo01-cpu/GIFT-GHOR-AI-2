const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const aiTabCode = `
            <button
              onClick={() => setActiveTab('ai-assistant')}
              className={\`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all \${
                activeTab === 'ai-assistant'
                  ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }\`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#ECA548]" />
                <span>AI Assistant (New)</span>
              </div>
            </button>
`;

code = code.replace(
  "            <button\n              onClick={() => setActiveTab('knowledge')}",
  aiTabCode + "            <button\n              onClick={() => setActiveTab('knowledge')}"
);

// Add the component rendering
const componentCode = `
          {/* ----------------- TAB: AI ASSISTANT ----------------- */}
          {activeTab === 'ai-assistant' && (
            <AdminAIAssistant />
          )}
`;

code = code.replace(
  "          {/* ----------------- TAB 2: KNOWLEDGE BASE ----------------- */}",
  componentCode + "\n          {/* ----------------- TAB 2: KNOWLEDGE BASE ----------------- */}"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
