import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Search, X, Download, ArrowLeft, ArrowUpRight, 
  Settings, Database, Eye, Trash2, Maximize2 
} from 'lucide-react';

export default function TerminalDashboard({ 
  streams, 
  activeStreamKey, 
  setActiveStreamKey, 
  onBack, 
  theme = 'phosphor',
  setTheme
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const [logs, setLogs] = useState(() => Array.from({length: 50}, (_, i) => `[${new Date(Date.now() - i*10000).toISOString()}] INFO: Fetching ${Math.floor(Math.random()*100)} records from ${activeStreamKey}...`));

  const currentStream = streams[activeStreamKey];
  const dataset = currentStream.data || [];

  // Theme definitions
  const themes = {
    monochrome: {
      bg: 'bg-[#fafafa]', text: 'text-zinc-900', border: 'border-zinc-200', 
      cardBg: 'bg-white', textMuted: 'text-zinc-500', accentBg: 'bg-emerald-600', 
      accentText: 'text-white', hoverBg: 'hover:bg-zinc-100', thead: 'bg-zinc-100', rowHover: 'hover:bg-zinc-50'
    },
    phosphor: {
      bg: 'bg-black', text: 'text-[#00ff41]', border: 'border-[#00ff41]/30', 
      cardBg: 'bg-[#001100]', textMuted: 'text-[#00ff41]/60', accentBg: 'bg-[#00ff41]', 
      accentText: 'text-black', hoverBg: 'hover:bg-[#002200]', thead: 'bg-[#002200]', rowHover: 'hover:bg-[#001a00]'
    }
  };
  const t = themes[theme];

  // Sorting & Filtering
  const filteredData = useMemo(() => {
    let result = [...dataset];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => Object.values(item).some(v => v && String(v).toLowerCase().includes(q)));
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [dataset, searchQuery, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const toggleRow = (idx) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(idx)) newSet.delete(idx); else newSet.add(idx);
    setSelectedRows(newSet);
  };

  const toggleAll = () => {
    if (selectedRows.size === filteredData.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(filteredData.map((_, i) => i)));
  };

  return (
    <div className={`flex-1 flex flex-col min-h-screen ${t.bg} ${t.text} ${theme === 'phosphor' ? 'font-mono' : 'font-sans'} transition-colors duration-300 relative`}>
      
      {/* HEADER */}
      <header className={`sticky top-0 z-40 ${t.bg} border-b ${t.border} shadow-sm`}>
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className={`p-1.5 rounded-md ${t.hoverBg} transition`}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 font-semibold">
              <Database className="w-4 h-4" /> <span>Data Pipeline /</span>
              <span className={t.textMuted}>{currentStream.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center p-1 rounded-md border ${t.border} ${t.cardBg}`}>
              <button onClick={() => setTheme('monochrome')} className={`px-2 py-1 text-xs font-semibold rounded ${theme === 'monochrome' ? 'bg-zinc-200 text-black' : 'text-zinc-500'}`}>Monochrome</button>
              <button onClick={() => setTheme('phosphor')} className={`px-2 py-1 text-xs font-semibold rounded ${theme === 'phosphor' ? 'bg-[#00ff41] text-black' : 'text-[#00ff41]/60'}`}>Phosphor</button>
            </div>
            <button onClick={() => setIsLogViewerOpen(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border ${t.border} ${t.hoverBg} text-xs font-semibold transition`}>
              <Terminal className="w-3.5 h-3.5" /> Logs
            </button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-[1400px] mx-auto px-4 py-6 w-full flex-1 flex flex-col gap-6">
        
        {/* CONTROLS */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${t.border} ${t.cardBg}`}>
          <div className="flex items-center gap-3 w-full max-w-md relative">
            <Search className={`w-4 h-4 absolute left-3 ${t.textMuted}`} />
            <input type="text" placeholder="Filter records..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`w-full pl-9 pr-4 py-2 text-sm bg-transparent border ${t.border} rounded-md focus:outline-none focus:ring-1 focus:ring-current`} />
          </div>
          
          <div className="flex items-center gap-3">
            {selectedRows.size > 0 && (
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition">
                <Trash2 className="w-4 h-4" /> Delete ({selectedRows.size})
              </button>
            )}
            <button className={`flex items-center gap-1.5 px-4 py-2 rounded-md ${t.accentBg} ${t.accentText} text-sm font-semibold transition hover:opacity-90`}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className={`flex-1 rounded-xl border ${t.border} ${t.cardBg} overflow-hidden flex flex-col`}>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className={`${t.thead} border-b ${t.border} sticky top-0 z-10`}>
                <tr>
                  <th className="px-4 py-3 w-12 text-center">
                    <input type="checkbox" checked={selectedRows.size === filteredData.length && filteredData.length > 0} onChange={toggleAll} className="cursor-pointer" />
                  </th>
                  {currentStream.fields.map(field => (
                    <th key={field} onClick={() => handleSort(field)} className="px-4 py-3 cursor-pointer select-none group">
                      <div className="flex items-center gap-1 uppercase text-xs font-semibold tracking-wider">
                        {field.replace('_', ' ')}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={currentStream.fields.length + 2} className="px-4 py-12 text-center text-sm opacity-50">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className={`border-b ${t.border} last:border-0 ${t.rowHover} transition-colors`}>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={selectedRows.has(idx)} onChange={() => toggleRow(idx)} className="cursor-pointer" />
                      </td>
                      {currentStream.fields.map(field => (
                        <td key={field} className="px-4 py-3 max-w-[200px] truncate" title={String(row[field] || '')}>
                          {row[field] || '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition`}>
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className={`p-3 border-t ${t.border} flex items-center justify-between text-xs ${t.textMuted}`}>
            <span>Showing {filteredData.length} of {dataset.length} records</span>
            <div className="flex gap-2">
              <button disabled className="px-2 py-1 opacity-50 cursor-not-allowed">Previous</button>
              <button disabled className="px-2 py-1 opacity-50 cursor-not-allowed">Next</button>
            </div>
          </div>
        </div>

      </main>

      {/* LOG VIEWER MODAL */}
      <AnimatePresence>
        {isLogViewerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsLogViewerOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={e => e.stopPropagation()} className={`w-full max-w-4xl h-[70vh] rounded-xl border ${t.border} ${t.cardBg} flex flex-col shadow-2xl`}>
              <div className={`flex items-center justify-between p-3 border-b ${t.border}`}>
                <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                  <Terminal className="w-4 h-4" /> SYSTEM_LOGS :: {activeStreamKey.toUpperCase()}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-white/10 rounded"><Maximize2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsLogViewerOpen(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className={`hover:bg-white/5 px-2 py-0.5 rounded ${log.includes('ERROR') ? 'text-red-500' : ''}`}>{log}</div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
