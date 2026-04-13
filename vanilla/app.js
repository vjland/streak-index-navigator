// Baccarat Logic
function simulateShoe() {
    const shoe = [];
    for (let i = 0; i < 8; i++) {
        for (let val = 1; val <= 9; val++) {
            for (let j = 0; j < 4; j++) shoe.push(val);
        }
        for (let j = 0; j < 16; j++) shoe.push(0);
    }
    
    for (let i = shoe.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
    }

    const outcomes = [];
    let cursor = 0;
    const cutCard = shoe.length - 14;

    while (cursor < cutCard) {
        if (cursor + 6 > shoe.length) break;

        const p1 = shoe[cursor++];
        const b1 = shoe[cursor++];
        const p2 = shoe[cursor++];
        const b2 = shoe[cursor++];

        let pTotal = (p1 + p2) % 10;
        let bTotal = (b1 + b2) % 10;

        if (pTotal >= 8 || bTotal >= 8) {
            if (pTotal > bTotal) outcomes.push('P');
            else if (bTotal > pTotal) outcomes.push('B');
            else outcomes.push('T');
            continue;
        }

        let p3 = -1;
        if (pTotal <= 5) {
            p3 = shoe[cursor++];
            pTotal = (pTotal + p3) % 10;
        }

        let bDraws = false;
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

function calculateStreakIndex(outcomes) {
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

function calculateMA(data, period = 9) {
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
}

// App State
let demoOutcomes = [];
let liveOutcomes = [];
let mode = 'demo'; // 'demo' | 'live'
let isInputOpen = false;
let showBigRoad = true;
let maPeriods = [9];
let chartInstance = null;

// DOM Elements
const btnDemo = document.getElementById('btn-demo');
const btnLive = document.getElementById('btn-live');
const btnAction = document.getElementById('btn-action');
const iconRefresh = document.getElementById('icon-refresh');
const iconEdit = document.getElementById('icon-edit');
const liveInputPanel = document.getElementById('live-input-panel');
const btnP = document.getElementById('btn-p');
const btnB = document.getElementById('btn-b');
const btnUndo = document.getElementById('btn-undo');
const btnClear = document.getElementById('btn-clear');
const chartEmpty = document.getElementById('chart-empty');
const lastOutcomeEl = document.getElementById('last-outcome');
const ctx = document.getElementById('streakChart').getContext('2d');
const confirmModal = document.getElementById('confirm-modal');
const btnCancelClear = document.getElementById('btn-cancel-clear');
const btnConfirmClear = document.getElementById('btn-confirm-clear');
const btnDownloadChart = document.getElementById('btn-download-chart');
const btnToggleBigRoad = document.getElementById('btn-toggle-bigroad');
const periodBtns = document.querySelectorAll('.period-btn');
const bigRoadContainer = document.getElementById('big-road-container');
const bigRoadScroll = document.getElementById('big-road-scroll');

// Calculator DOM
const calculatorFooter = document.getElementById('calculator-footer');

// Initialization
function init() {
    handleNewDemoShoe();
    setupEventListeners();
}

function setupEventListeners() {
    btnDemo.addEventListener('click', () => setMode('demo'));
    btnLive.addEventListener('click', () => setMode('live'));
    
    btnAction.addEventListener('click', () => {
        if (mode === 'demo') {
            handleNewDemoShoe();
        } else {
            toggleInputPanel();
        }
    });

    btnP.addEventListener('click', () => handleAddLiveOutcome('P'));
    btnB.addEventListener('click', () => handleAddLiveOutcome('B'));
    btnUndo.addEventListener('click', handleUndoLiveOutcome);
    btnClear.addEventListener('click', () => {
        confirmModal.classList.remove('hidden');
    });

    btnCancelClear.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
    });

    btnConfirmClear.addEventListener('click', () => {
        handleClearLiveShoe();
        confirmModal.classList.add('hidden');
    });

    btnDownloadChart.addEventListener('click', handleDownloadChart);

    btnToggleBigRoad.addEventListener('click', () => {
        showBigRoad = !showBigRoad;
        btnToggleBigRoad.classList.toggle('active', showBigRoad);
        updateUI();
    });

    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const p = parseInt(btn.dataset.period);
            if (maPeriods.includes(p)) {
                maPeriods = maPeriods.filter(x => x !== p);
                btn.classList.remove('active');
            } else {
                maPeriods.push(p);
                btn.classList.add('active');
            }
            updateChart(mode === 'demo' ? demoOutcomes : liveOutcomes);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = e.key.toLowerCase();
        if (key === 'p') {
            if (mode !== 'live') setMode('live');
            handleAddLiveOutcome('P');
        } else if (key === 'b') {
            if (mode !== 'live') setMode('live');
            handleAddLiveOutcome('B');
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            if (mode !== 'live') setMode('live');
            if (liveOutcomes.length > 0) handleUndoLiveOutcome();
        }
    });
}

