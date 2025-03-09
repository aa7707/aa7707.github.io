// State management
const state = {
    monthlyIncome: 0,
    envelopes: {},
    transactions: [],
    goals: {},
    lastUpdated: null,
    monthlyHistory: {},
    unallocatedAmount: 0,
    accounts: {}
};

// Theme management with improved transitions
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcons(theme);
}

function updateThemeIcons(theme) {
    const sunIcon = document.querySelector('.fa-sun');
    const moonIcon = document.querySelector('.fa-moon');
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'inline-block';
    } else {
        sunIcon.style.display = 'inline-block';
        moonIcon.style.display = 'none';
    }
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// Helper Functions
function updateDOMContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}

// Account Display Functions
function updateAccountDisplay() {
    let content = '<h3>Your Bank Accounts:</h3>';
    
    // Group accounts by type
    const accountsByType = {
        salary: [],
        savings: [],
        emergency: []
    };

    for (const [accountKey, account] of Object.entries(state.accounts)) {
        accountsByType[account.type].push({ ...account, key: accountKey });
    }

    // Render each account type section
    for (const [type, accounts] of Object.entries(accountsByType)) {
        if (accounts.length > 0) {
            content += `<h4>${type.charAt(0).toUpperCase() + type.slice(1)} Accounts</h4>`;
            content += '<table class="report-table">';
            content += `
                <tr>
                    <th>Account Name</th>
                    <th>Last 4 Digits</th>
                    <th>Balance</th>
                    <th>Actions</th>
                </tr>`;

            accounts.forEach(account => {
                content += `
                    <tr>
                        <td>${account.name}</td>
                        <td>****${account.number}</td>
                        <td>₹${account.balance.toLocaleString()}</td>
                        <td>
                            <button onclick="updateAccountBalance('${account.key}')" class="small-button">Update Balance</button>
                            <button onclick="transferFunds('${account.key}')" class="small-button">Transfer</button>
                            <button onclick="addAccountRule('${account.key}')" class="small-button">Add Rule</button>
                            ${account.type === 'emergency' ? `<button onclick="trackEmergencyFund('${account.key}')" class="small-button">Emergency Fund</button>` : ''}
                        </td>
                    </tr>`;
            });
            content += '</table>';
        }
    }

    updateDOMContent('account-display', content);
}

// Data Validation Functions
const validators = {
    amount: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
    },
    accountNumber: (value) => /^\d{4}$/.test(value),
    required: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
    accountName: (value) => typeof value === 'string' && value.length >= 3 && value.length <= 50
};

function validateInput(value, validations) {
    // If validations is a string (old format), convert it to array with single item
    if (typeof validations === 'string') {
        validations = ['amount'];
    }
    // If validations is not an array, make it one
    if (!Array.isArray(validations)) {
        validations = [validations];
    }
    return validations.every(validation => validators[validation](value));
}

// Improved Error Handling
function showError(message, element) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'status-message status-error';
    errorDiv.textContent = message;
    
    if (element) {
        element.parentNode.insertBefore(errorDiv, element.nextSibling);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

function showSuccess(message, element) {
    const successDiv = document.createElement('div');
    successDiv.className = 'status-message status-success';
    successDiv.textContent = message;
    
    if (element) {
        element.parentNode.insertBefore(successDiv, element.nextSibling);
        setTimeout(() => successDiv.remove(), 5000);
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadState();
    
    // Set up event listeners for real-time validation
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            if (!validators.amount(e.target.value)) {
                e.target.classList.add('invalid');
            } else {
                e.target.classList.remove('invalid');
            }
        });
    });

    // Initialize mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('nav');
    const mainContent = document.getElementById('main');

    mobileMenuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
        mainContent.classList.toggle('nav-open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !mobileMenuToggle.contains(e.target) && nav.classList.contains('active')) {
            nav.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            mainContent.classList.remove('nav-open');
        }
    });

    // Close menu when clicking on a nav button
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (window.innerWidth <= 768) {  // Only on mobile
                nav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                mainContent.classList.remove('nav-open');
            }
        });
    });

    // Show accounts section by default
    showSection('accounts');
});

// Save and Load State
function saveState() {
    localStorage.setItem('budgetAppState', JSON.stringify(state));
    state.lastUpdated = new Date().toISOString();
    updateLastUpdated();
}

