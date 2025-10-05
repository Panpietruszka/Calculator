/**
 * ========================================
 * 1. GLOBAL CONSTANTS AND VARIABLES (GLOBAL STATE)
 * ========================================
 */
let lastOperationWasEquals = false;
let history = []; 
let currentMode = 'dec'; // Default mode for programmer calculator
const HISTORY_KEY = 'calculatorHistory';

/**
 * ========================================
 * 2. DOM ELEMENT REFERENCES (DOM ELEMENTS)
 * ========================================
 */
// Main Containers
const calculatorBody = document.querySelector('.calculator-body');
const mainContent = document.querySelector('.main-content');
const menuPanel = document.querySelector('.menu-panel');

// Views and Menu Panels
const historyContent = document.querySelector('.history-content');
const menuContent = document.querySelector('.menu-content'); // TEN ELEMENT OTRZYMA KLASĘ
const converterContent = document.querySelector('.converter-content'); 
const converterModeBody = document.querySelector('.converter-mode-body'); 
const dateCalcBody = document.querySelector('.date-calculator-body');
const menuItems = document.querySelector(".menu-items"); // TEN ELEMENT OTRZYMA KLASĘ

// Display Fields
const inputField = document.getElementById('input');
const resultField = document.getElementById('result');

// Buttons and Navigation Links
const historyLink = document.getElementById('history-link');
const scientificLink = document.getElementById('scientific-link');
const programmingLink = document.getElementById('programming-link');
const converterLink = document.getElementById('converter-link'); 
const dateLink = document.getElementById('date-link');

// History Elements
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Icons
const hamburgerIcon = document.querySelector('.hamburger-icon');
const backIcon = document.getElementById('back-to-calc'); // The ID in HTML must be 'back-to-calc'

/**
 * ========================================
 * 3. SMOOTH SCROLLBAR MANAGEMENT
 * ========================================
 */

// Function to get the Smooth Scrollbar instance
const getHistoryScrollbar = () => {
    // The scrollbar is initialized on this element in animation.js
    const scrollContainer = document.querySelector('.js-scroll-list'); 
    
    // We use the global get() method to retrieve the instance
    if (window.Scrollbar && scrollContainer) {
        return window.Scrollbar.get(scrollContainer);
    }
    return null;
};

// Function to force Smooth Scrollbar update and fix mouse scrolling.
const updateHistoryScrollbar = (scrollToTop = false) => {
    const historyScrollbarInstance = getHistoryScrollbar();
    
    if (historyScrollbarInstance) {
        // Force recalculation of container sizes
        historyScrollbarInstance.update(); 
        
        // Optional: Scroll to the very top
        if (scrollToTop) {
            historyScrollbarInstance.scrollTo(0, 0, 300);
        }
    } else {
        // console.warn('Smooth Scrollbar: Instance not found. Check if animation.js is working correctly.');
    }
};

/**
 * ========================================
 * 4. DATA AND KEY MAPPING (DATA MODELS)
 * ========================================
 */
const PROGRAMMING_ALLOWED_KEYS = {
    'hex': '0123456789abcdef', 
    'dec': '0123456789',
    'oct': '01234567',
    'bin': '01'
};
const SCIENTIFIC_ALLOWED_CHARS = ['(', ')', '^', 'p', 'i', 'e', 's', 'c', 't', 'l', 'o', 'g', 'n', 'h', 'a', 'd', 'r', '!', '%', '|'];
const DISPLAY_OPERATOR_MAP = {'*': '×', '/': '÷'};


/**
 * ========================================
 * 5. HISTORY & DATA LOGIC (HISTORY & DATA LOGIC)
 * ========================================
 */
const loadHistory = () => {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) {
        history = JSON.parse(storedHistory);
    }
};

const saveHistory = () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

const formatResult = (result) => {
    if (typeof result === 'number' && !Number.isFinite(result)) {
        return '0';
    }
    const resultString = result.toString();
    if (resultString.length > 15 && resultString.includes('.')) {
        return parseFloat(result).toExponential(8);
    }
    if (resultString.length > 15) {
        return parseFloat(result).toPrecision(15).toString();
    }
    return result;
};

