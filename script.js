// Theme management
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
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

// State management
const state = {
    monthlyIncome: 0,
    envelopes: {},
    transactions: [],
    goals: {},
    lastUpdated: null,
    monthlyHistory: {}, // Store monthly data
    unallocatedAmount: 0,
    accounts: {} // New accounts object
};

// Helper Functions
function validateInput(value, fieldName) {
    if (!value && value !== 0 || isNaN(value) || value < 0) {
        alert(`Invalid input for ${fieldName}. Please enter a non-negative number.`);
        return false;
    }
    return true;
}

function updateDOMContent(elementId, content) {
    document.getElementById(elementId).innerHTML = content;
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}

// Load saved state from localStorage
function loadState() {
    const savedState = localStorage.getItem('budgetAppState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        Object.assign(state, parsedState);
        renderAll();
    }
}

// Save state to localStorage
function saveState() {
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem('budgetAppState', JSON.stringify(state));
}

// Render all sections
function renderAll() {
    renderEnvelopes();
    renderTransactions();
    renderGoals();
    renderAccounts();
    updateDropdown('transaction-envelope', Object.keys(state.envelopes), 'No Envelope');
    updateDropdown('goal-dropdown', Object.keys(state.goals), 'Select Goal');
    
    // Update account dropdowns
    const accountOptions = Object.entries(state.accounts).map(([key, account]) => ({
        value: key,
        text: `${account.name} (${account.type})`
    }));
    
    updateDropdown('income-account', accountOptions, 'Select Account for Income');
    updateDropdown('month-end-account', accountOptions, 'Select Account for Unallocated Funds');
    updateDropdown('transaction-account', accountOptions, 'Select Account');
    
    if (state.monthlyIncome > 0) {
        updateDOMContent('income-status', `Monthly Income: ₹${state.monthlyIncome}`);
    }
}

