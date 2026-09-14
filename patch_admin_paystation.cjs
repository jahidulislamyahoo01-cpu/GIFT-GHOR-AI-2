const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add state variables
const stateBlock = `  const [steadfastSecretKeyInput, setSteadfastSecretKeyInput] = useState('');`;
const newStateBlock = `  const [steadfastSecretKeyInput, setSteadfastSecretKeyInput] = useState('');
  const [paystationMerchantIdInput, setPaystationMerchantIdInput] = useState('');
  const [paystationPasswordInput, setPaystationPasswordInput] = useState('');
  const [hasPaystationPassword, setHasPaystationPassword] = useState(false);`;
code = code.replace(stateBlock, newStateBlock);

// Parse response logic
const responseBlock = `          setSteadfastApiKeyInput(data.steadfastApiKey || '');
          setHasSteadfastSecretKey(data.hasSteadfastSecretKey);`;
const newResponseBlock = `          setSteadfastApiKeyInput(data.steadfastApiKey || '');
          setHasSteadfastSecretKey(data.hasSteadfastSecretKey);
          setPaystationMerchantIdInput(data.paystationMerchantId || '');
          setHasPaystationPassword(data.hasPaystationPassword);`;
code = code.replace(responseBlock, newResponseBlock);

// Save logic
const saveBlock = `      if (steadfastApiKeyInput !== undefined) payload.steadfastApiKey = steadfastApiKeyInput;
      if (steadfastSecretKeyInput) payload.steadfastSecretKey = steadfastSecretKeyInput;`;
const newSaveBlock = `      if (steadfastApiKeyInput !== undefined) payload.steadfastApiKey = steadfastApiKeyInput;
      if (steadfastSecretKeyInput) payload.steadfastSecretKey = steadfastSecretKeyInput;
      
      if (paystationMerchantIdInput !== undefined) payload.paystationMerchantId = paystationMerchantIdInput;
      if (paystationPasswordInput) payload.paystationPassword = paystationPasswordInput;`;
code = code.replace(saveBlock, newSaveBlock);

// Success reset logic
const resetBlock = `        if (steadfastSecretKeyInput) {
          setHasSteadfastSecretKey(true);
          setSteadfastSecretKeyInput('');
        }`;
const newResetBlock = `        if (steadfastSecretKeyInput) {
          setHasSteadfastSecretKey(true);
          setSteadfastSecretKeyInput('');
        }
        if (paystationPasswordInput) {
          setHasPaystationPassword(true);
          setPaystationPasswordInput('');
        }`;
code = code.replace(resetBlock, newResetBlock);

// UI Addition
const steadfastUIEnd = `                  </div>

                  <button
                    type="submit"`;
const uiToAdd = `                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" style={{ color: '#ECA548' }} />
                      Pay Station (Payment Gateway)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Merchant ID / Store ID
                        </label>
                        <input
                          type="text"
                          value={paystationMerchantIdInput}
                          onChange={(e) => setPaystationMerchantIdInput(e.target.value)}
                          placeholder="Enter Merchant ID"
                          className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Password / Secret Key
                        </label>
                        <input
                          type="password"
                          value={paystationPasswordInput}
                          onChange={(e) => setPaystationPasswordInput(e.target.value)}
                          placeholder={hasPaystationPassword ? "•••••••••••• (Leave blank to keep current)" : "Enter Password"}
                          className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"`;
code = code.replace(steadfastUIEnd, uiToAdd);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Patched AdminDashboard UI for PayStation');