const addToHistory = (expression, result) => {
    const formattedResult = formatResult(result);
    history.push({ expression, result: formattedResult });
    if (history.length > 200) { 
        history.shift(); 
    }
    saveHistory();
    // Update scrollbar because a new element has been added
    updateHistoryScrollbar(); 
};

const displayHistory = () => {
    historyList.innerHTML = '';
    const historyToShow = [...history].reverse();

    // Visibility control for the "Clear History" button
    clearHistoryBtn.style.display = historyToShow.length === 0 ? 'none' : 'block';

    historyToShow.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('history-item'); 
        li.innerHTML = `<span class="expression">${item.expression}</span><br><span class="result">${item.result}</span>`;
        historyList.appendChild(li);
        
        // KEY: Restore the history entry to the calculator
        li.addEventListener('click', () => {
            updateDisplay(item.result);
            switchMenuPanelContent('main'); // Return to the main menu view
            toggleMenu(false); // Closes the menu after selecting an element
        });
    });
    
    // Ensure that after displaying history, the scroll is at the top 
    updateHistoryScrollbar(true); 
};

const clearHistory = () => {
    history = [];
    saveHistory();
    displayHistory();
};

const convertNumber = (value, fromMode, toMode) => {
    if (typeof value !== 'string') value = value.toString();
    value = value.replace(/\s/g, '');
    if (value === '') return '0';
    let base;
    switch (fromMode) {
        case 'bin': base = 2; break;
        case 'oct': base = 8; break;
        case 'hex': base = 16; break;
        case 'dec': default: base = 10; break;
    }
    decValue = parseInt(value, base);
    if (isNaN(decValue)) return 'Error';
    decValue = decValue | 0;

    let result;
    switch (toMode) {
        case 'bin': result = (decValue >>> 0).toString(2); break;
        case 'oct': result = (decValue >>> 0).toString(8); break;
        case 'hex': result = (decValue >>> 0).toString(16).toUpperCase(); break;
        case 'dec': default: result = decValue.toString(10); break;
    }
    return result;
};


/**
 * ========================================
 * 6. EXPRESSION EVALUATION LOGIC
 * ========================================
 */
const evaluateProgrammingExpression = (expression) => {
    try {
        const parts = expression.split(/([+\-×÷/]|mod|AND|OR|XOR|<<|>>)/i).filter(Boolean).map(p => p.trim());
        if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) { return '0'; }
        if (parts.length === 1) {
            const decResult = convertNumber(parts[0], currentMode, 'dec');
            return convertNumber(decResult, 'dec', currentMode);
        }
        
        const operatorIndex = parts.findIndex(p => ['+', '-', '×', '÷', '/', 'MOD', 'AND', 'OR', 'XOR', '<<', '>>'].includes(p.toUpperCase()));
        if (operatorIndex <= 0 || operatorIndex + 1 >= parts.length) {
            return convertNumber(parts[0], currentMode, currentMode);
        }
        
        const operator = parts[operatorIndex].toUpperCase();
        const num1Str = parts[0].replace('×', '*').replace('÷', '/');
        const num2Str = parts[operatorIndex + 1].replace('×', '*').replace('÷', '/');
        const num1 = parseInt(convertNumber(num1Str, currentMode, 'dec'), 10) || 0;
        const num2 = parseInt(convertNumber(num2Str, currentMode, 'dec'), 10) || 0;

        let result;
        switch (operator) {
            case '+': result = num1 + num2; break;
            case '-': result = num1 - num2; break;
            case '×':
            case '*': result = num1 * num2; break;
            case '÷':
            case '/': result = num2 === 0 ? NaN : Math.trunc(num1 / num2); break;
            case 'MOD': case '%': result = num1 % num2; break;
            case 'AND': result = num1 & num2; break;
            case 'OR': result = num1 | num2; break;
            case 'XOR': result = num1 ^ num2; break;
            case '<<': result = num1 << num2; break;
            case '>>': result = num1 >> num2; break;
            default: return 'Error';
        }
        if (!Number.isFinite(result)) { return 'Error'; }
        return convertNumber(result.toString(), 'dec', currentMode);
    } catch (error) {
        return 'Error';
    }
};

