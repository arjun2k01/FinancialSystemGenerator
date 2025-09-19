// Enhanced Google Gemini AI Voice Assistant with Error Handling
class GeminiAIVoiceAssistant {
    constructor(statementGenerator) {
        this.statementGenerator = statementGenerator;
        this.recognition = null;
        this.isListening = false;
        this.lastTranscript = '';
        this.isSecureContext = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        // Google Gemini API configuration
        this.apiKey = 'AIzaSyD2FhpzAEpFwuWqGWD-s3Hvi6ieQu6GYhc';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
        
        this.initializeVoiceRecognition();
        this.bindVoiceEvents();
        this.checkCompatibility();
    }
    
    checkCompatibility() {
        const hasVoiceSupport = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
        
        if (!hasVoiceSupport) {
            this.showVoiceMessage('Voice recognition not supported. Please use "Type Instead" option.', 'warning');
            this.updateVoiceStatus('Voice not supported - Type Instead available');
            return;
        }
        
        if (!this.isSecureContext) {
            this.showVoiceMessage('Voice recognition requires HTTPS. Using manual input for development.', 'warning');
            this.updateVoiceStatus('Voice requires HTTPS - Type Instead available');
        }
    }
    
    initializeVoiceRecognition() {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            return;
        }
        
        try {
            // Initialize speech recognition with better error handling
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.continuous = false; // Changed to false for better reliability
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-IN';
            this.recognition.maxAlternatives = 1;
            
            // Recognition event handlers with improved error handling
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceStatus('🎤 Listening... Speak clearly (will auto-stop after silence)');
                this.updateVoiceButtons(true);
                document.getElementById('voiceTranscript').style.display = 'block';
            };
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // Update transcript display
                const transcriptText = document.getElementById('transcriptText');
                if (transcriptText) {
                    transcriptText.textContent = finalTranscript || interimTranscript || 'Listening...';
                }
                
