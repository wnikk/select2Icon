/**
 * select2icon - A versatile icon picker component
 * Version: 1.0.0
 *
 * License: MIT
 */
(function () {
    // Main class for the icon picker
    class select2icon {
        // Static array to track all active picker instances
        static instances = [];
        // Flag to ensure global click listener is only initialized once
        static _clickListenerInitialized = false;

        /**
         * Constructor: initializes the picker with user config
         * @param {Object} config - Configuration options
         */
        constructor(config = {}) {
            // Merge user config with defaults
            this.config = Object.assign({
                target: null, // Target element selector or node
                selected: null, // Initially selected icon key or class,
                icons: null, // Array or object of icon definitions
                iconSourceUrl: './icons/icons.json', // Fallback icon source
                selectedCustomClass: 's2i-selected', // CSS class for selected icon
                placeholder: 'Select an icon...', // Input placeholder
                language: null, // Language code

                showHeader: false, // Show header section
                headerText: 'Select an icon...', // Header text
                showSearch: true, // Show search input

                showFooter: false, // Show footer section
                mustAccept: false, // Require confirmation to select
                onSelected: () => {}, // Callback when icon selected
                onUpdated: () => {}, // Callback when icon updated
                onOpened: () => {}, // Callback when popup opened
                onClosed: () => {} // Callback when popup closed
            }, config);

            // Internal state
            this.iconData = {}; // Normalized icon data
            this.selectedIcon = this.config.selected || null; // Currently selected icon key
            this.container = null; // Main container element
            this.popup = null; // Popup panel element
            this.searchInputRef = null; // Reference to search input
            this.highlightIndex = -1; // Keyboard highlight index

            // Detect language and load translations
            this.language = this._detectLanguage();
            this.translations = this._getTranslations(this.language);

            // Register instance and setup global click listener
            select2icon.instances.push(this);
            select2icon._setupGlobalClickListener();

            // Initialize picker
            this._init();
        }

        /**
         * Detects the language for localization
         * @returns {string} Language code
         */
        _detectLanguage() {
            if (this.config.language) return this.config.language;
            const htmlLang = document.documentElement.lang;
            if (htmlLang) return htmlLang.split('-')[0];
            return navigator.language?.split('-')[0] || 'en';
        }

        /**
         * Gets translation strings for the given language
         * @param {string} lang - Language code
         * @returns {Object} Translations
         */
        _getTranslations(lang) {
            const fallback = {
                selectIcon: 'Select an icon',
                apply: 'Apply',
                close: 'Close',
                placeholder: 'Select an icon...',
                search: 'Search...'
            };

            // Allow custom translations via window.Select2IconLang
            const custom =
                typeof window.Select2IconLang === 'object' &&
                typeof window.Select2IconLang[lang] === 'object'
                    ? window.Select2IconLang[lang]
                    : {};

            return { ...fallback, ...custom };
        }

        /**
         * Sets up a global click listener to close popups when clicking outside
         * Only runs once for all instances
         */
        static _setupGlobalClickListener() {
            if (!select2icon._clickListenerInitialized) {
                document.addEventListener('click', (e) => {
                    select2icon.instances.forEach(inst => {
                        if (
                            inst.popup &&
                            inst.config.mode !== 'inline' &&
                            !inst.container.contains(e.target)
                        ) {
                            inst._closePopup();
                        }
                    });
                });
                select2icon._clickListenerInitialized = true;
            }
        }

        /**
         * Initializes the picker: loads icons, detects mode, renders UI
         */
        async _init() {
            await this._loadIcons();
            this._detectMode();
            this._render();
            this._bindEvents();
        }

        /**
         * Loads icon definitions from config or external source
         * Supports async loading from URL
         */
        async _loadIcons() {
            if (!this.config.icons) {
                try {
                    const response = await fetch(this.config.iconSourceUrl);
                    this.config.icons = await response.json();
                } catch (err) {
                    console.error('select2icon: Failed to load icons', err);
                    this.config.icons = {};
                }
            }
            this.iconData = this._normalizeIcons(this.config.icons || []);
        }

        /**
         * Normalizes icon definitions to a consistent object format
         * Supports objects, class strings, and raw HTML
         * @param {Array|Object} rawIcons
         * @returns {Object} Normalized icons
         */
        _normalizeIcons(rawIcons) {
            const normalized = {};

            // If rawIcons is already an object (not an array), assume it's in key-value format
            if (typeof rawIcons === 'object' && !Array.isArray(rawIcons)) {
                rawIcons = Object.entries(rawIcons);
            }
            for (const [index, item] of rawIcons) {
                let key = `icon-${index}`;
                let icon = {};

                // String: class or raw HTML
                if (typeof item === 'string') {
                    if (item.trim().startsWith('<')) {
                        // Raw HTML icon
                        icon = {
                            label: `Custom Icon ${index + 1}`,
                            html: item,
                            class: '',
                            search: { terms: [] }
                        };
                    } else {
                        // Icon font class
                        key = item;
                        icon = {
                            label: item,
                            class: item,
                            search: { terms: [item] }
                        };
                    }
                } else if (typeof item === 'object') {
                    // Full object definition
                    key = item.class || index;
                    icon = {
                        label: item.label || key,
                        class: key,
                        html: item.html || '',
                        category: item.category || '',
                        search: {
                            terms: Array.isArray(item.search?.terms) ? item.search.terms : []
                        }
                    };
                }

                normalized[key] = icon;
            }

            return normalized;
        }

        /**
         * Detects picker mode: input, dropdown, or inline
         * Sets this.config.mode accordingly
         */
        _detectMode() {
            if (this.config.mode) return;

            const target = typeof this.config.target === 'string'
                ? document.querySelector(this.config.target)
                : this.config.target;

            if (!target) {
                console.error('select2icon: Target element not found');
                return;
            }

            if (target.tagName === 'INPUT') {
                this.config.mode = 'input';
            } else {
                this.config.mode = 'dropdown';
            }
        }

        /**
         * Renders the picker UI based on mode
         * - input: attaches popup to input
         * - dropdown: attaches popup to container
         * - inline: renders icons directly
         */
        _render() {
            const target = typeof this.config.target === 'string'
                ? document.querySelector(this.config.target)
                : this.config.target;

            if (!target) {
                console.error('select2icon: Target element not found');
                return;
            }

            // Attach reference to instance for external access
            if (target.dataset) {
                target.dataset.select2icon = this;
            }

            if (this.config.mode === 'input') {
                target.placeholder = this.translations.placeholder;
                target.classList.add('s2i-input');
                target.addEventListener('focus', () => this._openPopup());
                target.addEventListener('click', () => this._openPopup());

                this.container = target.parentNode;
            }

            if (this.config.mode === 'dropdown') {
                this.container = target;
                target.addEventListener('click', () => this._openPopup());
            }

            if (this.config.mode === 'inline') {
                this.container = document.createElement('div');
                this.container.className = 's2i-container';
                this._renderHeader(this.container);
                this._renderIcons(this.container);
                this._renderFooter(this.container);
                target.appendChild(this.container);
            }
        }

        /**
         * Opens the icon picker popup panel
         * Handles closing other popups and rendering content
         */
        _openPopup() {
            if (this.popup) return;

            // Close other active popups
            select2icon.instances.forEach(inst => {
                if (
                    inst !== this &&
                    inst.popup &&
                    typeof inst._closePopup === 'function'
                ) {
                    inst._closePopup();
                }
            });

            // Create popup container
            this.popup = document.createElement('div');
            this.popup.className = 's2i-popup';

            // Render header
            this._renderHeader(this.popup);

            // Render icon grid
            const gridWrapper = document.createElement('div');
            gridWrapper.className = 's2i-grid';
            this._renderIcons(gridWrapper);
            this.popup.appendChild(gridWrapper);

            // Render footer
            if (this.config.showFooter) {
                this._renderFooter(this.popup);
            }

            // Determine target element
            const targetEl = typeof this.config.target === 'string'
                ? document.querySelector(this.config.target)
                : this.config.target;

            // Insert popup based on mode
            if (this.config.mode === 'input' || this.config.mode === 'dropdown') {
                if (targetEl && targetEl.parentNode) {
                    targetEl.parentNode.insertBefore(this.popup, targetEl.nextSibling);
                }
            } else {
                // Inline mode: append inside container
                this.container.appendChild(this.popup);
            }

            // Trigger fade-in animation
            requestAnimationFrame(() => {
                this.popup.classList.add('s2i-visible');
            });

            this.config.onOpened();
            this._focusInitial();
        }

        /**
         * Closes the icon picker popup panel
         * Handles fade-out and cleanup
         */
        _closePopup() {
            if (!this.popup) {return;}

            this.popup.classList.remove('s2i-visible');

            const popupRef = this.popup; // save reference for later removal
            this.popup = null; // clear reference immediately

            setTimeout(() => {
                if (popupRef && popupRef.parentNode && popupRef.parentNode.contains(popupRef)) {
                    popupRef.parentNode.removeChild(popupRef);
                }
                this.config.onClosed();
            }, 250);
        }

        /**
         * Renders the header section (title and/or search input)
         * Allows custom header via config.showHeader function
         * @param {HTMLElement} container
         */
        _renderHeader(container) {
            if (typeof this.config.showHeader === 'function') {
                this.config.showHeader(container, this);
                return;
            }

            if (!this.config.showHeader && !this.config.showSearch) return;

            const header = document.createElement('div');
            header.className = 's2i-header';

            if (this.config.showHeader) {
                const title = document.createElement('div');
                title.className = 's2i-title';
                title.textContent = this.config.headerText || this.translations.selectIcon;
                header.appendChild(title);
            }

            if (this.config.showSearch) {
                const searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.className = 's2i-search';
                searchInput.placeholder = this.translations.search;
                searchInput.addEventListener('input', (e) => {
                    this._filterIcons(e.target.value.trim().toLowerCase());
                });
                searchInput.addEventListener('keydown', (e) => this._handleSearchKey(e, searchInput));
                header.appendChild(searchInput);
                this.searchInputRef = searchInput;
            }

            container.appendChild(header);
        }

        /**
         * Renders the footer section (confirm/close buttons)
         * Allows custom footer via config.showFooter function
         * @param {HTMLElement} container
         */
        _renderFooter(container) {
            if (!this.config.showFooter) return;

            if (typeof this.config.showFooter === 'function') {
                this.config.showFooter(container, this);
                return;
            }

            const footer = document.createElement('div');
            footer.className = 's2i-footer';

            if (this.config.mustAccept) {
                const confirmBtn = document.createElement('button');
                confirmBtn.textContent = this.translations.apply;
                confirmBtn.className = 's2i-confirm';
                confirmBtn.addEventListener('click', () => this._confirmSelection());
                footer.appendChild(confirmBtn);
            }

            const closeBtn = document.createElement('button');
            closeBtn.textContent = this.translations.close;
            closeBtn.className = 's2i-close';
            closeBtn.addEventListener('click', () => this._closePopup());
            footer.appendChild(closeBtn);

            container.appendChild(footer);
        }

        /**
         * Renders the icon grid
         * Each icon is focusable and clickable
         * @param {HTMLElement} container
         */
        _renderIcons(container) {
            Object.entries(this.iconData).forEach(([key, icon]) => {
                const iconEl = document.createElement('div');
                iconEl.classList.add('s2i-icon');
                iconEl.dataset.key = key;
                iconEl.setAttribute('tabindex', '0');
                iconEl.title = icon.label || key;

                if (icon.html) {
                    iconEl.innerHTML = icon.html;
                } else if (icon.class) {
                    const iTag = document.createElement('i');
                    iTag.className = icon.class;
                    iconEl.appendChild(iTag);
                }

                iconEl.addEventListener('click', () => this._selectIcon(key));
                container.appendChild(iconEl);
            });
            if (this.selectedIcon) {
                this._highlightSelected();
            }
            if (this.iconData && Object.keys(this.iconData).length === 0) {
                const noIconsMsg = document.createElement('div');
                noIconsMsg.className = 's2i-no-icons';
                noIconsMsg.textContent = 'No icons available';
                container.appendChild(noIconsMsg);
            }
        }

        /**
         * Filters icons in the grid based on search query
         * Highlights matching icons for keyboard navigation
         * @param {string} query
         */
        _filterIcons(query) {
            const icons = this.container.querySelectorAll('.s2i-icon');
            icons.forEach(icon => {
                const key = icon.dataset.key.toLowerCase();
                const data = this.iconData[icon.dataset.key];
                const label = (data.label || '').toLowerCase();
                const className = (data.class || '').toLowerCase();
                const terms = (data.search?.terms || []).map(t => t.toLowerCase());

                const match = key.includes(query) ||
                    label.includes(query) ||
                    className.includes(query) ||
                    terms.some(term => term.includes(query));

                icon.style.display = match ? '' : 'none';
            });

            const visibleIcons = Array.from(this.container.querySelectorAll('.s2i-icon'))
                .filter(icon => icon.style.display !== 'none');

            if (visibleIcons.length === 1) {
                this.highlightIndex = 0;
                this._highlightByIndex(visibleIcons);
            } else {
                this.highlightIndex = -1;
                this._highlightByIndex(visibleIcons);
            }
        }

        /**
         * Handles icon selection (by click or keyboard)
         * Updates selectedIcon and triggers callback
         * @param {string} key - Icon key
         */
        _selectIcon(key) {
            this.selectedIcon = key;
            this._highlightSelected();

            if (this.config.mode === 'input') {
                const input = typeof this.config.target === 'string'
                    ? document.querySelector(this.config.target)
                    : this.config.target;
                if (input && input.tagName === 'INPUT') {
                    input.value = key;
                }
            }

            this.config.onSelected(key);
            if (!this.config.mustAccept) this._closePopup();
        }

        /**
         * Confirms selection when mustAccept is true
         * Triggers onSelected callback
         */
        _confirmSelection() {
            this.config.onSelected(this.selectedIcon);
            this._closePopup();
        }

        /**
         * Highlights the selected icon in the grid
         */
        _highlightSelected() {
            const icons = this.container.querySelectorAll('.s2i-icon');
            icons.forEach(icon => {
                icon.classList.remove(this.config.selectedCustomClass);
                if (icon.dataset.key === this.selectedIcon) {
                    icon.classList.add(this.config.selectedCustomClass);
                }
            });
        }

        /**
         * Highlights icon by keyboard index for navigation
         * @param {Array} icons - Array of visible icon elements
         */
        _highlightByIndex(icons) {
            icons.forEach((icon, i) => {
                icon.classList.toggle(this.config.selectedCustomClass, i === this.highlightIndex);
            });
        }

        /**
         * Handles keyboard navigation in the search input
         * Supports arrow keys, Enter, Escape, Backspace
         * @param {KeyboardEvent} e
         * @param {HTMLInputElement} input
         */
        _handleSearchKey(e, input) {
            const visibleIcons = Array.from(this.container.querySelectorAll('.s2i-icon'))
                .filter(icon => icon.style.display !== 'none');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.highlightIndex = Math.min(this.highlightIndex + 1, visibleIcons.length - 1);
                this._highlightByIndex(visibleIcons);
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.highlightIndex = Math.max(this.highlightIndex - 1, 0);
                this._highlightByIndex(visibleIcons);
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                if (visibleIcons.length === 1) {
                    this._selectIcon(visibleIcons[0].dataset.key);
                } else if (this.highlightIndex >= 0 && visibleIcons[this.highlightIndex]) {
                    this._selectIcon(visibleIcons[this.highlightIndex].dataset.key);
                }
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                this._closePopup();
            }

            if (e.key === 'Backspace') {
                input.focus();
            }
        }

        /**
         * Focuses the initial element in the popup (search or first icon)
         */
        _focusInitial() {
            if (this.searchInputRef) {
                this.searchInputRef.focus();
                return;
            }

            const icons = Array.from(this.container.querySelectorAll('.s2i-icon'))
                .filter(icon => icon.style.display !== 'none');

            let targetIcon = icons.find(icon => icon.dataset.key === this.selectedIcon);
            if (!targetIcon) targetIcon = icons[0];

            if (targetIcon) {
                targetIcon.focus();
                this.highlightIndex = icons.indexOf(targetIcon);
                this._highlightByIndex(icons);
            }
        }

        /**
         * Reserved for future event bindings
         */
        _bindEvents() {
            // Reserved for future use
        }

        // Public API

        /**
         * Opens the icon picker popup programmatically
         * after instance creation
         * Example: document.querySelector('#myInput').select2icon.openPopup()
         */
        openPopup() {
            this._openPopup();
        }

        /**
         * Sets the selected icon by key or class
         * Example: picker.setIcon('fa fa-user')
         * @param {string} keyOrClass
         */
        setIcon(keyOrClass) {
            this.selectedIcon = keyOrClass;
            this._highlightSelected();
            this.config.onUpdated(keyOrClass);
        }

        /**
         * Gets the currently selected icon key/class
         * @returns {string}
         */
        getIcon() {
            return this.selectedIcon;
        }

        /**
         * Destroys the picker instance and cleans up DOM
         */
        destroy() {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            this.container = null;
            this.popup = null;
            this.iconData = {};
        }

        /**
         * Loads new icon data and re-renders the picker
         * Example: picker.loadIcons(newIcons)
         * @param {Object} jsonData
         */
        loadIcons(jsonData) {
            this.iconData = jsonData;
            if (this.container) {
                this.container.innerHTML = '';
                this._render();
            }
        }
    }

    // Safe export for browser and Node.js environments
    if (typeof window !== 'undefined') {
        window.select2icon = select2icon;
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = select2icon;
    }
})();