const isPartialScientificFunction = (expression) => {
    const trimmed = expression.trim();
    if (trimmed === '' || trimmed === '0') return false;

    // Simple check: does it end with an operator or an open parenthesis
    const operators = ['+', '-', '×', '÷', '/', '*', '^', '%', 'mod'];
    const lastChar = trimmed.slice(-1);
    if (operators.includes(lastChar) || /\($/.test(trimmed)) return true; 

    // Check for incomplete functions (e.g., just 'sin' or 'log(')
    if (/(?:sin|cos|tan|log|ln|10\^|2√|3√)$/i.test(trimmed)) return true;

    return false;
};

const evaluateExpression = (expression) => {
    if (mainContent.classList.contains('programming-mode')) {
        return evaluateProgrammingExpression(expression);
    }
    
    // Prevent errors resulting from incomplete scientific functions
    if (mainContent.classList.contains('scientific-mode') && isPartialScientificFunction(expression)) {
        return 'PARTIAL_FUNCTION';
    }

    try {
        let cleanedExpression = expression
             .replace(/x/g, '*')
             .replace(/×/g, '*')
             .replace(/÷/g, '/')
             .replace(/mod/g, '%')
             .replace(/pi/gi, 'Math.PI') 
             .replace(/e/gi, 'Math.E')  
             .replace(/sin\(/gi, 'Math.sin(') 
             .replace(/cos\(/gi, 'Math.cos(')
             .replace(/tan\(/gi, 'Math.tan(')
             .replace(/log\(/gi, 'Math.log10(') 
             .replace(/ln\(/gi, 'Math.log(') 
             .replace(/10\^/g, 'Math.pow(10,')
             .replace(/2√\(/g, 'Math.sqrt(')
             .replace(/3√\(/g, 'Math.cbrt(')
             .replace(/\|/g, 'Math.abs(')
             .replace(/\^/g, '**'); 
             
        cleanedExpression = cleanedExpression.replace(/(\d+)\!/g, (match, n) => {
            const num = parseInt(n);
            if (num < 0 || !Number.isInteger(num)) return `NaN`;
            let result = 1;
            for (let i = 2; i <= num; i++) result *= i;
            return result.toString();
        });
        
        if (cleanedExpression.trim() === '') {
            return 0;
        }

        const result = new Function(`return ${cleanedExpression}`)();
        return result;
    } catch (error) {
        return NaN;
    }
};


/**
 * ========================================
 * 7. USER INTERFACE AND VIEW LOGIC (KEY FIX SECTION)
 * ========================================
 */
const updateProgrammingButtonState = (mode) => {
    const allNumericButtons = document.querySelectorAll(
        '.programming-buttons button[data-val], .normal-buttons button[data-val]'
    );
    
    const allowedDigits = PROGRAMMING_ALLOWED_KEYS;

    allNumericButtons.forEach(button => {
        const val = button.dataset.val ? button.dataset.val.toLowerCase() : '';
        
        if (val === '' || button.dataset.op || button.dataset.fn) return;

        if (val === '.') {
            button.setAttribute('disabled', 'disabled');
            button.classList.add('disabled-mode');
            return;
        }

        if (val.length === 1) {
            if (allowedDigits[mode].includes(val)) {
                button.removeAttribute('disabled');
                button.classList.remove('disabled-mode');
            } else {
                button.setAttribute('disabled', 'disabled');
                button.classList.add('disabled-mode');
            }
        }
    });
};

const updateDisplay = (value) => {
    inputField.value = value;
    resultField.style.visibility = 'visible';

    if (value === '') {
        resultField.innerText = '0';
        return;
    }
    
    if (mainContent.classList.contains('programming-mode')) {
        const result = evaluateProgrammingExpression(value);
        resultField.innerText = result !== 'Error' ? result : 'Error';
        return;
    }
    
    const result = evaluateExpression(value);
    
    if (result === 'PARTIAL_FUNCTION') {
        resultField.innerText = '0';
        return;
    }

    if (Number.isFinite(result) || (typeof result === 'string' && result !== 'Error')) {
        resultField.innerText = formatResult(result);
    } else {
        resultField.innerText = '';
    }
};

const toggleMenu = (active) => {
    if (active === undefined) {
        mainContent.classList.toggle('active'); 
        menuPanel.classList.toggle('active');
    } else {
        if (active) {
            mainContent.classList.add('active');
            menuPanel.classList.add('active');
        } else {
            mainContent.classList.remove('active');
            menuPanel.classList.remove('active');
            // Remove the active-panel class from all panels when closing the menu
            [menuContent, historyContent, converterContent].forEach(panel => {
                if (panel) panel.classList.remove('active-panel');
            });
            clearHistoryBtn.style.display = 'none'; // Hide history button when closing
        }
    }
    
    // Key fix: refresh Scrollbar when the menu opens/closes
    updateHistoryScrollbar(); 
    
    // After changing the menu state, update icon visibility.
    let currentView = 'calculator';
    if (converterModeBody.style.display === 'flex') {
        currentView = 'converterBody';
    } else if (dateCalcBody.style.display === 'flex') {
        currentView = 'dateCalculator';
    }
    switchMainView(currentView);
};

// 🏆 ZMIANA: Dodajemy zarządzanie klasami dla menu-items ORAZ menuContent
const toggleCalculatorModes = (mode) => {
    ['scientific', 'programming'].forEach(m => {
        mainContent.classList.remove(`${m}-mode`);
        calculatorBody.classList.remove(`${m}-mode`);
        // USUŃ: klasę aktywnego trybu z kontenerów menu
        if (menuItems) {
            menuItems.classList.remove(`${m}-active`); 
        }
        if (menuContent) { // DODANE: Usuń klasę z menuContent
            menuContent.classList.remove(`${m}-active`);
        }
    });

    if (mode !== 'normal') {
        mainContent.classList.add(`${mode}-mode`);
        calculatorBody.classList.add(`${mode}-mode`);
        // DODAJ: klasę aktywnego trybu do kontenerów menu
        if (menuItems) {
            menuItems.classList.add(`${mode}-active`);
        }
        if (menuContent) { // DODANE: Dodaj klasę do menuContent
            menuContent.classList.add(`${mode}-active`);
        }
    }
};

/**
 * 💡 KEY CHANGE: Instead of manipulating style.display, we use CSS classes 'active-panel'.
 * This allows CSS (opacity/pointer-events) to control visibility and animations.
 */
const switchMenuPanelContent = (panelName) => {
    // List of all panels to switch
    const allPanels = [menuContent, historyContent, converterContent];
    
    // 1. Remove the 'active-panel' class from all panels
    allPanels.forEach(panel => {
        if (panel) {
            panel.classList.remove('active-panel'); 
            // Optional: Ensure that inline 'display' style does not conflict, if it was previously set
            panel.style.display = ''; 
        }
    });
    
    // Reset the "Clear History" button state
    clearHistoryBtn.style.display = 'none';

    const targetPanel = {
        'main': menuContent,
        'history': historyContent,
        'converters': converterContent 
    }[panelName];

    // 2. Add the 'active-panel' class to the selected panel
    if (targetPanel) {
        targetPanel.classList.add('active-panel'); 
    }
    
    if (panelName === 'history') {
        displayHistory();
        // KEY: Force Smooth Scrollbar update to correctly handle the list
        updateHistoryScrollbar(); 
    } 
};

const switchMainView = (viewName) => {
    const views = {
        'calculator': calculatorBody,
        'converterBody': converterModeBody,
        'dateCalculator': dateCalcBody,
    };

    // Ensure all main views are hidden
    Object.values(views).forEach(view => {
        // We use style.display for main views (outside the menu), which is correct
        if (view) view.style.display = 'none';
    });
    
    const targetView = views[viewName];
    if (targetView) {
        // Show only the selected view
        targetView.style.display = (viewName === 'calculator' ? 'grid' : 'flex');
    }
    
    // Logic for displaying icons (arrow vs hamburger)
    const menuActive = menuPanel.classList.contains('active');
    
    // Show arrow if menu is open OR view is full-screen (outside menu)
    const showBackIcon = menuActive || viewName === 'converterBody' || viewName === 'dateCalculator';
    
    // Show Hamburger if menu is closed AND view is the main calculator
    const showHamburgerIcon = !menuActive && viewName === 'calculator';

    // Update icons
    backIcon.style.opacity = showBackIcon ? '1' : '0';
    backIcon.style.visibility = showBackIcon ? 'visible' : 'hidden';
    
    hamburgerIcon.style.opacity = showHamburgerIcon ? '1' : '0';
    hamburgerIcon.style.visibility = showHamburgerIcon ? 'visible' : 'hidden';
};


/**
 * ========================================
 * 8. BUTTON EVENT HANDLERS (EVENT HANDLERS)
 * ========================================
 */
const handleButtonClick = (event) => {
    const button = event.target;
    if (button.hasAttribute('disabled') || button.classList.contains('disabled-mode')) {
        return;
    }

    const buttonValue = button.dataset.op || button.dataset.val || button.innerText;
    let currentInput = inputField.value;
    const operators = ['+', '-', '×', '÷', '%']; 
    const isOperator = operators.includes(buttonValue);
    const lastCharIsOperator = operators.includes(currentInput.slice(-1));
    const isFunction = button.dataset.fn;
    const isScientificMode = mainContent.classList.contains('scientific-mode');


    if ((buttonValue === '÷' || buttonValue === '×' || buttonValue === '%') && (currentInput === '' || lastCharIsOperator)) {
        return;
    }
    if (isOperator && lastCharIsOperator) {
        currentInput = currentInput.slice(0, -1) + buttonValue;
        updateDisplay(currentInput);
        return;
    }

    if (buttonValue === '.') {
        const parts = currentInput.split(/[\+\-×÷%]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) return;
    }

    if (isFunction) {
        switch (isFunction) {
            case 'AC': 
                updateDisplay('');
                lastOperationWasEquals = false;
                return;
            case 'equals': // =
                const result = evaluateExpression(currentInput);
                const finalResult = (result === 'PARTIAL_FUNCTION' || !Number.isFinite(result)) ? 'Error' : result.toString();
                
                if (finalResult !== 'Error') {
                    addToHistory(currentInput, finalResult); 
                    updateDisplay(finalResult);
                    resultField.style.visibility = 'visible';
                    lastOperationWasEquals = true;
                } else {
                    updateDisplay('Error');
                    resultField.innerText = '';
                }
                return;
            case 'backspace': 
                updateDisplay(currentInput.slice(0, -1));
                return;
            case 'plus-minus': 
                if (currentInput.startsWith('-')) {
                    updateDisplay(currentInput.substring(1));
                } else if (currentInput !== '') {
                    updateDisplay('-' + currentInput);
                }
                return;
            default:
                break;
        }
    }
    
    if (isScientificMode && button.dataset.sci) {
        let valueToAdd = button.dataset.sci;
        
        if (valueToAdd === '10x') {
            valueToAdd = '10^(';
        } else if (valueToAdd === '2√x') {
            valueToAdd = '2√(';
        } else if (valueToAdd === '3√x') {
            valueToAdd = '3√(';
        } else if (valueToAdd === 'x^y') {
            valueToAdd = '^';
        } else if (valueToAdd === 'x^2') {
            valueToAdd = '^2';
        } else if (valueToAdd === '|x|') {
            valueToAdd = '|';
        } else if (!valueToAdd.includes('(') && !valueToAdd.includes('^') && !valueToAdd.includes('!')) { 
            valueToAdd += '(';
        }

        if (lastOperationWasEquals) {
            currentInput = valueToAdd;
            lastOperationWasEquals = false;
        } else {
            currentInput += valueToAdd;
        }
        updateDisplay(currentInput);
        return;
    }

    if (lastOperationWasEquals) {
        if (isOperator || button.dataset.op) {
            currentInput = inputField.value + buttonValue;
            lastOperationWasEquals = false;
        } else {
            currentInput = buttonValue;
            lastOperationWasEquals = false;
        }
    } else {
        currentInput += buttonValue;
    }

    updateDisplay(currentInput);
};

const handleProgrammingButtonClick = (event) => {
    const button = event.target;
    const mode = button.dataset.mode;
    const value = button.dataset.bit || button.dataset.val || button.dataset.op;

    if (button.hasAttribute('disabled') || button.classList.contains('disabled-mode')) {
        return;
    }

    if (mode) { // Mode change (DEC/HEX/OCT/BIN)
        const oldMode = currentMode;
        currentMode = mode;

        const valueToConvert = lastOperationWasEquals ? resultField.innerText : inputField.value;
        const converted = convertNumber(valueToConvert, oldMode, currentMode);
        
        inputField.value = converted;
        updateDisplay(converted);
        lastOperationWasEquals = false; 

        document.querySelectorAll('.program-mode').forEach(btn => btn.classList.remove('active-mode'));
        button.classList.add('active-mode');

        updateProgrammingButtonState(currentMode); 

    } else if (button.dataset.fn === 'equals') {
        const result = evaluateProgrammingExpression(inputField.value);
        if (result !== 'Error') {
            addToHistory(inputField.value, result);
            updateDisplay(result.toString());
            resultField.innerText = result; 
            resultField.style.visibility = 'visible';
            lastOperationWasEquals = true;
        } else {
            inputField.value = ''; 
            resultField.innerText = 'Error';
            updateDisplay(inputField.value); 
        }
        return;
    } else if (button.dataset.fn) {
        handleButtonClick(event);
        return;
    } 
    
    else { // Value/operator input
        let currentInput = inputField.value;
        const operators = ['AND', 'OR', 'XOR', '<<', '>>', '+', '-', '×', '÷', 'MOD'];
        const isOperator = operators.includes(value.toUpperCase());
        
        if (lastOperationWasEquals) {
            if (isOperator) {
                currentInput = resultField.innerText;
            } else {
                currentInput = '';
            }
            lastOperationWasEquals = false;
        }
        
        const lastCharIsOperator = operators.some(op => currentInput.trim().endsWith(op));

        if (isOperator) {
            const opToAppend = value.toUpperCase();
            if (lastCharIsOperator) {
                   const lastOp = operators.find(op => currentInput.trim().endsWith(op));
                   if (lastOp) {
                        currentInput = currentInput.slice(0, currentInput.lastIndexOf(lastOp)) + ' ' + opToAppend + ' ';
                   } else {
                        currentInput += ' ' + opToAppend + ' ';
                   }
            } else {
                currentInput += ' ' + opToAppend + ' '; 
            }
        } 
        else {
            currentInput += value;
        }
        
        currentInput = currentInput.replace(/\s+/g, ' ').trim();

        updateDisplay(currentInput);
    }
};

const handleKeyboardInput = (event) => {
    const key = event.key;
    const currentInput = inputField.value;
    const isProgrammingMode = mainContent.classList.contains('programming-mode');
    const isScientificMode = mainContent.classList.contains('scientific-mode');
    
    const isCalculatorViewActive = calculatorBody.style.display === 'grid'; // We use 'grid' because switchMainView sets it this way for the calculator
    if (!isCalculatorViewActive) { return; }
    
    // Handle Backspace
    if (key === 'Backspace') {
        event.preventDefault(); 
        if (currentInput.length > 0) {
            updateDisplay(currentInput.slice(0, -1));
        }
        return;
    }

    // Handle Enter / Equals
    if (key === 'Enter' || key === '=') {
        event.preventDefault();
        const result = evaluateExpression(currentInput);
        const finalResult = (result === 'PARTIAL_FUNCTION' || !Number.isFinite(result)) ? 'Error' : result.toString();

        if (finalResult !== 'Error') {
            addToHistory(currentInput, finalResult);
            updateDisplay(finalResult);
            resultField.style.visibility = 'visible';
            lastOperationWasEquals = true;
        }
        return;
    }

    // Handle numeric and operators (+, -, *, /)
    const isOperator = ['+', '-', '*', '/'].includes(key);
    const isDot = key === '.';
    const isDigit = /^[0-9]$/.test(key);

    if (isOperator || isDot || isDigit) {
        event.preventDefault();
        let valueToAppend = key;

        if (isProgrammingMode) {
            if (isDot) return; 
            const allowed = PROGRAMMING_ALLOWED_KEYS[currentMode];
            if (isDigit && !allowed.includes(key)) return; 
            
            valueToAppend = DISPLAY_OPERATOR_MAP[key] || key;
            
            if (isOperator) {
                let currentInput = inputField.value;
                const programmingOperators = ['AND', 'OR', 'XOR', '<<', '>>', '+', '-', '×', '÷', 'MOD'];
                const lastCharIsOperator = programmingOperators.some(pOp => currentInput.trim().endsWith(pOp));
                
                if (lastCharIsOperator) {
                    const lastOp = programmingOperators.find(pOp => currentInput.trim().endsWith(pOp));
                    currentInput = currentInput.slice(0, currentInput.lastIndexOf(lastOp)) + ' ' + valueToAppend + ' ';
                } else {
                    currentInput += ' ' + valueToAppend + ' ';
                }
                updateDisplay(currentInput.replace(/\s+/g, ' ').trim());
                return;
            }
        } else {
            valueToAppend = DISPLAY_OPERATOR_MAP[key] || key;
            if (isDot) {
                const parts = inputField.value.split(/[\+\-×÷%]/);
                const lastPart = parts[parts.length - 1];
                if (lastPart.includes('.')) return;
            }
        }
        
        let newValue = inputField.value;
        if (lastOperationWasEquals && !isOperator) {
            newValue = '';
            lastOperationWasEquals = false;
        } else if (lastOperationWasEquals && isOperator) {
            newValue = resultField.innerText;
            lastOperationWasEquals = false;
        }
        
        newValue += valueToAppend;
        updateDisplay(newValue);
        return;
    }
    
    // Handle scientific keys
    if (isScientificMode) {
        const isScientificChar = SCIENTIFIC_ALLOWED_CHARS.includes(key.toLowerCase());
        
        if (isScientificChar) {
            event.preventDefault();
            let valueToAppend = key;
            
            let newValue = inputField.value;
            if (lastOperationWasEquals) {
                newValue = valueToAppend;
                lastOperationWasEquals = false;
            } else {
                newValue += valueToAppend;
            }
            updateDisplay(newValue);
            return;
        }
    }
    
    // Block other input keys
    const isLetter = /^[a-zA-Z]$/.test(key);
    if (isLetter && !isScientificMode && !isProgrammingMode) {
        event.preventDefault();
    }
};


/**
 * ========================================
 * 9. INITIALIZATION (INITIALIZATION)
 * ========================================
 */
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();

    // --- Assign events to calculator buttons ---
    document.querySelectorAll('.normal-buttons button, .scientific-buttons button').forEach(button => {
        button.addEventListener('click', handleButtonClick);
    });

    document.querySelectorAll('.programming-buttons button').forEach(button => {
        button.addEventListener('click', handleProgrammingButtonClick);
    });

    // --- Keyboard handling ---
    document.addEventListener('keydown', handleKeyboardInput);
    
    inputField.addEventListener('input', () => {
        updateDisplay(inputField.value);
    });
    
    // --- NAVIGATION HANDLING (FIXED) ---
    
    hamburgerIcon.addEventListener('click', () => {
        toggleMenu(true);
        switchMenuPanelContent('main'); 
    });

    // 💡 KEY CHANGE: BACK_ICON logic was changed to check the 'active-panel' class.
    backIcon.addEventListener('click', () => {
        // 1. If Menu is open
        if (menuPanel.classList.contains('active')) {
            
            // Check which panel is currently visible by checking the CSS CLASS
            const isHistoryVisible = historyContent.classList.contains('active-panel');
            const isConvertersVisible = converterContent.classList.contains('active-panel');
            const isMainMenuVisible = menuContent.classList.contains('active-panel');

            // If we are in History or Converters, return to the Main Menu List
            if (isHistoryVisible || isConvertersVisible) {
                switchMenuPanelContent('main');
            } 
            // If we are on the Main Menu List, close it
            else if (isMainMenuVisible) {
                toggleMenu(false); // Closes the menu, which leads to switchMainView('calculator')
            }
        } 
        // 2. If Menu is closed, but we are in full-screen mode (Converter/Date)
        else if (converterModeBody.style.display === 'flex' || dateCalcBody.style.display === 'flex') {
            switchMainView('calculator'); // Return to the main calculator
        }
    });

    // Side Menu Links
    historyLink.addEventListener('click', (event) => {
        event.preventDefault();
        toggleMenu(true); 
        switchMenuPanelContent('history'); 
    });

    // 🏆 ZMIANA: Przełączanie trybu naukowego i zarządzanie stylem menu
    scientificLink.addEventListener('click', (event) => {
        event.preventDefault();
        
        const isCurrentlyScientific = mainContent.classList.contains('scientific-mode');
        const newMode = isCurrentlyScientific ? 'normal' : 'scientific';
        
        // Zaktualizuj tryb i klasy na kontenerach menu
        toggleCalculatorModes(newMode); 
        
        // Zarządzaj aktywnym stylem linków w menu
        document.querySelectorAll('.menu-items a').forEach(link => link.classList.remove('link-active'));
        if (newMode === 'scientific') {
            scientificLink.classList.add('link-active');
        }

        toggleMenu(false);
        updateDisplay('');
        switchMainView('calculator');
    });

    // 🏆 ZMIANA: Przełączanie trybu programisty i zarządzanie stylem menu
    programmingLink.addEventListener('click', (event) => {
        event.preventDefault();
        
        const isCurrentlyProgramming = mainContent.classList.contains('programming-mode');
        const newMode = isCurrentlyProgramming ? 'normal' : 'programming';

        // Zaktualizuj tryb i klasy na kontenerach menu
        toggleCalculatorModes(newMode);

        // Zarządzaj aktywnym stylem linków w menu
        document.querySelectorAll('.menu-items a').forEach(link => link.classList.remove('link-active'));
        if (newMode === 'programming') {
            programmingLink.classList.add('link-active');
        }
        
        // Logika ustawiania trybu DEC jako domyślnego dla kalkulatora programisty
        if (newMode === 'programming') {
            currentMode = 'dec';
            document.querySelectorAll('.program-mode').forEach(btn => btn.classList.remove('active-mode'));
            const decButton = document.querySelector('.programming-buttons [data-mode="dec"]');
            if(decButton) {
                decButton.classList.add('active-mode');
            }
            updateProgrammingButtonState(currentMode); 
        }

        toggleMenu(false);
        updateDisplay('');
        switchMainView('calculator');
    });

    converterLink.addEventListener('click', (event) => {
        event.preventDefault();
        toggleMenu(true); 
        switchMenuPanelContent('converters'); 
    });
    
    document.querySelectorAll('.converter-content a[data-converter-type]').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            toggleMenu(false);
            switchMainView('converterBody');
        });
    });

    // 🏆 CHANGE INTRODUCED HERE: Switching between Date Calculator and Normal mode
    dateLink.addEventListener('click', (event) => {
        event.preventDefault();
        toggleMenu(false);
        
        // Check if the date calculator view is already active
        if (dateCalcBody.style.display === 'flex') {
            // If YES, return to the main calculator ('calculator')
            switchMainView('calculator');
        } else {
            // If NO, switch to the Date Calculator
            switchMainView('dateCalculator');
        }
    });

    clearHistoryBtn.addEventListener('click', clearHistory);
    
    // --- Initial settings ---
    switchMainView('calculator');
    updateDisplay(''); 
});