                // Process final transcript with Gemini AI
                if (finalTranscript.trim()) {
                    this.lastTranscript = finalTranscript;
                    this.processVoiceWithGeminiAI(finalTranscript);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                
                let errorMessage = '';
                switch (event.error) {
                    case 'network':
                        errorMessage = 'Network error. Please check internet connection or use "Type Instead" option.';
                        break;
                    case 'not-allowed':
                        errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
                        break;
                    case 'no-speech':
                        errorMessage = 'No speech detected. Please speak clearly and try again.';
                        break;
                    case 'audio-capture':
                        errorMessage = 'Microphone not found. Please check your microphone and try again.';
                        break;
                    case 'service-not-allowed':
                        errorMessage = 'Speech recognition service not allowed. Please use "Type Instead" option.';
                        break;
                    default:
                        errorMessage = `Speech recognition error: ${event.error}. Try "Type Instead" option.`;
                }
                
                this.showVoiceMessage(errorMessage, 'error');
                this.stopVoiceRecognition();
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceStatus('Voice recognition stopped - Ready for next input');
                this.updateVoiceButtons(false);
            };
            
        } catch (error) {
            console.error('Error initializing voice recognition:', error);
            this.showVoiceMessage('Voice recognition initialization failed. Please use "Type Instead" option.', 'error');
        }
    }
    
    bindVoiceEvents() {
        // Start voice input
        const startBtn = document.getElementById('startVoiceInput');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startVoiceRecognition();
            });
        }
        
        // Stop voice input
        const stopBtn = document.getElementById('stopVoiceInput');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopVoiceRecognition();
            });
        }
        
        // Manual input toggle
        const manualBtn = document.getElementById('manualInput');
        if (manualBtn) {
            manualBtn.addEventListener('click', () => {
                this.toggleManualInput();
            });
        }
        
        // Process manual input
        const processBtn = document.getElementById('processManualInput');
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                this.processManualInput();
            });
        }
        
        // Cancel manual input
        const cancelBtn = document.getElementById('cancelManualInput');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideManualInput();
            });
        }
        
        // Clear voice data
        const clearBtn = document.getElementById('clearVoiceData');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearVoiceData();
            });
        }
        
        // Enter key support for manual input
        const manualTextInput = document.getElementById('manualTextInput');
        if (manualTextInput) {
            manualTextInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.processManualInput();
                }
            });
        }
    }
    
    startVoiceRecognition() {
        if (!this.recognition) {
            this.showVoiceMessage('Speech recognition not available. Please use "Type Instead" option.', 'error');
            return;
        }
        
        if (this.isListening) {
            this.showVoiceMessage('Already listening...', 'warning');
            return;
        }
        
        // Request microphone permission first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    try {
                        this.recognition.start();
                        this.showVoiceMessage('🤖 Google Gemini AI Voice Assistant activated! Speak your transaction details.', 'success');
                    } catch (error) {
                        console.error('Error starting recognition:', error);
                        this.showVoiceMessage('Error starting voice recognition. Try "Type Instead" option.', 'error');
                    }
                })
                .catch((error) => {
                    console.error('Microphone permission error:', error);
                    this.showVoiceMessage('Microphone access denied. Please allow microphone permission or use "Type Instead".', 'error');
                });
        } else {
            try {
                this.recognition.start();
                this.showVoiceMessage('🤖 Google Gemini AI Voice Assistant activated!', 'success');
            } catch (error) {
                console.error('Error starting recognition:', error);
                this.showVoiceMessage('Voice recognition failed. Please use "Type Instead" option.', 'error');
            }
        }
    }
    
    stopVoiceRecognition() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.showVoiceMessage('Voice recognition stopped', 'info');
        }
    }
    
    toggleManualInput() {
        const manualSection = document.getElementById('manualInputSection');
        const manualTextInput = document.getElementById('manualTextInput');
        
        if (manualSection.style.display === 'none') {
            manualSection.style.display = 'block';
            manualTextInput.focus();
            this.updateVoiceStatus('Manual input mode - Type your transaction details');
            this.showVoiceMessage('Manual input activated. Type your transaction details and click "Process with AI".', 'info');
        } else {
            this.hideManualInput();
        }
    }
    
    hideManualInput() {
        const manualSection = document.getElementById('manualInputSection');
        const manualTextInput = document.getElementById('manualTextInput');
        
        manualSection.style.display = 'none';
        manualTextInput.value = '';
        this.updateVoiceStatus('Ready for voice or manual input');
    }
    
    processManualInput() {
        const manualTextInput = document.getElementById('manualTextInput');
        const inputText = manualTextInput.value.trim();
        
        if (!inputText) {
            this.showVoiceMessage('Please enter some text to process.', 'warning');
            return;
        }
        
        this.updateVoiceStatus('Processing manual input with Gemini AI...');
        this.processVoiceWithGeminiAI(inputText);
        this.hideManualInput();
    }
    
    async processVoiceWithGeminiAI(transcript) {
        this.updateVoiceStatus('🤖 Processing with Google Gemini AI...');
        this.showAIProcessing('Analyzing your input with Gemini AI...');
        
        try {
            // Enhanced Gemini AI prompt for better extraction
            const prompt = `You are an expert AI assistant for extracting financial transaction data from natural speech/text in India. 

Extract information from this input: "${transcript}"

Return ONLY a valid JSON object with these exact fields:
{
    "accountHolder": "full name or null",
    "location": "city/place name or null", 
    "date": "YYYY-MM-DD format or null (use 2025-09-19 for 'today')",
    "particulars": "transaction description or null",
    "debitAmount": "number only without currency or null",
    "creditAmount": "number only without currency or null",
    "action": "add_entry, clear_form, load_sample, or null"
}

Handle these patterns intelligently:
- Names: "My name is Kritima Mahajan", "I am John", "Account holder Rajesh"
- Locations: "Location Gurdaspur", "From Delhi", "City Mumbai", "Place Chandigarh"
- Dates: "Today", "19th September", "Date 2025-09-20", "Yesterday"
- Amounts: "Debit 5000 rupees", "Credit 3000", "Spent 500", "Received 10000 rs", "Amount 2500"
- Descriptions: "Bill payment", "ATM withdrawal", "Salary credit", "Cash deposit", "Online transfer"
- Actions: "Add entry", "Submit", "Clear form", "Load sample data"

Important rules:
1. Extract only numbers for amounts (no rupees, rs, currency symbols)
2. Use standard date format YYYY-MM-DD
3. Set only one of debitAmount OR creditAmount, never both
4. Return valid JSON only, no explanations`;

            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 1,
                    topP: 0.8,
                    maxOutputTokens: 500,
                }
            };
            
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API request failed: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Clean the response to extract JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in AI response');
            }
            
            const extractedData = JSON.parse(jsonMatch[0]);
            
            // Show AI response
            const extractedFields = Object.keys(extractedData).filter(k => extractedData[k] !== null && extractedData[k] !== "");
            this.showAIProcessing(`✨ Gemini Extracted: ${extractedFields.join(', ')}`);
            
            // Apply extracted data to form
            this.applyExtractedData(extractedData);
            
        } catch (error) {
            console.error('Gemini AI processing error:', error);
            this.showVoiceMessage('Gemini AI processing failed. Using basic pattern matching...', 'warning');
            this.hideAIProcessing();
            
            // Fallback to basic pattern matching
            this.basicPatternMatching(transcript);
        }
    }
    
    applyExtractedData(data) {
        let appliedFields = [];
        
        // Apply account holder
        if (data.accountHolder && data.accountHolder.trim()) {
            const field = document.getElementById('accountHolder');
            if (field) {
                field.value = data.accountHolder.trim();
                appliedFields.push('Account Holder');
                this.statementGenerator.updateAccountInfo();
            }
        }
        
        // Apply location
        if (data.location && data.location.trim()) {
            const field = document.getElementById('location');
            if (field) {
                field.value = data.location.trim();
                appliedFields.push('Location');
                this.statementGenerator.updateAccountInfo();
            }
        }
        
        // Apply date
        if (data.date && data.date.trim()) {
            const field = document.getElementById('entryDate');
            if (field) {
                let dateValue = data.date.trim();
                // Handle "today" specially
                if (dateValue.toLowerCase().includes('today')) {
                    const today = new Date();
                    dateValue = today.toISOString().split('T')[0];
                }
                field.value = dateValue;
                appliedFields.push('Date');
            }
        }
        
        // Apply particulars
        if (data.particulars && data.particulars.trim()) {
            const field = document.getElementById('particulars');
            if (field) {
                field.value = data.particulars.trim();
                appliedFields.push('Particulars');
            }
        }
        
        // Apply amounts (only one at a time)
        if (data.debitAmount && parseFloat(data.debitAmount) > 0) {
            const debitField = document.getElementById('debitAmount');
            const creditField = document.getElementById('creditAmount');
            if (debitField) {
                debitField.value = parseFloat(data.debitAmount);
                if (creditField) creditField.value = ''; // Clear credit
                appliedFields.push('Debit Amount');
            }
        } else if (data.creditAmount && parseFloat(data.creditAmount) > 0) {
            const creditField = document.getElementById('creditAmount');
            const debitField = document.getElementById('debitAmount');
            if (creditField) {
                creditField.value = parseFloat(data.creditAmount);
                if (debitField) debitField.value = ''; // Clear debit
                appliedFields.push('Credit Amount');
            }
        }
        
        // Handle actions with delay for better UX
        if (data.action) {
            switch (data.action.toLowerCase()) {
                case 'add_entry':
                case 'submit':
                    setTimeout(() => {
                        this.statementGenerator.addEntry();
                        this.showAIProcessing('✅ Entry added successfully by Gemini AI!');
                        setTimeout(() => this.hideAIProcessing(), 3000);
                    }, 1500);
                    appliedFields.push('Entry Added');
                    break;
                case 'clear_form':
                    this.statementGenerator.clearForm();
                    appliedFields.push('Form Cleared');
                    break;
                case 'load_sample':
                    this.statementGenerator.loadSampleData();
                    appliedFields.push('Sample Data Loaded');
                    break;
            }
        }
        
        // Show success message
        if (appliedFields.length > 0) {
            this.showVoiceMessage(`✅ Gemini AI Applied: ${appliedFields.join(', ')}`, 'success');
            this.updateVoiceStatus('✨ Google Gemini AI processing complete!');
            
            if (!data.action) {
                setTimeout(() => {
                    this.hideAIProcessing();
                }, 3000);
            }
        } else {
            this.showVoiceMessage('No actionable data found. Try being more specific or use examples.', 'warning');
            this.hideAIProcessing();
        }
    }
    
    basicPatternMatching(text) {
        const normalizedText = text.toLowerCase();
        let appliedFields = [];
        
        // Enhanced pattern matching as fallback
        const patterns = {
            name: /(?:my name is|i am|account holder|name)\s+([a-zA-Z\s]{2,30})(?=\s|$|,|location|from|debit|credit|amount)/i,
            location: /(?:location|place|city|from)\s+([a-zA-Z\s]{2,20})(?=\s|$|,|debit|credit|amount|date)/i,
            debit: /(?:debit|spend|spent|paid|withdraw|withdrawal)\s*(?:amount|rupees|rs\.?)?\s*(\d+(?:\.\d{1,2})?)/i,
            credit: /(?:credit|received|deposit|income|credited|salary)\s*(?:amount|rupees|rs\.?)?\s*(\d+(?:\.\d{1,2})?)/i,
            particulars: /(?:for|bill|invoice|payment|cash|atm|online|transfer|salary|deposit)\s*(?:payment|withdrawal|deposit|transfer)?\s*([a-zA-Z0-9\s-]{3,30})/i
        };
        
        // Apply patterns
        Object.entries(patterns).forEach(([type, pattern]) => {
            const match = text.match(pattern);
            if (match) {
                const value = match[1].trim();
                let fieldId = '';
                
                switch (type) {
                    case 'name':
                        fieldId = 'accountHolder';
                        break;
                    case 'location':
                        fieldId = 'location';
                        break;
                    case 'debit':
                        fieldId = 'debitAmount';
                        document.getElementById('creditAmount').value = '';
                        break;
                    case 'credit':
                        fieldId = 'creditAmount';
                        document.getElementById('debitAmount').value = '';
                        break;
                    case 'particulars':
                        fieldId = 'particulars';
                        break;
                }
                
                if (fieldId) {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.value = value;
                        appliedFields.push(type);
                        if (type === 'name' || type === 'location') {
                            this.statementGenerator.updateAccountInfo();
                        }
                    }
                }
            }
        });
        
        // Handle actions
        if (normalizedText.includes('add entry') || normalizedText.includes('submit')) {
            setTimeout(() => {
                this.statementGenerator.addEntry();
            }, 500);
            appliedFields.push('Entry Added');
        }
        
        if (normalizedText.includes('clear form')) {
            this.statementGenerator.clearForm();
            appliedFields.push('Form Cleared');
        }
        
        if (appliedFields.length > 0) {
            this.showVoiceMessage(`Fallback Applied: ${appliedFields.join(', ')}`, 'success');
        } else {
            this.showVoiceMessage('Could not extract data. Please try the manual input option.', 'warning');
        }
    }
    
    clearVoiceData() {
        const transcriptText = document.getElementById('transcriptText');
        const voiceTranscript = document.getElementById('voiceTranscript');
        const manualTextInput = document.getElementById('manualTextInput');
        
        if (transcriptText) transcriptText.textContent = 'Waiting for speech...';
        if (voiceTranscript) voiceTranscript.style.display = 'none';
        if (manualTextInput) manualTextInput.value = '';
        
        this.hideManualInput();
        this.lastTranscript = '';
        this.hideAIProcessing();
        this.updateVoiceStatus('All voice data cleared. Ready for new input.');
        this.showVoiceMessage('Voice data cleared successfully', 'info');
    }
    
    showAIProcessing(message) {
        const aiProcessing = document.getElementById('aiProcessing');
        const aiResponse = document.getElementById('aiResponse');
        
        if (aiProcessing && aiResponse) {
            aiResponse.textContent = message;
            aiProcessing.style.display = 'block';
        }
    }
    
    hideAIProcessing() {
        const aiProcessing = document.getElementById('aiProcessing');
        if (aiProcessing) {
            aiProcessing.style.display = 'none';
        }
    }
    
    updateVoiceStatus(message) {
        const statusElement = document.getElementById('voiceStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    updateVoiceButtons(isListening) {
        const startBtn = document.getElementById('startVoiceInput');
        const stopBtn = document.getElementById('stopVoiceInput');
        
        if (startBtn) startBtn.disabled = isListening;
        if (stopBtn) stopBtn.disabled = !isListening;
    }
    
    showVoiceMessage(message, type) {
        if (this.statementGenerator && this.statementGenerator.showMessage) {
            this.statementGenerator.showMessage(`🎙️ ${message}`, type);
        } else {
            console.log(`Voice Assistant: ${message}`);
        }
    }
}





