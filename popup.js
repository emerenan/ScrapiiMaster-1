// Use the ScrapiiAPI object from connector.js

// DOM Elements
const statusPanel = document.getElementById('statusPanel');
const pageInfo = document.getElementById('pageInfo');
const rescanButton = document.getElementById('rescanButton');

const aiAnalysisPanel = document.getElementById('aiAnalysisPanel');
const aiToggle = document.getElementById('aiToggle');
const elementsContainer = document.getElementById('elementsContainer');
const addElementButton = document.getElementById('addElementButton');

const paginationPanel = document.getElementById('paginationPanel');
const paginationToggle = document.getElementById('paginationToggle');
const paginationInfo = document.getElementById('paginationInfo');
const paginationOptions = document.querySelectorAll('input[name="paginationOption"]');
const customRangeControls = document.getElementById('customRangeControls');
const fromPage = document.getElementById('fromPage');
const toPage = document.getElementById('toPage');
const limitEnabled = document.getElementById('limitEnabled');
const pageLimit = document.getElementById('pageLimit');

const previewContainer = document.getElementById('previewContainer');
const refreshPreviewButton = document.getElementById('refreshPreviewButton');

const exportCsvButton = document.getElementById('exportCsvButton');
const exportExcelButton = document.getElementById('exportExcelButton');
const upgradeButton = document.getElementById('upgradeButton');
const premiumContent = document.getElementById('premiumContent');

const selectedCount = document.querySelector('.selected-count');
const viewHistoryLink = document.getElementById('viewHistoryLink');
const startExtractionButton = document.getElementById('startExtractionButton');

const elementPreviewDialog = document.getElementById('elementPreviewDialog');
const addElementDialog = document.getElementById('addElementDialog');

// State variables
let currentUrl = '';
let isPremium = false;
let currentElements = [];
let paginationData = null;
let previewData = [];

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Send message to background script to analyze current page
  chrome.runtime.sendMessage({ action: 'analyzeCurrentPage' });
  
  // Get extension settings from storage
  loadSettings();
  
  // Setup event listeners
  rescanButton.addEventListener('click', rescanPage);
  
  aiToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ aiEnabled: enabled });
  });
  
  paginationToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ paginationEnabled: enabled });
    updatePaginationUI();
  });
  
  paginationOptions.forEach(option => {
    option.addEventListener('change', updatePaginationOptions);
  });
  
  limitEnabled.addEventListener('change', () => {
    pageLimit.disabled = !limitEnabled.checked;
    updatePaginationOptions();
  });
  
  [fromPage, toPage, pageLimit].forEach(input => {
    input.addEventListener('change', updatePaginationOptions);
  });
  
  refreshPreviewButton.addEventListener('click', refreshPreview);
  
  exportCsvButton.addEventListener('click', exportAsCsv);
  exportExcelButton.addEventListener('click', exportAsExcel);
  
  startExtractionButton.addEventListener('click', startExtraction);
  
  // Setup listeners for settings and help buttons
  document.getElementById('settingsButton').addEventListener('click', showSettings);
  document.getElementById('helpButton').addEventListener('click', showHelp);
  
  addElementButton.addEventListener('click', showAddElementDialog);
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'elementsDetected') {
      updateElements(message.elements);
    }
    
    if (message.action === 'paginationDetected') {
      updatePagination(message.pagination);
    }
    
    if (message.action === 'previewReady') {
      updatePreview(message.data);
    }
  });
});

