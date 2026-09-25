import fs from 'fs';

let file = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Add states
const stateMarker = `  const [uploadRawText, setUploadRawText] = useState('');`;
const stateReplacement = `  const [uploadRawText, setUploadRawText] = useState('');
  
  // New FAQ form state
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState<'general' | 'delivery' | 'order' | 'payment' | 'customization'>('general');
  const [isAddingFaq, setIsAddingFaq] = useState(false);`;

if(file.includes(stateMarker)) {
  file = file.replace(stateMarker, stateReplacement);
}

// Add functions
const funcMarker = `  const handleUploadKnowledge = async (e: React.FormEvent) => {`;
const funcReplacement = `  const handleDeleteUploadedFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this uploaded knowledge?')) return;
    try {
      const res = await fetch(\`/api/admin/uploaded-files/\${id}\`, {
        method: 'DELETE',
        headers: { Authorization: \`Bearer \${authToken}\` },
      });
      if (res.ok) {
        showToast('File deleted successfully');
        loadAdminState(authToken, false);
      }
    } catch (e) {
      showToast('Error deleting file');
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    setIsAddingFaq(true);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${authToken}\` },
        body: JSON.stringify({ question: newFaqQuestion, answer: newFaqAnswer, category: newFaqCategory }),
      });
      if (res.ok) {
        showToast('FAQ added successfully');
        setNewFaqQuestion('');
        setNewFaqAnswer('');
        loadAdminState(authToken, false);
      }
    } catch (e) {
      showToast('Error adding FAQ');
    } finally {
      setIsAddingFaq(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      const res = await fetch(\`/api/admin/faqs/\${id}\`, {
        method: 'DELETE',
        headers: { Authorization: \`Bearer \${authToken}\` },
      });
      if (res.ok) {
        showToast('FAQ deleted successfully');
        loadAdminState(authToken, false);
      }
    } catch (e) {
      showToast('Error deleting FAQ');
    }
  };

  const handleUploadKnowledge = async (e: React.FormEvent) => {`;

if(file.includes(funcMarker)) {
  file = file.replace(funcMarker, funcReplacement);
}

// UI updates
const fileUiMarker = `                        {f.fileType}
                      </span>
                    </div>`;
const fileUiReplacement = `                        {f.fileType}
                      </span>
                      <button onClick={() => handleDeleteUploadedFile(f.id)} className="ml-3 p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>`;
if (file.includes(fileUiMarker)) {
  file = file.replace(fileUiMarker, fileUiReplacement);
}

const faqUiMarker = `                <div className="space-y-3">
                  {faqs.map((faq) => (`;
const faqUiReplacement = `                
                <form onSubmit={handleAddFaq} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-gray-700">Add New Text Data / FAQ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="Question / Title" 
                      value={newFaqQuestion} 
                      onChange={(e) => setNewFaqQuestion(e.target.value)} 
                      className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:border-[#ECA548]" 
                    />
                    <select 
                      value={newFaqCategory} 
                      onChange={(e) => setNewFaqCategory(e.target.value as any)}
                      className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:border-[#ECA548]"
                    >
                      <option value="general">General</option>
                      <option value="delivery">Delivery</option>
                      <option value="order">Order Info</option>
                      <option value="payment">Payment</option>
                      <option value="customization">Customization</option>
                    </select>
                  </div>
                  <textarea 
                    placeholder="Answer / Text Content (You can paste plain text knowledge here)" 
                    rows={3}
                    value={newFaqAnswer} 
                    onChange={(e) => setNewFaqAnswer(e.target.value)} 
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:border-[#ECA548]" 
                  />
                  <button type="submit" disabled={isAddingFaq} className="bg-[#ECA548] text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90">
                    {isAddingFaq ? 'Adding...' : 'Add Knowledge'}
                  </button>
                </form>

                <div className="space-y-3">
                  {faqs.map((faq) => (`;
if (file.includes(faqUiMarker)) {
  file = file.replace(faqUiMarker, faqUiReplacement);
}

const deleteFaqUiMarker = `                        <span>Updated: {new Date(faq.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>`;
const deleteFaqUiReplacement = `                        <span>Updated: {new Date(faq.updatedAt).toLocaleDateString()}</span>
                        <button onClick={() => handleDeleteFaq(faq.id)} className="text-red-500 hover:text-red-700 p-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>`;
if (file.includes(deleteFaqUiMarker)) {
  // Use replaceAll in case there are multiple matches (though map should loop over only one place)
  file = file.replace(deleteFaqUiMarker, deleteFaqUiReplacement);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', file);
console.log('Admin Dashboard updated');
