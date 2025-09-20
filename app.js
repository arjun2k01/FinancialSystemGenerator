// Financial Statement Generator with AI Chatbot - Production Ready

class FinancialStatementGenerator {
    constructor() {
        this.transactions = [];
        this.chatHistory = [];
        this.isListening = false;
        this.recognition = null;
        
        // Gemini AI Configuration
        this.geminiApiKey = 'AIzaSyD2FhpzAEpFwuWqGWD-s3Hvi6ieQu6GYhc';
        this.geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`;
        
        this.sampleData = {
            sampleTransactions: [
                {"DATE": "04.12.2023", "PARTICULARS": "TO BILL NO-1085", "DEBIT": 37000.00, "CREDIT": 0},
                {"DATE": "21.12.2023", "PARTICULARS": "TO BILL NO-1176", "DEBIT": 27750.00, "CREDIT": 0},
                {"DATE": "03.01.2024", "PARTICULARS": "TO BILL NO-1234", "DEBIT": 101000.00, "CREDIT": 0},
                {"DATE": "08.01.2024", "PARTICULARS": "BY CHQ/CASH", "DEBIT": 0, "CREDIT": 50000.00},
                {"DATE": "23.02.2024", "PARTICULARS": "BY CHQ/CASH", "DEBIT": 0, "CREDIT": 45000.00},
                {"DATE": "22.04.2024", "PARTICULARS": "BY CHQ/CASH", "DEBIT": 0, "CREDIT": 40000.00},
                {"DATE": "25.05.2024", "PARTICULARS": "BY CHQ/CASH", "DEBIT": 0, "CREDIT": 16500.00},
                {"DATE": "25.05.2024", "PARTICULARS": "TO BILL NO-172", "DEBIT": 17000.00, "CREDIT": 0},
                {"DATE": "25.05.2024", "PARTICULARS": "BY RETURNED", "DEBIT": 0, "CREDIT": 13875.00},
                {"DATE": "31.05.2024", "PARTICULARS": "TO BILL NO-201", "DEBIT": 29750.00, "CREDIT": 0},
                {"DATE": "12.06.2024", "PARTICULARS": "TO BILL NO-252", "DEBIT": 28500.00, "CREDIT": 0},
                {"DATE": "16.07.2024", "PARTICULARS": "TO BILL NO-404", "DEBIT": 20900.00, "CREDIT": 0},
                {"DATE": "09.08.2024", "PARTICULARS": "TO BILL NO-501", "DEBIT": 23800.00, "CREDIT": 0},
                {"DATE": "16.08.2024", "PARTICULARS": "BY CHQ/CASH", "DEBIT": 0, "CREDIT": 50000.00},
                {"DATE": "28.08.2024", "PARTICULARS": "TO BILL NO-555", "DEBIT": 41500.00, "CREDIT": 0},
                {"DATE": "31.08.2024", "PARTICULARS": "TO BILL NO-567", "DEBIT": 57500.00, "CREDIT": 0}
            ],
            defaultAccount: {
                name: "YOGESH JI",
                location: "GURDASPURIA"
            }
        };
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        try {
            this.initializeVoiceRecognition();
            this.bindEvents();
            this.updateDisplay();
            this.setDefaultDate();
            this.showMessage('Financial Statement Generator initialized successfully!', 'success');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showMessage('Application initialized with limited features. Some functions may not work.', 'error');
        }
    }

    initializeVoiceRecognition() {
        try {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                this.recognition.lang = 'en-US';
                
                this.recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    this.handleVoiceInput(transcript);
                };
                
                this.recognition.onerror = (event) => {
                    console.error('Voice recognition error:', event.error);
                    this.stopVoiceInput();
                    this.showMessage('Voice recognition error. Please try again.', 'error');
                };
                
                this.recognition.onend = () => {
                    this.stopVoiceInput();
                };
            }
        } catch (error) {
            console.warn('Voice recognition not available:', error);
        }
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('transactionDate');
        if (dateInput) {
            dateInput.value = today;
        }
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('transactionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTransaction();
            });
        }

        // Chat functionality
        this.bindButtonEvent('sendChatBtn', () => this.sendChatMessage());
        this.bindButtonEvent('voiceInputBtn', () => this.toggleVoiceInput());
        this.bindButtonEvent('clearChatBtn', () => this.clearChat());
        
        // Chat input enter key
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }

        // Button events
        this.bindButtonEvent('loadSampleBtn', () => this.loadSampleData());
        this.bindButtonEvent('clearFormBtn', () => this.clearForm());
        this.bindButtonEvent('clearAllBtn', () => this.clearAllData());
        this.bindButtonEvent('exportPdfBtn', () => this.exportToPDF());
        this.bindButtonEvent('exportImageBtn', () => this.exportToImage());
        this.bindButtonEvent('whatsappShareBtn', () => this.shareOnWhatsApp());
        this.bindButtonEvent('exportJsonBtn', () => this.exportToJSON());
        this.bindButtonEvent('importJsonBtn', () => this.importFromJSON());

        // JSON file import
        const fileInput = document.getElementById('jsonFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }

        // Amount input validation
        this.bindInputEvent('debitAmount', (e) => {
            if (e.target.value && document.getElementById('creditAmount').value) {
                document.getElementById('creditAmount').value = '';
            }
        });

        this.bindInputEvent('creditAmount', (e) => {
            if (e.target.value && document.getElementById('debitAmount').value) {
                document.getElementById('debitAmount').value = '';
            }
        });
    }

    bindButtonEvent(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
        } else {
            console.warn(`Element with ID ${elementId} not found`);
        }
    }

    bindInputEvent(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('input', handler);
        } else {
            console.warn(`Element with ID ${elementId} not found`);
        }
    }

    // Chat Functions
    async sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;

        try {
            // Add user message to chat
            this.addChatMessage(message, 'user');
            chatInput.value = '';
            
            // Show loading
            this.showChatLoading(true);
            
            // Process with AI
            await this.processWithGemini(message);
            
        } catch (error) {
            console.error('Chat error:', error);
            this.addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
        } finally {
            this.showChatLoading(false);
        }
    }

    async processWithGemini(userMessage) {
        try {
            const context = this.buildContext();
            const prompt = this.buildPrompt(userMessage, context);
            
            const response = await fetch(this.geminiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not process your request.';
            
            // Process AI response for actions
            await this.processAIResponse(aiResponse, userMessage);
            
        } catch (error) {
            console.error('Gemini API error:', error);
            // Fallback to local processing
            await this.fallbackProcessing(userMessage);
        }
    }

    buildContext() {
        const accountName = document.getElementById('accountName').value || 'Not set';
        const location = document.getElementById('location').value || 'Not set';
        const transactionsWithBalance = this.calculateRunningBalance();
        const currentBalance = transactionsWithBalance.length > 0 ? 
            transactionsWithBalance[transactionsWithBalance.length - 1].BALANCE : 0;
        
        const totalDebits = this.transactions.reduce((sum, t) => sum + t.DEBIT, 0);
        const totalCredits = this.transactions.reduce((sum, t) => sum + t.CREDIT, 0);

        return {
            accountName,
            location,
            currentBalance,
            totalEntries: this.transactions.length,
            totalDebits,
            totalCredits,
            recentTransactions: transactionsWithBalance.slice(-5)
        };
    }

    buildPrompt(userMessage, context) {
        return `You are a professional financial AI assistant for an Indian accounting system. Current context:
- Account: ${context.accountName} (${context.location})
- Current Balance: ₹${this.formatNumber(context.currentBalance)}
- Total Entries: ${context.totalEntries}
- Total Debits: ₹${this.formatNumber(context.totalDebits)}
- Total Credits: ₹${this.formatNumber(context.totalCredits)}

Recent transactions: ${JSON.stringify(context.recentTransactions)}

User message: "${userMessage}"

Instructions:
1. If user wants to add a transaction, respond with: ACTION:ADD_TRANSACTION followed by JSON with date, particulars, debit, credit
2. If user wants analysis, provide detailed financial insights
3. If user asks questions about data, answer based on current context
4. Use Indian currency formatting (₹ symbol, lakh/crore terms)
5. Be professional and helpful
6. If user wants to delete/clear, respond with ACTION:DELETE or ACTION:CLEAR
7. For exports, respond with ACTION:EXPORT_PDF or ACTION:EXPORT_IMAGE

Respond naturally and professionally:`;
    }

    async processAIResponse(aiResponse, userMessage) {
        // Check for actions in AI response
        if (aiResponse.includes('ACTION:ADD_TRANSACTION')) {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const transactionData = JSON.parse(jsonMatch[0]);
                    await this.addTransactionFromAI(transactionData);
                    return;
                } catch (error) {
                    console.error('Failed to parse transaction data:', error);
                }
            }
        }
        
        if (aiResponse.includes('ACTION:EXPORT_PDF')) {
            this.exportToPDF();
            this.addChatMessage('I\'ve generated a PDF export of your statement.', 'ai');
            return;
        }
        
        if (aiResponse.includes('ACTION:EXPORT_IMAGE')) {
            this.exportToImage();
            this.addChatMessage('I\'ve generated an image export of your statement.', 'ai');
            return;
        }
        
        if (aiResponse.includes('ACTION:CLEAR')) {
            this.clearAllData();
            this.addChatMessage('I\'ve cleared all your data as requested.', 'ai');
            return;
        }

        // Regular AI response
        this.addChatMessage(aiResponse.replace(/ACTION:[A-Z_]+/g, '').trim(), 'ai');
    }

    async fallbackProcessing(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Transaction parsing
        const transactionPatterns = [
            /add\s+(?:debit|dr)\s+(?:of\s+)?(\d+(?:\.\d+)?)\s+(?:for\s+)?(.+)/i,
            /add\s+(?:credit|cr)\s+(?:of\s+)?(\d+(?:\.\d+)?)\s+(?:for\s+)?(.+)/i,
            /debit\s+(\d+(?:\.\d+)?)\s+(.+)/i,
            /credit\s+(\d+(?:\.\d+)?)\s+(.+)/i
        ];
        
        for (const pattern of transactionPatterns) {
            const match = message.match(pattern);
            if (match) {
                const amount = parseFloat(match[1]);
                const particulars = match[2].trim().toUpperCase();
                const isDebit = /debit|dr/i.test(message);
                
                await this.addTransactionFromAI({
                    particulars,
                    debit: isDebit ? amount : 0,
                    credit: isDebit ? 0 : amount,
                    date: new Date().toISOString().split('T')[0]
                });
                return;
            }
        }
        
        // Balance inquiry
        if (message.includes('balance') || message.includes('current balance')) {
            const context = this.buildContext();
            this.addChatMessage(`Your current balance is ₹${this.formatIndianCurrency(context.currentBalance).replace('₹', '')}. You have ${context.totalEntries} transactions with total debits of ₹${this.formatIndianCurrency(context.totalDebits).replace('₹', '')} and total credits of ₹${this.formatIndianCurrency(context.totalCredits).replace('₹', '')}.`, 'ai');
            return;
        }
        
        // Export actions
        if (message.includes('export pdf') || message.includes('generate pdf')) {
            this.exportToPDF();
            this.addChatMessage('I\'ve generated a PDF export of your statement.', 'ai');
            return;
        }
        
        if (message.includes('export image') || message.includes('generate image')) {
            this.exportToImage();
            this.addChatMessage('I\'ve generated an image export of your statement.', 'ai');
            return;
        }
        
        // Default response
        this.addChatMessage('I understand you want help with your finances. You can ask me to:\n• Add transactions (e.g., "Add debit 5000 for electricity")\n• Check your balance\n• Export statements\n• Analyze your financial data\n\nWhat would you like to do?', 'ai');
    }

    async addTransactionFromAI(data) {
        try {
            const transaction = {
                DATE: this.formatDate(data.date || new Date().toISOString().split('T')[0]),
                PARTICULARS: data.particulars.toUpperCase(),
                DEBIT: parseFloat(data.debit) || 0,
                CREDIT: parseFloat(data.credit) || 0,
                id: Date.now()
            };

            this.transactions.push(transaction);
            this.updateDisplay();
            this.addChatMessage(`✅ Transaction added successfully!\n• ${transaction.PARTICULARS}\n• ${transaction.DEBIT > 0 ? `Debit: ₹${this.formatNumber(transaction.DEBIT)}` : `Credit: ₹${this.formatNumber(transaction.CREDIT)}`}`, 'ai');
        } catch (error) {
            console.error('Failed to add transaction from AI:', error);
            this.addChatMessage('Sorry, I couldn\'t add that transaction. Please check the details and try again.', 'ai');
        }
    }

    addChatMessage(message, sender) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (sender === 'ai') {
            contentDiv.innerHTML = `<strong>AI Assistant:</strong> ${message.replace(/\n/g, '<br>')}`;
        } else {
            contentDiv.innerHTML = `<strong>You:</strong> ${message}`;
        }
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store in chat history
        this.chatHistory.push({ sender, message, timestamp: new Date() });
    }

    showChatLoading(show) {
        const loadingElement = document.getElementById('chatLoading');
        if (loadingElement) {
            loadingElement.classList.toggle('hidden', !show);
        }
    }

    clearChat() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            // Keep the initial greeting
            chatMessages.innerHTML = `
                <div class="chat-message ai-message">
                    <div class="message-content">
                        <strong>AI Assistant:</strong> Hello! I'm your financial AI assistant. I can help you:
                        <ul>
                            <li>Add transactions using natural language</li>
                            <li>Analyze your financial data</li>
                            <li>Generate reports and insights</li>
                            <li>Answer questions about your statements</li>
                        </ul>
                        Try saying: "Add a debit of 5000 for electricity bill" or "What's my current balance?"
                    </div>
                </div>
            `;
        }
        this.chatHistory = [];
    }

    // Voice Input Functions
    toggleVoiceInput() {
        if (!this.recognition) {
            this.showMessage('Voice recognition is not supported in your browser.', 'error');
            return;
        }

        if (this.isListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    startVoiceInput() {
        try {
            this.isListening = true;
            const voiceBtn = document.getElementById('voiceInputBtn');
            if (voiceBtn) {
                voiceBtn.textContent = '⏸️ Stop';
                voiceBtn.classList.add('voice-active');
            }
            
            this.recognition.start();
            this.showMessage('Listening... Speak now!', 'info');
        } catch (error) {
            console.error('Voice input error:', error);
            this.stopVoiceInput();
        }
    }

    stopVoiceInput() {
        this.isListening = false;
        const voiceBtn = document.getElementById('voiceInputBtn');
        if (voiceBtn) {
            voiceBtn.textContent = '🎤 Voice';
            voiceBtn.classList.remove('voice-active');
        }
        
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    handleVoiceInput(transcript) {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = transcript;
        }
        this.addChatMessage(transcript, 'user');
        this.processWithGemini(transcript);
    }

    // Indian number formatting
    formatIndianCurrency(amount) {
        if (amount === 0) return '₹0.00';
        
        const numStr = Math.abs(amount).toFixed(2);
        const parts = numStr.split('.');
        let integerPart = parts[0];
        const decimalPart = parts[1];
        
        if (integerPart.length > 3) {
            const lastThree = integerPart.slice(-3);
            const remaining = integerPart.slice(0, -3);
            integerPart = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
        }
        
        return `₹${integerPart}.${decimalPart}`;
    }

    formatNumber(amount) {
        return Math.abs(amount).toFixed(2).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    }

    formatDate(dateStr) {
        if (dateStr.includes('.')) return dateStr;
        
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    parseDate(dateStr) {
        const [day, month, year] = dateStr.split('.');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    calculateRunningBalance() {
        let runningBalance = 0;
        
        const sortedTransactions = [...this.transactions].sort((a, b) => {
            return this.parseDate(a.DATE) - this.parseDate(b.DATE);
        });

        return sortedTransactions.map(transaction => {
            runningBalance += transaction.CREDIT - transaction.DEBIT;
            return {
                ...transaction,
                BALANCE: runningBalance
            };
        });
    }

    addTransaction() {
        const date = document.getElementById('transactionDate').value;
        const particulars = document.getElementById('particulars').value.trim();
        const debitAmount = parseFloat(document.getElementById('debitAmount').value) || 0;
        const creditAmount = parseFloat(document.getElementById('creditAmount').value) || 0;

        if (!date || !particulars) {
            this.showMessage('Please fill in all required fields.', 'error');
            return;
        }

        if (debitAmount === 0 && creditAmount === 0) {
            this.showMessage('Please enter either a debit or credit amount.', 'error');
            return;
        }

        if (debitAmount > 0 && creditAmount > 0) {
            this.showMessage('Please enter either debit OR credit amount, not both.', 'error');
            return;
        }

        const transaction = {
            DATE: this.formatDate(date),
            PARTICULARS: particulars.toUpperCase(),
            DEBIT: debitAmount,
            CREDIT: creditAmount,
            id: Date.now()
        };

        this.transactions.push(transaction);
        this.updateDisplay();
        this.clearForm();
        this.showMessage('Transaction added successfully!', 'success');
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.updateDisplay();
            this.showMessage('Transaction deleted successfully!', 'success');
        }
    }

    loadSampleData() {
        if (this.transactions.length > 0) {
            if (!confirm('This will replace any existing data. Continue?')) {
                return;
            }
        }
        
        document.getElementById('accountName').value = this.sampleData.defaultAccount.name;
        document.getElementById('location').value = this.sampleData.defaultAccount.location;
        
        this.transactions = this.sampleData.sampleTransactions.map((t, index) => ({
            ...t,
            id: Date.now() + index
        }));
        
        this.updateDisplay();
        this.showMessage('Sample data loaded successfully!', 'success');
    }

    clearForm() {
        const form = document.getElementById('transactionForm');
        if (form) {
            form.reset();
            this.setDefaultDate();
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            this.transactions = [];
            document.getElementById('accountName').value = '';
            document.getElementById('location').value = '';
            this.clearForm();
            this.updateDisplay();
            this.showMessage('All data cleared successfully!', 'success');
        }
    }

    updateDisplay() {
        this.updateTable();
        this.updateBalanceCards();
        this.updateEmptyState();
    }

    updateTable() {
        const tbody = document.getElementById('transactionTableBody');
        if (!tbody) return;
        
        const transactionsWithBalance = this.calculateRunningBalance();
        tbody.innerHTML = '';
        
        transactionsWithBalance.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = 'new-row';
            
            const balanceClass = transaction.BALANCE >= 0 ? 'positive-balance' : 'negative-balance';
            
            row.innerHTML = `
                <td>${transaction.DATE}</td>
                <td>${transaction.PARTICULARS}</td>
                <td class="amount-cell">${transaction.DEBIT > 0 ? this.formatIndianCurrency(transaction.DEBIT) : '-'}</td>
                <td class="amount-cell">${transaction.CREDIT > 0 ? this.formatIndianCurrency(transaction.CREDIT) : '-'}</td>
                <td class="balance-cell ${balanceClass}">${this.formatIndianCurrency(transaction.BALANCE)}</td>
                <td>
                    <button class="delete-btn" onclick="window.financialApp.deleteTransaction(${transaction.id})">
                        Delete
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    updateBalanceCards() {
        const transactionsWithBalance = this.calculateRunningBalance();
        const currentBalance = transactionsWithBalance.length > 0 ? 
            transactionsWithBalance[transactionsWithBalance.length - 1].BALANCE : 0;
        
        const totalDebits = this.transactions.reduce((sum, t) => sum + t.DEBIT, 0);
        const totalCredits = this.transactions.reduce((sum, t) => sum + t.CREDIT, 0);
        const totalEntries = this.transactions.length;

        const balanceElement = document.getElementById('currentBalance');
        if (balanceElement) {
            balanceElement.textContent = this.formatIndianCurrency(currentBalance);
            balanceElement.className = `balance-amount ${currentBalance >= 0 ? 'balance-positive' : 'balance-negative'}`;
        }

        this.updateElementText('totalEntries', totalEntries);
        this.updateElementText('totalDebits', this.formatIndianCurrency(totalDebits));
        this.updateElementText('totalCredits', this.formatIndianCurrency(totalCredits));
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const table = document.querySelector('.table-container');
        
        if (!emptyState || !table) return;
        
        if (this.transactions.length === 0) {
            emptyState.classList.remove('hidden');
            table.style.display = 'none';
        } else {
            emptyState.classList.add('hidden');
            table.style.display = 'block';
        }
    }

    // Export Functions
    prepareExportData() {
        const accountName = document.getElementById('accountName').value || 'N/A';
        const location = document.getElementById('location').value || 'N/A';
        const transactionsWithBalance = this.calculateRunningBalance();
        const today = new Date().toLocaleDateString('en-GB');
        
        return { accountName, location, transactionsWithBalance, today };
    }

    populateExportTable() {
        const { accountName, location, transactionsWithBalance, today } = this.prepareExportData();
        
        this.updateElementText('exportAccountName', accountName);
        this.updateElementText('exportLocation', location);
        this.updateElementText('exportDate', today);
        
        const finalBalance = transactionsWithBalance.length > 0 ? 
            transactionsWithBalance[transactionsWithBalance.length - 1].BALANCE : 0;
        this.updateElementText('exportFinalBalance', this.formatIndianCurrency(finalBalance));
        
        const tbody = document.getElementById('exportTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        transactionsWithBalance.forEach(transaction => {
            const row = document.createElement('tr');
            const balanceClass = transaction.BALANCE >= 0 ? 'positive-balance' : 'negative-balance';
            
            row.innerHTML = `
                <td>${transaction.DATE}</td>
                <td>${transaction.PARTICULARS}</td>
                <td class="amount-cell">${transaction.DEBIT > 0 ? this.formatIndianCurrency(transaction.DEBIT) : '-'}</td>
                <td class="amount-cell">${transaction.CREDIT > 0 ? this.formatIndianCurrency(transaction.CREDIT) : '-'}</td>
                <td class="balance-cell ${balanceClass}">${this.formatIndianCurrency(transaction.BALANCE)}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    async exportToPDF() {
        if (this.transactions.length === 0) {
            this.showMessage('No transactions to export.', 'error');
            return;
        }

        try {
            this.populateExportTable();
            
            if (!window.jspdf) {
                this.showMessage('PDF library not loaded. Please refresh and try again.', 'error');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const exportContainer = document.getElementById('exportContainer');
            exportContainer.style.left = '0';
            exportContainer.style.top = '0';
            exportContainer.style.position = 'relative';
            
            const canvas = await html2canvas(exportContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            exportContainer.style.left = '-9999px';
            exportContainer.style.top = '-9999px';
            exportContainer.style.position = 'absolute';
            
            pdf.save('financial-statement.pdf');
            this.showMessage('PDF exported successfully!', 'success');
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showMessage('Error exporting PDF. Please try again.', 'error');
        }
    }

    async exportToImage() {
        if (this.transactions.length === 0) {
            this.showMessage('No transactions to export.', 'error');
            return;
        }

        try {
            this.populateExportTable();
            
            const exportContainer = document.getElementById('exportContainer');
            exportContainer.style.left = '0';
            exportContainer.style.top = '0';
            exportContainer.style.position = 'relative';
            
            const canvas = await html2canvas(exportContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            
            exportContainer.style.left = '-9999px';
            exportContainer.style.top = '-9999px';
            exportContainer.style.position = 'absolute';
            
            const link = document.createElement('a');
            link.download = 'financial-statement.png';
            link.href = canvas.toDataURL();
            link.click();
            
            this.showMessage('Image exported successfully!', 'success');
            
        } catch (error) {
            console.error('Image export error:', error);
            this.showMessage('Error exporting image. Please try again.', 'error');
        }
    }

    exportToJSON() {
        try {
            const exportData = {
                account: {
                    name: document.getElementById('accountName').value,
                    location: document.getElementById('location').value
                },
                transactions: this.transactions,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showMessage('JSON backup exported successfully!', 'success');
        } catch (error) {
            console.error('JSON export error:', error);
            this.showMessage('Error exporting JSON backup.', 'error');
        }
    }

    importFromJSON() {
        document.getElementById('jsonFileInput').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.transactions && Array.isArray(data.transactions)) {
                    if (this.transactions.length > 0) {
                        if (!confirm('This will replace existing data. Continue?')) {
                            return;
                        }
                    }
                    
                    this.transactions = data.transactions.map((t, index) => ({
                        ...t,
                        id: t.id || (Date.now() + index)
                    }));
                    
                    if (data.account) {
                        document.getElementById('accountName').value = data.account.name || '';
                        document.getElementById('location').value = data.account.location || '';
                    }
                    
                    this.updateDisplay();
                    this.showMessage('Data imported successfully!', 'success');
                } else {
                    this.showMessage('Invalid file format. Please select a valid JSON backup file.', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showMessage('Error importing file. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }

    shareOnWhatsApp() {
        if (this.transactions.length === 0) {
            this.showMessage('No transactions to share.', 'error');
            return;
        }

        const { accountName, location, transactionsWithBalance } = this.prepareExportData();
        const currentBalance = transactionsWithBalance.length > 0 ? 
            transactionsWithBalance[transactionsWithBalance.length - 1].BALANCE : 0;
        
        let message = `*📊 FINANCIAL STATEMENT*\n\n`;
        message += `👤 Account: ${accountName}\n`;
        message += `📍 Location: ${location}\n\n`;
        message += `💰 Current Balance: ${this.formatIndianCurrency(currentBalance)}\n`;
        message += `📋 Total Entries: ${this.transactions.length}\n\n`;
        message += `*Recent Transactions:*\n`;
        
        const recentTransactions = transactionsWithBalance.slice(-5);
        recentTransactions.forEach(t => {
            const amount = t.DEBIT > 0 ? 
                `Dr: ${this.formatIndianCurrency(t.DEBIT)}` : 
                `Cr: ${this.formatIndianCurrency(t.CREDIT)}`;
            message += `${t.DATE} | ${t.PARTICULARS} | ${amount}\n`;
        });
        
        message += `\n_Generated by AI Financial Assistant_`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    }

    showMessage(text, type = 'info') {
        const existingMessage = document.querySelector('.status-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const message = document.createElement('div');
        message.className = `status-message ${type}`;
        message.textContent = text;
        
        const header = document.querySelector('.header');
        if (header) {
            header.insertAdjacentElement('afterend', message);
        }
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }
}

// Initialize the application
let financialApp;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        financialApp = new FinancialStatementGenerator();
        window.financialApp = financialApp;
    });
} else {
    financialApp = new FinancialStatementGenerator();
    window.financialApp = financialApp;
}