// Load settings from chrome storage
function loadSettings() {
  chrome.storage.local.get([
    'aiEnabled',
    'paginationEnabled',
    'isPremium',
    'scrapingOptions',
    'pageInfo',
    'elements',
    'paginationInfo'
  ], (result) => {
    // Update UI based on settings
    aiToggle.checked = result.aiEnabled !== undefined ? result.aiEnabled : true;
    paginationToggle.checked = result.paginationEnabled !== undefined ? result.paginationEnabled : true;
    isPremium = result.isPremium || false;
    
    // Update UI for premium features
    updatePremiumUI();
    
    // Update pagination options
    if (result.scrapingOptions) {
      document.querySelector(`input[value="${result.scrapingOptions.paginationOption}"]`).checked = true;
      
      if (result.scrapingOptions.paginationOption === 'custom') {
        customRangeControls.classList.remove('hidden');
        fromPage.value = result.scrapingOptions.customRange.from;
        toPage.value = result.scrapingOptions.customRange.to;
        limitEnabled.checked = result.scrapingOptions.customRange.limitEnabled;
        pageLimit.value = result.scrapingOptions.customRange.limit;
        pageLimit.disabled = !limitEnabled.checked;
      }
    }
    
    // Update page info if available
    if (result.pageInfo) {
      updatePageInfo(result.pageInfo);
    }
    
    // Update elements if available
    if (result.elements && result.elements.length > 0) {
      updateElements(result.elements);
    }
    
    // Update pagination if available
    if (result.paginationInfo) {
      updatePagination(result.paginationInfo);
    }
  });
}

// Update page info in the UI
function updatePageInfo(info) {
  if (!info) return;
  
  currentUrl = info.url;
  
  const html = `
    <div class="page-info">
      <div class="page-title">
        ${info.favicon ? `<img src="${info.favicon}" class="page-favicon" alt="favicon">` : ''}
        ${info.title || 'Unknown Page'}
      </div>
      <div class="page-url">${info.url}</div>
    </div>
  `;
  
  pageInfo.innerHTML = html;
  
  // Enable start extraction button if elements are selected
  updateStartButton();
}

// Update elements in the UI
function updateElements(elements) {
  if (!elements || elements.length === 0) {
    elementsContainer.innerHTML = '<p>No elements detected. Try rescanning the page.</p>';
    currentElements = [];
    updateSelectedCount();
    return;
  }
  
  currentElements = elements;
  
  const html = elements.map(element => `
    <div class="element-item" data-id="${element.id}">
      <input type="checkbox" class="element-checkbox" id="element-${element.id}" 
        ${element.selected ? 'checked' : ''}>
      <span class="material-icons element-icon">${element.icon}</span>
      <div class="element-info">
        <div class="element-name">${element.name}</div>
        <div class="element-type">${element.type}</div>
      </div>
      <div class="element-actions">
        <button class="icon-button element-preview-btn" data-id="${element.id}" title="Preview">
          <span class="material-icons">visibility</span>
        </button>
        <button class="icon-button element-edit-btn" data-id="${element.id}" title="Edit">
          <span class="material-icons">edit</span>
        </button>
      </div>
    </div>
  `).join('');
  
  elementsContainer.innerHTML = html;
  
  // Add event listeners to element items
  document.querySelectorAll('.element-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const elementId = e.target.closest('.element-item').dataset.id;
      toggleElementSelection(elementId, e.target.checked);
    });
  });
  
  document.querySelectorAll('.element-preview-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const elementId = e.target.closest('.element-preview-btn').dataset.id;
      const element = currentElements.find(el => el.id === elementId);
      showElementPreview(element);
    });
  });
  
  document.querySelectorAll('.element-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const elementId = e.target.closest('.element-edit-btn').dataset.id;
      const element = currentElements.find(el => el.id === elementId);
      editElement(element);
    });
  });
  
  updateSelectedCount();
}

// Update pagination info in the UI
function updatePagination(pagination) {
  if (!pagination) return;
  
  paginationData = pagination;
  
  const html = pagination.detected 
    ? `
      <div class="pagination-detected">
        <p><strong>Pagination detected!</strong></p>
        <p>Current page: ${pagination.currentPage}</p>
        ${pagination.totalPages ? `<p>Total pages: ${pagination.totalPages}</p>` : ''}
        ${pagination.pattern ? `<p>Pattern: ${pagination.pattern}</p>` : ''}
      </div>
    `
    : '<p>No pagination detected on this page.</p>';
  
  paginationInfo.innerHTML = html;
  
  // Update to/from page values based on detected pagination
  if (pagination.detected) {
    fromPage.value = pagination.currentPage;
    toPage.value = pagination.totalPages || pagination.currentPage + 5;
  }
}

