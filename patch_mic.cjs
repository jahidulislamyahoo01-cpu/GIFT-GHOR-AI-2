const fs = require('fs');
let code = fs.readFileSync('src/components/AdminAIAssistant.tsx', 'utf8');

const targetStr = `    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };`;

const newStr = `    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access blocked! Please allow microphone permissions in your browser settings.");
      }
    };`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newStr);
    console.log("Patched mic error handling");
}

fs.writeFileSync('src/components/AdminAIAssistant.tsx', code);
