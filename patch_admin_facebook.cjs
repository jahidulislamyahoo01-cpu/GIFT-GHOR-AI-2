const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add state variables
const stateBlock = `  const [paystationMerchantIdInput, setPaystationMerchantIdInput] = useState('');
  const [paystationPasswordInput, setPaystationPasswordInput] = useState('');
  const [hasPaystationPassword, setHasPaystationPassword] = useState(false);`;
const newStateBlock = `  const [paystationMerchantIdInput, setPaystationMerchantIdInput] = useState('');
  const [paystationPasswordInput, setPaystationPasswordInput] = useState('');
  const [hasPaystationPassword, setHasPaystationPassword] = useState(false);
  const [facebookPageIdInput, setFacebookPageIdInput] = useState('');
  const [facebookAccessTokenInput, setFacebookAccessTokenInput] = useState('');
  const [hasFacebookAccessToken, setHasFacebookAccessToken] = useState(false);`;
code = code.replace(stateBlock, newStateBlock);

// Parse response logic
const responseBlock = `          setPaystationMerchantIdInput(data.paystationMerchantId || '');
          setHasPaystationPassword(data.hasPaystationPassword);`;
const newResponseBlock = `          setPaystationMerchantIdInput(data.paystationMerchantId || '');
          setHasPaystationPassword(data.hasPaystationPassword);
          setFacebookPageIdInput(data.facebookPageId || '');
          setHasFacebookAccessToken(data.hasFacebookAccessToken);`;
code = code.replace(responseBlock, newResponseBlock);

// Save logic
const saveBlock = `      if (paystationMerchantIdInput !== undefined) payload.paystationMerchantId = paystationMerchantIdInput;
      if (paystationPasswordInput) payload.paystationPassword = paystationPasswordInput;`;
const newSaveBlock = `      if (paystationMerchantIdInput !== undefined) payload.paystationMerchantId = paystationMerchantIdInput;
      if (paystationPasswordInput) payload.paystationPassword = paystationPasswordInput;
      
      if (facebookPageIdInput !== undefined) payload.facebookPageId = facebookPageIdInput;
      if (facebookAccessTokenInput) payload.facebookAccessToken = facebookAccessTokenInput;`;
code = code.replace(saveBlock, newSaveBlock);

// Success reset logic
const resetBlock = `        if (paystationPasswordInput) {
          setHasPaystationPassword(true);
          setPaystationPasswordInput('');
        }`;
const newResetBlock = `        if (paystationPasswordInput) {
          setHasPaystationPassword(true);
          setPaystationPasswordInput('');
        }
        if (facebookAccessTokenInput) {
          setHasFacebookAccessToken(true);
          setFacebookAccessTokenInput('');
        }`;
code = code.replace(resetBlock, newResetBlock);

// UI Addition
const paystationUIEnd = `                  </div>

                  <button
                    type="submit"`;
const uiToAdd = `                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" style={{ color: '#ECA548' }}>
                        <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                      </svg>
                      Facebook Page Insights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Facebook Page ID
                        </label>
                        <input
                          type="text"
                          value={facebookPageIdInput}
                          onChange={(e) => setFacebookPageIdInput(e.target.value)}
                          placeholder="e.g. 123456789012345"
                          className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Page Access Token
                        </label>
                        <input
                          type="password"
                          value={facebookAccessTokenInput}
                          onChange={(e) => setFacebookAccessTokenInput(e.target.value)}
                          placeholder={hasFacebookAccessToken ? "•••••••••••• (Leave blank to keep current)" : "Enter Long-Lived Token"}
                          className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"`;
code = code.replace(paystationUIEnd, uiToAdd);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log('Patched AdminDashboard UI for Facebook');
