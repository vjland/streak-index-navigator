export type Outcome = 'P' | 'B' | 'T';

export function simulateShoe(): Outcome[] {
  const shoe: number[] = [];
  // 8 decks
  for (let i = 0; i < 8; i++) {
    // Cards 1-9 (4 of each per deck)
    for (let val = 1; val <= 9; val++) {
      for (let j = 0; j < 4; j++) shoe.push(val);
    }
    // Cards 10, J, Q, K (value 0, 16 per deck)
    for (let j = 0; j < 16; j++) shoe.push(0);
  }
  
  // Fisher-Yates shuffle
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }

  const outcomes: Outcome[] = [];
  let cursor = 0;
  
  // Cut card around 14 cards from the end
  const cutCard = shoe.length - 14;

  while (cursor < cutCard) {
    if (cursor + 6 > shoe.length) break; // Not enough cards for a hand

    const p1 = shoe[cursor++];
    const b1 = shoe[cursor++];
    const p2 = shoe[cursor++];
    const b2 = shoe[cursor++];

    let pTotal = (p1 + p2) % 10;
    let bTotal = (b1 + b2) % 10;

    // Natural
    if (pTotal >= 8 || bTotal >= 8) {
      if (pTotal > bTotal) outcomes.push('P');
      else if (bTotal > pTotal) outcomes.push('B');
      else outcomes.push('T');
      continue;
    }

    let p3 = -1;
    // Player draws 3rd card
    if (pTotal <= 5) {
      p3 = shoe[cursor++];
      pTotal = (pTotal + p3) % 10;
    }

    let bDraws = false;
    // Banker draws 3rd card
    if (p3 === -1) {
      if (bTotal <= 5) bDraws = true;
    } else {
      if (bTotal <= 2) bDraws = true;
      else if (bTotal === 3 && p3 !== 8) bDraws = true;
      else if (bTotal === 4 && p3 >= 2 && p3 <= 7) bDraws = true;
      else if (bTotal === 5 && p3 >= 4 && p3 <= 7) bDraws = true;
      else if (bTotal === 6 && (p3 === 6 || p3 === 7)) bDraws = true;
    }

    if (bDraws) {
      const b3 = shoe[cursor++];
      bTotal = (bTotal + b3) % 10;
    }

    if (pTotal > bTotal) outcomes.push('P');
    else if (bTotal > pTotal) outcomes.push('B');
    else outcomes.push('T');
  }

  return outcomes;
}

export function calculateStreakIndex(outcomes: Outcome[]): number[] {
  const nonTies = outcomes.filter(o => o !== 'T');
  if (nonTies.length === 0) return [];
  
  const index = [0];
  let currentIndex = 0;
  
  for (let i = 1; i < nonTies.length; i++) {
    if (nonTies[i] === nonTies[i-1]) {
      currentIndex += 1;
    } else {
      currentIndex -= 1;
    }
    index.push(currentIndex);
  }
  
  return index;
}

export function calculateMovingAverage(data: number[], period: number = 5): (number | null)[] {
  const ma: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ma.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      ma.push(sum / period);
    }
  }
  return ma;
}
