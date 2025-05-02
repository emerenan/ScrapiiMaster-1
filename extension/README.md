# Scrapii Chrome Extension

An AI-powered Chrome extension for intelligent web data extraction, with robust pagination support and multiple export options.

## Features

- **AI-Powered Element Detection**: Automatically identifies extractable elements on any web page using advanced AI.
- **Intelligent Pagination Detection**: Automatically recognizes pagination patterns for multi-page scraping.
- **Customizable Extraction**: Fine-tune which elements to extract and how to handle pagination.
- **Multiple Export Options**: Export data to CSV, Excel, or directly to a PostgreSQL database (premium feature).
- **Real-time Preview**: Preview extracted data before performing full extraction.
- **User-friendly Interface**: Clean, intuitive UI makes web scraping accessible to everyone.

## Installation

### Developer Mode

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" at the top right
4. Click "Load unpacked" and select the `extension` directory
5. The Scrapii extension should now be visible in your Chrome extensions

### Backend Server

This extension requires a backend server for AI analysis and data processing. To set up the server:

1. Navigate to the root directory of this project
2. Install dependencies: `npm install`
3. Start the server: `npm run dev`
4. The server will start on `http://localhost:5000`

## Usage

1. **Navigate** to any website you want to extract data from
2. **Click** the Scrapii extension icon in your Chrome toolbar
3. **Wait** for AI analysis to complete (automatically detects elements and pagination)
4. **Select** the elements you want to extract
5. **Configure** pagination options if needed
6. **Click** "Start Extraction" to begin the data extraction process
7. **Export** your data in your preferred format (CSV, Excel, or PostgreSQL)

## Configuration

### AI Analysis

- Toggle AI analysis on/off using the switch in the AI Analysis panel
- Add custom elements using the "Add Element" button
- Edit or preview any detected element

### Pagination

- Toggle pagination on/off using the switch in the Pagination panel
- Choose from three pagination options:
  - Single page: Extract data from the current page only
  - All pages: Extract data from all detected pages
  - Custom range: Specify a range of pages to extract data from

### Export Options

- **CSV**: Export data to a CSV file
- **Excel**: Export data to an Excel file
- **Database** (Premium): Export data directly to a PostgreSQL database

## Premium Features

Upgrade to Premium to unlock:

- **Database Export**: Send extracted data directly to your PostgreSQL database
- **Advanced Pagination**: Extract data from unlimited pages
- **Priority Support**: Get faster responses to your support inquiries

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For support or inquiries, please contact us at support@scrapii.com