// Update preview data in the UI
function updatePreview(data) {
  if (!data || data.length === 0) {
    previewContainer.innerHTML = '<p>No preview data available. Select elements to preview.</p>';
    return;
  }
  
  previewData = data;
  
  // Extract column headers from the first item
  const columns = Object.keys(data[0]);
  
  const html = `
    <table class="preview-table">
      <thead>
        <tr>
          ${columns.map(column => `<th>${column}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(item => `
          <tr>
            ${columns.map(column => `<td>${item[column] || ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  previewContainer.innerHTML = html;
}

// Update start button state
function updateStartButton() {
  const selectedElements = currentElements.filter(el => el.selected);
  startExtractionButton.disabled = selectedElements.length === 0 || !currentUrl;
}

// Update selected count in footer
function updateSelectedCount() {
  const selectedElements = currentElements.filter(el => el.selected);
  selectedCount.textContent = `${selectedElements.length} ${selectedElements.length === 1 ? 'item' : 'items'} selected`;
  updateStartButton();
}

// Update premium UI elements
function updatePremiumUI() {
  if (isPremium) {
    // Show premium database export options
    premiumContent.innerHTML = `
      <div class="db-connection-form">
        <div class="db-connection-row">
          <select class="db-input" id="dbConnectionSelect">
            <option value="">Select Database Connection</option>
            <option value="1">My PostgreSQL DB</option>
            <option value="new">+ Add New Connection</option>
          </select>
          <button class="icon-button" id="configureDbButton" title="Configure">
            <span class="material-icons">settings</span>
          </button>
        </div>
        <div class="db-connection-row">
          <input type="text" class="db-input" id="tableNameInput" placeholder="Table name" value="scrapii_data">
          <button class="button primary small" id="exportToDbButton">Export</button>
        </div>
      </div>
    `;
    
    // Add event listeners for database export
    document.getElementById('exportToDbButton').addEventListener('click', exportToDatabase);
  } else {
    // Default state is already set in HTML
  }
}

// Update pagination UI based on toggle and options
function updatePaginationUI() {
  const enabled = paginationToggle.checked;
  
  document.querySelectorAll('.pagination-options input').forEach(input => {
    input.disabled = !enabled;
  });
  
  // Show/hide custom range controls based on selected option
  const selectedOption = document.querySelector('input[name="paginationOption"]:checked').value;
  if (selectedOption === 'custom' && enabled) {
    customRangeControls.classList.remove('hidden');
  } else {
    customRangeControls.classList.add('hidden');
  }
}

// Update pagination options in storage
function updatePaginationOptions() {
  const option = document.querySelector('input[name="paginationOption"]:checked').value;
  
  // Show/hide custom range controls
  if (option === 'custom') {
    customRangeControls.classList.remove('hidden');
  } else {
    customRangeControls.classList.add('hidden');
  }
  
  // Save to storage
  chrome.storage.local.set({
    scrapingOptions: {
      paginationOption: option,
      customRange: {
        from: parseInt(fromPage.value) || 1,
        to: parseInt(toPage.value) || 5,
        limit: parseInt(pageLimit.value) || 10,
        limitEnabled: limitEnabled.checked
      }
    }
  });
}

// Toggle element selection
function toggleElementSelection(elementId, selected) {
  // Update local state
  currentElements = currentElements.map(el => {
    if (el.id === elementId) {
      el.selected = selected;
    }
    return el;
  });
  
  // Update storage
  chrome.storage.local.set({ elements: currentElements });
  
  // Update UI
  updateSelectedCount();
  
  // Send message to background script
  chrome.runtime.sendMessage({
    action: 'toggleElementSelection',
    elementId,
    selected
  });
}

// Show element preview dialog
function showElementPreview(element) {
  if (!element) return;
  
  elementPreviewDialog.innerHTML = `
    <div class="dialog-content">
      <div class="dialog-header">
        <h3 class="dialog-title">
          <span class="material-icons text-primary">${element.icon}</span>
          Element Preview: ${element.name}
        </h3>
        <button class="dialog-close" id="closePreviewDialog">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="dialog-body">
        <div class="element-preview">
          <div class="element-detail">
            <div class="element-detail-label">Type:</div>
            <div class="element-detail-value">${element.type}</div>
          </div>
          <div class="element-detail">
            <div class="element-detail-label">CSS Selector:</div>
            <div class="element-detail-value">${element.selector}</div>
          </div>
        </div>
        
        <div>
          <h4 class="form-label">Preview</h4>
          <div class="element-preview" style="min-height: 100px; display: flex; justify-content: center; align-items: center;">
            <div style="text-align: center;">
              <span class="material-icons" style="font-size: 32px; color: var(--primary); opacity: 0.5;">${element.icon}</span>
              <p style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                Preview available in the web page context
              </p>
            </div>
          </div>
          <p style="font-size: 10px; color: var(--text-secondary); margin-top: 4px;">
            Note: To see the real element, use the highlight feature in the main panel.
          </p>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="button outline" id="highlightElementButton" data-selector="${element.selector}">
          <span class="material-icons">highlight</span>
          Highlight on Page
        </button>
        <button class="button primary" id="closePreviewDialogBtn">Close</button>
      </div>
    </div>
  `;
  
  elementPreviewDialog.classList.remove('hidden');
  
  // Add event listeners
  document.getElementById('closePreviewDialog').addEventListener('click', () => {
    elementPreviewDialog.classList.add('hidden');
  });
  
  document.getElementById('closePreviewDialogBtn').addEventListener('click', () => {
    elementPreviewDialog.classList.add('hidden');
  });
  
  document.getElementById('highlightElementButton').addEventListener('click', (e) => {
    const selector = e.target.dataset.selector;
    
    // Send message to content script to highlight element
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'highlightElement',
        selector: element.selector
      });
    });
  });
}

