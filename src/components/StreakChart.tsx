import React from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

interface StreakChartProps {
  data: number[];
  maData: (number | null)[];
}

export function StreakChart({ data, maData }: StreakChartProps) {
  const chartData = {
    labels: Array.from({ length: 80 }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Streak Index',
        data: data,
        borderColor: 'rgb(6, 182, 212)', // Cyan 500
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: 'rgb(255, 255, 255)',
        pointBorderColor: 'rgb(6, 182, 212)',
        pointBorderWidth: 1,
        pointHoverRadius: 4,
        fill: false,
        tension: 0,
      },
      {
        label: '5-Period MA',
        data: maData,
        borderColor: 'rgb(217, 70, 239)', // Fuchsia 500
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: 'rgb(255, 255, 255)',
        pointBorderColor: 'rgb(217, 70, 239)',
        pointBorderWidth: 1,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.4,
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
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => `Hand ${context[0].label}`,
        }
      },
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

  return <Line data={chartData} options={options} />;
}
