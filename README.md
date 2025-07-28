# JobCap Chrome Extension

JobCap is a Chrome extension that extracts job ad details from Indeed and LinkedIn job pages. It helps you quickly capture key job information such as role, company, office location, work location, job type, and pay, and makes it easy to copy this data for your records or applications.

## Features
- Supports both Indeed and LinkedIn job ads
- Robust extraction logic for real-world job ad HTML
- Simple popup UI for viewing and copying job details

## Installation & Setup

### 1. Clone or Download the Repository
Clone this repository to your local machine.

### 2. Load the Extension in Chrome
1. Open Google Chrome.
2. Go to `chrome://extensions/` in the address bar.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked**.
5. Select the folder where you cloned or extracted this repository (the folder containing `manifest.json`).
6. The extension should now appear in your extensions list as **JobCap**.

### 3. Using the Extension
- Navigate to a job ad on Indeed or LinkedIn.
- Click the JobCap extension icon in your Chrome toolbar.
- The popup will display the extracted job details.
- Use the copy button to copy all fields to your clipboard.

## Development
- All main logic is in `content.js` (content script) and `popup.js` (popup UI logic).
- To update extraction logic, edit `content.js`, reload the extension in Chrome, and then reload the target page.

---

This tool is not affiliated with Indeed, LinkedIn, or any other job board. This tool is for personal productivity only.