// Show add element dialog
function showAddElementDialog() {
  addElementDialog.innerHTML = `
    <div class="dialog-content">
      <div class="dialog-header">
        <h3 class="dialog-title">Add Custom Element</h3>
        <button class="dialog-close" id="closeAddDialog">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="dialog-body">
        <form id="addElementForm">
          <div class="form-group">
            <label class="form-label" for="elementName">Name</label>
            <input type="text" id="elementName" class="form-input" placeholder="e.g. Product Title" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="elementSelector">CSS Selector</label>
            <input type="text" id="elementSelector" class="form-input" placeholder="e.g. .product-title, #price" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="elementType">Type</label>
            <select id="elementType" class="form-select">
              <option value="text">Text</option>
              <option value="price">Price</option>
              <option value="image">Image</option>
              <option value="rating">Rating</option>
              <option value="url">URL</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div id="iconPreview" style="margin-top: 8px; display: flex; align-items: center;">
            <span class="material-icons" style="margin-right: 8px; color: var(--primary);">title</span>
            <span>Icon preview for this element type</span>
          </div>
        </form>
      </div>
      <div class="dialog-footer">
        <button class="button outline" id="cancelAddElement">Cancel</button>
        <button class="button primary" id="submitAddElement">Add Element</button>
      </div>
    </div>
  `;
  
  addElementDialog.classList.remove('hidden');
  
  // Add event listeners
  document.getElementById('closeAddDialog').addEventListener('click', () => {
    addElementDialog.classList.add('hidden');
  });
  
  document.getElementById('cancelAddElement').addEventListener('click', () => {
    addElementDialog.classList.add('hidden');
  });
  
  const elementType = document.getElementById('elementType');
  const iconPreview = document.getElementById('iconPreview');
  
  elementType.addEventListener('change', () => {
    const type = elementType.value;
    let icon = 'title';
    
    switch (type) {
      case 'text': icon = 'title'; break;
      case 'price': icon = 'attach_money'; break;
      case 'image': icon = 'image'; break;
      case 'rating': icon = 'star'; break;
      case 'url': icon = 'link'; break;
      case 'custom': icon = 'code'; break;
    }
    
    iconPreview.innerHTML = `
      <span class="material-icons" style="margin-right: 8px; color: var(--primary);">${icon}</span>
      <span>Icon preview for this element type</span>
    `;
  });
  
  document.getElementById('submitAddElement').addEventListener('click', () => {
    const name = document.getElementById('elementName').value;
    const selector = document.getElementById('elementSelector').value;
    const type = document.getElementById('elementType').value;
    
    if (!name || !selector) {
      return;
    }
    
    // Generate icon based on type
    let icon = 'title';
    switch (type) {
      case 'text': icon = 'title'; break;
      case 'price': icon = 'attach_money'; break;
      case 'image': icon = 'image'; break;
      case 'rating': icon = 'star'; break;
      case 'url': icon = 'link'; break;
      case 'custom': icon = 'code'; break;
    }
    
    // Generate unique ID
    const id = 'custom-' + Date.now();
    
    // Add new element
    const newElement = {
      id,
      name,
      selector,
      type,
      icon,
      selected: true
    };
    
    // Update local state
    currentElements.push(newElement);
    
    // Update storage
    chrome.storage.local.set({ elements: currentElements });
    
    // Update UI
    updateElements(currentElements);
    
    // Close dialog
    addElementDialog.classList.add('hidden');
  });
}

