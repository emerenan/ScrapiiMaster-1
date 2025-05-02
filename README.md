# Scrapii: AI-Powered Web Data Extraction

Scrapii is a Chrome extension that uses AI to analyze web pages, automatically detect extractable elements, and allow for seamless data extraction with pagination support and multiple export options.

## Features

- **AI-Powered Element Detection**: Automatically identifies extractable elements like prices, titles, images, etc.
- **Pagination Intelligence**: Detects pagination patterns to enable multi-page data extraction
- **Export Versatility**: Export to CSV, Excel, or directly to PostgreSQL database (premium)
- **Live Preview**: See extracted data in real-time before performing full extractions
- **Customization**: Add custom elements or modify detected ones for precise extractions

## Project Structure

The project consists of two main components:
1. **Chrome Extension**: Client-side components for interacting with web pages
2. **Backend Server**: API server with OpenAI integration for AI-powered analysis

### Chrome Extension Components:
- `manifest.json`: Extension configuration
- `popup.html/css/js`: UI for controlling the extension
- `background.js`: Handles background events and communication
- `content.js`: Interacts with page content
- `connector.js`: Manages API communication

### Backend Server Components:
- `server/index.ts`: Express server setup
- `server/routes.ts`: API endpoint definitions
- `server/openai.ts`: Integration with OpenAI for AI analysis
- `shared/schema.ts`: Database schema definitions using Drizzle ORM

## Installation

### Development Setup

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/scrapii.git
   cd scrapii
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the backend server:
   ```
   npm run dev
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked" and select the `extension` directory

## Usage Guide

1. **Analyzing a Page**:
   - Navigate to any webpage you want to scrape
   - Click the Scrapii extension icon in your Chrome toolbar
   - The extension will automatically analyze the page using AI

2. **Selecting Elements**:
   - In the popup, you'll see detected elements like text, images, prices, etc.
   - Check the elements you want to extract
   - Use the "Add Element" button to add custom elements

3. **Configuring Pagination**:
   - If pagination is detected, you can enable the pagination feature
   - Choose to extract from:
     - Single page (current page only)
     - All pages (extract from all detected pages)
     - Custom range (specify a range of pages)

4. **Extracting Data**:
   - Click "Start Extraction" to begin the data extraction process
   - Preview the extracted data in the "Data Preview" panel

5. **Exporting Data**:
   - Use the "Export" panel to export your data
   - Options include CSV, Excel, or PostgreSQL (premium)

## Development

### Adding New Features

To add new features to the extension:

1. Update the relevant components:
   - For UI changes, modify `popup.html` and `popup.js`
   - For background operations, update `background.js`
   - For page interaction, modify `content.js`

2. Add new API endpoints by editing `server/routes.ts`

### Testing

To test the extension:

1. Start the backend server (`npm run dev`)
2. Load the extension in Chrome
3. Navigate to a test website
4. Click the extension icon and verify functionality

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the GPT models used for AI analysis
- Chrome Extension APIs for making browser extension development accessible