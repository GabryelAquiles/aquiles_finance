// Dados Iniciais de Demonstração
const initialTransactions = [
    { id: '1', description: 'Salário Mensal', amount: 5500.00, type: 'income', category: 'Salário', date: '2026-10-05' },
    { id: '2', description: 'Supermercado', amount: 642.80, type: 'expense', category: 'Alimentação', date: '2026-10-10' },
    { id: '3', description: 'Aluguel & Condomínio', amount: 1800.00, type: 'expense', category: 'Moradia', date: '2026-10-12' },
    { id: '4', description: 'Projeto Freelance Dev', amount: 1200.00, type: 'income', category: 'Investimentos', date: '2026-10-15' },
    { id: '5', description: 'Combustível', amount: 220.00, type: 'expense', category: 'Transporte', date: '2026-10-18' }
];

// Variáveis de Estado Global
let transactions = [];
let cashFlowChartInstance = null;
let categoryChartInstance = null;

// Cores vivas para o gráfico de rosca de categorias
const categoryColors = {
    'Alimentação': '#f59e0b',
    'Moradia': '#3b82f6',
    'Transporte': '#8b5cf6',
    'Lazer': '#ec4899',
    'Saúde': '#06b6d4',
    'Salário': '#10b981',
    'Investimentos': '#6366f1',
    'Outros': '#6b7280'
};

// Inicialização da Aplicação ao carregar o DOM
window.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    setDefaultDate();
    initCharts();
    renderApp();
});

// Carregar transações do LocalStorage
function loadTransactions() {
    const saved = localStorage.getItem('aquiles_transactions');
    if (saved) {
        try {
            transactions = JSON.parse(saved);
        } catch(e) {
            transactions = [...initialTransactions];
        }
    } else {
        transactions = [...initialTransactions];
        saveTransactions();
    }
}

// Salvar no LocalStorage
function saveTransactions() {
    localStorage.setItem('aquiles_transactions', JSON.stringify(transactions));
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tx-date').value = today;
}

function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDateBR(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Renderização Geral
function renderApp() {
    renderTotals();
    renderTransactionList();
    updateCharts();
}

// Atualiza os Cards de Métrica
function renderTotals() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        const amt = parseFloat(t.amount);
        if (t.type === 'income') totalIncome += amt;
        else totalExpense += amt;
    });

    const balance = totalIncome - totalExpense;

    document.getElementById('total-balance').textContent = formatBRL(balance);
    document.getElementById('total-incomes').textContent = formatBRL(totalIncome);
    document.getElementById('total-expenses').textContent = formatBRL(totalExpense);
}

// Renderiza a Lista/Tabela de Transações
function renderTransactionList() {
    const listContainer = document.getElementById('transaction-list');
    const emptyState = document.getElementById('empty-state');
    const filtered = getFilteredTransactions();

    listContainer.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        filtered.forEach(tx => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/[0.03] transition-colors group';

            const isIncome = tx.type === 'income';
            const amountClass = isIncome ? 'text-[#10b981] font-bold' : 'text-[#ef4444] font-bold';
            const sign = isIncome ? '+' : '-';

            tr.innerHTML = `
                <td class="py-3.5 px-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-lg glass-panel flex items-center justify-center text-xs ${isIncome ? 'text-[#10b981]' : 'text-[#ef4444]'}">
                            <i class="fa-solid ${isIncome ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                        </div>
                        <span class="font-medium text-white">${escapeHtml(tx.description)}</span>
                    </div>
                </td>
                <td class="py-3.5 px-4">
                    <span class="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 border border-white/10 text-zinc-300">
                        ${escapeHtml(tx.category)}
                    </span>
                </td>
                <td class="py-3.5 px-4 text-xs text-zinc-400">${formatDateBR(tx.date)}</td>
                <td class="py-3.5 px-4 text-right text-sm ${amountClass}">${sign} ${formatBRL(tx.amount)}</td>
                <td class="py-3.5 px-4 text-center">
                    <button onclick="deleteTransaction('${tx.id}')" title="Excluir Transação" class="text-zinc-500 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </td>
            `;
            listContainer.appendChild(tr);
        });
    }
}

function getFilteredTransactions() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const categoryFilter = document.getElementById('filter-category').value;

    return transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchText);
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        return matchesSearch && matchesType && matchesCategory;
    });
}

function filterTransactions() {
    renderTransactionList();
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderApp();
    showToast('Lançamento removido com sucesso!', 'fa-trash-can');
}