// Edit element
function editElement(element) {
  if (!element) return;
  
  addElementDialog.innerHTML = `
    <div class="dialog-content">
      <div class="dialog-header">
        <h3 class="dialog-title">Edit Element</h3>
        <button class="dialog-close" id="closeEditDialog">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="dialog-body">
        <form id="editElementForm">
          <div class="form-group">
            <label class="form-label" for="editElementName">Name</label>
            <input type="text" id="editElementName" class="form-input" value="${element.name}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="editElementSelector">CSS Selector</label>
            <input type="text" id="editElementSelector" class="form-input" value="${element.selector}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="editElementType">Type</label>
            <select id="editElementType" class="form-select">
              <option value="text" ${element.type === 'text' ? 'selected' : ''}>Text</option>
              <option value="price" ${element.type === 'price' ? 'selected' : ''}>Price</option>
              <option value="image" ${element.type === 'image' ? 'selected' : ''}>Image</option>
              <option value="rating" ${element.type === 'rating' ? 'selected' : ''}>Rating</option>
              <option value="url" ${element.type === 'url' ? 'selected' : ''}>URL</option>
              <option value="custom" ${element.type === 'custom' ? 'selected' : ''}>Custom</option>
            </select>
          </div>
          <div id="editIconPreview" style="margin-top: 8px; display: flex; align-items: center;">
            <span class="material-icons" style="margin-right: 8px; color: var(--primary);">${element.icon}</span>
            <span>Icon preview for this element type</span>
          </div>
        </form>
      </div>
      <div class="dialog-footer">
        <button class="button outline" id="cancelEditElement">Cancel</button>
        <button class="button primary" id="submitEditElement" data-id="${element.id}">Save Changes</button>
      </div>
    </div>
  `;
  
  addElementDialog.classList.remove('hidden');
  
  // Add event listeners
  document.getElementById('closeEditDialog').addEventListener('click', () => {
    addElementDialog.classList.add('hidden');
  });
  
  document.getElementById('cancelEditElement').addEventListener('click', () => {
    addElementDialog.classList.add('hidden');
  });
  
  const editElementType = document.getElementById('editElementType');
  const editIconPreview = document.getElementById('editIconPreview');
  
  editElementType.addEventListener('change', () => {
    const type = editElementType.value;
    let icon = 'title';
    
    switch (type) {
      case 'text': icon = 'title'; break;
      case 'price': icon = 'attach_money'; break;
      case 'image': icon = 'image'; break;
      case 'rating': icon = 'star'; break;
      case 'url': icon = 'link'; break;
      case 'custom': icon = 'code'; break;
    }
    
    editIconPreview.innerHTML = `
      <span class="material-icons" style="margin-right: 8px; color: var(--primary);">${icon}</span>
      <span>Icon preview for this element type</span>
    `;
  });
  
  document.getElementById('submitEditElement').addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    const name = document.getElementById('editElementName').value;
    const selector = document.getElementById('editElementSelector').value;
    const type = document.getElementById('editElementType').value;
    
    if (!name || !selector) {
      return;
    }
    
    // Generate icon based on type
    let icon = 'title';
    switch (type) {
      case 'text': icon = 'title'; break;
      case 'price': icon = 'attach_money'; break;
      case 'image': icon = 'image'; break;
      case 'rating': icon = 'star'; break;
      case 'url': icon = 'link'; break;
      case 'custom': icon = 'code'; break;
    }
    
    // Update element
    currentElements = currentElements.map(el => {
      if (el.id === id) {
        return {
          ...el,
          name,
          selector,
          type,
          icon
        };
      }
      return el;
    });
    
    // Update storage
    chrome.storage.local.set({ elements: currentElements });
    
    // Update UI
    updateElements(currentElements);
    
    // Close dialog
    addElementDialog.classList.add('hidden');
  });
}

