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

function calculateMovingAverage(data, period = 5) {
    const ma = [];
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

// App State
let demoOutcomes = [];
let liveOutcomes = [];
let mode = 'demo'; // 'demo' | 'live'
let isInputOpen = false;
let chartInstance = null;

// Calculator State
let netUnits = 0;
let steps = 0;
let unitHistory = [];
let sessionStartTime = null;
let sessions = [];
try {
    const saved = localStorage.getItem('baccarat_sessions_vanilla');
    if (saved) {
        sessions = JSON.parse(saved);
    }
} catch (e) {
    sessions = [];
}
let isLogOpen = false;

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

// Calculator DOM
const calculatorFooter = document.getElementById('calculator-footer');
const calcNetValue = document.getElementById('calc-net-value');
const btnCalcMinus = document.getElementById('btn-calc-minus');
const btnCalcPlus = document.getElementById('btn-calc-plus');
const btnCalcUndo = document.getElementById('btn-calc-undo');
const btnCalcRefresh = document.getElementById('btn-calc-refresh');
const btnCalcLog = document.getElementById('btn-calc-log');
const calcLogPanel = document.getElementById('calc-log-panel');
const calcLogEmpty = document.getElementById('calc-log-empty');
const calcLogList = document.getElementById('calc-log-list');
const btnCalcClearAll = document.getElementById('btn-calc-clear-all');
const btnCalcExportCsv = document.getElementById('btn-calc-export-csv');
const confirmSessionsModal = document.getElementById('confirm-sessions-modal');
const btnCancelClearSessions = document.getElementById('btn-cancel-clear-sessions');
const btnConfirmClearSessions = document.getElementById('btn-confirm-clear-sessions');

// Initialization
function init() {
    handleNewDemoShoe();
    setupEventListeners();
    updateCalculatorUI();
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

    // Calculator listeners
    btnCalcMinus.addEventListener('click', () => handleUnitChange(-1));
    btnCalcPlus.addEventListener('click', () => handleUnitChange(1));
    btnCalcUndo.addEventListener('click', handleUndoUnitChange);
    btnCalcRefresh.addEventListener('click', handleRefreshCalculator);
    btnCalcLog.addEventListener('click', toggleCalcLog);
    btnCalcExportCsv.addEventListener('click', handleExportCSV);

    btnCalcClearAll.addEventListener('click', () => {
        confirmSessionsModal.classList.remove('hidden');
    });

    btnCancelClearSessions.addEventListener('click', () => {
        confirmSessionsModal.classList.add('hidden');
    });

    btnConfirmClearSessions.addEventListener('click', () => {
        sessions = [];
        localStorage.setItem('baccarat_sessions_vanilla', JSON.stringify(sessions));
        updateCalculatorUI();
        confirmSessionsModal.classList.add('hidden');
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

// Calculator Actions
function handleUnitChange(delta) {
    if (sessionStartTime === null) {
        sessionStartTime = Date.now();
    }
    netUnits += delta;
    steps += 1;
    unitHistory.push(delta);
    updateCalculatorUI();
}

function handleUndoUnitChange() {
    if (unitHistory.length > 0) {
        const lastDelta = unitHistory.pop();
        netUnits -= lastDelta;
        steps -= 1;
        if (unitHistory.length === 0) {
            sessionStartTime = null;
        }
        updateCalculatorUI();
    }
}

function handleRefreshCalculator() {
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
        
        sessions.unshift(newSession);
        localStorage.setItem('baccarat_sessions_vanilla', JSON.stringify(sessions));
    }
    
    netUnits = 0;
    steps = 0;
    unitHistory = [];
    sessionStartTime = null;
    updateCalculatorUI();
}

function handleExportCSV() {
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
}

function toggleCalcLog() {
    isLogOpen = !isLogOpen;
    updateCalculatorUI();
}

function updateCalculatorUI() {
    // Value
    calcNetValue.textContent = (netUnits > 0 ? '+' : '') + netUnits;
    calcNetValue.className = 'calc-value';
    if (netUnits > 0) calcNetValue.classList.add('positive');
    else if (netUnits < 0) calcNetValue.classList.add('negative');

    // Panel
    if (isLogOpen) {
        calcLogPanel.classList.remove('hidden');
        btnCalcLog.classList.add('active');
    } else {
        calcLogPanel.classList.add('hidden');
        btnCalcLog.classList.remove('active');
    }
    
    btnCalcUndo.disabled = unitHistory.length === 0;

    // List
    if (sessions.length === 0) {
        calcLogEmpty.style.display = 'block';
        calcLogList.style.display = 'none';
        btnCalcClearAll.classList.add('hidden');
        btnCalcExportCsv.classList.add('hidden');
    } else {
        calcLogEmpty.style.display = 'none';
        calcLogList.style.display = 'block';
        btnCalcClearAll.classList.remove('hidden');
        btnCalcExportCsv.classList.remove('hidden');
        
        calcLogList.innerHTML = '';
        
        // Group by date
        const groupedSessions = sessions.reduce((acc, session) => {
            const datePart = session.date.split(',')[0];
            if (!acc[datePart]) acc[datePart] = [];
            acc[datePart].push(session);
            return acc;
        }, {});

        Object.entries(groupedSessions).forEach(([date, dateSessions]) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'calc-log-group';
            
            const header = document.createElement('h4');
            header.className = 'calc-log-group-header';
            header.textContent = date;
            groupDiv.appendChild(header);
            
            const tableContainer = document.createElement('div');
            tableContainer.className = 'calc-log-table-container';
            
            const table = document.createElement('table');
            table.className = 'calc-log-table';
            
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Time</th>
                    <th>Duration</th>
                    <th class="text-right">Steps</th>
                    <th class="text-right">Net</th>
                    <th class="hidden">Model</th>
                </tr>
            `;
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            dateSessions.forEach(session => {
                const tr = document.createElement('tr');
                const timePart = session.date.split(',')[1] ? session.date.split(',')[1].trim() : session.date;
                const netClass = session.net > 0 ? 'text-emerald' : session.net < 0 ? 'text-rose' : 'text-zinc';
                const netText = (session.net > 0 ? '+' : '') + session.net;
                const stepsText = session.steps || 0;
                const modelText = session.model || 'Sigma';
                
                tr.innerHTML = `
                    <td class="text-zinc-400">${timePart}</td>
                    <td class="text-zinc-300">${session.duration}</td>
                    <td class="text-zinc-300 text-right">${stepsText}</td>
                    <td class="font-bold text-right ${netClass}">${netText}</td>
                    <td class="hidden">${modelText}</td>
                `;
                tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            tableContainer.appendChild(table);
            groupDiv.appendChild(tableContainer);
            calcLogList.appendChild(groupDiv);
        });
    }
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

    if (hasData) {
        updateChart(currentOutcomes);
        
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
    }
}

function updateChart(outcomes) {
    const streakIndex = calculateStreakIndex(outcomes);
    const maData = calculateMovingAverage(streakIndex, 5);
    
    const labels = Array.from({ length: 80 }, (_, i) => i + 1);

    if (chartInstance) {
        chartInstance.data.datasets[0].data = streakIndex;
        chartInstance.data.datasets[1].data = maData;
        chartInstance.data.datasets[0].borderColor = mode === 'live' ? 'rgb(16, 185, 129)' : 'rgb(6, 182, 212)';
        chartInstance.data.datasets[1].borderColor = mode === 'live' ? 'rgb(245, 158, 11)' : 'rgb(217, 70, 239)';
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
                        tension: 0,
                    },
                    {
                        label: '5-Period MA',
                        data: maData,
                        borderColor: mode === 'live' ? 'rgb(245, 158, 11)' : 'rgb(217, 70, 239)',
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: false,
                        tension: 0.4,
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
