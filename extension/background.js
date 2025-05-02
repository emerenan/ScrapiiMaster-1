// API base URL - should be updated to point to your server
const API_BASE_URL = 'http://localhost:5000/api';

// Listen for installation event
chrome.runtime.onInstalled.addListener(() => {
  console.log('Scrapii extension installed');
  
  // Initialize extension settings
  chrome.storage.local.set({
    aiEnabled: true,
    paginationEnabled: true,
    isPremium: false,
    apiKey: '',
    scrapingOptions: {
      paginationOption: 'single',
      customRange: {
        from: 1,
        to: 5,
        limit: 10,
        limitEnabled: true
      }
    }
  });
});

// Handle browser action click
chrome.action.onClicked.addListener((tab) => {
  // Inject content script to get page info
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getPageInfo
  });
});

// Function to get page info
function getPageInfo() {
  // Get page HTML content
  const html = document.documentElement.outerHTML;
  const url = window.location.href;
  const title = document.title;
  
  // Get favicon
  let favicon = null;
  const faviconEl = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  if (faviconEl) {
    favicon = faviconEl.href;
  }
  
  // Send data to background script
  chrome.runtime.sendMessage({
    action: 'pageAnalyzed',
    data: {
      html,
      url,
      title,
      favicon
    }
  });
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'analyzeCurrentPage') {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      
      const tab = tabs[0];
      
      // Execute script to analyze page
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getPageInfo
      });
    });
    return true; // Keep message channel open for async response
  }
  
  // Handle page analyzed message from content script
  if (message.action === 'pageAnalyzed') {
    const { html, url, title, favicon } = message.data;
    
    // Send to server for analysis (simulated for now)
    // In a real extension, this would make API calls to your backend
    analyzePageOnServer(html, url, title, favicon);
    return true;
  }
  
  // Handle element selection toggle
  if (message.action === 'toggleElementSelection') {
    // Update storage with selected elements
    chrome.storage.local.get('elements', (data) => {
      const elements = data.elements || [];
      const updatedElements = elements.map(el => {
        if (el.id === message.elementId) {
          el.selected = !el.selected;
        }
        return el;
      });
      
      chrome.storage.local.set({ elements: updatedElements });
      sendResponse({ success: true });
    });
    return true;
  }
});

// Function to analyze page on server
function analyzePageOnServer(html, url, title, favicon) {
  // Store basic page info immediately
  chrome.storage.local.set({
    pageInfo: { url, title, favicon }
  });
  
  // In a real extension, these would be API calls to your backend
  // Simulate element detection (this would normally be an API call)
  setTimeout(() => {
    // Save detected elements to storage
    chrome.storage.local.set({
      elements: [
        {
          id: 'title-1',
          type: 'text',
          name: 'Page Title',
          selector: 'h1, .title',
          icon: 'title',
          selected: true
        },
        {
          id: 'price-1',
          type: 'price',
          name: 'Product Price',
          selector: '.price, .product-price',
          icon: 'attach_money',
          selected: true
        },
        {
          id: 'image-1',
          type: 'image',
          name: 'Product Image',
          selector: '.product-image img, .main-image',
          icon: 'image',
          selected: true
        }
      ]
    });
    
    // Simulate pagination detection
    chrome.storage.local.set({
      paginationInfo: {
        pattern: url.includes('page=') ? url.replace(/page=\d+/, 'page={page}') : null,
        currentPage: url.includes('page=') ? parseInt(url.match(/page=(\d+)/)[1]) : 1,
        totalPages: 5, // Simulated total pages
        detected: url.includes('page=')
      }
    });
  }, 1000);
}

// In a real extension, we would implement functions to:
// 1. Make API calls to the backend for AI analysis
// 2. Handle data extraction based on selected elements
// 3. Export data to CSV/Excel/DB
// 4. Handle pagination navigation