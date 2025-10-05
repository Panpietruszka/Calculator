// converters.js

document.addEventListener('DOMContentLoaded', () => {
    // ===============================================
    // 1. UNIVERSAL HELPER FUNCTIONS AND TOOLS
    // ===============================================

    /**
     * Normalizes the value from the input field (replaces comma with dot) and returns a number.
     * Also prevents multiple decimal separators.
     */
    const getAndNormalizeValue = (inputElement) => {
        let rawValue = inputElement.value;
        let normalizedValue = rawValue.replace(/,/g, '.');

        // Logic to prevent multiple decimal separators
        const parts = normalizedValue.split('.');
        if (parts.length > 2) {
            normalizedValue = parts[0] + '.' + parts.slice(1).join('');
            // Correct the input, displaying the comma, but normalizing internally
            inputElement.value = normalizedValue.replace(/\./g, ',');
        }

        return parseFloat(normalizedValue);
    };

    /**
     * Always displays a comma as the decimal separator after input.
     */
    const handleInputCorrection = (e) => {
        let value = e.target.value;
        value = value.replace(/\./g, ','); // Always display comma
        e.target.value = value;
    };

    /**
     * Gets the selected unit from the custom select element.
     * @param {HTMLElement} customSelectElement - The custom select container element.
     * @returns {string} The unit code (e.g., 'USD', 'cm').
     */
    const getSelectedUnit = (customSelectElement) => {
        return customSelectElement.querySelector('.select-selected').getAttribute('data-value');
    };

    /**
     * Unified result formatting: uses a comma, removes unnecessary zeros, limits precision.
     * @param {number} value - The numerical value to format.
     * @param {number} maxDecimals - Maximum number of decimal places.
     * @returns {string} The formatted string.
     */
    const formatResult = (value, maxDecimals = 10) => {
        if (isNaN(value) || !isFinite(value)) return '';
        // Use toFixed(maxDecimals) to ensure accuracy, then remove trailing zeros.
        const fixedValue = value.toFixed(maxDecimals);
        return fixedValue.replace(/\.?0+$/, '').replace('.', ',');
    };
    
    // --- Helper for creating select options ---
    function createCustomSelectOption(currencyCode, fullName) {
        const optionDiv = document.createElement('div');
        optionDiv.textContent = `${currencyCode} - ${fullName}`;
        optionDiv.setAttribute('data-value', currencyCode);
        return optionDiv;
    }
    
    function closeAllSelects(element) {
        document.querySelectorAll('.select-items').forEach(item => {
            if (item !== element) {
                item.classList.add('select-hide');
            }
        });
    }

    // ===============================================
    // 2. CURRENCY - VARIABLES AND LOGIC
    // ===============================================

    const fromCurrencyInput = document.getElementById('from-currency-input');
    const toCurrencyInput = document.getElementById('to-currency-input');
    const swapIcon = document.getElementById('swap-icon');

    const customFromSelect = document.getElementById('custom-from-currency-select');
    const customToSelect = document.getElementById('custom-to-currency-select');

    let currencyRates = {};
    let currencyNames = {};
    
    // NOTE: API Key is exposed here, ideally it should be handled securely on a backend.
    const API_KEY = 'cur_live_CiqwjmGkZBQymSUajcRxjV36ByEEQcBVhmWXBDAK'; 
    const NBP_RATES_URL = `https://api.nbp.pl/api/exchangerates/tables/A/?format=json`;
    const RATES_URL = `https://api.currencyapi.com/v3/latest?apikey=${API_KEY}`;
    const CURRENCIES_URL = `https://api.currencyapi.com/v3/currencies?apikey=${API_KEY}`;

    const MAX_OPTIONS_HEIGHT = 250;

    const STORAGE_KEY_FROM = 'converterFromCurrency';
    const STORAGE_KEY_TO = 'converterToCurrency';
    
    const saveCurrenciesToStorage = () => {
        const fromCurrecy = customFromSelect.querySelector('.select-selected').getAttribute('data-value');
        const toCurrecy = customToSelect.querySelector('.select-selected').getAttribute('data-value');
        localStorage.setItem(STORAGE_KEY_FROM, fromCurrecy);
        localStorage.setItem(STORAGE_KEY_TO, toCurrecy);
    };

    const loadCurrenciesFromStorage = () => {
        const defaulFrom = customFromSelect.querySelector('.select-selected')?.getAttribute('data-value') || 'USD';
        const defaulTo = customToSelect.querySelector('.select-selected')?.getAttribute('data-value') || 'PLN';
        return {
            from: localStorage.getItem(STORAGE_KEY_FROM) || defaulFrom,
            to: localStorage.getItem(STORAGE_KEY_TO) || defaulTo
        };
    };

    const updateCustomSelectDisplay = (selectElement, currencyCode, currencyName) => {
        const selectedDiv = selectElement.querySelector('.select-selected');
        const fullName = currencyName || currencyNames[currencyCode] || currencyCode;
        if (selectedDiv) {
             selectedDiv.textContent = `${currencyCode} - ${fullName}`;
             selectedDiv.setAttribute('data-value', currencyCode);
        }
    };
    
    const populateCustomSelects = () => {
        const fromItemsContainer = customFromSelect.querySelector('.select-items');
        const toItemsContainer = customToSelect.querySelector('.select-items');

        fromItemsContainer.innerHTML = '';
        toItemsContainer.innerHTML = '';

        const sortedCurrencies = Object.keys(currencyRates).sort();

        const savedCurrencies = loadCurrenciesFromStorage();

        sortedCurrencies.forEach(currency => {
            const fullName = currencyNames[currency] || currency;

            const optionFrom = createCustomSelectOption(currency, fullName);
            fromItemsContainer.appendChild(optionFrom);

            const optionTo = createCustomSelectOption(currency, fullName);
            toItemsContainer.appendChild(optionTo);
        });

        updateCustomSelectDisplay(customFromSelect, savedCurrencies.from);
        updateCustomSelectDisplay(customToSelect, savedCurrencies.to);

        window.convertFromTo();
    };
    
    // Unified Custom Select click handler, updated to support other converters
    function handleCustomSelectClick(customSelectElement, converterType, conversionFunction) {
        const selectedDiv = customSelectElement.querySelector('.select-selected');
        const itemsDiv = customSelectElement.querySelector('.select-items');
        
        selectedDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (itemsDiv.classList.contains('select-hide')) {
                if (customSelectElement.classList.contains('select-opens-up')) {
                    const rect = customSelectElement.getBoundingClientRect();
                    const spaceAbove = rect.top;
                    itemsDiv.style.maxHeight = `${Math.min(spaceAbove - 30, MAX_OPTIONS_HEIGHT)}px`;
                } else {
                    itemsDiv.style.maxHeight = `${MAX_OPTIONS_HEIGHT}px`; 
                }
            }

            closeAllSelects(itemsDiv); 
            itemsDiv.classList.toggle('select-hide');
        });

        itemsDiv.addEventListener('click', (e) => {
            const clickedOption = e.target.closest('div[data-value]');
            if (clickedOption) {
                const newValue = clickedOption.getAttribute('data-value');
                const newText = clickedOption.textContent;
                
                if (selectedDiv.getAttribute('data-value') !== newValue) {
                    selectedDiv.textContent = newText;
                    selectedDiv.setAttribute('data-value', newValue);
                    
                    // Save and convert logic for different types
                    const isFromSelect = customSelectElement.id.includes('from');
                    
                    switch (converterType) {
                        case 'currency':
                            saveCurrenciesToStorage();
                            window.convertFromTo();
                            break;
                        case 'length':
                            localStorage.setItem(isFromSelect ? STORAGE_KEY_FROM_LENGTH : STORAGE_KEY_TO_LENGTH, newValue);
                            populateLengthCustomSelects(); 
                            window.performLengthConversion();
                            break;
                        case 'mass':
                            localStorage.setItem(isFromSelect ? STORAGE_KEY_FROM_MASS : STORAGE_KEY_TO_MASS, newValue);
                            populateMassCustomSelects(); 
                            window.performMassConversion();
                            break;
                        case 'temperature':
                            localStorage.setItem(isFromSelect ? STORAGE_KEY_FROM_TEMP : STORAGE_KEY_TO_TEMP, newValue);
                            populateTemperatureCustomSelects();
                            window.performTemperatureConversion();
                            break;
                        case 'volume':
                            localStorage.setItem(isFromSelect ? STORAGE_KEY_FROM_VOLUME : STORAGE_KEY_TO_VOLUME, newValue);
                            populateVolumeCustomSelects();
                            window.performVolumeConversion();
                            break;
                    }
                }

                itemsDiv.classList.add('select-hide');
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            closeAllSelects();
        }
    });

    const normalizeNbpRates = (nbpRates) => {
        const rates = { 'PLN': 1.0 }; 
        nbpRates.forEach(rate => {
            rates[rate.code] = 1 / rate.mid; // NBP rates are PLN/Foreign, we want Foreign/PLN to normalize
        });

        const baseCurrency = 'USD';
        const plnToUsdRate = rates[baseCurrency] || 1.0; 
        
        const normalizedRates = { [baseCurrency]: 1.0 }; 
        normalizedRates['PLN'] = 1 / plnToUsdRate; // PLN rate relative to USD base

        for(const code in rates) {
            // Convert everything to the USD base rate
            normalizedRates[code] = rates[code] / plnToUsdRate;
        }
        
        // Ensure hardcoded English names are present for crucial currencies
        if (!currencyNames['PLN']) currencyNames['PLN'] = 'Polish Złoty';
        if (!currencyNames['USD']) currencyNames['USD'] = 'US Dollar';
        
        return normalizedRates;
    };
    
    // ZMIANA: Usunięto pobieranie polskich nazw walut z NBP
    const getRatesFromNBP = async () => {
        const response = await fetch(NBP_RATES_URL);
        
        if (!response.ok) {
            throw new Error(`NBP HTTP Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0 && data[0].rates) {
            const ratesData = data[0].rates;
            
            // Usunięto:
            // ratesData.forEach(rate => {
            //     currencyNames[rate.code] = rate.currency; // Pobrałoby polskie nazwy!
            // });
            
            return normalizeNbpRates(ratesData);
        } else {
            throw new Error('NBP: Invalid data structure or missing rates.');
        }
    };
    
    const getRatesFromFallback = async () => {
        try {
            console.log('2. Attempting to retrieve rates from fallback CurrencyAPI...');
            const response = await fetch(RATES_URL);
            const data = await response.json();

            if (data.data) {
                const baseCurrency = 'USD';
                const baseRate = data.data[baseCurrency]?.value || 1.0;
                
                currencyRates = { [baseCurrency]: 1.0 };
                
                for(const key in data.data) {
                    // Normalize to USD base
                    currencyRates[key] = (data.data[key].value / baseRate) || 1.0;
                }
                
                console.log('✅ Success: Data retrieved from CurrencyAPI (Fallback).');
                populateCustomSelects();
            } else {
                console.error('Error retrieving rates from fallback API.');
                useDefaultValues();
            }
        } catch (error) {
            console.error('❌ Connection error with fallback API. Using default values.', error);
            useDefaultValues();
        }
    };

    const getExchangeRates = async () => {
        let nbpSuccess = false;
        try {
            console.log('1. Attempting to retrieve rates from NBP API (Primary)...');
            const nbpRates = await getRatesFromNBP();
            
            if (Object.keys(nbpRates).length > 0) {
                currencyRates = nbpRates;
                nbpSuccess = true;
                console.log('✅ Success: Data retrieved from NBP API.');
                populateCustomSelects();
                return;
            }
        } catch (error) {
            console.warn('❌ NBP API Error. Trying fallback API (CurrencyAPI)...', error.message);
        }

        if (!nbpSuccess) {
            await getRatesFromFallback();
        }
    };
    
    // TA FUNKCJA JEST KLUCZOWA: Pobiera angielskie nazwy walut z API.
    const getCurrencyNames = async () => {
        try {
            const response = await fetch(CURRENCIES_URL);
            const data = await response.json();
            
            if (data.data) {
                for (const key in data.data) {
                    currencyNames[key] = data.data[key].name;
                }
                getExchangeRates();
            } else {
                console.error('Error retrieving currency names.');
                getExchangeRates();
            }
        } catch (error) {
            console.error('Connection error with names API:', error);
            getExchangeRates();
        }
    };

    const useDefaultValues = () => {
        currencyRates = {
            // Default rates relative to USD (approximately)
            'PLN': 0.24, 'USD': 1.0, 'EUR': 1.08, 'GBP': 1.25, 
            'CHF': 1.05, 'JPY': 0.0068, 'CZK': 0.043, 'HUF': 0.0028, 'AUD': 0.64
        };
        currencyNames = {
            // Domyślne nazwy są w j. angielskim
            'PLN': 'Polish Złoty', 'USD': 'US Dollar', 'EUR': 'Euro',
            'GBP': 'British Pound', 'CHF': 'Swiss Franc', 'JPY': 'Japanese Yen',
            'CZK': 'Czech Koruna', 'HUF': 'Hungarian Forint', 'AUD': 'Australian Dollar'
        };
        populateCustomSelects();
    };

    // CURRENCY CONVERSION FUNCTIONS (conversion and swap)
    window.convertFromTo = () => {
        const value = getAndNormalizeValue(fromCurrencyInput);
        const fromCurrency = getSelectedUnit(customFromSelect);
        const toCurrency = getSelectedUnit(customToSelect);

        if (!isNaN(value) && value >= 0 && currencyRates[fromCurrency] && currencyRates[toCurrency]) {
            const result = (value * currencyRates[toCurrency]) / currencyRates[fromCurrency];
            toCurrencyInput.value = formatResult(result, 2); // 2 decimal places for currencies
        } else {
            toCurrencyInput.value = '';
        }
    };

    window.convertToFrom = () => {
        const value = getAndNormalizeValue(toCurrencyInput);
        const fromCurrency = getSelectedUnit(customFromSelect);
        const toCurrency = getSelectedUnit(customToSelect);

        if (!isNaN(value) && value >= 0 && currencyRates[fromCurrency] && currencyRates[toCurrency]) {
            const result = (value * currencyRates[fromCurrency]) / currencyRates[toCurrency];
            fromCurrencyInput.value = formatResult(result, 2); // 2 decimal places for currencies
        } else {
            fromCurrencyInput.value = '';
        }
    };
    
    const swapCurrencies = () => {
        const fromSelectedDiv = customFromSelect.querySelector('.select-selected');
        const toSelectedDiv = customToSelect.querySelector('.select-selected');
        
        const tempText = fromSelectedDiv.textContent;
        const tempValue = fromSelectedDiv.getAttribute('data-value');
        
        fromSelectedDiv.textContent = toSelectedDiv.textContent;
        fromSelectedDiv.setAttribute('data-value', toSelectedDiv.getAttribute('data-value'));

        toSelectedDiv.textContent = tempText;
        toSelectedDiv.setAttribute('data-value', tempValue);
        
        saveCurrenciesToStorage();
        window.convertFromTo();
    };


    // ===============================================
    // 3. LENGTH - LOGIC (Factors to Meter)
    // ===============================================
    
    const fromLengthInput = document.getElementById('from-length');
    const toLengthInput = document.getElementById('to-length');
    const customFromSelectLength = document.getElementById('custom-from-length-select');
    const customToSelectLength = document.getElementById('custom-to-length-select');
    const swapIconLength = document.getElementById('swap-icon-length'); 

    const lengthUnits = {
        'km': { name: 'Kilometer', baseFactor: 1000 },
        'm': { name: 'Meter', baseFactor: 1 },
        'cm': { name: 'Centimeter', baseFactor: 0.01 },
        'mm': { name: 'Millimeter', baseFactor: 0.001 },
        'mi': { name: 'Mile', baseFactor: 1609.344 },
        'yd': { name: 'Yard', baseFactor: 0.9144 },
        'ft': { name: 'Foot', baseFactor: 0.3048 },
        'in': { name: 'Inch', baseFactor: 0.0254 },
    };

    const STORAGE_KEY_FROM_LENGTH = 'converterFromLength';
    const STORAGE_KEY_TO_LENGTH = 'converterToLength';
    
    const loadLengthDefaults = () => {
        const savedFrom = localStorage.getItem(STORAGE_KEY_FROM_LENGTH) || 'cm';
        const savedTo = localStorage.getItem(STORAGE_KEY_TO_LENGTH) || 'm';

        if (lengthUnits[savedFrom]) updateLengthCustomSelectDisplay(customFromSelectLength, savedFrom);
        if (lengthUnits[savedTo]) updateLengthCustomSelectDisplay(customToSelectLength, savedTo);
    };
    
    const updateLengthCustomSelectDisplay = (selectElement, unitCode) => {
        const selectedDiv = selectElement.querySelector('.select-selected');
        const fullName = lengthUnits[unitCode] ? lengthUnits[unitCode].name : unitCode;
        if (selectedDiv) {
            selectedDiv.textContent = `${unitCode} - ${fullName}`;
            selectedDiv.setAttribute('data-value', unitCode);
        }
    }
    
    const populateLengthCustomSelects = () => {
        if (!customFromSelectLength || !customToSelectLength) return;
        const fromItemsContainer = customFromSelectLength.querySelector('.select-items');
        const toItemsContainer = customToSelectLength.querySelector('.select-items');
        
        fromItemsContainer.innerHTML = '';
        toItemsContainer.innerHTML = '';

        const sortedUnits = Object.keys(lengthUnits).sort();

        sortedUnits.forEach(code => {
            const fullName = lengthUnits[code].name;

            fromItemsContainer.appendChild(createCustomSelectOption(code, fullName));
            toItemsContainer.appendChild(createCustomSelectOption(code, fullName));
        });
        
        loadLengthDefaults();
        window.performLengthConversion();
    };

    const convertLength = (fromUnitCode, toUnitCode, value) => {
        if (isNaN(value) || !lengthUnits[fromUnitCode] || !lengthUnits[toUnitCode]) return 0;

        const fromUnitFactor = lengthUnits[fromUnitCode].baseFactor;
        const toUnitFactor = lengthUnits[toUnitCode].baseFactor;

        // Formula: Value * (Factor_From / Factor_To)
        return (value * fromUnitFactor) / toUnitFactor;
    };

    window.performLengthConversion = function() {
        const value = getAndNormalizeValue(fromLengthInput);
        const fromUnit = getSelectedUnit(customFromSelectLength);
        const toUnit = getSelectedUnit(customToSelectLength);

        if (!isNaN(value) && value >= 0) {
            const result = convertLength(fromUnit, toUnit, value);
            toLengthInput.value = formatResult(result, 10);
        } else {
            toLengthInput.value = '';
        }
    };
    
    window.performLengthConversionReverse = function() {
        const value = getAndNormalizeValue(toLengthInput);
        const fromUnit = getSelectedUnit(customFromSelectLength);
        const toUnit = getSelectedUnit(customToSelectLength);

        if (!isNaN(value) && value >= 0) {
            const result = convertLength(toUnit, fromUnit, value); // Reversed conversion
            fromLengthInput.value = formatResult(result, 10);
        } else {
            fromLengthInput.value = '';
        }
    };

    const swapLengthUnits = () => {
        const fromSelectedDiv = customFromSelectLength.querySelector('.select-selected');
        const toSelectedDiv = customToSelectLength.querySelector('.select-selected');
        
        const tempText = fromSelectedDiv.textContent;
        const tempValue = fromSelectedDiv.getAttribute('data-value');
        
        fromSelectedDiv.textContent = toSelectedDiv.textContent;
        fromSelectedDiv.setAttribute('data-value', toSelectedDiv.getAttribute('data-value'));

        toSelectedDiv.textContent = tempText;
        toSelectedDiv.setAttribute('data-value', tempValue);
        
        localStorage.setItem(STORAGE_KEY_FROM_LENGTH, fromSelectedDiv.getAttribute('data-value'));
        localStorage.setItem(STORAGE_KEY_TO_LENGTH, toSelectedDiv.getAttribute('data-value'));
        
        window.performLengthConversion();
    };


    // ===============================================
    // 4. MASS - LOGIC (Factors to Kilogram)
    // ===============================================

    const fromMassInput = document.getElementById('from-mass');
    const toMassInput = document.getElementById('to-mass');
    const customFromSelectMass = document.getElementById('custom-from-mass-select');
    const customToSelectMass = document.getElementById('custom-to-mass-select');
    const swapIconMass = document.getElementById('swap-icon-mass');

    const massUnits = {
        't': { name: 'Tonne (Metric)', baseFactor: 1000 },
        'kg': { name: 'Kilogram', baseFactor: 1 },
        'g': { name: 'Gram', baseFactor: 0.001 },
        'mg': { name: 'Milligram', baseFactor: 0.000001 },
        'lb': { name: 'Pound (Avoirdupois)', baseFactor: 0.45359237 },
        'oz': { name: 'Ounce (Avoirdupois)', baseFactor: 0.0283495231 },
    };

    const STORAGE_KEY_FROM_MASS = 'converterFromMass';
    const STORAGE_KEY_TO_MASS = 'converterToMass';

    const loadMassDefaults = () => {
        const savedFrom = localStorage.getItem(STORAGE_KEY_FROM_MASS) || 'kg';
        const savedTo = localStorage.getItem(STORAGE_KEY_TO_MASS) || 'g';

        if (massUnits[savedFrom]) updateMassCustomSelectDisplay(customFromSelectMass, savedFrom);
        if (massUnits[savedTo]) updateMassCustomSelectDisplay(customToSelectMass, savedTo);
    };

    const updateMassCustomSelectDisplay = (selectElement, unitCode) => {
        const selectedDiv = selectElement.querySelector('.select-selected');
        const fullName = massUnits[unitCode] ? massUnits[unitCode].name : unitCode;
        if (selectedDiv) {
            selectedDiv.textContent = `${unitCode} - ${fullName}`;
            selectedDiv.setAttribute('data-value', unitCode);
        }
    };

    const populateMassCustomSelects = () => {
        if (!customFromSelectMass || !customToSelectMass) return;
        const fromItemsContainer = customFromSelectMass.querySelector('.select-items');
        const toItemsContainer = customToSelectMass.querySelector('.select-items');
        
        fromItemsContainer.innerHTML = '';
        toItemsContainer.innerHTML = '';

        const sortedUnits = Object.keys(massUnits).sort();

        sortedUnits.forEach(code => {
            const fullName = massUnits[code].name;
            fromItemsContainer.appendChild(createCustomSelectOption(code, fullName));
            toItemsContainer.appendChild(createCustomSelectOption(code, fullName));
        });
        
        loadMassDefaults();
        window.performMassConversion();
    };

    const convertMass = (fromUnitCode, toUnitCode, value) => {
        if (isNaN(value) || !massUnits[fromUnitCode] || !massUnits[toUnitCode]) return 0;

        const fromUnitFactor = massUnits[fromUnitCode].baseFactor;
        const toUnitFactor = massUnits[toUnitCode].baseFactor;

        // Formula: Value * (Factor_From / Factor_To)
        return (value * fromUnitFactor) / toUnitFactor;
    };

    window.performMassConversion = function() {
        const value = getAndNormalizeValue(fromMassInput);
        const fromUnit = getSelectedUnit(customFromSelectMass);
        const toUnit = getSelectedUnit(customToSelectMass);

        if (!isNaN(value) && value >= 0) {
            const result = convertMass(fromUnit, toUnit, value);
            toMassInput.value = formatResult(result, 10);
        } else {
            toMassInput.value = '';
        }
    };
    
    window.performMassConversionReverse = function() {
        const value = getAndNormalizeValue(toMassInput);
        const fromUnit = getSelectedUnit(customFromSelectMass);
        const toUnit = getSelectedUnit(customToSelectMass);

        if (!isNaN(value) && value >= 0) {
            const result = convertMass(toUnit, fromUnit, value);
            fromMassInput.value = formatResult(result, 10);
        } else {
            fromMassInput.value = '';
        }
    };
    
    const swapMassUnits = () => {
        const fromSelectedDiv = customFromSelectMass.querySelector('.select-selected');
        const toSelectedDiv = customToSelectMass.querySelector('.select-selected');
        
        const tempText = fromSelectedDiv.textContent;
        const tempValue = fromSelectedDiv.getAttribute('data-value');
        
        fromSelectedDiv.textContent = toSelectedDiv.textContent;
        fromSelectedDiv.setAttribute('data-value', toSelectedDiv.getAttribute('data-value'));

        toSelectedDiv.textContent = tempText;
        toSelectedDiv.setAttribute('data-value', tempValue);
        
        localStorage.setItem(STORAGE_KEY_FROM_MASS, fromSelectedDiv.getAttribute('data-value'));
        localStorage.setItem(STORAGE_KEY_TO_MASS, toSelectedDiv.getAttribute('data-value'));
        
        window.performMassConversion();
    };

    // ===============================================
    // 5. TEMPERATURE - LOGIC (Requires functions, not just factors)
    // ===============================================

    const fromTempInput = document.getElementById('from-temperature');
    const toTempInput = document.getElementById('to-temperature');
    const customFromSelectTemp = document.getElementById('custom-from-temperature-select');
    const customToSelectTemp = document.getElementById('custom-to-temperature-select');
    const swapIconTemp = document.getElementById('swap-icon-temperature');

    const tempUnits = {
        'C': { name: 'Celsius' },
        'F': { name: 'Fahrenheit' },
        'K': { name: 'Kelvin' },
    };
    
    const STORAGE_KEY_FROM_TEMP = 'converterFromTemp';
    const STORAGE_KEY_TO_TEMP = 'converterToTemp';
    
    const loadTemperatureDefaults = () => {
        const savedFrom = localStorage.getItem(STORAGE_KEY_FROM_TEMP) || 'C';
        const savedTo = localStorage.getItem(STORAGE_KEY_TO_TEMP) || 'F';

        if (tempUnits[savedFrom]) updateTemperatureCustomSelectDisplay(customFromSelectTemp, savedFrom);
        if (tempUnits[savedTo]) updateTemperatureCustomSelectDisplay(customToSelectTemp, savedTo);
    };

    const updateTemperatureCustomSelectDisplay = (selectElement, unitCode) => {
        const selectedDiv = selectElement.querySelector('.select-selected');
        const fullName = tempUnits[unitCode] ? tempUnits[unitCode].name : unitCode;
        if (selectedDiv) {
            selectedDiv.textContent = `${unitCode} - ${fullName}`;
            selectedDiv.setAttribute('data-value', unitCode);
        }
    };
    
    const populateTemperatureCustomSelects = () => {
        if (!customFromSelectTemp || !customToSelectTemp) return;
        const fromItemsContainer = customFromSelectTemp.querySelector('.select-items');
        const toItemsContainer = customToSelectTemp.querySelector('.select-items');
        
        fromItemsContainer.innerHTML = '';
        toItemsContainer.innerHTML = '';

        const sortedUnits = Object.keys(tempUnits).sort();

        sortedUnits.forEach(code => {
            const fullName = tempUnits[code].name;
            fromItemsContainer.appendChild(createCustomSelectOption(code, fullName));
            toItemsContainer.appendChild(createCustomSelectOption(code, fullName));
        });
        
        loadTemperatureDefaults();
        window.performTemperatureConversion();
    };


    // Temperature conversion functions (via Celsius)
    const toCelsius = (value, fromUnit) => {
        if (fromUnit === 'F') return (value - 32) * 5/9;
        if (fromUnit === 'K') return value - 273.15;
        return value; // C
    };

    const fromCelsius = (value, toUnit) => {
        if (toUnit === 'F') return (value * 9/5) + 32;
        if (toUnit === 'K') return value + 273.15;
        return value; // C
    };
    
    window.performTemperatureConversion = function() {
        const value = getAndNormalizeValue(fromTempInput);
        const fromUnit = getSelectedUnit(customFromSelectTemp);
        const toUnit = getSelectedUnit(customToSelectTemp);

        if (!isNaN(value)) {
            const valueInC = toCelsius(value, fromUnit);
            const result = fromCelsius(valueInC, toUnit);
            toTempInput.value = formatResult(result, 2); // 2 decimal places for temperature
        } else {
            toTempInput.value = '';
        }
    };
    
    window.performTemperatureConversionReverse = function() {
        const value = getAndNormalizeValue(toTempInput);
        const fromUnit = getSelectedUnit(customFromSelectTemp);
        const toUnit = getSelectedUnit(customToSelectTemp);

        if (!isNaN(value)) {
            // First, convert from TO (which is the 'source') to Celsius
            const valueInC = toCelsius(value, toUnit);
            // Then, convert from Celsius to FROM (which is the 'target')
            const result = fromCelsius(valueInC, fromUnit);
            fromTempInput.value = formatResult(result, 2);
        } else {
            fromTempInput.value = '';
        }
    };

    const swapTemperatureUnits = () => {
        const fromSelectedDiv = customFromSelectTemp.querySelector('.select-selected');
        const toSelectedDiv = customToSelectTemp.querySelector('.select-selected');
        
        const tempText = fromSelectedDiv.textContent;
        const tempValue = fromSelectedDiv.getAttribute('data-value');
        
        fromSelectedDiv.textContent = toSelectedDiv.textContent;
        fromSelectedDiv.setAttribute('data-value', toSelectedDiv.getAttribute('data-value'));

        toSelectedDiv.textContent = tempText;
        toSelectedDiv.setAttribute('data-value', tempValue);
        
        localStorage.setItem(STORAGE_KEY_FROM_TEMP, fromSelectedDiv.getAttribute('data-value'));
        localStorage.setItem(STORAGE_KEY_TO_TEMP, toSelectedDiv.getAttribute('data-value'));
        
        window.performTemperatureConversion();
    };

    // ===============================================
    // 6. VOLUME - LOGIC (Factors to Cubic Meter)
    // ===============================================

    const fromVolumeInput = document.getElementById('from-volume');
    const toVolumeInput = document.getElementById('to-volume');
    const customFromSelectVolume = document.getElementById('custom-from-volume-select');
    const customToSelectVolume = document.getElementById('custom-to-volume-select');
    const swapIconVolume = document.getElementById('swap-icon-volume');

    const volumeUnits = {
        'm3': { name: 'Cubic Meter', baseFactor: 1 },
        'l': { name: 'Liter', baseFactor: 0.001 },
        'ml': { name: 'Milliliter', baseFactor: 0.000001 },
        'gal': { name: 'Gallon (US)', baseFactor: 0.00378541 },
        'qt': { name: 'Quart (US)', baseFactor: 0.000946353 },
        'pt': { name: 'Pint (US)', baseFactor: 0.000473176 },
        'cup': { name: 'Cup (US)', baseFactor: 0.000236588 },
    };

    const STORAGE_KEY_FROM_VOLUME = 'converterFromVolume';
    const STORAGE_KEY_TO_VOLUME = 'converterToVolume';

    const loadVolumeDefaults = () => {
        const savedFrom = localStorage.getItem(STORAGE_KEY_FROM_VOLUME) || 'l';
        const savedTo = localStorage.getItem(STORAGE_KEY_TO_VOLUME) || 'ml';

        if (volumeUnits[savedFrom]) updateVolumeCustomSelectDisplay(customFromSelectVolume, savedFrom);
        if (volumeUnits[savedTo]) updateVolumeCustomSelectDisplay(customToSelectVolume, savedTo);
    };

    const updateVolumeCustomSelectDisplay = (selectElement, unitCode) => {
        const selectedDiv = selectElement.querySelector('.select-selected');
        const fullName = volumeUnits[unitCode] ? volumeUnits[unitCode].name : unitCode;
        if (selectedDiv) {
            selectedDiv.textContent = `${unitCode} - ${fullName}`;
            selectedDiv.setAttribute('data-value', unitCode);
        }
    };

    const populateVolumeCustomSelects = () => {
        if (!customFromSelectVolume || !customToSelectVolume) return;
        const fromItemsContainer = customFromSelectVolume.querySelector('.select-items');
        const toItemsContainer = customToSelectVolume.querySelector('.select-items');
        
        fromItemsContainer.innerHTML = '';
        toItemsContainer.innerHTML = '';

        const sortedUnits = Object.keys(volumeUnits).sort();

        sortedUnits.forEach(code => {
            const fullName = volumeUnits[code].name;
            fromItemsContainer.appendChild(createCustomSelectOption(code, fullName));
            toItemsContainer.appendChild(createCustomSelectOption(code, fullName));
        });
        
        loadVolumeDefaults();
        window.performVolumeConversion();
    };

    const convertVolume = (fromUnitCode, toUnitCode, value) => {
        if (isNaN(value) || !volumeUnits[fromUnitCode] || !volumeUnits[toUnitCode]) return 0;

        const fromUnitFactor = volumeUnits[fromUnitCode].baseFactor;
        const toUnitFactor = volumeUnits[toUnitCode].baseFactor;

        // Formula: Value * (Factor_From / Factor_To)
        return (value * fromUnitFactor) / toUnitFactor;
    };

    window.performVolumeConversion = function() {
        const value = getAndNormalizeValue(fromVolumeInput);
        const fromUnit = getSelectedUnit(customFromSelectVolume);
        const toUnit = getSelectedUnit(customToSelectVolume);

        if (!isNaN(value) && value >= 0) {
            const result = convertVolume(fromUnit, toUnit, value);
            toVolumeInput.value = formatResult(result, 10);
        } else {
            toVolumeInput.value = '';
        }
    };
    
    window.performVolumeConversionReverse = function() {
        const value = getAndNormalizeValue(toVolumeInput);
        const fromUnit = getSelectedUnit(customFromSelectVolume);
        const toUnit = getSelectedUnit(customToSelectVolume);

        if (!isNaN(value) && value >= 0) {
            const result = convertVolume(toUnit, fromUnit, value);
            fromVolumeInput.value = formatResult(result, 10);
        } else {
            fromVolumeInput.value = '';
        }
    };
    
    const swapVolumeUnits = () => {
        const fromSelectedDiv = customFromSelectVolume.querySelector('.select-selected');
        const toSelectedDiv = customToSelectVolume.querySelector('.select-selected');
        
        const tempText = fromSelectedDiv.textContent;
        const tempValue = fromSelectedDiv.getAttribute('data-value');
        
        fromSelectedDiv.textContent = toSelectedDiv.textContent;
        fromSelectedDiv.setAttribute('data-value', toSelectedDiv.getAttribute('data-value'));

        toSelectedDiv.textContent = tempText;
        toSelectedDiv.setAttribute('data-value', tempValue);
        
        localStorage.setItem(STORAGE_KEY_FROM_VOLUME, fromSelectedDiv.getAttribute('data-value'));
        localStorage.setItem(STORAGE_KEY_TO_VOLUME, toSelectedDiv.getAttribute('data-value'));
        
        window.performVolumeConversion();
    };


    // ===========================================
    // 7. GLOBAL INITIALIZATION AND EVENT LISTENERS
    // ===========================================

    /**
     * Unified initialization function for all factor-based converters
     * @param {string} type - Converter type (e.g., 'mass', 'volume')
     * @param {HTMLElement} fromInput - 'From' input field
     * @param {HTMLElement} toInput - 'To' input field
     * @param {HTMLElement} fromSelect - 'From' Custom Select
     * @param {HTMLElement} toSelect - 'To' Custom Select
     * @param {HTMLElement} swapIconElement - Swap icon
     * @param {Function} conversionFunc - Main conversion function (performConversion)
     * @param {Function} reverseConversionFunc - Reverse conversion function (performConversionReverse)
     * @param {Function} swapFunc - Swap function
     * @param {Function} initFunc - Population function (populateCustomSelects)
     */
    const initConverter = (type, fromInput, toInput, fromSelect, toSelect, swapIconElement, conversionFunc, reverseConversionFunc, swapFunc, initFunc) => {
        if (!fromInput || !toInput || !fromSelect || !toSelect) return; 

        // Input field handling (formatting and conversion)
        fromInput.addEventListener('input', handleInputCorrection);
        toInput.addEventListener('input', handleInputCorrection);
        
        fromInput.addEventListener('input', conversionFunc);
        toInput.addEventListener('input', reverseConversionFunc);

        // Custom Select handling
        handleCustomSelectClick(fromSelect, type, conversionFunc);
        handleCustomSelectClick(toSelect, type, conversionFunc);
        
        // Swap handling
        if (swapIconElement) {
            swapIconElement.addEventListener('click', swapFunc);
        }

        // Unit initialization
        initFunc();
    };


    // --- Unit Converters (Non-currency) ---

    // LENGTH
    if (customFromSelectLength) {
        initConverter(
            'length', fromLengthInput, toLengthInput, 
            customFromSelectLength, customToSelectLength, 
            swapIconLength, window.performLengthConversion, 
            window.performLengthConversionReverse, swapLengthUnits, 
            populateLengthCustomSelects
        );
    }

    // MASS
    if (customFromSelectMass) {
        initConverter(
            'mass', fromMassInput, toMassInput, 
            customFromSelectMass, customToSelectMass, 
            swapIconMass, window.performMassConversion, 
            window.performMassConversionReverse, swapMassUnits, 
            populateMassCustomSelects
        );
    }
    
    // TEMPERATURE
    if (customFromSelectTemp) {
        initConverter(
            'temperature', fromTempInput, toTempInput, 
            customFromSelectTemp, customToSelectTemp, 
            swapIconTemp, window.performTemperatureConversion, 
            window.performTemperatureConversionReverse, swapTemperatureUnits, 
            populateTemperatureCustomSelects
        );
    }

    // VOLUME
    if (customFromSelectVolume) {
        initConverter(
            'volume', fromVolumeInput, toVolumeInput, 
            customFromSelectVolume, customToSelectVolume, 
            swapIconVolume, window.performVolumeConversion, 
            window.performVolumeConversionReverse, swapVolumeUnits, 
            populateVolumeCustomSelects
        );
    }


    // --- Currency Converter (Requires specific initialization) ---

    fromCurrencyInput.addEventListener('input', handleInputCorrection);
    toCurrencyInput.addEventListener('input', handleInputCorrection);

    fromCurrencyInput.addEventListener('input', window.convertFromTo);
    toCurrencyInput.addEventListener('input', window.convertToFrom);
    
    handleCustomSelectClick(customFromSelect, 'currency', window.convertFromTo);
    handleCustomSelectClick(customToSelect, 'currency', window.convertFromTo);
    
    if (swapIcon) {
        swapIcon.addEventListener('click', swapCurrencies);
    }

    // CURRENCY CONVERTER INITIALIZATION: Load data from API
    getCurrencyNames(); 
});