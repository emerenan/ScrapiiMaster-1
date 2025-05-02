# Scrapii Chrome Extension

This folder contains the Chrome extension for Scrapii, an AI-powered web data extraction tool.

## How to Install

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked"
5. Select this directory (the chrome-extension folder)

## Extension Structure

- `manifest.json`: Configuration file for the extension
- `popup.html`: UI for the extension popup
- `popup.css`: Styling for the popup
- `popup.js`: JavaScript for the popup interface
- `background.js`: Background service worker
- `content.js`: Content script injected into web pages
- `connector.js`: API communication with the backend server
- `icons/`: Directory containing icon files

## Permissions

The extension requires the following permissions:
- `activeTab`: To access the current tab's content
- `scripting`: To run scripts on the active tab
- `storage`: To store preferences and extraction data
- `downloads`: To download exported data files
- Host permissions for HTTP/HTTPS: To communicate with websites and the backend server

## Usage

1. Navigate to a webpage you want to extract data from
2. Click the Scrapii icon in your Chrome toolbar
3. Select elements to extract
4. Configure pagination options if needed
5. Click "Start Extraction"
6. Export the data in your preferred format

## Backend Server

The extension requires a running backend server at http://localhost:5000 by default. This can be changed in connector.js if needed.