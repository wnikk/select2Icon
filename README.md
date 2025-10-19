# Select2Icon - Icon Picker Component

**Select2Icon** is a lightweight, framework-agnostic JavaScript component
for selecting icons with a modern, searchable UI.
It supports input, dropdown, and inline modes, and is fully customizable and extendable.

## Screenshots

![Example of Select2Icon in dropdown mode](https://github.com/wnikk/select2Icon/blob/main/demo/screen.gif)

## Features
- ⚡ Lightweight (~11KB minified + gzipped)
- 🆓 No dependencies
- 🔍 Real-time search with keyboard navigation
- 🎨 Supports icon fonts, emojis, SVGs, and raw HTML
- 🧠 Auto-detects mode based on target element
- 🌐 Localization support (English, Ukraine, and more)
- 🧩 Works with any framework: Bootstrap, Tailwind, Vue, React, Angular, etc.
- 🧘 Fully encapsulated - no global pollution
- 🧵 Multiple independent instances on the same page
- 🧭 Natural behavior like native `<select>`: closes on outside click
- 🧱 Header and footer can be static or dynamically rendered via functions

## Installation

Include the JS and CSS files in your project:

```html
<link rel="stylesheet" href="./css/select2icon.css" />
<script src="./js/select2icon.js"></script>
```

## Usage Example

```html
<input id="icon-picker-input" type="text" placeholder="Select an icon..." />

<script>
  const sampleIcons = {
    "fa fa-user": { label: "User", search: {terms: ["person", "account", "profile"]}},
    "fa fa-home": { label: "Home", class: "fa fa-home" },
    "fa fa-search": { label: "Search", class: "fa fa-search" }
  };

  new select2icon({target: '#icon-picker-input', icons: sampleIcons});
</script>
```

### Other type of icon definitions:

```js
const iconListArray = [
  // Object definition with metadata
  { class: "fa fa-cog", label: "Settings", category: "System",
      search: {terms: ["gear", "preferences", "options"]}
  }, 
  // Class string definition
  "fa fa-archway",
  // Or raw HTML definition
  "<svg viewBox='0 0 24 24'><circle cx='12' cy='12' r='10' fill='blue'/></svg>"
]; 
```

### Load from file:

```js
new select2icon({
  target: '#icon-picker-input',
  iconSourceUrl: './path/to/icons.json',
  placeholder: 'Choose an icon...',
  onSelected: (key) => console.log('Selected icon:', key)
});
```

## Usage for React
```jsx
<Select2Icon
  icons={iconList}
  language="ru"
  selected={chosenIcon}
  onChange={(key) => setChosenIcon(key)}
/>
```

## Usage for Vue
```vue
<Select2Icon
  :icons="iconList"
  language="ru"
  v-model:selected="chosenIcon"
/>
```

## Configuration Options

| Option               | Type      | Default                              | Description                                                                             |
|----------------------|-----------|--------------------------------------|-----------------------------------------------------------------------------------------|
| `target`             | string/HTMLElement | -                                    | Selector or DOM element for attach                                                      |
| `selected`        | string    | `null`                                    | Set initial selected icon                                                               |
| `icons`              | array/object | `null`                               | Icon definitions: objects, class strings, or HTML                                       |
| `iconSourceUrl`      | string    | `'./icons/icons.json'`               | Fallback URL to load icons from                                                         |
| `mode`               | string    | auto (`input`, `dropdown`, `inline`) | Auto-detected unless explicitly set                                                     |
| `placeholder`        | string    | `'Select an icon...'`                | Placeholder for input field                                                             |
| `language`           | string    | browser-detected                     | Language code (`en`, `ru`, etc.)                                                        |
| `showHeader`         | boolean/function | `true`                               | Show header or render custom header via function `(container, instance) => HTMLElement` |
| `headerText`         | string    | `'Select an icon...'`                | Used only if `showHeader` is `true`                                                     |
| `showSearch`         | boolean   | `true`                               | Show search input field                                                                 |
| `showFooter`         | boolean/function | `true`                               | Show footer or render custom footer via function `(container, instance) => HTMLElement` |
| `mustAccept`         | boolean   | `false`                              | Require explicit confirmation via Apply button                                          |
| `selectedCustomClass`| string    | `'s2i-selected'`                     | CSS class for selected icon                                                             |
| `onSelected`         | function  | `() => {}`                           | Callback when icon is selected                                                          |
| `onUpdated`          | function  | `() => {}`                           | Callback when icon is updated via API                                                   |
| `onOpened`           | function  | `() => {}`                           | Callback when popup opens                                                               |
| `onClosed`           | function  | `() => {}`                           | Callback when popup closes                                                              |

## API Reference

| Method         | Description                                                                 | Parameters           | Returns             |
|----------------|------------------------------------------------------------------------------|----------------------|---------------------|
| `setIcon(key)` | Manually sets the selected icon                                             | `key: string`        | `void`              |
| `getIcon()`    | Returns the currently selected icon key                                     | —                    | `string \| null`    |
| `openPopup()`  | Programmatically opens the icon picker popup                                | —                    | `void`              |
| `destroy()`    | Destroys the component and removes it from the DOM                          | —                    | `void`              |
| `refresh()`    | Re-renders the icon list (useful after updating the `icons` array)          | —                    | `void`              |

## Usage API Example

```js
const picker = new select2icon(...);
//or: picker = document.querySelector('#iconInput').dataset.select2icon;

// Set icon manually
picker.setIcon('fa fa-star');

// Get current icon
console.log(picker.getIcon());

// Open popup
picker.openPopup();
```


## Keyboard Navigation

- `ArrowDown` / `ArrowUp`: Navigate between visible icons
- `Enter`: Select highlighted icon or auto-select if only one match
- `Escape`: Close popup
- `Backspace`: Return focus to search field

## Framework Compatibility

Select2Icon is **100% framework-agnostic**. It works seamlessly with:

- ✅ Vanilla JavaScript
- ✅ Bootstrap / Tailwind / Bulma
- ✅ React / Vue / Angular / Svelte
- ✅ jQuery or no framework at all

No dependencies. No build tools required. Just plug and play.

## Adding a New Language Translation

Select2Icon supports localization through a simple internal dictionary.
To add a new language, follow these steps:

### 1. Extend the Translation Dictionary

In your HTML or JS file before initializing:

```js
window.Select2IconLang = {
    fr: {
        selectIcon: 'Sélectionner une icône',
        close: 'Fermer',
        // 'placeholder', 'search' are missing and will fallback to English
    },
    ru: {
        selectIcon: 'Выбрать иконку',
        apply: 'Применить',
        close: 'Закрыть',
        placeholder: 'Выберите иконку...',
        search: 'Поиск...'
    },
};
```

### 2. Set the Language

You can specify the language explicitly when initializing:

```js
new select2icon({
  target: '#myInput',
  icons: [...],
  language: 'fr' // French
});
```

### 3. Optional: Fallback Behavior

If a language code is not found, Select2Icon will check page's `<html lang="...">` attribute.
If still not found, it will check the browser's language settings.
If no match is found, it will default to English (`en`).

## License

MIT License - free to use, modify, and distribute.