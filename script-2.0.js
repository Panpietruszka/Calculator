// Pobierz wszystkie przyciski radio
const radioButtons = document.querySelectorAll('input[name="value-radio"]');

// Pobierz wartości zmiennych CSS
const rootStyles = getComputedStyle(document.documentElement);
const getCssVar = (name) => rootStyles.getPropertyValue(name).trim();

// Utwórz jeden obiekt do przechowywania wszystkich stylów
const stylesByValue = {
  'value-1': {
    textColor: getCssVar('--font-color-dark'),
    buttonBg: getCssVar('--button-bg-light'),
    bodyBg: getCssVar('--light-blue-background'),
    boxShadow: getCssVar('--box-shadow-for-light'),
    border: getCssVar('--border-light')
  },
  'value-2': {
    textColor: getCssVar('--font-color-light'),
    buttonBg: getCssVar('--button-bg-normal'),
    bodyBg: getCssVar('--blue-background'),
    boxShadow: getCssVar('--box-shadow-for-dark'),
    border: getCssVar('--border-normal')
  },
  'value-3': {
    textColor: getCssVar('--font-color-light'),
    buttonBg: getCssVar('--button-bg-dark'),
    bodyBg: getCssVar('--new-background'),
    boxShadow: getCssVar('--box-shadow-for-dark'),
    border: getCssVar('--border-normal')
  },
  // --- Dodany element value-4 ---
  'value-4': {
    textColor: getCssVar('--font-color-new'), // Użyj nowej zmiennej CSS
    buttonBg: getCssVar('--button-bg-new'),  // Użyj nowej zmiennej CSS
    bodyBg: getCssVar('--new-body-background'), // Użyj nowej zmiennej CSS
    boxShadow: getCssVar('--box-shadow-for-new'), // Użyj nowej zmiennej CSS
    border: getCssVar('--border-new')     // Użyj nowej zmiennej CSS
  }
  // ------------------------------
};

// Pobierz elementy, na których będziesz działać
const allTextSpans = document.querySelectorAll('.radio-input label span');
const selection = document.querySelector('.selection');
const mainContent2 = document.querySelector('.main-content');
const body = document.body;

// --- Dodane funkcje ---

// Funkcja, która aplikuje style na podstawie wybranej wartości
const applyStyles = (selectedValue) => {
    // Zresetuj kolor tekstu wszystkich spanów
    allTextSpans.forEach(span => {
        span.style.color = '';
    });

    const selectedStyles = stylesByValue[selectedValue];
    if (!selectedStyles) return; // Jeśli nie ma stylów, zakończ

    const selectedTextSpan = document.querySelector(`#${selectedValue}-text`);
    if (selectedTextSpan && selectedStyles.textColor) {
        selectedTextSpan.style.color = selectedStyles.textColor;
    }

    if (selection && selectedStyles.buttonBg) {
        selection.style.backgroundColor = selectedStyles.buttonBg;
    }

    if (body && selectedStyles.bodyBg) {
        body.style.backgroundColor = selectedStyles.bodyBg;
    }

    if (mainContent2 && selectedStyles.boxShadow) {
        mainContent2.style.boxShadow = selectedStyles.boxShadow;
    }

    if (mainContent2 && selectedStyles.border) {
        mainContent2.style.border = selectedStyles.border;
    }
};

// Nasłuchuj na zdarzenie zmiany wyboru
radioButtons.forEach(button => {
    button.addEventListener('change', () => {
        const selectedValue = button.value;
        // Zapisz wybraną wartość do localStorage
        localStorage.setItem('selectedTheme', selectedValue);
        // Zastosuj style
        applyStyles(selectedValue);
    });
});

// Dodaj tę sekcję na końcu skryptu, aby wczytać stan przy ładowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    // Sprawdź, czy coś zostało zapisane w localStorage
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        // Znajdź odpowiedni input i zaznacz go
        const savedButton = document.querySelector(`input[name="value-radio"][value="${savedTheme}"]`);
        if (savedButton) {
            savedButton.checked = true;
            // Zastosuj style, aby wygląd strony się zgadzał
            applyStyles(savedTheme);
        }
    }
});