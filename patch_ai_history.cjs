const fs = require('fs');
let code = fs.readFileSync('src/components/AdminAIAssistant.tsx', 'utf8');

const oldState = `  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    sender: 'model',
    text: 'Hello Boss! I am your AI Business Assistant. How can I help you grow Gift Ghor today? Ask me for ad copy, business strategy, or product ideas.'
  }]);`;

const newState = `  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('giftghor_ai_assistant_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
    return [{
      id: 'welcome',
      sender: 'model',
      text: 'Hello Boss! I am your AI Business Assistant. How can I help you grow Gift Ghor today? Ask me for ad copy, business strategy, or product ideas.\\n\\n*Your chat history is now automatically saved!*'
    }];
  });

  useEffect(() => {
    localStorage.setItem('giftghor_ai_assistant_history', JSON.stringify(messages));
  }, [messages]);`;

code = code.replace(oldState, newState);

// Add clear history button
const oldHeader = `          <h2 className="text-lg font-bold text-gray-800">AI Business Assistant</h2>
          <p className="text-xs text-blue-600 font-medium">Marketing • Strategy • Content</p>
        </div>
      </div>`;

const newHeader = `          <h2 className="text-lg font-bold text-gray-800">AI Business Assistant</h2>
          <p className="text-xs text-blue-600 font-medium">Marketing • Strategy • Content</p>
        </div>
        <button 
          onClick={() => {
            if (confirm('Clear chat history?')) {
              setMessages([{
                id: 'welcome',
                sender: 'model',
                text: 'Hello Boss! I am your AI Business Assistant. How can I help you grow Gift Ghor today? Ask me for ad copy, business strategy, or product ideas.'
              }]);
            }
          }}
          className="ml-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Clear History"
        >
          <X className="w-5 h-5" />
        </button>
      </div>`;

code = code.replace(oldHeader, newHeader);

// In the input handler, also update UI
// Well, we did add the clear button using X, which is imported already from lucide-react.

fs.writeFileSync('src/components/AdminAIAssistant.tsx', code);
console.log("Patched AIAssistant history");
