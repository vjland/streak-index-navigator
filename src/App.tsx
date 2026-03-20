import React, { useState, useEffect } from 'react';
import { simulateShoe, calculateStreakIndex, calculateMovingAverage, Outcome } from './baccarat';
import { StreakChart } from './components/StreakChart';
import { RefreshCw, Edit3, Undo2, Trash2, List } from 'lucide-react';

interface Session {
  id: string;
  date: string;
  duration: string;
  net: number;
  steps: number;
  model?: string;
}

export default function App() {
  const [demoOutcomes, setDemoOutcomes] = useState<Outcome[]>([]);
  const [liveOutcomes, setLiveOutcomes] = useState<Outcome[]>([]);
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isConfirmClearSessionsOpen, setIsConfirmClearSessionsOpen] = useState(false);

  // Calculator state
  const [netUnits, setNetUnits] = useState(0);
  const [steps, setSteps] = useState(0);
  const [unitHistory, setUnitHistory] = useState<number[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('baccarat_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isLogOpen, setIsLogOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('baccarat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const handleUnitChange = (delta: number) => {
    if (sessionStartTime === null) {
      setSessionStartTime(Date.now());
    }
    setNetUnits(prev => prev + delta);
    setSteps(prev => prev + 1);
    setUnitHistory(prev => [...prev, delta]);
  };

  const handleUndoUnitChange = () => {
    if (unitHistory.length > 0) {
      const lastDelta = unitHistory[unitHistory.length - 1];
      setNetUnits(prev => prev - lastDelta);
      setSteps(prev => prev - 1);
      setUnitHistory(prev => prev.slice(0, -1));
      if (unitHistory.length === 1) {
        setSessionStartTime(null);
      }
    }
  };

  const handleRefreshCalculator = () => {
    if (sessionStartTime !== null && steps > 0) {
      const endTime = Date.now();
      const durationMs = endTime - sessionStartTime;
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      const durationStr = `${minutes}m ${seconds}s`;
      
      const newSession = {
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toLocaleString(),
        duration: durationStr,
        net: netUnits,
        steps: steps,
        model: 'Sigma'
      };
      
      setSessions(prev => [newSession, ...prev]);
    }
    
    setNetUnits(0);
    setSteps(0);
    setUnitHistory([]);
    setSessionStartTime(null);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Duration', 'Steps', 'Net', 'Model'];
    const rows = sessions.map(session => {
      const datePart = session.date.includes(',') ? session.date.split(',')[0].trim() : session.date;
      const timePart = session.date.includes(',') ? session.date.split(',')[1]?.trim() : '';
      return [
        datePart,
        timePart,
        session.duration,
        session.steps || 0,
        session.net,
        session.model || 'Sigma'
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'baccarat_sessions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNewDemoShoe = () => {
    setDemoOutcomes(simulateShoe());
  };

  useEffect(() => {
    handleNewDemoShoe();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      if (key === 'p') {
        setMode('live');
        setLiveOutcomes(prev => [...prev, 'P']);
      } else if (key === 'b') {
        setMode('live');
        setLiveOutcomes(prev => [...prev, 'B']);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setMode('live');
        setLiveOutcomes(prev => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentOutcomes = mode === 'demo' ? demoOutcomes : liveOutcomes;
  const streakIndex = calculateStreakIndex(currentOutcomes);
  const maData = calculateMovingAverage(streakIndex, 5);

  const handleAddLiveOutcome = (outcome: Outcome) => {
    setLiveOutcomes(prev => [...prev, outcome]);
  };

  const handleUndoLiveOutcome = () => {
    setLiveOutcomes(prev => prev.slice(0, -1));
  };

  const handleClearLiveShoe = () => {
    setLiveOutcomes([]);
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center text-cyan-400" title="Streak Index">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 6 5 6 11 12 5 18 13 18" />
              <line x1="19" y1="18" x2="19" y2="10" />
              <line x1="19" y1="6" x2="19.01" y2="6" strokeWidth="3" />
            </svg>
          </div>
          
          <div className="flex items-center bg-zinc-950/50 rounded-lg p-1 border border-zinc-800/80">
            <button
              onClick={() => { setMode('demo'); setIsInputOpen(false); }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'demo' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Demo
            </button>
            <button
              onClick={() => setMode('live')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'live' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Live
            </button>
          </div>
          
          {currentOutcomes.length > 0 && (
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
              currentOutcomes[currentOutcomes.length - 1] === 'P' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : currentOutcomes[currentOutcomes.length - 1] === 'B'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {currentOutcomes[currentOutcomes.length - 1]}
            </div>
          )}
        </div>

        <div className="relative">
          {mode === 'demo' ? (
            <button
              onClick={handleNewDemoShoe}
              className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded-md transition-colors shadow-sm border border-zinc-700/50"
              title="New Shoe"
            >
              <RefreshCw size={14} />
            </button>
          ) : (
            <button
              onClick={() => setIsInputOpen(!isInputOpen)}
              className={`flex items-center justify-center p-1.5 rounded-md transition-colors shadow-sm border ${isInputOpen ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700/50'}`}
              title="Toggle Input Panel"
            >
              <Edit3 size={14} />
            </button>
          )}

          {mode === 'live' && isInputOpen && (
            <div className="absolute top-full -right-6 mt-3 bg-zinc-900 border border-zinc-800 border-r-0 p-3 rounded-l-xl shadow-2xl z-20 flex flex-col gap-2 w-48 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleAddLiveOutcome('P')} 
                  className="bg-blue-500/10 text-blue-400 border border-blue-500/20 py-3 rounded-lg font-bold hover:bg-blue-500/20 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-xl">P</span>
                  <span className="text-xs uppercase tracking-wider opacity-80">Player</span>
                </button>
                <button 
                  onClick={() => handleAddLiveOutcome('B')} 
                  className="bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-lg font-bold hover:bg-red-500/20 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-xl">B</span>
                  <span className="text-xs uppercase tracking-wider opacity-80">Banker</span>
                </button>
              </div>
              
              <div className="flex gap-2 mt-1 pt-2 border-t border-zinc-800/80">
                <button 
                  onClick={handleUndoLiveOutcome} 
                  disabled={liveOutcomes.length === 0} 
                  className="flex-1 flex items-center justify-center gap-1 bg-zinc-800/50 text-zinc-300 py-1.5 rounded-md text-[10px] font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Undo2 size={10} /> Undo
                </button>
                <button 
                  onClick={() => setIsConfirmClearOpen(true)} 
                  disabled={liveOutcomes.length === 0} 
                  className="flex-1 flex items-center justify-center gap-1 bg-rose-500/10 text-rose-400 py-1.5 rounded-md text-[10px] font-medium hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 size={10} /> Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto flex flex-col">
        <div className={`flex-1 min-h-0 flex flex-col relative overflow-hidden transition-colors duration-300 ${mode === 'live' ? 'bg-slate-900' : 'bg-zinc-900'}`}>
          {streakIndex.length > 0 ? (
            <div className="absolute inset-0">
              <StreakChart data={streakIndex} maData={maData} mode={mode} />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
              {mode === 'demo' ? 'Simulating shoe...' : 'Awaiting live input...'}
            </div>
          )}
        </div>
        
        {mode === 'live' && (
          <div className="bg-zinc-900 border-t border-zinc-800/80 p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`text-2xl font-bold ${netUnits > 0 ? 'text-emerald-400' : netUnits < 0 ? 'text-rose-400' : 'text-zinc-100'}`}>
                  {netUnits > 0 ? '+' : ''}{netUnits}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleUnitChange(-1)} className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-lg hover:bg-rose-500/20 transition-colors">-1</button>
                <button onClick={() => handleUnitChange(1)} className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-lg hover:bg-emerald-500/20 transition-colors">+1</button>
                <button onClick={handleUndoUnitChange} disabled={unitHistory.length === 0} className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/50 flex items-center justify-center font-bold text-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">C</button>
                <div className="w-px h-8 bg-zinc-800 mx-2"></div>
                <button onClick={handleRefreshCalculator} className="p-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors" title="Refresh Session">
                  <RefreshCw size={18} />
                </button>
                <button onClick={() => setIsLogOpen(!isLogOpen)} className={`p-2 rounded-md transition-colors ${isLogOpen ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`} title="Session Log">
                  <List size={18} />
                </button>
              </div>
            </div>
            
            {isLogOpen && (
              <div className="mt-4 pt-4 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-300">Session History</h3>
                  {sessions.length > 0 && (
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={handleExportCSV}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Export CSV
                      </button>
                      <button 
                        onClick={() => setIsConfirmClearSessionsOpen(true)}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
                {sessions.length === 0 ? (
                  <div className="text-sm text-zinc-500 italic">No sessions recorded yet.</div>
                ) : (
                  <div className="space-y-6 max-h-60 overflow-y-auto pr-2">
                    {Object.entries(
                      sessions.reduce((acc, session) => {
                        const datePart = session.date.split(',')[0];
                        if (!acc[datePart]) acc[datePart] = [];
                        acc[datePart].push(session);
                        return acc;
                      }, {} as Record<string, Session[]>)
                    ).map(([date, dateSessions]) => (
                      <div key={date} className="space-y-2">
                        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider sticky top-0 bg-zinc-900 py-1">{date}</h4>
                        <div className="bg-zinc-950/50 rounded-lg border border-zinc-800/50 overflow-hidden">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 bg-zinc-900/50 border-b border-zinc-800/50">
                              <tr>
                                <th className="px-3 py-2 font-medium">Time</th>
                                <th className="px-3 py-2 font-medium">Duration</th>
                                <th className="px-3 py-2 font-medium text-right">Steps</th>
                                <th className="px-3 py-2 font-medium text-right">Net</th>
                                <th className="hidden">Model</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                              {(dateSessions as Session[]).map(session => {
                                const timePart = session.date.split(',')[1]?.trim() || session.date;
                                return (
                                  <tr key={session.id} className="hover:bg-zinc-900/30 transition-colors">
                                    <td className="px-3 py-2 text-zinc-400">{timePart}</td>
                                    <td className="px-3 py-2 text-zinc-300">{session.duration}</td>
                                    <td className="px-3 py-2 text-zinc-300 text-right">{session.steps || 0}</td>
                                    <td className={`px-3 py-2 font-bold text-right ${session.net > 0 ? 'text-emerald-400' : session.net < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                                      {session.net > 0 ? '+' : ''}{session.net}
                                    </td>
                                    <td className="hidden">{session.model || 'Sigma'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Clear Shoe Data?</h3>
            <p className="text-sm text-zinc-400 mb-6">This will permanently delete all recorded hands in the current live shoe. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleClearLiveShoe();
                  setIsConfirmClearOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmClearSessionsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Clear Session History?</h3>
            <p className="text-sm text-zinc-400 mb-6">This will permanently delete all recorded sessions. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmClearSessionsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSessions([]);
                  setIsConfirmClearSessionsOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
