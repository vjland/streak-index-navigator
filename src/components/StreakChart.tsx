import React, { useRef, useCallback, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'hammerjs';
import { Download, Grid3X3 } from 'lucide-react';
import { Outcome } from '../baccarat';
import { BigRoad } from './BigRoad';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  zoomPlugin
);

interface StreakChartProps {
  data: number[];
  mode: 'demo' | 'live';
  rawOutcomes?: Outcome[];
}

export function StreakChart({ data, mode, rawOutcomes = [] }: StreakChartProps) {
  const chartRef = useRef<any>(null);
  const isLive = mode === 'live';
  const [showBigRoad, setShowBigRoad] = useState(true);
  const [maPeriods, setMaPeriods] = useState<number[]>([9]);

  const calculateMA = useCallback((period: number) => {
    const ma = new Array(data.length).fill(null);
    if (data.length < period) return ma;
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      ma[i] = sum / period;
    }
    return ma;
  }, [data]);

  const ma6 = useMemo(() => calculateMA(6), [calculateMA]);
  const ma9 = useMemo(() => calculateMA(9), [calculateMA]);

  const toggleMA = (period: number) => {
    setMaPeriods(prev => 
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    );
  };

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.download = `sigma-i-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = chartRef.current.toBase64Image();
    link.click();
  }, []);
  
  const chartData = {
    labels: Array.from({ length: 80 }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Streak Index',
        data: data,
        borderColor: isLive ? 'rgb(16, 185, 129)' : 'rgb(6, 182, 212)', // Emerald 500 : Cyan 500
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.3,
      },
      {
        label: `6-Period MA`,
        data: ma6,
        borderColor: 'rgba(156, 163, 175, 0.5)', // gray-400
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.4,
        hidden: !maPeriods.includes(6),
      },
      {
        label: `9-Period MA`,
        data: ma9,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.4,
        hidden: !maPeriods.includes(9),
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 0,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'y' as const,
        },
        limits: {
          y: { min: -40, max: 40 }
        }
      }
    },
    scales: {
      x: {
        min: 0,
        max: 79,
        title: {
          display: false,
        },
        grid: {
          display: false,
          drawTicks: false,
        },
        ticks: {
          padding: 0,
        },
        border: {
          display: false,
        }
      },
      y: {
        min: -20,
        max: 20,
        title: {
          display: false,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
          drawTicks: false,
        },
        ticks: {
          padding: 0,
        },
        border: {
          display: false,
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="relative flex-1 min-h-0">
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm z-0">
            {mode === "demo" ? "Simulating shoe..." : "Awaiting live input..."}
          </div>
        )}
        <Line ref={chartRef} data={chartData} options={options} />
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 backdrop-blur-sm z-50">
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-md transition-colors"
            title="Download Chart"
          >
            <Download size={16} />
          </button>
          
          <div className="w-px h-4 bg-zinc-700" />
          
          <div className="flex gap-1">
            <button 
              onClick={() => toggleMA(6)} 
              className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${maPeriods.includes(6) ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              6
            </button>
            <button 
              onClick={() => toggleMA(9)} 
              className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${maPeriods.includes(9) ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              9
            </button>
          </div>

          <div className="w-px h-4 bg-zinc-700" />
          
          <button 
            onClick={() => setShowBigRoad(!showBigRoad)} 
            className={`p-1.5 rounded-md transition-colors ${showBigRoad ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Toggle Big Road"
          >
            <Grid3X3 size={16} />
          </button>
        </div>
      </div>
      
      {showBigRoad && (
        <div className="flex-none">
          <BigRoad outcomes={rawOutcomes} mode={mode} />
        </div>
      )}
    </div>
  );
}