// Actions
function setMode(newMode) {
    mode = newMode;
    btnDemo.className = mode === 'demo' ? 'active' : '';
    btnLive.className = mode === 'live' ? 'active' : '';
    
    const chartContainer = document.querySelector('.chart-container');
    if (mode === 'live') {
        chartContainer.classList.add('live-mode');
        calculatorFooter.classList.remove('hidden');
    } else {
        chartContainer.classList.remove('live-mode');
        calculatorFooter.classList.add('hidden');
    }
    
    if (mode === 'demo') {
        iconRefresh.style.display = 'block';
        iconEdit.style.display = 'none';
        btnAction.classList.remove('active');
        toggleInputPanel(false);
    } else {
        iconRefresh.style.display = 'none';
        iconEdit.style.display = 'block';
    }
    
    updateUI();
}

function toggleInputPanel(force) {
    isInputOpen = force !== undefined ? force : !isInputOpen;
    if (isInputOpen) {
        liveInputPanel.classList.remove('hidden');
        btnAction.classList.add('active');
    } else {
        liveInputPanel.classList.add('hidden');
        btnAction.classList.remove('active');
    }
}

function handleNewDemoShoe() {
    demoOutcomes = simulateShoe();
    updateUI();
}

function handleAddLiveOutcome(outcome) {
    if (outcome === 'P') {
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    } else if (outcome === 'B') {
        if (navigator.vibrate) navigator.vibrate(100);
    }
    liveOutcomes.push(outcome);
    updateUI();
}

function handleUndoLiveOutcome() {
    liveOutcomes.pop();
    updateUI();
}

function handleClearLiveShoe() {
    liveOutcomes = [];
    updateUI();
}

