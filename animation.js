$(document).ready(function () {
    // Initialization of smooth-scrollbar
    var Scrollbar = window.Scrollbar;
    Scrollbar.use(window.OverscrollPlugin);

    // Check if the scrollable element exists on the page
    const historyListContainer = document.querySelector('.js-scroll-list');
    if (!historyListContainer) {
        // Translated error message: 'Element .js-scroll-list not found. Animation script stopped.'
        console.error('Element .js-scroll-list not found. Animation script stopped.');
        return;
    }

    var customScroll = Scrollbar.init(historyListContainer, {
        plugins: {
            overscroll: true
        }
    });

    // Function to update animation classes based on scrolling
    const updateHistoryItemClasses = () => {
        const historyItems = $('#history-list li');
        const scrollOffset = customScroll.offset.y;
        const containerHeight = customScroll.getSize().content.height;
        const containerBottom = scrollOffset + containerHeight;

        historyItems.each(function (index, element) {
            const $li = $(element);
            const liTop = element.offsetTop;
            const liBottom = liTop + $li.height();

            // Check if the element is in view
            if (liBottom > scrollOffset && liTop < containerBottom) {
                $li.removeClass('item-hide').addClass('item-focus');
            } else {
                $li.removeClass('item-focus').addClass('item-hide');
            }
        });
    };

    // Add a scroll listener
    customScroll.addListener(updateHistoryItemClasses);

    // Listener for DOM tree changes to activate animation after new elements are added
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                updateHistoryItemClasses();
            }
        });
    });

    const historyList = document.getElementById('history-list');
    if (historyList) {
        observer.observe(historyList, { childList: true });
    }
    
    // Run the function on page load
    updateHistoryItemClasses();
});