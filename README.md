<div align="center">
<img src="public/icon.png" alt="logo" height="120px" />

# KOTOBAi

A browser extension for showing Japanese word definitions and reading by hovering over words.

<table>
 <tr>
	 <td align="center">
		 <a href="https://chromewebstore.google.com/detail/kotobai/ggimgmdngdcdamnjdcjimaajbofcolia" style="display: inline-block">
	    <img src="https://user-images.githubusercontent.com/22908993/166417152-f870bfbd-1770-4c28-b69d-a7303aebc9a6.png" alt="Chrome web store" />
	    <p>Chrome Web Store</p>
	  </a>
	 </td>
	 <td align="center">
		 <a href="https://addons.mozilla.org/en-US/firefox/addon/kotobai/" style="display: inline-block">
	    <img src="https://user-images.githubusercontent.com/22908993/166417727-3481fef4-00e5-4cf0-bb03-27fb880d993c.png" alt="Firefox add-ons" />
	    <p>Firefox Add-ons</p>
	  </a>
	 </td>
 </tr>
</table>
</div>

### Features:
- Word bookmarks and practice using flashcards or tests.
- Anki Integration
- Command menu for searching words, kanji, or names. Press the Ctrl+Alt+A keys on any page to open the command menu.
- Dashboard page to see more details about a word, kanji, or name with its stroke order.

## Project setup

```bash
# Install dependencies
yarn install

# Compiles and hot-reloads for development for the chrome browser
yarn dev

# Compiles and minifies for production for the chrome browser
yarn build

# Create a zip file from the build folder
yarn build:zip

# Compiles and hot-reloads for development for the firefox browser
yarn dev:firefox

# Compiles and minifies for production for the firefox browser
yarn build:firefox

# Generate dictionary data
yarn build:firefox

# Lints and fixes files
yarn lint
```

### Install Locally

#### Chrome

1. Open chrome and navigate to extensions page using this URL: chrome://extensions.
2. Enable the "Developer mode".
3. Click "Load unpacked extension" button, browse the `kotobai/dist` directory and select it.

### Firefox

1. Open firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click the "Load Temporary Add-on" button.
3. Browse the `kotobai/dist` directory and select the `manifest.json` file.