function handleNewTransaction(e) {
    e.preventDefault();

    const desc = document.getElementById('tx-desc').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const type = document.getElementById('tx-type').value;
    const category = document.getElementById('tx-category').value;
    const date = document.getElementById('tx-date').value;

    if (!desc || isNaN(amount) || amount <= 0 || !date) return;

    const newTx = { id: Date.now().toString(), description: desc, amount, type, category, date };

    transactions.push(newTx);
    saveTransactions();
    renderApp();
    closeTransactionModal();
    showToast('Lançamento salvo com sucesso!');
    document.getElementById('transaction-form').reset();
    setDefaultDate();
}

// Configuração dos Gráficos do Chart.js
function initCharts() {
    const ctx1 = document.getElementById('cashFlowChart').getContext('2d');
    cashFlowChartInstance = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            datasets: [
                { label: 'Entradas', data: Array(12).fill(0), backgroundColor: '#10b981', borderRadius: 6, barThickness: 12 },
                { label: 'Saídas', data: Array(12).fill(0), backgroundColor: '#ef4444', borderRadius: 6, barThickness: 12 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#71717a', font: { size: 10 } } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a', font: { size: 10 } } }
            }
        }
    });

    const ctx2 = document.getElementById('categoryChart').getContext('2d');
    categoryChartInstance = new Chart(ctx2, {
        type: 'doughnut',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 2, borderColor: '#121215' }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', font: { size: 11 }, boxWidth: 10 } } }
        }
    });
}

function updateCharts() {
    if (!cashFlowChartInstance || !categoryChartInstance) return;

    const incomeByMonth = Array(12).fill(0);
    const expenseByMonth = Array(12).fill(0);

    transactions.forEach(t => {
        if (t.date) {
            const monthIndex = new Date(t.date).getMonth();
            if (monthIndex >= 0 && monthIndex < 12) {
                if (t.type === 'income') incomeByMonth[monthIndex] += parseFloat(t.amount);
                else expenseByMonth[monthIndex] += parseFloat(t.amount);
            }
        }
    });

    cashFlowChartInstance.data.datasets[0].data = incomeByMonth;
    cashFlowChartInstance.data.datasets[1].data = expenseByMonth;
    cashFlowChartInstance.update();

    const categoryTotals = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = labels.map(lbl => categoryColors[lbl] || '#6b7280');

    document.getElementById('no-category-msg').classList.toggle('hidden', labels.length > 0);

    categoryChartInstance.data.labels = labels;
    categoryChartInstance.data.datasets[0].data = data;
    categoryChartInstance.data.datasets[0].backgroundColor = colors;
    categoryChartInstance.update();
}

// Simulação de Sincronização Open Finance
function openSyncModal() {
    const modal = document.getElementById('modal-sync');
    document.getElementById('sync-step-select').classList.remove('hidden');
    document.getElementById('sync-step-loading').classList.add('hidden');
    document.getElementById('sync-step-success').classList.add('hidden');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function closeSyncModal() {
    const modal = document.getElementById('modal-sync');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function simulateBankSync(bankName) {
    document.getElementById('sync-step-select').classList.add('hidden');
    document.getElementById('sync-step-loading').classList.remove('hidden');
    document.getElementById('sync-loading-bank').textContent = `Conectando ao ${bankName}...`;

    setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        const mockImports = [
            { id: Date.now().toString() + '1', description: `${bankName} - Restaurante`, amount: 89.90, type: 'expense', category: 'Alimentação', date: today },
            { id: Date.now().toString() + '2', description: `${bankName} - Rendimento CDB`, amount: 145.20, type: 'income', category: 'Investimentos', date: today }
        ];

        transactions.push(...mockImports);
        saveTransactions();
        renderApp();

        document.getElementById('sync-step-loading').classList.add('hidden');
        document.getElementById('sync-step-success').classList.remove('hidden');
        document.getElementById('sync-success-msg').textContent = `Foram importadas ${mockImports.length} novas transações do ${bankName}.`;
        showToast(`Banco ${bankName} sincronizado com sucesso!`);
    }, 2000);
}

function openTransactionModal() {
    const modal = document.getElementById('modal-transaction');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
}

function closeTransactionModal() {
    const modal = document.getElementById('modal-transaction');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function showToast(message, iconClass = 'fa-circle-check') {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = message;
    document.getElementById('toast-icon').className = `fa-solid ${iconClass} text-white text-lg`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}