function loadState() {
    const savedState = localStorage.getItem('budgetAppState');
    if (savedState) {
        Object.assign(state, JSON.parse(savedState));
        updateAccountDisplay();
        updateEnvelopeDisplay();
        updateTransactionList();
        updateGoalDisplay();
        updateDashboard();
        updateLastUpdated();
        updateAccountDropdowns();
    }
}

function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement && state.lastUpdated) {
        const date = new Date(state.lastUpdated);
        lastUpdatedElement.textContent = `Last updated: ${date.toLocaleString()}`;
    }
}

// Dashboard Updates
function updateDashboard() {
    const totalBalance = Object.values(state.accounts)
        .reduce((sum, account) => sum + account.balance, 0);
    
    document.getElementById('total-balance').textContent = 
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
            .format(totalBalance);
    
    document.getElementById('unallocated-amount').textContent = 
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
            .format(state.unallocatedAmount);
    
    updateMonthlyChart();
}

// Chart Implementation
function updateMonthlyChart() {
    const ctx = document.getElementById('monthly-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.monthlyChart) {
        window.monthlyChart.destroy();
    }
    
    const labels = Object.keys(state.monthlyHistory).slice(-6);
    const data = labels.map(month => {
        const monthData = state.monthlyHistory[month];
        return {
            income: monthData?.income || 0,
            expenses: monthData?.expenses || 0
        };
    });
    
    window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Income',
                data: data.map(d => d.income),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }, {
                label: 'Expenses',
                data: data.map(d => d.expenses),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Transaction Management
function addTransaction() {
    const name = document.getElementById('transaction-name').value.trim();
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const accountKey = document.getElementById('transaction-account').value;
    const envelope = document.getElementById('transaction-envelope').value;
    
    // Validate inputs
    if (!validateInput(name, ['required'])) {
        showError('Please enter a transaction name', document.getElementById('transaction-name'));
        return;
    }
    
    if (!validateInput(amount, ['amount'])) {
        showError('Please enter a valid amount', document.getElementById('transaction-amount'));
        return;
    }
    
    if (!accountKey) {
        showError('Please select an account', document.getElementById('transaction-account'));
        return;
    }
    
    // Get account and validate balance
    const account = state.accounts[accountKey];
    if (!account) {
        showError('Selected account not found');
        return;
    }
    
    if (amount > account.balance) {
        showError(`Insufficient funds in account ${account.name}`, document.getElementById('transaction-amount'));
        return;
    }
    
    // If envelope selected, validate envelope balance
    if (envelope) {
        const envelopeBalance = state.envelopes[envelope] || 0;
        if (amount > envelopeBalance) {
            showError(`Insufficient funds in envelope ${envelope}`, document.getElementById('transaction-amount'));
            return;
        }
    }
    
    // Create transaction
    const transaction = {
        id: Date.now(),
        name: name,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        fromAccount: accountKey,
        envelope: envelope,
        accountName: account.name
    };
    
    // Update account balance
    account.balance -= amount;
    account.transactions.push(transaction);
    
    // Update envelope if selected
    if (envelope) {
        state.envelopes[envelope] -= amount;
    }
    
    // Add to global transactions
    state.transactions.push(transaction);
    
    // Update monthly history
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!state.monthlyHistory[currentMonth]) {
        state.monthlyHistory[currentMonth] = { income: 0, expenses: 0, transactions: [] };
    }
    state.monthlyHistory[currentMonth].expenses += amount;
    state.monthlyHistory[currentMonth].transactions.push(transaction);
    
    // Update UI
    updateTransactionList();
    updateEnvelopeDisplay();
    updateAccountDisplay();
    updateDashboard();
    
    // Clear form
    document.getElementById('transaction-name').value = '';
    document.getElementById('transaction-amount').value = '';
    document.getElementById('transaction-envelope').value = '';
    document.getElementById('transaction-account').value = '';
    
    showSuccess('Transaction added successfully');
    saveState();
}