// Rescan page
function rescanPage() {
  chrome.runtime.sendMessage({ action: 'analyzeCurrentPage' });
  
  // Show loading state
  pageInfo.innerHTML = `
    <div class="page-info-loading">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    </div>
  `;
  
  elementsContainer.innerHTML = `
    <div class="elements-loading">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    </div>
  `;
  
  paginationInfo.innerHTML = `
    <div class="pagination-loading">
      <div class="skeleton"></div>
    </div>
  `;
}

// Refresh preview
function refreshPreview() {
  const selectedElements = currentElements.filter(el => el.selected);
  
  if (selectedElements.length === 0) {
    previewContainer.innerHTML = '<p>No elements selected for preview.</p>';
    return;
  }
  
  // Show loading state
  previewContainer.innerHTML = `
    <div class="preview-loading">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    </div>
  `;
  
  // Get element IDs
  const elementIds = selectedElements.map(el => el.id);
  
  // Use our API connector to fetch preview data
  ScrapiiAnalyzer.getDataPreview(currentUrl, elementIds)
    .then(data => {
      if (data && data.length > 0) {
        updatePreview(data);
      } else {
        previewContainer.innerHTML = '<p>No data found for the selected elements.</p>';
      }
    })
    .catch(error => {
      console.error('Error getting preview:', error);
      previewContainer.innerHTML = '<p>Failed to extract preview data.</p>';
    });
}

// Start extraction
function startExtraction() {
  const selectedElements = currentElements.filter(el => el.selected);
  
  if (selectedElements.length === 0) {
    return;
  }
  
  // Disable button during extraction
  startExtractionButton.disabled = true;
  startExtractionButton.innerHTML = `
    <span class="material-icons">sync</span>
    Extracting...
  `;
  
  // Get pagination options
  chrome.storage.local.get('scrapingOptions', (result) => {
    const paginationOptions = result.scrapingOptions;
    
    // Use the API connector to extract data
    ScrapiiAnalyzer.extractData(currentUrl, selectedElements, paginationOptions)
      .then(data => {
        if (data && data.length > 0) {
          // Save extracted data
          chrome.storage.local.set({
            extractedData: data,
            extractionTimestamp: Date.now(),
            extractionUrl: currentUrl,
            extractionElements: selectedElements
          });
          
          // Update UI
          updatePreview(data);
          
          // Show success message
          showNotification(`Data extracted successfully! (${data.length} items)`);
        } else {
          showNotification('No data was extracted. Try adjusting your element selection.', true);
        }
      })
      .catch(error => {
        console.error('Error extracting data:', error);
        showNotification('Failed to extract data', true);
      })
      .finally(() => {
        // Re-enable button
        startExtractionButton.disabled = false;
        startExtractionButton.innerHTML = `
          <span class="material-icons">play_arrow</span>
          Start Extraction
        `;
      });
  });
}