// Ultimate Financial Statement Generator JavaScript with Image Sharing
class UltimateFinancialStatementGenerator {
    constructor() {
        this.entries = [];
        this.accountHolder = '';
        this.location = '';
        this.balance = 0;
        this.totalDebits = 0;
        this.totalCredits = 0;
        this.currentImageBlob = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDisplay();
        this.setCurrentDate();
        // Initialize Google Gemini AI Voice Assistant
    this.geminiVoice = new GeminiAIVoiceAssistant(this);
        
    }

    bindEvents() {
        // Form submission
        const entryForm = document.getElementById('entryForm');
        if (entryForm) {
            entryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addEntry();
            });
        }

        // Clear form
        const clearFormBtn = document.getElementById('clearForm');
        if (clearFormBtn) {
            clearFormBtn.addEventListener('click', () => {
                this.clearForm();
            });
        }

        // Load sample data
        const loadSampleBtn = document.getElementById('loadSampleData');
        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', () => {
                this.loadSampleData();
            });
        }

        // Account holder and location changes
        const accountHolderInput = document.getElementById('accountHolder');
        const locationInput = document.getElementById('location');
        
        if (accountHolderInput) {
            accountHolderInput.addEventListener('input', () => {
                this.updateAccountInfo();
            });
        }

        if (locationInput) {
            locationInput.addEventListener('input', () => {
                this.updateAccountInfo();
            });
        }

        // Amount input validation
        const debitInput = document.getElementById('debitAmount');
        const creditInput = document.getElementById('creditAmount');
        
        if (debitInput && creditInput) {
            debitInput.addEventListener('input', (e) => {
                if (e.target.value && creditInput.value) {
                    creditInput.value = '';
                }
            });

            creditInput.addEventListener('input', (e) => {
                if (e.target.value && debitInput.value) {
                    debitInput.value = '';
                }
            });
        }

        // Action buttons
        const downloadPDFBtn = document.getElementById('downloadPDF');
        if (downloadPDFBtn) {
            downloadPDFBtn.addEventListener('click', () => {
                this.downloadPDF();
            });
        }

        const shareImageBtn = document.getElementById('shareImageWhatsApp');
        if (shareImageBtn) {
            shareImageBtn.addEventListener('click', () => {
                this.shareImageToWhatsApp();
            });
        }

        const shareTextBtn = document.getElementById('shareTextWhatsApp');
        if (shareTextBtn) {
            shareTextBtn.addEventListener('click', () => {
                this.sendTextViaWhatsApp();
            });
        }

        const shareBothBtn = document.getElementById('shareBothFormats');
        if (shareBothBtn) {
            shareBothBtn.addEventListener('click', () => {
                this.shareBothFormats();
            });
        }

        const clearAllBtn = document.getElementById('clearAllData');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }

        // Modal events
        const closeImagePreview = document.getElementById('closeImagePreview');
        const closePreview = document.getElementById('closePreview');
        const downloadImage = document.getElementById('downloadImage');
        const shareImageNow = document.getElementById('shareImageNow');
        const imagePreviewModal = document.getElementById('imagePreviewModal');

        if (closeImagePreview) {
            closeImagePreview.addEventListener('click', () => {
                this.closeImageModal();
            });
        }

        if (closePreview) {
            closePreview.addEventListener('click', () => {
                this.closeImageModal();
            });
        }

        if (downloadImage) {
            downloadImage.addEventListener('click', () => {
                this.downloadImage();
            });
        }

        if (shareImageNow) {
            shareImageNow.addEventListener('click', () => {
                this.shareCurrentImage();
            });
        }

        // Close modal on background click
        if (imagePreviewModal) {
            imagePreviewModal.addEventListener('click', (e) => {
                if (e.target.id === 'imagePreviewModal') {
                    this.closeImageModal();
                }
            });
        }
    }

    setCurrentDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        const dateInput = document.getElementById('entryDate');
        if (dateInput) {
            dateInput.value = formattedDate;
        }
    }

    addEntry() {
        const dateInput = document.getElementById('entryDate');
        const particularsInput = document.getElementById('particulars');
        const debitInput = document.getElementById('debitAmount');
        const creditInput = document.getElementById('creditAmount');
        
        if (!dateInput || !particularsInput || !debitInput || !creditInput) {
            this.showMessage('Form elements not found.', 'error');
            return;
        }

        const date = dateInput.value;
        const particulars = particularsInput.value.trim();
        const debit = parseFloat(debitInput.value) || 0;
        const credit = parseFloat(creditInput.value) || 0;

        // Validation
        if (!date || !particulars) {
            this.showMessage('Please fill in the date and particulars fields.', 'error');
            return;
        }

        if (debit === 0 && credit === 0) {
            this.showMessage('Please enter either a debit or credit amount.', 'error');
            return;
        }

        // Create entry
        const entry = {
            id: Date.now() + Math.random(),
            date: this.formatDateForDisplay(date),
            particulars: particulars,
            debit: debit,
            credit: credit,
            timestamp: new Date().toISOString()
        };

        this.entries.push(entry);
        this.calculateTotals();
        this.updateDisplay();
        this.clearFormFields();
        
        this.showMessage('Entry added successfully!', 'success');
    }

    loadSampleData() {
        if (this.entries.length > 0 && !confirm('This will replace all current entries with sample data. Continue?')) {
            return;
        }

        const button = document.getElementById('loadSampleData');
        if (button) {
            button.classList.add('btn--loading');
        }

        try {
            // Set sample account info
            const accountHolderInput = document.getElementById('accountHolder');
            const locationInput = document.getElementById('location');
            
            if (accountHolderInput) accountHolderInput.value = 'YOGESH JI';
            if (locationInput) locationInput.value = 'GURDASPURIA';
            
            this.updateAccountInfo();

            // Clear existing entries
            this.entries = [];

            // Sample data with proper formatting
            const sampleData = [
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
                {"DATE": "31.08.2024", "PARTICULARS": "TO BILL NO-567", "DEBIT": 57500.00, "CREDIT": 0},
                {"DATE": "01.09.2024", "PARTICULARS": "BY DISCOUNT", "DEBIT": 0, "CREDIT": 375.00},
                {"DATE": "19.10.2024", "PARTICULARS": "BY CHQ/CASH", "DEBIT": 0, "CREDIT": 50000.00},
                {"DATE": "25.10.2024", "PARTICULARS": "TO BILL NO-754", "DEBIT": 49550.00, "CREDIT": 0},
                {"DATE": "03.12.2024", "PARTICULARS": "BY CHQ/CASH", "DEBIT": 0, "CREDIT": 50000.00},
                {"DATE": "06.12.2024", "PARTICULARS": "TO BILL NO-938", "DEBIT": 86450.00, "CREDIT": 0},
                {"DATE": "13.12.2024", "PARTICULARS": "TO BILL NO-983", "DEBIT": 17000.00, "CREDIT": 0},
                {"DATE": "20.12.2024", "PARTICULARS": "TO BILL NO-1009", "DEBIT": 29750.00, "CREDIT": 0},
                {"DATE": "21.12.2024", "PARTICULARS": "TO BILL NO-1019", "DEBIT": 900.00, "CREDIT": 0},
                {"DATE": "21.12.2024", "PARTICULARS": "BY RETURNED", "DEBIT": 0, "CREDIT": 46250.00},
                {"DATE": "21.12.2024", "PARTICULARS": "BY CHQ/CASH", "DEBIT": 0, "CREDIT": 35000.00},
                {"DATE": "01.01.2025", "PARTICULARS": "TO BILL NO-1072", "DEBIT": 56100.00, "CREDIT": 0},
                {"DATE": "07.01.2025", "PARTICULARS": "BY CHQ/CASH", "DEBIT": 0, "CREDIT": 50000.00},
                {"DATE": "10.01.2025", "PARTICULARS": "TO BILL NO-1136", "DEBIT": 18700.00, "CREDIT": 0},
                {"DATE": "14.01.2025", "PARTICULARS": "TO BILL NO-1154", "DEBIT": 10500.00, "CREDIT": 0},
                {"DATE": "28.02.2025", "PARTICULARS": "BY CHQ/CASH", "DEBIT": 0, "CREDIT": 40000.00},
                {"DATE": "18.04.2025", "PARTICULARS": "TO BILL NO-54", "DEBIT": 30240.00, "CREDIT": 0},
                {"DATE": "18.04.2025", "PARTICULARS": "TO BILL NO-55", "DEBIT": 3900.00, "CREDIT": 0},
                {"DATE": "18.04.2025", "PARTICULARS": "TO BILL NO-56", "DEBIT": 15356.00, "CREDIT": 0}
            ];

            // Convert sample data to entries
            sampleData.forEach((item, index) => {
                const entry = {
                    id: Date.now() + index + Math.random(),
                    date: item.DATE || '01.01.2024',
                    particulars: item.PARTICULARS,
                    debit: item.DEBIT || 0,
                    credit: item.CREDIT || 0,
                    timestamp: new Date().toISOString()
                };
                
                this.entries.push(entry);
            });

            this.calculateTotals();
            this.updateDisplay();
            
            setTimeout(() => {
                if (button) {
                    button.classList.remove('btn--loading');
                }
                this.showMessage(`Sample data loaded successfully! ${sampleData.length} entries added.`, 'success');
            }, 800);

        } catch (error) {
            console.error('Error loading sample data:', error);
            if (button) {
                button.classList.remove('btn--loading');
            }
            this.showMessage('Error loading sample data. Please try again.', 'error');
        }
    }

    async shareImageToWhatsApp() {
        if (this.entries.length === 0) {
            this.showMessage('No entries to share. Add some transactions first.', 'error');
            return;
        }

        const button = document.getElementById('shareImageWhatsApp');
        if (button) {
            button.classList.add('btn--loading');
        }

        try {
            this.showMessage('Generating high-quality statement image...', 'info');
            
            // Generate the image
            const imageBlob = await this.generateStatementImage();
            
            if (imageBlob) {
                this.currentImageBlob = imageBlob;
                const imageUrl = URL.createObjectURL(imageBlob);
                
                // Show preview modal
                const previewImage = document.getElementById('previewImage');
                const modal = document.getElementById('imagePreviewModal');
                
                if (previewImage && modal) {
                    previewImage.src = imageUrl;
                    modal.classList.remove('hidden');
                }
                
                this.showMessage('Image generated successfully! Preview and share via WhatsApp.', 'success');
            } else {
                throw new Error('Failed to generate image');
            }
            
        } catch (error) {
            console.error('Image generation error:', error);
            this.showMessage('Error generating image: ' + error.message, 'error');
        } finally {
            if (button) {
                setTimeout(() => {
                    button.classList.remove('btn--loading');
                }, 1000);
            }
        }
    }

    async generateStatementImage() {
        try {
            // Check if html2canvas is available
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas library not loaded');
            }

            // Update the hidden image container with current data
            this.updateImageContainer();

            // Get the image container
            const container = document.getElementById('imageGenerationContainer');
            const wrapper = container ? container.querySelector('.statement-image-wrapper') : null;
            
            if (!container || !wrapper) {
                throw new Error('Image generation container not found');
            }
            
            // Temporarily show the container for rendering
            container.style.position = 'absolute';
            container.style.top = '-9999px';
            container.style.left = '0';
            container.classList.remove('hidden');

            // Generate image with high quality settings
            const canvas = await html2canvas(wrapper, {
                width: 1200,
                height: wrapper.scrollHeight + 100,
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: false,
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure fonts are loaded in cloned document
                    const clonedWrapper = clonedDoc.querySelector('.statement-image-wrapper');
                    if (clonedWrapper) {
                        clonedWrapper.style.fontFamily = 'Arial, sans-serif';
                    }
                }
            });

            // Hide the container again
            container.classList.add('hidden');
            container.style.position = 'absolute';
            container.style.top = '-9999px';
            container.style.left = '-9999px';

            // Convert canvas to blob
            return new Promise((resolve) => {
                canvas.toBlob(
                    (blob) => resolve(blob),
                    'image/png',
                    1.0
                );
            });

        } catch (error) {
            console.error('Error in generateStatementImage:', error);
            throw error;
        }
    }

    updateImageContainer() {
        // Update account holder info in image
        const accountInfo = this.accountHolder && this.location ? 
            `${this.accountHolder.toUpperCase()} ${this.location.toUpperCase()}` :
            this.accountHolder.toUpperCase() || 'ACCOUNT HOLDER NAME';
        
        const displayAccountHolderImage = document.getElementById('displayAccountHolderImage');
        if (displayAccountHolderImage) {
            displayAccountHolderImage.textContent = accountInfo;
        }

        // Update table data for image
        const tbody = document.getElementById('statementBodyImage');
        if (tbody) {
            let html = '';

            this.entries.forEach(entry => {
                html += `
                    <tr>
                        <td>${entry.date}</td>
                        <td>${entry.particulars}</td>
                        <td>${entry.debit > 0 ? this.formatIndianNumber(entry.debit) : ''}</td>
                        <td>${entry.credit > 0 ? this.formatIndianNumber(entry.credit) : ''}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        }

        // Update totals for image
        const totalDebitImage = document.getElementById('totalDebitImage');
        const totalCreditImage = document.getElementById('totalCreditImage');
        
        if (totalDebitImage) {
            totalDebitImage.textContent = this.formatIndianNumber(this.totalDebits);
        }
        if (totalCreditImage) {
            totalCreditImage.textContent = this.formatIndianNumber(this.totalCredits);
        }
    }

    async shareCurrentImage() {
        if (!this.currentImageBlob) {
            this.showMessage('No image available to share.', 'error');
            return;
        }

        try {
            // Create a temporary URL for the image
            const imageUrl = URL.createObjectURL(this.currentImageBlob);
            
            // Create WhatsApp message with image reference
            const accountInfo = this.accountHolder && this.location ? 
                `${this.accountHolder.toUpperCase()} ${this.location.toUpperCase()}` :
                this.accountHolder.toUpperCase() || 'ACCOUNT HOLDER';

            let message = `*📊 ACCOUNT STATEMENT IMAGE*\n\n`;
            message += `👤 *Account:* ${accountInfo}\n`;
            message += `📅 *Generated:* ${new Date().toLocaleDateString('en-IN')}\n\n`;
            message += `💰 *Summary:*\n`;
            message += `• Entries: ${this.entries.length}\n`;
            message += `• Total Debits: ₹${this.formatIndianNumber(this.totalDebits)}\n`;
            message += `• Total Credits: ₹${this.formatIndianNumber(this.totalCredits)}\n`;
            message += `• Balance: ₹${this.formatIndianNumber(Math.abs(this.balance))} ${this.balance >= 0 ? '(Credit)' : '(Debit)'}\n\n`;
            message += `📋 *Professional statement image attached*\n`;
            message += `✨ Generated with Ultimate Financial Statement Generator\n`;
            message += `⏰ ${new Date().toLocaleString('en-IN')}`;

            // For mobile devices, try to share using Web Share API
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([this.currentImageBlob], 'statement.png', { type: 'image/png' })] })) {
                const file = new File([this.currentImageBlob], `Statement_${(this.accountHolder || 'Account').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`, {
                    type: 'image/png'
                });

                await navigator.share({
                    title: 'Account Statement',
                    text: message,
                    files: [file]
                });

                this.showMessage('Statement image shared successfully!', 'success');
            } else {
                // Fallback: Open WhatsApp Web with text message
                const encodedMessage = encodeURIComponent(message + '\n\n*Note: Please download and attach the statement image manually.*');
                const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
                
                // Also trigger image download
                this.downloadImage();
                
                const newWindow = window.open(whatsappURL, '_blank');
                
                if (newWindow) {
                    this.showMessage('WhatsApp opened with message! Statement image downloaded - please attach it manually.', 'info');
                } else {
                    this.showMessage('Please allow popups. Statement image has been downloaded.', 'info');
                }
            }

            // Close the modal
            this.closeImageModal();

        } catch (error) {
            console.error('Error sharing image:', error);
            this.showMessage('Error sharing image: ' + error.message, 'error');
        }
    }

    downloadImage() {
        if (!this.currentImageBlob) {
            this.showMessage('No image available to download.', 'error');
            return;
        }

        try {
            const url = URL.createObjectURL(this.currentImageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Statement_${(this.accountHolder || 'Account').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showMessage('Statement image downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error downloading image:', error);
            this.showMessage('Error downloading image: ' + error.message, 'error');
        }
    }

    closeImageModal() {
        const modal = document.getElementById('imagePreviewModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Clean up blob URL
        const previewImg = document.getElementById('previewImage');
        if (previewImg && previewImg.src && previewImg.src.startsWith('blob:')) {
            URL.revokeObjectURL(previewImg.src);
        }
        if (previewImg) {
            previewImg.src = '';
        }
    }

    async shareBothFormats() {
        if (this.entries.length === 0) {
            this.showMessage('No entries to share. Add some transactions first.', 'error');
            return;
        }

        const button = document.getElementById('shareBothFormats');
        if (button) {
            button.classList.add('btn--loading');
        }

        try {
            // Generate PDF first
            this.showMessage('Preparing PDF and image for sharing...', 'info');
            
            // Generate image
            const imageBlob = await this.generateStatementImage();
            
            if (imageBlob) {
                // Download both formats
                this.downloadPDF();
                
                const url = URL.createObjectURL(imageBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Statement_${(this.accountHolder || 'Account').replace(/\s+/g, '_')}_Image_${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                // Open WhatsApp with message
                this.sendTextViaWhatsApp();

                this.showMessage('Both PDF and image downloaded! WhatsApp opened for sharing.', 'success');
            }

        } catch (error) {
            console.error('Error sharing both formats:', error);
            this.showMessage('Error preparing files: ' + error.message, 'error');
        } finally {
            if (button) {
                button.classList.remove('btn--loading');
            }
        }
    }

    calculateTotals() {
        this.balance = 0;
        this.totalDebits = 0;
        this.totalCredits = 0;
        
        this.entries.forEach(entry => {
            this.totalDebits += entry.debit;
            this.totalCredits += entry.credit;
            this.balance += entry.credit - entry.debit;
        });
    }

    updateDisplay() {
        this.updateBalanceDisplay();
        this.updateStatementTable();
    }

    updateAccountInfo() {
        const accountHolderInput = document.getElementById('accountHolder');
        const locationInput = document.getElementById('location');
        
        const accountHolder = accountHolderInput ? accountHolderInput.value.trim() : '';
        const location = locationInput ? locationInput.value.trim() : '';
        
        this.accountHolder = accountHolder;
        this.location = location;
        
        const displayText = accountHolder && location ? 
            `${accountHolder.toUpperCase()} ${location.toUpperCase()}` : 
            accountHolder.toUpperCase() || 'ACCOUNT HOLDER NAME';
            
        const displayElement = document.getElementById('displayAccountHolder');
        if (displayElement) {
            displayElement.textContent = displayText;
        }
    }

    updateBalanceDisplay() {
        const balanceElement = document.getElementById('currentBalance');
        if (balanceElement) {
            const balanceClass = this.balance >= 0 ? 'positive-balance' : 'negative-balance';
            balanceElement.textContent = this.formatIndianCurrency(this.balance);
            balanceElement.className = `balance-amount ${balanceClass}`;
        }
        
        // Update stats
        const totalEntriesElement = document.getElementById('totalEntries');
        const totalDebitsDisplayElement = document.getElementById('totalDebitsDisplay');
        const totalCreditsDisplayElement = document.getElementById('totalCreditsDisplay');
        
        if (totalEntriesElement) totalEntriesElement.textContent = this.entries.length;
        if (totalDebitsDisplayElement) totalDebitsDisplayElement.textContent = this.formatIndianCurrency(this.totalDebits);
        if (totalCreditsDisplayElement) totalCreditsDisplayElement.textContent = this.formatIndianCurrency(this.totalCredits);
    }

    updateStatementTable() {
        const tbody = document.getElementById('statementBody');
        const tfoot = document.getElementById('statementFooter');
        
        if (!tbody || !tfoot) return;
        
        if (this.entries.length === 0) {
            tbody.innerHTML = '<tr class="empty-state"><td colspan="6">No entries yet. Add your first transaction above or load sample data.</td></tr>';
            tfoot.classList.add('hidden');
            return;
        }

        let html = '';
        let runningBalance = 0;

        this.entries.forEach((entry, index) => {
            runningBalance += entry.credit - entry.debit;
            const balanceClass = runningBalance >= 0 ? 'positive-balance' : 'negative-balance';
            
            html += `
                <tr class="entry-row">
                    <td>${entry.date}</td>
                    <td>${entry.particulars}</td>
                    <td class="indian-number">${entry.debit > 0 ? this.formatIndianNumber(entry.debit) : ''}</td>
                    <td class="indian-number">${entry.credit > 0 ? this.formatIndianNumber(entry.credit) : ''}</td>
                    <td class="${balanceClass} indian-number">${this.formatIndianNumber(Math.abs(runningBalance))}</td>
                    <td><button class="delete-btn" onclick="app.deleteEntry('${entry.id}')" title="Delete entry">🗑️</button></td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // Update footer
        const totalDebitElement = document.getElementById('totalDebit');
        const totalCreditElement = document.getElementById('totalCredit');
        const finalBalanceElement = document.getElementById('finalBalance');
        
        if (totalDebitElement) totalDebitElement.textContent = this.formatIndianNumber(this.totalDebits);
        if (totalCreditElement) totalCreditElement.textContent = this.formatIndianNumber(this.totalCredits);
        if (finalBalanceElement) finalBalanceElement.textContent = this.formatIndianNumber(Math.abs(this.balance));
        
        tfoot.classList.remove('hidden');
    }

    deleteEntry(entryId) {
        if (confirm('Are you sure you want to delete this entry?')) {
            this.entries = this.entries.filter(entry => entry.id.toString() !== entryId.toString());
            this.calculateTotals();
            this.updateDisplay();
            this.showMessage('Entry deleted successfully!', 'success');
        }
    }

    clearFormFields() {
        const dateInput = document.getElementById('entryDate');
        const particularsInput = document.getElementById('particulars');
        const debitInput = document.getElementById('debitAmount');
        const creditInput = document.getElementById('creditAmount');
        
        if (dateInput) dateInput.value = '';
        if (particularsInput) particularsInput.value = '';
        if (debitInput) debitInput.value = '';
        if (creditInput) creditInput.value = '';
        
        this.setCurrentDate();
    }

    clearForm(clearAccountInfo = true) {
        if (clearAccountInfo) {
            const accountHolderInput = document.getElementById('accountHolder');
            const locationInput = document.getElementById('location');
            
            if (accountHolderInput) accountHolderInput.value = '';
            if (locationInput) locationInput.value = '';
            
            this.updateAccountInfo();
        }
        this.clearFormFields();
    }

    clearAllData() {
        const button = document.getElementById('clearAllData');
        
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            if (button) {
                button.classList.add('btn--loading');
            }
            
            this.entries = [];
            this.accountHolder = '';
            this.location = '';
            this.balance = 0;
            this.totalDebits = 0;
            this.totalCredits = 0;
            
            this.clearForm(true);
            this.updateDisplay();
            
            setTimeout(() => {
                if (button) {
                    button.classList.remove('btn--loading');
                }
                this.showMessage('All data cleared successfully!', 'success');
            }, 500);
        }
    }

    downloadPDF() {
        if (this.entries.length === 0) {
            this.showMessage('No entries to export. Add some transactions first.', 'error');
            return;
        }

        const button = document.getElementById('downloadPDF');
        if (button) {
            button.classList.add('btn--loading');
        }

        try {
            // Check if jsPDF is available
            if (typeof window.jspdf === 'undefined') {
                throw new Error('PDF library not loaded');
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Set margins and initial position
            const margin = 20;
            let y = 30;

            // Header - "ACCOUNT STATEMENTS"
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('ACCOUNT STATEMENTS', 105, y, { align: 'center' });
            y += 15;

            // Account holder name and location
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            const accountInfo = this.accountHolder && this.location ? 
                `${this.accountHolder.toUpperCase()} ${this.location.toUpperCase()}` :
                this.accountHolder.toUpperCase() || 'ACCOUNT HOLDER';
            doc.text(accountInfo, 105, y, { align: 'center' });
            y += 20;

            // Table setup
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');

            // Table headers
            const headers = ['DATE', 'PARTICULARS', 'DEBIT', 'CREDIT'];
            const colPositions = [margin, margin + 30, margin + 110, margin + 145];

            // Draw header row
            headers.forEach((header, i) => {
                doc.text(header, colPositions[i], y);
            });

            // Draw header line
            doc.line(margin, y + 2, margin + 160, y + 2);
            y += 10;

            // Table data
            doc.setFont(undefined, 'normal');

            this.entries.forEach(entry => {
                // Check if we need a new page
                if (y > 270) {
                    doc.addPage();
                    y = 30;
                    
                    // Repeat headers on new page
                    doc.setFont(undefined, 'bold');
                    headers.forEach((header, i) => {
                        doc.text(header, colPositions[i], y);
                    });
                    doc.line(margin, y + 2, margin + 160, y + 2);
                    y += 10;
                    doc.setFont(undefined, 'normal');
                }

                // Date
                doc.text(entry.date, colPositions[0], y);

                // Particulars (truncate if too long)
                const particulars = entry.particulars.length > 30 ? 
                    entry.particulars.substring(0, 30) + '...' : 
                    entry.particulars;
                doc.text(particulars, colPositions[1], y);

                // Debit
                if (entry.debit > 0) {
                    doc.text(this.formatIndianNumber(entry.debit), colPositions[2], y, { align: 'right' });
                }

                // Credit
                if (entry.credit > 0) {
                    doc.text(this.formatIndianNumber(entry.credit), colPositions[3], y, { align: 'right' });
                }

                y += 8;
            });

            // Final totals
            y += 5;
            doc.line(margin, y, margin + 160, y);
            y += 8;

            doc.setFont(undefined, 'bold');
            doc.text('TOTAL', colPositions[1], y);
            doc.text(this.formatIndianNumber(this.totalDebits), colPositions[2], y, { align: 'right' });
            doc.text(this.formatIndianNumber(this.totalCredits), colPositions[3], y, { align: 'right' });

            // Save the PDF
            const fileName = `Statement_${(this.accountHolder || 'Account').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            this.showMessage('PDF downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showMessage('Error generating PDF: ' + error.message, 'error');
        } finally {
            if (button) {
                setTimeout(() => {
                    button.classList.remove('btn--loading');
                }, 1000);
            }
        }
    }

    async sendTextViaWhatsApp() {
        if (this.entries.length === 0) {
            this.showMessage('No entries to share. Add some transactions first.', 'error');
            return;
        }

        const button = document.getElementById('shareTextWhatsApp');
        if (button) {
            button.classList.add('btn--loading');
        }

        try {
            // Create WhatsApp message
            const accountInfo = this.accountHolder && this.location ? 
                `${this.accountHolder.toUpperCase()} ${this.location.toUpperCase()}` :
                this.accountHolder.toUpperCase() || 'ACCOUNT HOLDER';

            let message = `*📊 ACCOUNT STATEMENT*\n\n`;
            message += `👤 *Account Holder:* ${accountInfo}\n`;
            message += `📅 *Generated:* ${new Date().toLocaleDateString('en-IN')}\n\n`;
            message += `💰 *Financial Summary:*\n`;
            message += `• Total Entries: ${this.entries.length}\n`;
            message += `• Total Debits: ₹${this.formatIndianNumber(this.totalDebits)}\n`;
            message += `• Total Credits: ₹${this.formatIndianNumber(this.totalCredits)}\n`;
            message += `• Current Balance: ₹${this.formatIndianNumber(Math.abs(this.balance))}\n`;
            message += `• Status: ${this.balance >= 0 ? 'Credit Balance ✅' : 'Debit Balance ⚠️'}\n\n`;
            
            message += `📋 *Recent Transactions:*\n`;
            const recentEntries = this.entries.slice(-5);
            recentEntries.forEach((entry, index) => {
                message += `${index + 1}. ${entry.date} - ${entry.particulars}\n`;
                if (entry.debit > 0) message += `   💸 Debit: ₹${this.formatIndianNumber(entry.debit)}\n`;
                if (entry.credit > 0) message += `   💰 Credit: ₹${this.formatIndianNumber(entry.credit)}\n`;
            });
            
            message += `\n✨ *Complete PDF statement available for download*\n`;
            message += `🔒 Generated with Ultimate Financial Statement Generator\n`;
            message += `⏰ ${new Date().toLocaleString('en-IN')}`;

            // Open WhatsApp with message
            const encodedMessage = encodeURIComponent(message);
            const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
            
            // Open WhatsApp
            const newWindow = window.open(whatsappURL, '_blank');
            
            if (newWindow) {
                this.showMessage('WhatsApp opened successfully! Share the message and download PDF separately if needed.', 'success');
            } else {
                this.showMessage('Please allow popups to open WhatsApp. You can copy this message manually.', 'info');
            }
            
        } catch (error) {
            console.error('WhatsApp sharing error:', error);
            this.showMessage('Error preparing WhatsApp message: ' + error.message, 'error');
        } finally {
            if (button) {
                setTimeout(() => {
                    button.classList.remove('btn--loading');
                }, 1000);
            }
        }
    }

    // Utility functions for Indian number formatting
    formatIndianNumber(amount) {
        if (amount === 0) return '0.00';
        
        const num = Math.abs(amount);
        const [integer, decimal] = num.toFixed(2).split('.');
        
        // Indian numbering system: last 3 digits, then groups of 2
        let result = integer.slice(-3);
        let remaining = integer.slice(0, -3);
        
        while (remaining.length > 0) {
            if (remaining.length <= 2) {
                result = remaining + ',' + result;
                break;
            } else {
                result = remaining.slice(-2) + ',' + result;
                remaining = remaining.slice(0, -2);
            }
        }
        
        return result + '.' + decimal;
    }

    formatIndianCurrency(amount) {
        const formatted = this.formatIndianNumber(amount);
        return '₹' + formatted;
    }

    formatDateForDisplay(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    showMessage(text, type = 'success') {
        const container = document.getElementById('messageContainer');
        if (!container) return;
        
        const message = document.createElement('div');
        message.className = `message message--${type}`;
        message.textContent = text;
        
        container.appendChild(message);
        container.classList.remove('hidden');
        
        // Remove message after 6 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
            if (container.children.length === 0) {
                container.classList.add('hidden');
            }
        }, 6000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new UltimateFinancialStatementGenerator();
});

// Also initialize immediately in case DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.app) {
            window.app = new UltimateFinancialStatementGenerator();
        }
    });
} else {
    window.app = new UltimateFinancialStatementGenerator();
}