// Envelope Management
function addEnvelope() {
    const envelopeName = document.getElementById('envelope-name').value.trim();
    const envelopeAmount = parseFloat(document.getElementById('envelope-amount').value);

    if (!envelopeName) {
        alert('Envelope name cannot be empty.');
        return;
    }
    if (!validateInput(envelopeAmount, "Envelope Amount")) return;

    // Check if there's enough unallocated amount
    if (envelopeAmount > state.unallocatedAmount) {
        alert('Insufficient unallocated funds to create this envelope.');
        return;
    }

    state.envelopes[envelopeName] = (state.envelopes[envelopeName] || 0) + envelopeAmount;
    state.unallocatedAmount -= envelopeAmount;
    
    renderEnvelopes();
    updateDropdown('transaction-envelope', Object.keys(state.envelopes), 'No Envelope');
    saveState();
    alert(`Envelope "${envelopeName}" added/updated successfully!`);
}

function renderEnvelopes() {
    let content = '<h3>Envelopes:</h3>';
    for (const [name, amount] of Object.entries(state.envelopes)) {
        content += `<p>${name}: ₹${amount}</p>`;
    }
    updateDOMContent('envelope-display', content);
}

function moveUnusedToUnallocated() {
    if (Object.keys(state.envelopes).length === 0) {
        alert("No funds to move to unallocated.");
        return;
    }

    let unusedTotal = Object.values(state.envelopes).reduce((sum, amount) => sum + amount, 0);
    state.unallocatedAmount += unusedTotal;
    
    // Set all envelope amounts to 0 instead of removing them
    for (let envelopeName in state.envelopes) {
        state.envelopes[envelopeName] = 0;
    }
    
    renderEnvelopes();
    saveState();
    alert(`Moved ₹${unusedTotal} to unallocated funds.`);
}

// Goal Management
function addGoal() {
    const goalName = document.getElementById('goal-name').value.trim();
    const goalAmount = parseFloat(document.getElementById('goal-amount').value);

    if (!goalName) {
        alert('Goal name cannot be empty.');
        return;
    }
    if (!validateInput(goalAmount, "Goal Amount")) return;

    state.goals[goalName] = { target: goalAmount, allocated: 0 };
    updateGoalDisplay();
    updateDropdown('goal-dropdown', Object.keys(state.goals), 'Select Goal');
    saveState();
    
    // Clear input fields
    document.getElementById('goal-name').value = '';
    document.getElementById('goal-amount').value = '';
    
    showSuccess(`Goal "${goalName}" added successfully!`);
}

function allocateToGoal() {
    const goalName = document.getElementById('goal-dropdown').value;
    const allocationAmount = parseFloat(document.getElementById('goal-allocation').value);

    if (!goalName) {
        showError('Please select a goal.');
        return;
    }
    if (!validateInput(allocationAmount, "Allocation Amount")) return;

    const goal = state.goals[goalName];
    goal.allocated += allocationAmount;

    updateGoalDisplay();
    saveState();
    
    // Clear allocation amount
    document.getElementById('goal-allocation').value = '';
    
    showSuccess(`Allocated ₹${allocationAmount} to "${goalName}" successfully!`);
}

function renderGoals() {
    let content = '<h3>Goals:</h3>';
    for (const [name, { target, allocated }] of Object.entries(state.goals)) {
        content += `<p>${name}: ₹${allocated}/${target}</p>`;
    }
    updateDOMContent('goal-display', content);
}

