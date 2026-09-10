import fs from 'fs';
const file = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const target = `                    {/* Mode Toggle: AI vs Manual Takeover */}`;

const replacement = `                    {/* Mode Toggle: AI vs Manual Takeover */}`;

// Let's actually find the place right after the Top Bar (after its closing div, around line 849)

const fullTarget = `                      </div>
                    </div>

                    {/* Mode Toggle: AI vs Manual Takeover */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 hidden sm:inline-block">Response Mode:</span>
                      {currentSession.mode === 'admin_takeover' ? (
                        <button
                          onClick={() => handleToggleTakeover(currentSession.id, 'ai')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 hidden sm:block" />
                          <span>Hand Over</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleTakeover(currentSession.id, 'admin_takeover')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-300 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5 hidden sm:block" />
                          <span>Take Over</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Lead Banner (if extracted) */}
                  {currentSession.orderExtracted && currentSession.orderExtracted.customerPhone && (
                    <div className="bg-emerald-50/50 border-b border-emerald-100 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start md:items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-emerald-800 flex items-center gap-2">
                            Order Lead Captured
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-800 text-[9px] uppercase tracking-wider font-bold">
                              {currentSession.orderExtracted.orderStatus || 'NEW'}
                            </span>
                          </div>
                          <div className="text-emerald-700 mt-0.5">
                            <span className="font-semibold">{currentSession.orderExtracted.customerName}</span> • {currentSession.orderExtracted.customerPhone}
                          </div>
                          {currentSession.orderExtracted.customerAddress && (
                            <div className="text-emerald-600 mt-0.5 flex items-start gap-1">
                              <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                              <span className="line-clamp-1">{currentSession.orderExtracted.customerAddress}</span>
                            </div>
                          )}
                          {currentSession.orderExtracted.productDetails && (
                            <div className="text-emerald-600 mt-0.5 flex items-start gap-1">
                              <Package className="w-3 h-3 mt-0.5 shrink-0" />
                              <span className="line-clamp-1">{currentSession.orderExtracted.productDetails}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="md:w-auto w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm text-center">
                        Process Order
                      </button>
                    </div>
                  )}

                  {/* Chat Message History */}`;

const targetToReplace = `                      </div>
                    </div>

                    {/* Mode Toggle: AI vs Manual Takeover */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Response Mode:</span>
                      {currentSession.mode === 'admin_takeover' ? (
                        <button
                          onClick={() => handleToggleTakeover(currentSession.id, 'ai')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Hand Over to AI</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleTakeover(currentSession.id, 'admin_takeover')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-300 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Take Over Chat</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chat Message History */}`;

if (file.includes(targetToReplace)) {
  fs.writeFileSync('src/components/AdminDashboard.tsx', file.replace(targetToReplace, fullTarget));
  console.log("Updated Chat View with Order Lead banner.");
} else {
  console.log("Could not find chat view top bar replace target.");
}