function handleDownloadChart() {
    const canvas = document.getElementById('streakChart');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `sigma-i-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// UI Updates
function updateUI() {
    const currentOutcomes = mode === 'demo' ? demoOutcomes : liveOutcomes;
    const hasData = currentOutcomes.length > 0;
    
    // Update empty states
    const emptyText = mode === 'demo' ? 'Simulating shoe...' : 'Awaiting live input...';
    chartEmpty.textContent = emptyText;
    
    chartEmpty.style.display = hasData ? 'none' : 'flex';
    document.getElementById('streakChart').style.display = hasData ? 'block' : 'none';

    // Update buttons
    btnUndo.disabled = liveOutcomes.length === 0;
    btnClear.disabled = liveOutcomes.length === 0;

    if (showBigRoad) {
        bigRoadContainer.classList.remove('hidden');
    } else {
        bigRoadContainer.classList.add('hidden');
    }

    if (hasData) {
        updateChart(currentOutcomes);
        
        if (mode === 'live') {
            // Update last outcome
            const last = currentOutcomes[currentOutcomes.length - 1];
            lastOutcomeEl.textContent = last;
            lastOutcomeEl.className = 'last-outcome'; // reset classes
            if (last === 'P') {
                lastOutcomeEl.classList.add('outcome-p');
            } else if (last === 'B') {
                lastOutcomeEl.classList.add('outcome-b');
            } else {
                lastOutcomeEl.classList.add('outcome-t');
            }
            lastOutcomeEl.classList.remove('hidden');
        } else {
            lastOutcomeEl.classList.add('hidden');
            lastOutcomeEl.textContent = '';
        }
    } else {
        lastOutcomeEl.classList.add('hidden');
    }

    if (showBigRoad) {
        drawBigRoad(currentOutcomes);
    }
}

function drawBigRoad(outcomes) {
    const cells = [];
    let currentX = 0;
    let currentY = 0;
    let currentStreakOutcome = null;
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

    const maxX = cells.reduce((max, cell) => Math.max(max, cell.x), 0);
    const minCols = 40;
    const cols = Math.max(minCols, maxX + 2);
    const cellSize = 16;
    const width = cols * cellSize;
    const height = 6 * cellSize;

    let svgContent = `
        <svg id="big-road-svg" width="${width}" height="${height}" style="min-width: 100%; min-height: 100%;">
            <defs>
                <pattern id="grid" width="${cellSize}" height="${cellSize}" patternUnits="userSpaceOnUse">
                    <path d="M ${cellSize} 0 L 0 0 0 ${cellSize}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
    `;

    cells.forEach(cell => {
        const cx = cell.x * cellSize + cellSize / 2;
        const cy = cell.y * cellSize + cellSize / 2;
        const r = cellSize / 2 - 2;
        const color = cell.outcome === 'P' ? '#3b82f6' : '#ef4444';

        svgContent += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="2" />`;
        
        if (cell.ties > 0) {
            svgContent += `<line x1="${cx - r + 1}" y1="${cy + r - 1}" x2="${cx + r - 1}" y2="${cy - r + 1}" stroke="#10b981" stroke-width="2" />`;
        }
        if (cell.ties > 1) {
            svgContent += `<text x="${cx}" y="${cy + 3}" font-size="8" fill="#10b981" text-anchor="middle" font-weight="bold">${cell.ties}</text>`;
        }
    });

    svgContent += `</svg>`;
    bigRoadScroll.innerHTML = svgContent;
    
    if (mode === 'demo') {
        bigRoadScroll.scrollLeft = 0;
    } else {
        const clientWidth = bigRoadScroll.clientWidth;
        const targetX = (maxX + 2) * cellSize;
        if (targetX > clientWidth) {
            bigRoadScroll.scrollLeft = targetX - clientWidth;
        } else {
            bigRoadScroll.scrollLeft = 0;
        }
    }
}

function updateChart(outcomes) {
    const streakIndex = calculateStreakIndex(outcomes);
    const maData6 = calculateMA(streakIndex, 6);
    const maData9 = calculateMA(streakIndex, 9);
    
    const labels = Array.from({ length: 80 }, (_, i) => i + 1);

    if (chartInstance) {
        chartInstance.data.datasets[0].data = streakIndex;
        chartInstance.data.datasets[0].borderColor = mode === 'live' ? 'rgb(16, 185, 129)' : 'rgb(6, 182, 212)';
        
        chartInstance.data.datasets[1].data = maData6;
        chartInstance.data.datasets[1].hidden = !maPeriods.includes(6);
        
        chartInstance.data.datasets[2].data = maData9;
        chartInstance.data.datasets[2].hidden = !maPeriods.includes(9);
        
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Streak Index',
                        data: streakIndex,
                        borderColor: mode === 'live' ? 'rgb(16, 185, 129)' : 'rgb(6, 182, 212)',
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: false,
                        tension: 0.3,
                    },
                    {
                        label: `6-Period MA`,
                        data: maData6,
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.4,
                        hidden: !maPeriods.includes(6),
                    },
                    {
                        label: `9-Period MA`,
                        data: maData9,
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.4,
                        hidden: !maPeriods.includes(9),
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 0 },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'y'
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
                        grid: { display: false, drawTicks: false },
                        ticks: { padding: 0 },
                        border: { display: false }
                    },
                    y: {
                        min: -20,
                        max: 20,
                        grid: { color: 'rgba(255, 255, 255, 0.03)', drawTicks: false },
                        ticks: { padding: 0 },
                        border: { display: false }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
}

// Start
init();