// Report Generation
function displayReport() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let content = `
        <h3>Financial Report</h3>
        <div class="report-summary">
            <h4>Current Month (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</h4>
            <table class="report-table">
                <tr>
                    <th>Category</th>
                    <th>Amount</th>
                </tr>
                <tr class="income-row">
                    <td>Monthly Income</td>
                    <td>₹${state.monthlyIncome}</td>
                </tr>
                <tr class="expense-row">
                    <td>Monthly Expenses</td>
                    <td>₹${state.monthlyHistory[currentMonth]?.expenses || 0}</td>
                </tr>
                <tr>
                    <td>Unallocated Funds</td>
                    <td>₹${state.unallocatedAmount}</td>
                </tr>
            </table>
        </div>

        <div class="report-details">
            <h4>Envelope Balances</h4>
            <table class="report-table">
                <tr>
                    <th>Envelope Name</th>
                    <th>Balance</th>
                </tr>`;

    for (const [name, amount] of Object.entries(state.envelopes)) {
        content += `
                <tr>
                    <td>${name}</td>
                    <td>₹${amount}</td>
                </tr>`;
    }

    content += `
            </table>

            <h4>Recent Transactions</h4>
            <table class="report-table">
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Envelope</th>
                </tr>`;

    // Sort transactions by date (newest first)
    const sortedTransactions = [...state.transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    sortedTransactions.forEach(tx => {
        const formattedDate = new Date(tx.date).toLocaleDateString();
        const rowClass = tx.type === 'income' ? 'income-row' : 'expense-row';
        content += `
                <tr class="${rowClass}">
                    <td>${formattedDate}</td>
                    <td>${tx.name}</td>
                    <td>₹${tx.amount}</td>
                    <td>${tx.envelope || 'Unallocated'}</td>
                </tr>`;
    });

    content += `
            </table>

            <h4>Financial Goals</h4>
            <table class="report-table">
                <tr>
                    <th>Goal Name</th>
                    <th>Progress</th>
                    <th>Target</th>
                </tr>`;

    for (const [name, { target, allocated }] of Object.entries(state.goals)) {
        const progress = (allocated / target * 100).toFixed(1);
        content += `
                <tr>
                    <td>${name}</td>
                    <td>₹${allocated} (${progress}%)</td>
                    <td>₹${target}</td>
                </tr>`;
    }

    content += `
            </table>

            <h4>Account Summary</h4>
            <table class="report-table">
                <tr>
                    <th>Account Name</th>
                    <th>Type</th>
                    <th>Balance</th>
                    <th>Last 4 Digits</th>
                </tr>`;

    for (const [key, account] of Object.entries(state.accounts)) {
        content += `
            <tr>
                <td>${account.name}</td>
                <td>${account.type.charAt(0).toUpperCase() + account.type.slice(1)}</td>
                <td>₹${account.balance.toLocaleString()}</td>
                <td>****${account.number}</td>
            </tr>`;
    }

    content += `
            </table>
        </div>`;

    updateDOMContent('report-display', content);
    document.getElementById('report-display').classList.remove('hidden');
}

// Reset App Data
function resetData() {
    if (confirm('Are you sure you want to reset all data?')) {
        // Reset state
        state.monthlyIncome = 0;
        state.envelopes = {};
        state.transactions = [];
        state.goals = {};
        state.lastUpdated = null;
        state.monthlyHistory = {};
        state.unallocatedAmount = 0;
        state.accounts = {};

        // Clear all input fields
        document.getElementById('income-input').value = '';
        document.getElementById('envelope-name').value = '';
        document.getElementById('envelope-amount').value = '';
        document.getElementById('transaction-name').value = '';
        document.getElementById('transaction-amount').value = '';
        document.getElementById('goal-name').value = '';
        document.getElementById('goal-amount').value = '';
        document.getElementById('goal-allocation').value = '';
        document.getElementById('account-name').value = '';
        document.getElementById('account-number').value = '';
        document.getElementById('account-type').value = '';
        document.getElementById('account-balance').value = '';

        // Clear all displays
        document.getElementById('income-status').innerText = '';
        document.getElementById('envelope-display').innerHTML = '';
        document.getElementById('transaction-list').innerHTML = '';
        document.getElementById('goal-display').innerHTML = '';
        document.getElementById('report-display').innerHTML = '';
        document.getElementById('account-display').innerHTML = '';

        // Reset dropdowns
        updateDropdown('transaction-envelope', [], 'No Envelope');
        updateDropdown('goal-dropdown', [], 'Select Goal');

        // Clear localStorage
        localStorage.removeItem('budgetAppState');

        // Show income section
        showSection('income');

        alert('All data has been reset successfully!');
    }
}

// Dropdown Update Helper
function updateDropdown(elementId, items, defaultOption) {
    const dropdown = document.getElementById(elementId);
    if (!dropdown) return;
    
    dropdown.innerHTML = `<option value="">${defaultOption}</option>`;
    
    if (Array.isArray(items)) {
        items.forEach(item => {
            if (typeof item === 'object' && item.value && item.text) {
                dropdown.innerHTML += `<option value="${item.value}">${item.text}</option>`;
            } else {
                dropdown.innerHTML += `<option value="${item}">${item}</option>`;
            }
        });
    }
}

