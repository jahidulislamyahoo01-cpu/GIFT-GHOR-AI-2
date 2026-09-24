const fs = require('fs');
let code = fs.readFileSync('src/components/AdminAIAssistant.tsx', 'utf8');

code = code.replace(
  "import { Send, UploadCloud, Mic, X, Loader2, Play } from 'lucide-react';",
  "import { Send, UploadCloud, Mic, X, Loader2, Play, Sparkles } from 'lucide-react';"
);

fs.writeFileSync('src/components/AdminAIAssistant.tsx', code);
