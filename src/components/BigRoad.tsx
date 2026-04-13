import React, { useMemo, useRef, useEffect } from 'react';
import { Outcome } from '../baccarat';

interface BigRoadProps {
  outcomes: Outcome[];
  mode: 'demo' | 'live';
}

interface BigRoadCell {
  x: number;
  y: number;
  outcome: 'P' | 'B';
  ties: number;
}

function generateBigRoad(outcomes: Outcome[]): BigRoadCell[] {
  const cells: BigRoadCell[] = [];
  let currentX = 0;
  let currentY = 0;
  let currentStreakOutcome: 'P' | 'B' | null = null;
  let isDragonTail = false;
  let pendingTies = 0;
  let streakIndex = 0;

  for (const outcome of outcomes) {
    if (outcome === 'T') {
      if (cells.length === 0) {
        pendingTies++;
      } else {
        cells[cells.length - 1].ties++;
      }
      continue;
    }

    if (currentStreakOutcome === null) {
      currentStreakOutcome = outcome;
      cells.push({ x: 0, y: 0, outcome, ties: pendingTies });
      pendingTies = 0;
    } else if (outcome === currentStreakOutcome) {
      if (!isDragonTail && currentY + 1 < 6 && !cells.some(c => c.x === currentX && c.y === currentY + 1)) {
        currentY++;
      } else {
        isDragonTail = true;
        currentX++;
      }
      cells.push({ x: currentX, y: currentY, outcome, ties: pendingTies });
      pendingTies = 0;
    } else {
      currentStreakOutcome = outcome;
      isDragonTail = false;
      streakIndex++;
      
      let nextCol = streakIndex;
      while (cells.some(c => c.x === nextCol && c.y === 0)) {
        nextCol++;
      }
      streakIndex = nextCol;
      currentX = nextCol;
      currentY = 0;
      cells.push({ x: currentX, y: currentY, outcome, ties: pendingTies });
      pendingTies = 0;
    }
  }

  return cells;
}

export function BigRoad({ outcomes, mode }: BigRoadProps) {
  const cells = useMemo(() => generateBigRoad(outcomes), [outcomes]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const maxX = cells.reduce((max, cell) => Math.max(max, cell.x), 0);
  const minCols = 40;
  const cols = Math.max(minCols, maxX + 2);
  const cellSize = 16;
  const width = cols * cellSize;
  const height = 6 * cellSize;

  useEffect(() => {
    if (scrollRef.current) {
      if (mode === 'demo') {
        scrollRef.current.scrollLeft = 0;
      } else {
        const clientWidth = scrollRef.current.clientWidth;
        const targetX = (maxX + 2) * cellSize;
        if (targetX > clientWidth) {
          scrollRef.current.scrollLeft = targetX - clientWidth;
        } else {
          scrollRef.current.scrollLeft = 0;
        }
      }
    }
  }, [cells, maxX, cellSize, mode]);

  return (
    <div 
      ref={scrollRef}
      className="w-full overflow-x-auto overflow-y-hidden bg-zinc-950 border-t border-zinc-800/80 custom-scrollbar"
      style={{ height: height + 8 }}
    >
      <div className="relative" style={{ width, height }}>
        {/* Grid lines */}
        <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
          <defs>
            <pattern id="grid" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
              <path d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Cells */}
        <svg className="absolute inset-0" width={width} height={height}>
          {cells.map((cell, i) => {
            const cx = cell.x * cellSize + cellSize / 2;
            const cy = cell.y * cellSize + cellSize / 2;
            const r = cellSize / 2 - 2;
            const color = cell.outcome === 'P' ? '#3b82f6' : '#ef4444'; // blue-500 : red-500

            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2" />
                {cell.ties > 0 && (
                  <line 
                    x1={cx - r + 1} 
                    y1={cy + r - 1} 
                    x2={cx + r - 1} 
                    y2={cy - r + 1} 
                    stroke="#10b981" // emerald-500
                    strokeWidth="2" 
                  />
                )}
                {cell.ties > 1 && (
                  <text x={cx} y={cy + 3} fontSize="8" fill="#10b981" textAnchor="middle" fontWeight="bold">
                    {cell.ties}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