// Add transfer functionality
function transferFunds(fromAccountKey) {
    const fromAccount = state.accounts[fromAccountKey];
    if (!fromAccount) return;

    const amount = prompt(`Enter amount to transfer from ${fromAccount.name}:`);
    if (!amount || isNaN(amount)) return;

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0 || transferAmount > fromAccount.balance) {
        alert('Invalid transfer amount.');
        return;
    }

    const toAccountKey = prompt('Enter destination account key (name-number):');
    const toAccount = state.accounts[toAccountKey];
    if (!toAccount) {
        alert('Invalid destination account.');
        return;
    }

    fromAccount.balance -= transferAmount;
    toAccount.balance += transferAmount;

    const transaction = {
        name: `Transfer to ${toAccount.name}`,
        amount: transferAmount,
        date: new Date().toISOString().split('T')[0],
        type: 'transfer',
        fromAccount: fromAccountKey,
        toAccount: toAccountKey
    };

    fromAccount.transactions.push(transaction);
    toAccount.transactions.push(transaction);
    state.transactions.push(transaction);

    updateAccountDisplay();
    updateTransactionList();
    saveState();
    alert('Transfer completed successfully!');
}

// Update account balance
function updateAccountBalance(accountKey) {
    const account = state.accounts[accountKey];
    if (!account) return;

    const newBalance = prompt(`Enter new balance for ${account.name}:`);
    if (!newBalance || isNaN(newBalance)) return;

    const balance = parseFloat(newBalance);
    if (balance < 0) {
        alert('Balance cannot be negative.');
        return;
    }

    account.balance = balance;
    updateAccountDisplay();
    saveState();
    alert('Account balance updated successfully!');
}

// Function to move unallocated funds to selected account
function moveUnallocatedToAccount() {
    const targetAccount = document.getElementById('month-end-account').value;
    if (!targetAccount) {
        alert('Please select an account to move unallocated funds to.');
        return;
    }

    if (state.unallocatedAmount <= 0) {
        alert('No unallocated funds to move.');
        return;
    }

    const account = state.accounts[targetAccount];
    if (!account) {
        alert('Selected account not found.');
        return;
    }

    // Create transfer transaction
    const transaction = {
        name: 'Month End - Unallocated Funds Transfer',
        amount: state.unallocatedAmount,
        date: new Date().toISOString().split('T')[0],
        type: 'transfer',
        fromAccount: 'unallocated',
        toAccount: targetAccount
    };

    // Update account balance
    account.balance += state.unallocatedAmount;
    
    // Add transaction to account history
    account.transactions.push(transaction);
    state.transactions.push(transaction);

    // Update monthly history
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (state.monthlyHistory[currentMonth]) {
        state.monthlyHistory[currentMonth].transactions.push(transaction);
    }

    // Reset unallocated amount
    state.unallocatedAmount = 0;

    updateAccountDisplay();
    updateTransactionList();
    updateDashboard();
    saveState();
    alert(`Moved ₹${transaction.amount} to ${account.name}`);
}

// Add account rules functionality
function addAccountRule(accountKey) {
    const account = state.accounts[accountKey];
    if (!account) return;

    const ruleType = prompt('Select rule type:\n1. Minimum Balance Alert\n2. Automatic Transfer\n3. Monthly Transfer Schedule');
    if (!ruleType) return;

    switch(ruleType) {
        case '1':
            const minBalance = prompt('Enter minimum balance threshold:');
            if (!minBalance || isNaN(minBalance)) return;
            account.rules = account.rules || {};
            account.rules.minBalance = parseFloat(minBalance);
            break;
        case '2':
            const targetAccount = prompt('Enter destination account key (name-number):');
            const percentage = prompt('Enter percentage to transfer:');
            if (!targetAccount || !percentage || isNaN(percentage)) return;
            account.rules = account.rules || {};
            account.rules.autoTransfer = {
                targetAccount,
                percentage: parseFloat(percentage)
            };
            break;
        case '3':
            const schedule = prompt('Enter monthly transfer schedule (day of month):');
            const amount = prompt('Enter transfer amount:');
            if (!schedule || !amount || isNaN(schedule) || isNaN(amount)) return;
            account.rules = account.rules || {};
            account.rules.monthlyTransfer = {
                day: parseInt(schedule),
                amount: parseFloat(amount)
            };
            break;
    }

    saveState();
    alert('Account rule added successfully!');
}

