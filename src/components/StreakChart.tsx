import React, { useRef, useCallback } from 'react';
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
import { Download } from 'lucide-react';

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
}

export function StreakChart({ data, mode }: StreakChartProps) {
  const chartRef = useRef<any>(null);
  const isLive = mode === 'live';

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
        tension: 0.1,
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
    <div className="relative w-full h-full">
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm z-0">
          {mode === "demo" ? "Simulating shoe..." : "Awaiting live input..."}
        </div>
      )}
      <Line ref={chartRef} data={chartData} options={options} />
      <button
        onClick={handleDownload}
        className="absolute top-4 left-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg border border-zinc-700 transition-all shadow-xl backdrop-blur-sm z-50"
        title="Download Chart"
      >
        <Download size={16} />
      </button>
    </div>
  );
}
