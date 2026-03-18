import React, { useState, useEffect } from 'react';
import { simulateShoe, calculateStreakIndex, calculateMovingAverage, Outcome } from './baccarat';
import { StreakChart } from './components/StreakChart';
import { BigRoad } from './components/BigRoad';
import { RefreshCw, Edit3, X, Undo2, Trash2 } from 'lucide-react';

export default function App() {
  const [demoOutcomes, setDemoOutcomes] = useState<Outcome[]>([]);
  const [liveOutcomes, setLiveOutcomes] = useState<Outcome[]>([]);
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const handleNewDemoShoe = () => {
    setDemoOutcomes(simulateShoe());
  };

  useEffect(() => {
    handleNewDemoShoe();
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
            <div className="absolute top-full right-0 mt-3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl z-20 flex flex-col gap-2 w-48 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Live Input</h3>
                <button onClick={() => setIsInputOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <X size={12} />
                </button>
              </div>
              
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
        <div className="bg-zinc-900 border-b border-zinc-800/80 flex-1 min-h-0 flex flex-col relative overflow-hidden">
          {streakIndex.length > 0 ? (
            <div className="absolute inset-0">
              <StreakChart data={streakIndex} maData={maData} />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
              {mode === 'demo' ? 'Simulating shoe...' : 'Awaiting live input...'}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border-b border-zinc-800/80 h-[80px] flex-shrink-0 flex flex-col justify-end relative overflow-hidden">
          {currentOutcomes.length > 0 ? (
            <BigRoad outcomes={currentOutcomes} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
              {mode === 'demo' ? 'Simulating shoe...' : 'Awaiting live input...'}
            </div>
          )}
        </div>
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
    </div>
  );
}
