// Scrapii - Chrome Extension Background Script

// Load the connector API
importScripts('connector.js');

// Helper function to compute Levenshtein distance between two strings
// Used to detect significant changes in page titles
function levenshteinDistance(a, b) {
  if (!a || !b) return 0;
  
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,     // deletion
        matrix[i][j-1] + 1,     // insertion
        matrix[i-1][j-1] + cost // substitution
      );
    }
  }
  
  return matrix[a.length][b.length];
}

// Listen for installation event
chrome.runtime.onInstalled.addListener(() => {
  console.log('Scrapii extension installed');
  
  // Initialize extension settings
  chrome.storage.local.set({
    aiEnabled: true,
    paginationEnabled: true,
    isPremium: false,
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
  
  // Check premium status from server
  checkPremiumStatus();
});

// Function to check premium status
async function checkPremiumStatus() {
  try {
    const isPremium = await ScrapiiAPI.getPremiumStatus();
    chrome.storage.local.set({ isPremium });
    
    // If premium, also get database connections
    if (isPremium) {
      const connections = await ScrapiiAPI.getDatabaseConnections();
      chrome.storage.local.set({ dbConnections: connections });
    }
  } catch (error) {
    console.error('Error checking premium status:', error);
  }
}

// Function to get page info and HTML
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
    
    // Store basic page info immediately
    const pageInfo = { url, title, favicon };
    chrome.storage.local.set({ pageInfo });
    
    // Send message to popup for immediate UI update
    chrome.runtime.sendMessage({
      action: 'pageInfoUpdated',
      pageInfo
    });
    
    // Send to server for AI-powered analysis
    analyzePageWithAI(html, url);
    
    return true;
  }
  
  // Handle content script loaded message
  if (message.action === 'contentScriptLoaded') {
    const { url, title } = message.data;
    
    // Store basic page info
    const pageInfo = { url, title };
    chrome.storage.local.set({ pageInfo });
    
    // Get the full HTML content and analyze the page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageHTML' }, (response) => {
        if (response && response.html) {
          // Send to server for AI analysis
          analyzePageWithAI(response.html, url);
        }
      });
    });
    
    return true;
  }
  
  // Handle page content changed message (for single-page apps)
  if (message.action === 'pageContentChanged') {
    const { url, title } = message.data;
    
    // Check if URL has changed since last analyzed page
    chrome.storage.local.get('pageInfo', (result) => {
      const lastPageInfo = result.pageInfo || {};
      
      // Only re-analyze if URL changed or title changed significantly
      if (lastPageInfo.url !== url || 
          (lastPageInfo.title && lastPageInfo.title !== title && 
           levenshteinDistance(lastPageInfo.title, title) > 10)) {
        
        // Get updated HTML and analyze
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) return;
          
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageHTML' }, (response) => {
            if (response && response.html) {
              // Update page info
              const pageInfo = { url, title };
              chrome.storage.local.set({ pageInfo });
              
              // Send to server for AI analysis
              analyzePageWithAI(response.html, url);
            }
          });
        });
      }
    });
    
    return true;
  }
  
  // Handle selector generated message
  if (message.action === 'selectorGenerated') {
    const { selector, text, tagName } = message;
    
    // Store for use in the add element dialog
    chrome.storage.local.set({ 
      generatedSelector: { 
        selector, 
        text, 
        tagName,
        timestamp: Date.now()
      } 
    });
    
    // Notify popup
    chrome.runtime.sendMessage({
      action: 'selectorGenerated',
      selector,
      text,
      tagName
    });
    
    return true;
  }
  
  // Handle element selection toggle
  if (message.action === 'toggleElementSelection') {
    // Update storage with selected elements
    chrome.storage.local.get('elements', (data) => {
      const elements = data.elements || [];
      const updatedElements = elements.map(el => {
        if (el.id === message.elementId) {
          el.selected = message.selected !== undefined ? message.selected : !el.selected;
        }
        return el;
      });
      
      chrome.storage.local.set({ elements: updatedElements });
      sendResponse({ success: true });
    });
    return true;
  }
  
  // Handle data preview request
  if (message.action === 'getDataPreview') {
    const { url, elementIds } = message;
    
    // Use the API connector to get preview data
    ScrapiiAnalyzer.getDataPreview(url, elementIds)
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('Preview error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  // Handle extract data request
  if (message.action === 'extractData') {
    const { url, elements, pagination } = message;
    
    // Use the API connector to extract data
    ScrapiiAnalyzer.extractData(url, elements, pagination)
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('Extraction error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  // Handle export requests
  if (message.action === 'exportToCsv') {
    const { url, elements, pagination } = message;
    
    ScrapiiAnalyzer.exportToCsv(url, elements, pagination)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('CSV export error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (message.action === 'exportToExcel') {
    const { url, elements, pagination } = message;
    
    ScrapiiAnalyzer.exportToExcel(url, elements, pagination)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Excel export error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (message.action === 'exportToDatabase') {
    const { url, elements, pagination, connectionId, tableName } = message;
    
    ScrapiiAnalyzer.exportToDatabase(url, elements, pagination, connectionId, tableName)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Database export error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});

// Function to perform AI analysis on the page
async function analyzePageWithAI(html, url) {
  try {
    // Check if AI is enabled
    const settings = await new Promise(resolve => {
      chrome.storage.local.get(['aiEnabled'], resolve);
    });
    
    if (settings.aiEnabled === false) {
      console.log('AI analysis is disabled by user');
      return;
    }
    
    // Use the Analyzer to process the page
    await ScrapiiAnalyzer.analyzePage(html, url);
  } catch (error) {
    console.error('Error during AI analysis:', error);
  }
}