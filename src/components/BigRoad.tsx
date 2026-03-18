import React, { useMemo } from 'react';
import { Outcome } from '../baccarat';

interface Cell {
  outcome: 'P' | 'B';
  ties: number;
}

interface BigRoadProps {
  outcomes: Outcome[];
}

export function BigRoad({ outcomes }: BigRoadProps) {
  const grid = useMemo(() => {
    const matrix: (Cell | null)[][] = [];
    const ensureCol = (c: number) => {
      while (matrix.length <= c) matrix.push(Array(6).fill(null));
    };

    let logicalRow = 0;
    let streakStartCol = 0;
    let lastOutcome: 'P' | 'B' | null = null;
    let lastCell: Cell | null = null;
    let leadTies = 0;

    for (const outcome of outcomes) {
      if (outcome === 'T') {
        if (lastCell) lastCell.ties++;
        else leadTies++;
        continue;
      }

      if (lastOutcome === null) {
        lastOutcome = outcome;
        logicalRow = 0;
        streakStartCol = 0;
      } else if (outcome === lastOutcome) {
        logicalRow++;
      } else {
        lastOutcome = outcome;
        logicalRow = 0;
        streakStartCol++;
        while (matrix[streakStartCol] && matrix[streakStartCol][0] !== null) {
          streakStartCol++;
        }
      }

      let placeCol = streakStartCol;
      let placeRow = logicalRow;

      if (placeRow >= 6) {
        placeCol += (placeRow - 5);
        placeRow = 5;
      }
      
      ensureCol(placeCol);
      while (matrix[placeCol][placeRow] !== null) {
        placeCol++;
        ensureCol(placeCol);
      }

      const cell: Cell = { outcome, ties: leadTies };
      leadTies = 0;
      matrix[placeCol][placeRow] = cell;
      lastCell = cell;
    }

    // Ensure at least 25 columns for visual fill
    ensureCol(Math.max(25, matrix.length));
    return matrix;
  }, [outcomes]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex flex-col border-l border-t border-zinc-800/80 min-w-full">
        {[5, 4, 3, 2, 1, 0].map((rowIdx) => (
          <div key={rowIdx} className="flex">
            {grid.map((col, colIdx) => {
              const cell = col[rowIdx];
              return (
                <div 
                  key={`${colIdx}-${rowIdx}`} 
                  className="w-[18px] h-[18px] flex-shrink-0 border-r border-b border-zinc-800/80 flex items-center justify-center relative bg-zinc-900/50"
                >
                  {cell && (
                    <div className={`w-[14px] h-[14px] rounded-full border-[1.5px] flex items-center justify-center relative
                      ${cell.outcome === 'P' ? 'border-blue-500' : 'border-red-500'}
                    `}>
                      {cell.ties > 0 && (
                        <div className="absolute w-[14px] h-[1.5px] bg-emerald-500 transform -rotate-45" />
                      )}
                      {cell.ties > 1 && (
                        <span className="absolute -bottom-[3px] -right-[3px] text-[8px] font-bold text-emerald-400 bg-zinc-800 rounded-full w-[14px] h-[14px] flex items-center justify-center shadow-sm border border-emerald-900 leading-none">
                          {cell.ties}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
