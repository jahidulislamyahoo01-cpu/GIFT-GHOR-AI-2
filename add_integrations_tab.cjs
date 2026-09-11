const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const integrationsBtn = `
            {/* Integrations Tab */}
            <button
              onClick={() => setActiveTab('integrations')}
              className={\`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all \${
                activeTab === 'integrations'
                  ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }\`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Integrations (API)</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('security')}
`;
content = content.replace(
  `            <button
              onClick={() => setActiveTab('security')}`,
  integrationsBtn
);

// Add the view for Integrations
const integrationsView = `
          {/* ----------------- TAB 8: INTEGRATIONS ----------------- */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white rounded-2xl border border-[#ECECEC] p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="font-bold text-base text-[#262626] flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#ECA548]" />
                    Third-Party Integrations
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manage your email configuration for notifications and courier API for order fulfillment.
                  </p>
                </div>

                <form onSubmit={handleSaveIntegrations} className="space-y-6">
                  {/* Gmail Section */}
                  <div className="p-4 rounded-xl border border-[#ECECEC] bg-gray-50 space-y-4">
                    <h3 className="font-bold text-sm text-[#262626]">Gmail App Credentials (For Notifications)</h3>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Gmail Address
                      </label>
                      <input
                        type="email"
                        value={gmailUser}
                        onChange={(e) => setGmailUser(e.target.value)}
                        placeholder="giftghor@gmail.com"
                        className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Gmail App Password
                      </label>
                      <input
                        type="password"
                        value={gmailAppPasswordInput}
                        onChange={(e) => setGmailAppPasswordInput(e.target.value)}
                        placeholder={hasGmailAppPassword ? "•••••••••••• (Leave blank to keep current)" : "Enter 16-character App Password"}
                        className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                      />
                    </div>
                  </div>

                  {/* Steadfast Courier Section */}
                  <div className="p-4 rounded-xl border border-[#ECECEC] bg-gray-50 space-y-4">
                    <h3 className="font-bold text-sm text-[#262626]">Steadfast Courier API (For Order Fulfillment)</h3>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Steadfast API Key
                      </label>
                      <input
                        type="text"
                        value={steadfastApiKey}
                        onChange={(e) => setSteadfastApiKey(e.target.value)}
                        placeholder="Enter API Key"
                        className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Steadfast Secret Key
                      </label>
                      <input
                        type="password"
                        value={steadfastSecretKeyInput}
                        onChange={(e) => setSteadfastSecretKeyInput(e.target.value)}
                        placeholder={hasSteadfastSecretKey ? "•••••••••••• (Leave blank to keep current)" : "Enter Secret Key"}
                        className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingIntegrations}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-95"
                    style={{ backgroundColor: '#ECA548' }}
                  >
                    {isUpdatingIntegrations ? 'Saving...' : 'Save Integrations to Cloud'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ----------------- TAB 7: SECURITY & 2FA ----------------- */}
`;
content = content.replace(
  "          {/* ----------------- TAB 7: SECURITY & 2FA ----------------- */}",
  integrationsView
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