// Add emergency fund tracking
function trackEmergencyFund(accountKey) {
    const account = state.accounts[accountKey];
    if (!account || account.type !== 'emergency') {
        alert('This feature is only available for emergency savings accounts.');
        return;
    }

    const action = prompt('Select action:\n1. Record Emergency Usage\n2. Set Replenishment Goal\n3. View Emergency Fund History');
    if (!action) return;

    switch(action) {
        case '1':
            const amount = prompt('Enter emergency fund usage amount:');
            if (!amount || isNaN(amount)) return;
            account.emergencyHistory = account.emergencyHistory || [];
            account.emergencyHistory.push({
                date: new Date().toISOString(),
                amount: parseFloat(amount),
                type: 'usage'
            });
            break;
        case '2':
            const target = prompt('Enter replenishment target amount:');
            if (!target || isNaN(target)) return;
            account.emergencyTarget = parseFloat(target);
            break;
        case '3':
            let history = 'Emergency Fund History:\n';
            if (account.emergencyHistory) {
                account.emergencyHistory.forEach(record => {
                    history += `${new Date(record.date).toLocaleDateString()} - ${record.type}: ₹${record.amount}\n`;
                });
            }
            alert(history);
            return;
    }

    saveState();
    alert('Emergency fund tracking updated successfully!');
}

// Enhanced Account Management
function addAccount() {
    const name = document.getElementById('account-name').value.trim();
    const number = document.getElementById('account-number').value.trim();
    const type = document.getElementById('account-type').value;
    const balance = document.getElementById('account-balance').value;
    
    // Validate inputs
    if (!validateInput(name, ['required', 'accountName'])) {
        showError('Please enter a valid account name (3-50 characters)', document.getElementById('account-name'));
        return;
    }
    
    if (!validateInput(number, ['accountNumber'])) {
        showError('Please enter valid last 4 digits of account number', document.getElementById('account-number'));
        return;
    }
    
    if (!validateInput(balance, ['amount'])) {
        showError('Please enter a valid balance amount', document.getElementById('account-balance'));
        return;
    }
    
    if (!validateInput(type, ['required'])) {
        showError('Please select an account type', document.getElementById('account-type'));
        return;
    }
    
    // Add account to state with a unique key
    const accountKey = `${name}-${number}`;
    state.accounts[accountKey] = {
        name: name,
        number: number,
        type: type,
        balance: parseFloat(balance),
        transactions: []
    };
    
    // Update UI and dropdowns
    updateAccountDisplay();
    updateDashboard();
    updateAccountDropdowns();
    
    // Clear form
    document.getElementById('account-name').value = '';
    document.getElementById('account-number').value = '';
    document.getElementById('account-type').value = '';
    document.getElementById('account-balance').value = '';
    
    showSuccess('Account added successfully');
    saveState();
}

// Add this new function to update all account dropdowns
function updateAccountDropdowns() {
    const accountOptions = Object.entries(state.accounts).map(([key, account]) => ({
        value: key,
        text: `${account.name} (${account.type})`
    }));
    
    // Update income account dropdown
    updateDropdown('income-account', accountOptions, 'Select Account for Income');
    
    // Update transaction account dropdown
    updateDropdown('transaction-account', accountOptions, 'Select Account');
    
    // Update month-end account dropdown
    updateDropdown('month-end-account', accountOptions, 'Select Account for Unallocated Funds');
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.add('hidden'));
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update active nav button
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('onclick')?.includes(sectionId)) {
            button.classList.add('active');
        }
    });
    
    // Close mobile menu if open
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('mobile-menu-toggle');
    if (nav.classList.contains('active')) {
        nav.classList.remove('active');
        toggle.classList.remove('active');
    }

    // Smooth scroll to section
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Function to show dashboard
function showDashboard() {
    showSection('dashboard');
    updateDashboard();
}