// Export as CSV
function exportAsCsv() {
  chrome.storage.local.get(['extractedData', 'extractionElements', 'extractionUrl', 'scrapingOptions'], (result) => {
    if (!result.extractedData || result.extractedData.length === 0) {
      showNotification('No data to export. Extract data first.', true);
      return;
    }
    
    // If we already have the data locally, we can export it directly
    if (result.extractedData && result.extractedData.length > 0) {
      try {
        // Convert data to CSV
        const data = result.extractedData;
        const headers = Object.keys(data[0]);
        
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if needed
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csv += values.join(',') + '\n';
        });
        
        // Create download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scrapii-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('CSV exported successfully!');
      } catch (error) {
        console.error('Error exporting CSV:', error);
        showNotification('Failed to export CSV', true);
      }
    } 
    // If we need to fetch fresh data from the server
    else if (result.extractionUrl && result.extractionElements) {
      // Use the API connector to export
      ScrapiiAnalyzer.exportToCsv(
        result.extractionUrl, 
        result.extractionElements, 
        result.scrapingOptions
      )
      .then(() => {
        showNotification('CSV exported successfully!');
      })
      .catch(error => {
        console.error('Error exporting CSV:', error);
        showNotification('Failed to export CSV', true);
      });
    } else {
      showNotification('No data available for export', true);
    }
  });
}

// Export as Excel
function exportAsExcel() {
  chrome.storage.local.get(['extractedData', 'extractionElements', 'extractionUrl', 'scrapingOptions'], (result) => {
    if (!result.extractedData || result.extractedData.length === 0) {
      showNotification('No data to export. Extract data first.', true);
      return;
    }
    
    // Use the API connector for more complete Excel export
    if (result.extractionUrl && result.extractionElements) {
      // Use the API connector to export
      ScrapiiAnalyzer.exportToExcel(
        result.extractionUrl, 
        result.extractionElements, 
        result.scrapingOptions
      )
      .then(() => {
        showNotification('Excel exported successfully!');
      })
      .catch(error => {
        console.error('Error exporting Excel:', error);
        showNotification('Failed to export Excel', true);
      });
    } 
    // Fallback to local CSV export with Excel extension
    else if (result.extractedData && result.extractedData.length > 0) {
      try {
        // Convert data to CSV
        const data = result.extractedData;
        const headers = Object.keys(data[0]);
        
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header] || '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csv += values.join(',') + '\n';
        });
        
        // Create download
        const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scrapii-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Excel exported successfully!');
      } catch (error) {
        console.error('Error exporting Excel:', error);
        showNotification('Failed to export Excel', true);
      }
    } else {
      showNotification('No data available for export', true);
    }
  });
}

// Export to database (premium feature)
function exportToDatabase() {
  if (!isPremium) {
    showNotification('This is a premium feature', true);
    return;
  }
  
  const connectionId = document.getElementById('dbConnectionSelect').value;
  const tableName = document.getElementById('tableNameInput').value;
  
  if (!connectionId || connectionId === 'new') {
    showNotification('Please select a database connection', true);
    return;
  }
  
  if (!tableName) {
    showNotification('Please enter a table name', true);
    return;
  }
  
  chrome.storage.local.get(['extractedData', 'extractionElements', 'extractionUrl', 'scrapingOptions'], (result) => {
    if (!result.extractedData && (!result.extractionUrl || !result.extractionElements)) {
      showNotification('No data to export. Extract data first.', true);
      return;
    }
    
    // Use API connector to export to database
    ScrapiiAnalyzer.exportToDatabase(
      result.extractionUrl || currentUrl,
      result.extractionElements || currentElements.filter(el => el.selected),
      result.scrapingOptions,
      connectionId,
      tableName
    )
    .then(result => {
      showNotification(`Data exported to database successfully! (${result.rowsInserted || 0} rows)`);
    })
    .catch(error => {
      console.error('Error exporting to database:', error);
      showNotification('Failed to export to database', true);
    });
  });
}

// Show notification
function showNotification(message, isError = false) {
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  notification.innerHTML = `
    <span class="material-icons">${isError ? 'error' : 'check_circle'}</span>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Add notification styles if they don't exist
  if (!document.getElementById('notification-style')) {
    const style = document.createElement('style');
    style.id = 'notification-style';
    style.textContent = `
      .notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 16px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        transition: opacity 0.3s, transform 0.3s;
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      
      .notification.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      
      .notification.success {
        background-color: var(--secondary);
      }
      
      .notification.error {
        background-color: var(--error);
      }
      
      .notification .material-icons {
        font-size: 18px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Show notification with animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Show settings dialog
function showSettings() {
  alert('Settings dialog would appear here in the full extension.');
}

// Show help dialog
function showHelp() {
  alert('Help dialog would appear here in the full extension.');
}