// Income Management
function saveIncome() {
    const incomeInput = parseFloat(document.getElementById('income-input').value);
    const incomeAccount = document.getElementById('income-account').value;

    if (!validateInput(incomeInput, "Income")) return;
    if (!incomeAccount) {
        alert('Please select an account for the income.');
        return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    state.monthlyIncome = incomeInput;
    
    // Update account balance
    const account = state.accounts[incomeAccount];
    if (!account) {
        alert('Selected account not found.');
        return;
    }
    account.balance += incomeInput;
    
    // Create income transaction
    const transaction = {
        name: 'Monthly Income',
        amount: incomeInput,
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        toAccount: incomeAccount
    };
    
    account.transactions.push(transaction);
    state.transactions.push(transaction);
    
    // Calculate total allocated in envelopes
    const totalAllocated = Object.values(state.envelopes).reduce((sum, amount) => sum + amount, 0);
    
    // Set unallocated amount as remaining income
    state.unallocatedAmount = incomeInput - totalAllocated;
    
    // Initialize monthly history if not exists
    if (!state.monthlyHistory[currentMonth]) {
        state.monthlyHistory[currentMonth] = {
            income: 0,
            expenses: 0,
            transactions: []
        };
    }
    
    // Update monthly history
    state.monthlyHistory[currentMonth].income = incomeInput;
    state.monthlyHistory[currentMonth].transactions.push(transaction);
    
    updateDOMContent('income-status', `Monthly Income: ₹${state.monthlyIncome} (Added to ${account.name})`);
    renderAccounts();
    saveState();
    alert('Income updated successfully!');
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

// Account Management
function addAccount() {
    const accountName = document.getElementById('account-name').value.trim();
    const accountNumber = document.getElementById('account-number').value.trim();
    const accountType = document.getElementById('account-type').value;
    const accountBalance = parseFloat(document.getElementById('account-balance').value);

    if (!accountName || !accountNumber || !accountType) {
        alert('Please fill in all account details.');
        return;
    }
    if (!validateInput(accountBalance, "Account Balance")) return;
    if (accountNumber.length !== 4 || isNaN(accountNumber)) {
        alert('Please enter valid last 4 digits of account number.');
        return;
    }

    const accountKey = `${accountName}-${accountNumber}`;
    state.accounts[accountKey] = {
        name: accountName,
        number: accountNumber,
        type: accountType,
        balance: accountBalance,
        transactions: []
    };

    renderAll();
    saveState();
    alert('Account added successfully!');

    // Clear form
    document.getElementById('account-name').value = '';
    document.getElementById('account-number').value = '';
    document.getElementById('account-type').value = '';
    document.getElementById('account-balance').value = '';
}

function renderAccounts() {
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

// Transaction Management
function addTransaction() {
    const transactionName = document.getElementById('transaction-name').value.trim();
    const transactionAmount = parseFloat(document.getElementById('transaction-amount').value);
    const transactionEnvelope = document.getElementById('transaction-envelope').value;
    const transactionDate = new Date().toISOString().split('T')[0];
    const currentMonth = transactionDate.slice(0, 7);

    // Add account selection to transaction
    const fromAccount = document.getElementById('transaction-account').value;

    if (!transactionName || !fromAccount) {
        alert('Please fill in all transaction details.');
        return;
    }
    if (!validateInput(transactionAmount, "Transaction Amount")) return;

    const accountKey = fromAccount;
    const account = state.accounts[accountKey];

    if (!account) {
        alert('Please select a valid account.');
        return;
    }

    if (account.balance < transactionAmount) {
        alert(`Insufficient funds in account ${account.name}`);
        return;
    }

    if (transactionEnvelope && state.envelopes[transactionEnvelope] < transactionAmount) {
        alert(`Insufficient funds in envelope "${transactionEnvelope}".`);
        return;
    }

    const transaction = {
        name: transactionName,
        amount: transactionAmount,
        envelope: transactionEnvelope,
        date: transactionDate,
        type: 'expense',
        fromAccount: accountKey
    };

    // Update account balance
    account.balance -= transactionAmount;
    account.transactions.push(transaction);

    state.transactions.push(transaction);

    // Update monthly history
    if (!state.monthlyHistory[currentMonth]) {
        state.monthlyHistory[currentMonth] = {
            income: 0,
            expenses: 0,
            transactions: []
        };
    }
    state.monthlyHistory[currentMonth].expenses += transactionAmount;
    state.monthlyHistory[currentMonth].transactions.push(transaction);

    if (transactionEnvelope) {
        state.envelopes[transactionEnvelope] -= transactionAmount;
    } else {
        state.unallocatedAmount -= transactionAmount;
    }

    renderTransactions();
    renderEnvelopes();
    renderAccounts();
    saveState();
    alert('Transaction added successfully!');
}

function renderTransactions() {
    let content = '<h3>Transactions:</h3>';
    // Sort transactions by date (newest first)
    const sortedTransactions = [...state.transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    content += '<div class="transaction-list">';
    sortedTransactions.forEach(tx => {
        const formattedDate = new Date(tx.date).toLocaleDateString();
        const isIncome = tx.type === 'income';
        const amountClass = isIncome ? 'amount-income' : 'amount-expense';
        const transactionClass = isIncome ? 'transaction-income' : 'transaction-expense';
        
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
    renderGoals();
    updateDropdown('goal-dropdown', Object.keys(state.goals), 'Select Goal');
    alert(`Goal "${goalName}" added successfully!`);
}

function allocateToGoal() {
    const goalName = document.getElementById('goal-dropdown').value;
    const allocationAmount = parseFloat(document.getElementById('goal-allocation').value);

    if (!goalName) {
        alert('Please select a goal.');
        return;
    }
    if (!validateInput(allocationAmount, "Allocation Amount")) return;

    const goal = state.goals[goalName];
    goal.allocated += allocationAmount;

    renderGoals();
    alert(`Allocated ₹${allocationAmount} to "${goalName}" successfully!`);
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
    dropdown.innerHTML = `<option value="">${defaultOption}</option>`;
    
    if (Array.isArray(items)) {
        for (const item of items) {
            if (typeof item === 'object' && item.value && item.text) {
                dropdown.innerHTML += `<option value="${item.value}">${item.text}</option>`;
            } else {
                dropdown.innerHTML += `<option value="${item}">${item}</option>`;
            }
        }
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

    renderAccounts();
    renderTransactions();
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
    renderAccounts();
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

    renderAccounts();
    renderTransactions();
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

// Mobile menu functionality
function toggleMobileMenu() {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('mobile-menu-toggle');
    nav.classList.toggle('active');
    toggle.classList.toggle('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('mobile-menu-toggle');
    const isNavClick = nav.contains(e.target);
    const isToggleClick = toggle.contains(e.target);
    
    if (!isNavClick && !isToggleClick && nav.classList.contains('active')) {
        nav.classList.remove('active');
        toggle.classList.remove('active');
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadState();
    showSection('income');
    
    // Add mobile menu toggle listener
    document.getElementById('mobile-menu-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileMenu();
    });
});