// Income Management
function saveIncome() {
    const incomeInput = parseFloat(document.getElementById('income-input').value);
    const incomeAccountKey = document.getElementById('income-account').value;

    if (!validateInput(incomeInput, ['amount'])) {
        showError('Please enter a valid income amount', document.getElementById('income-input'));
        return;
    }
    if (!incomeAccountKey) {
        showError('Please select an account for the income', document.getElementById('income-account'));
        return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    state.monthlyIncome = incomeInput;
    
    // Update account balance
    const account = state.accounts[incomeAccountKey];
    if (!account) {
        showError('Selected account not found');
        return;
    }
    account.balance += incomeInput;
    
    // Create income transaction
    const transaction = {
        id: Date.now(), // Add unique ID to prevent duplicates
        name: 'Monthly Income',
        amount: incomeInput,
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        toAccount: incomeAccountKey,
        accountName: account.name
    };
    
    // Remove any previous income transactions for this month to prevent duplicates
    account.transactions = account.transactions.filter(t => 
        !(t.type === 'income' && t.date.startsWith(currentMonth))
    );
    state.transactions = state.transactions.filter(t => 
        !(t.type === 'income' && t.date.startsWith(currentMonth))
    );
    
    // Add new transaction
    account.transactions.push(transaction);
    state.transactions.push(transaction);
    
    // Calculate total allocated in envelopes
    const totalAllocated = Object.values(state.envelopes).reduce((sum, amount) => sum + amount, 0);
    
    // Set unallocated amount as remaining income
    state.unallocatedAmount = incomeInput - totalAllocated;
    
    // Initialize or update monthly history
    if (!state.monthlyHistory[currentMonth]) {
        state.monthlyHistory[currentMonth] = {
            income: 0,
            expenses: 0,
            transactions: []
        };
    }
    
    // Update monthly history (remove old income entry first)
    state.monthlyHistory[currentMonth].transactions = 
        state.monthlyHistory[currentMonth].transactions.filter(t => t.type !== 'income');
    state.monthlyHistory[currentMonth].income = incomeInput;
    state.monthlyHistory[currentMonth].transactions.push(transaction);
    
    updateDOMContent('income-status', `Monthly Income: ₹${state.monthlyIncome.toLocaleString()} (Added to ${account.name})`);
    updateAccountDisplay();
    updateTransactionList();
    updateDashboard();
    
    // Clear input
    document.getElementById('income-input').value = '';
    document.getElementById('income-account').value = '';
    
    showSuccess('Income updated successfully');
    saveState();
}

// Transaction Display Functions
function updateTransactionList() {
    let content = '<h3>Recent Transactions:</h3>';
    content += '<div class="transaction-list">';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...state.transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedTransactions.forEach(tx => {
        const formattedDate = new Date(tx.date).toLocaleDateString();
        const amountClass = tx.type === 'income' ? 'amount-income' : 'amount-expense';
        const transactionClass = tx.type === 'income' ? 'transaction-income' : 'transaction-expense';
        
        content += `
            <div class="transaction-item">
                <div class="transaction-details">
                    <span class="transaction-date">${formattedDate}</span>
                    <span class="${transactionClass}">${tx.name}</span>
                    ${tx.envelope ? `<span class="transaction-envelope">(${tx.envelope})</span>` : ''}
                </div>
                <span class="${amountClass}">₹${tx.amount.toLocaleString()}</span>
            </div>`;
    });
    
    content += '</div>';
    updateDOMContent('transaction-list', content);
}

// Enhanced Envelope Display
function updateEnvelopeDisplay() {
    let content = '<h3>Your Envelopes:</h3>';
    content += '<div class="envelope-grid">';
    
    for (const [name, amount] of Object.entries(state.envelopes)) {
        const percentage = (amount / state.monthlyIncome * 100).toFixed(1);
        content += `
            <div class="envelope-card">
                <h4>${name}</h4>
                <p class="envelope-amount">₹${amount.toLocaleString()}</p>
                <p class="envelope-percentage">${percentage}% of income</p>
                <div class="envelope-progress">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
            </div>`;
    }
    
    content += '</div>';
    updateDOMContent('envelope-display', content);
}

function updateGoalDisplay() {
    let content = '<h3>Financial Goals:</h3>';
    content += '<div class="goals-grid">';
    
    for (const [name, { target, allocated }] of Object.entries(state.goals)) {
        const progress = (allocated / target * 100).toFixed(1);
        content += `
            <div class="goal-card">
                <h4>${name}</h4>
                <div class="goal-details">
                    <p class="goal-amount">₹${allocated.toLocaleString()} / ₹${target.toLocaleString()}</p>
                    <p class="goal-progress">${progress}% Complete</p>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progress}%"></div>
                </div>
            </div>`;
    }
    
    content += '</div>';
    updateDOMContent('goal-display', content);
}
