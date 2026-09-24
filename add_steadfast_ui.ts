import fs from 'fs';
let file = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const targetState = `const [adminReplyText, setAdminReplyText] = useState('');`;
const replacementState = `const [adminReplyText, setAdminReplyText] = useState('');
  const [codAmount, setCodAmount] = useState<string>('');
  const [isSendingSteadfast, setIsSendingSteadfast] = useState(false);`;

if (file.includes(targetState)) {
  file = file.replace(targetState, replacementState);
}

const targetUI = `<span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 text-[10px] font-bold uppercase">
                        {currentSession.orderExtracted.orderStatus}
                      </span>
                    </div>`;

const replacementUI = `<span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 text-[10px] font-bold uppercase">
                        {currentSession.orderExtracted.orderStatus}
                      </span>
                    </div>

                    {/* Steadfast Integration */}
                    <div className="bg-white/50 px-4 md:px-5 py-3 border-b border-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <img src="https://steadfast.com.bd/favicon.ico" alt="Steadfast" className="w-4 h-4 object-contain" />
                        <span className="text-xs font-semibold text-gray-700">Steadfast Courier</span>
                      </div>
                      
                      {currentSession.orderExtracted.steadfastStatus === 'Sent' ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-600 font-bold bg-emerald-100 px-2 py-1 rounded">
                            ✅ Order Created successfully!
                          </span>
                          {currentSession.orderExtracted.trackingCode && (
                            <span className="text-gray-500 font-mono">
                              Tracking ID: {currentSession.orderExtracted.trackingCode}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <input 
                            type="number" 
                            placeholder="COD Amount (৳)" 
                            value={codAmount}
                            onChange={(e) => setCodAmount(e.target.value)}
                            className="w-full md:w-32 text-xs bg-white border border-[#ECECEC] rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-400 text-gray-800"
                          />
                          <button
                            onClick={async () => {
                              if (!codAmount) {
                                showToast('Please enter COD amount first');
                                return;
                              }
                              setIsSendingSteadfast(true);
                              try {
                                const res = await fetch('/api/admin/steadfast/send-order', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${authToken}\` },
                                  body: JSON.stringify({ sessionId: currentSession.id, codAmount })
                                });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                  showToast('Order sent to Steadfast Courier!');
                                  loadAdminState(authToken, false, true);
                                } else {
                                  showToast(data.error || 'Failed to send to Steadfast');
                                }
                              } catch (err) {
                                showToast('Network Error sending to Steadfast');
                              } finally {
                                setIsSendingSteadfast(false);
                              }
                            }}
                            disabled={isSendingSteadfast}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            {isSendingSteadfast ? 'Sending...' : '1-Click Send'}
                          </button>
                        </div>
                      )}
                    </div>`;

if (file.includes(targetUI)) {
  file = file.replace(targetUI, replacementUI);
  fs.writeFileSync('src/components/AdminDashboard.tsx', file);
  console.log('Steadfast UI added');
} else {
  console.log('Steadfast UI target not found');
}
