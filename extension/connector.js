// This script handles communication between the Chrome extension and the backend server
// It manages API calls to the OpenAI-powered analysis service

// API base URL - update this to your server address when deploying
const API_BASE_URL = 'http://localhost:5000/api';

// Helper for making API requests
async function fetchAPI(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // If we're expecting a file download
    if (response.headers.get('Content-Disposition')?.includes('attachment')) {
      return {
        blob: await response.blob(),
        filename: response.headers.get('Content-Disposition').split('filename=')[1] || 'scrapii-export.csv'
      };
    }

    // Regular JSON response
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// API functions
const API = {
  // Analyze a page to get basic page info
  async getPageInfo(url) {
    return await fetchAPI(`/analyze/page?url=${encodeURIComponent(url)}`);
  },
  
  // Analyze a page to detect elements using AI
  async detectElements(url, html) {
    return await fetchAPI(`/analyze/elements?url=${encodeURIComponent(url)}`);
  },
  
  // Analyze a page to detect pagination patterns using AI
  async detectPagination(url, html) {
    return await fetchAPI(`/analyze/pagination?url=${encodeURIComponent(url)}`);
  },
  
  // Update an element
  async updateElement(elementId, elementData) {
    return await fetchAPI(`/elements/${elementId}`, 'PUT', elementData);
  },
  
  // Add a new element
  async addElement(elementData) {
    return await fetchAPI('/elements', 'POST', elementData);
  },
  
  // Get a preview of the selected elements
  async getPreview(url, elementIds) {
    return await fetchAPI(`/preview?url=${encodeURIComponent(url)}&elements=${elementIds.join(',')}`);
  },
  
  // Extract data from a page
  async extractData(url, elements, pagination) {
    return await fetchAPI('/extract', 'POST', { url, elements, pagination });
  },
  
  // Export data to CSV
  async exportToCsv(url, elements, pagination) {
    return await fetchAPI('/export/csv', 'POST', { url, elements, pagination });
  },
  
  // Export data to Excel
  async exportToExcel(url, elements, pagination) {
    return await fetchAPI('/export/excel', 'POST', { url, elements, pagination });
  },
  
  // Export data to database (premium feature)
  async exportToDatabase(url, elements, pagination, connectionId, tableName) {
    return await fetchAPI('/export/database', 'POST', { 
      url, 
      elements, 
      pagination, 
      connectionId, 
      tableName 
    });
  },
  
  // Get user premium status
  async getPremiumStatus() {
    return await fetchAPI('/user/premium');
  },
  
  // Get database connections (premium feature)
  async getDatabaseConnections() {
    return await fetchAPI('/database/connections');
  }
};

// Analysis functions
const Analyzer = {
  // Analyze the current page using AI
  async analyzePage(html, url) {
    try {
      // Get basic page info
      const pageInfo = await API.getPageInfo(url);
      
      // Store in Chrome storage
      chrome.storage.local.set({ pageInfo });
      
      // Message to UI
      chrome.runtime.sendMessage({
        action: 'pageInfoUpdated',
        pageInfo
      });
      
      // Get AI-detected elements
      try {
        const elements = await API.detectElements(url);
        
        // Store in Chrome storage
        chrome.storage.local.set({ elements });
        
        // Message to UI
        chrome.runtime.sendMessage({
          action: 'elementsDetected',
          elements
        });
      } catch (elemError) {
        console.error('Error detecting elements:', elemError);
      }
      
      // Get pagination info
      try {
        const pagination = await API.detectPagination(url);
        
        // Store in Chrome storage
        chrome.storage.local.set({ paginationInfo: pagination });
        
        // Message to UI
        chrome.runtime.sendMessage({
          action: 'paginationDetected',
          pagination
        });
      } catch (paginationError) {
        console.error('Error detecting pagination:', paginationError);
      }
      
      return true;
    } catch (error) {
      console.error('Error analyzing page:', error);
      return false;
    }
  },
  
  // Get a preview of selected elements
  async getDataPreview(url, elementIds) {
    try {
      const previewData = await API.getPreview(url, elementIds);
      
      // Store in Chrome storage
      chrome.storage.local.set({ previewData });
      
      // Message to UI
      chrome.runtime.sendMessage({
        action: 'previewReady',
        data: previewData
      });
      
      return previewData;
    } catch (error) {
      console.error('Error getting preview:', error);
      return [];
    }
  },
  
  // Extract data from a page
  async extractData(url, elements, pagination) {
    try {
      const result = await API.extractData(url, elements, pagination);
      
      // Store in Chrome storage
      chrome.storage.local.set({ 
        extractedData: result.data,
        extractionTimestamp: Date.now(),
        extractionUrl: url
      });
      
      return result.data;
    } catch (error) {
      console.error('Error extracting data:', error);
      throw error;
    }
  },
  
  // Export to CSV
  async exportToCsv(url, elements, pagination) {
    try {
      const result = await API.exportToCsv(url, elements, pagination);
      
      // Create download from blob
      const url = URL.createObjectURL(result.blob);
      chrome.downloads.download({
        url: url,
        filename: result.filename,
        saveAs: true
      });
      
      return true;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  },
  
  // Export to Excel
  async exportToExcel(url, elements, pagination) {
    try {
      const result = await API.exportToExcel(url, elements, pagination);
      
      // Create download from blob
      const url = URL.createObjectURL(result.blob);
      chrome.downloads.download({
        url: url,
        filename: result.filename,
        saveAs: true
      });
      
      return true;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  },
  
  // Export to database (premium feature)
  async exportToDatabase(url, elements, pagination, connectionId, tableName) {
    try {
      const result = await API.exportToDatabase(url, elements, pagination, connectionId, tableName);
      return result;
    } catch (error) {
      console.error('Error exporting to database:', error);
      throw error;
    }
  }
};

// Export the API and Analyzer objects
window.ScrapiiAPI = API;
window.ScrapiiAnalyzer = Analyzer;