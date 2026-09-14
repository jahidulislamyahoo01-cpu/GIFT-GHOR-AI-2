import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, Search, Facebook, RefreshCw, AlertCircle } from 'lucide-react';

export function AdminInsightsView({ authToken }: { authToken: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/insights-dashboard', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch insights');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-[#262626] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#ECA548]" />
            Business Insights & Analytics
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Aggregated metrics from Google Analytics, Search Console, and Facebook.
          </p>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#ECECEC] rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-[#ECECEC] animate-pulse"></div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Google Analytics */}
          <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs flex flex-col h-full overflow-y-auto max-h-[600px]">
            <h3 className="font-bold text-[#262626] mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              Website Analytics
            </h3>
            <div className="prose prose-sm prose-p:text-xs prose-li:text-xs prose-headings:text-sm text-gray-600">
              <div className="markdown-body text-xs whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded-lg border border-gray-100">
                {data.analytics || 'No data available'}
              </div>
            </div>
          </div>

          {/* Search Console */}
          <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs flex flex-col h-full overflow-y-auto max-h-[600px]">
            <h3 className="font-bold text-[#262626] mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Search className="w-4 h-4 text-green-500" />
              Google Search Console
            </h3>
            <div className="prose prose-sm prose-p:text-xs prose-li:text-xs prose-headings:text-sm text-gray-600">
              <div className="markdown-body text-xs whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded-lg border border-gray-100">
                {data.searchConsole || 'No data available'}
              </div>
            </div>
          </div>

          {/* Facebook */}
          <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs flex flex-col h-full overflow-y-auto max-h-[600px]">
            <h3 className="font-bold text-[#262626] mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook Page Insights
            </h3>
            <div className="prose prose-sm prose-p:text-xs prose-li:text-xs prose-headings:text-sm text-gray-600">
              <div className="markdown-body text-xs whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded-lg border border-gray-100">
                {data.facebook || 'No data available'}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      
      <div className="bg-[#FDF7EE] rounded-2xl border border-[#ECA548]/30 p-5 mt-6">
        <h3 className="font-bold text-sm text-[#262626] mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#ECA548]" />
          AI Analysis Ready
        </h3>
        <p className="text-xs text-gray-600">
          The AI Assistant has been updated to read these real-time metrics. You can now go to the <strong>AI Assistant</strong> tab and ask questions like <em>"Based on the Google Analytics, which products are getting the most views?"</em> or <em>"What should I post on Facebook today to increase my engagement?"</em>
        </p>
      </div>
    </div>
  );
}
