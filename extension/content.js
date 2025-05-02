// Content script for Scrapii
// This script runs directly in the web page context

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageHTML') {
    // Get the page HTML and send it back
    sendResponse({
      html: document.documentElement.outerHTML,
      url: window.location.href,
      title: document.title
    });
    return true;
  }
  
  if (request.action === 'highlightElement') {
    highlightElementBySelector(request.selector);
    return true;
  }
  
  if (request.action === 'extractData') {
    const data = extractDataFromPage(request.elements);
    sendResponse({ data });
    return true;
  }
});

// Function to highlight an element based on CSS selector
function highlightElementBySelector(selector) {
  try {
    // Remove any existing highlights
    const existingHighlights = document.querySelectorAll('.scrapii-highlight');
    existingHighlights.forEach(el => el.classList.remove('scrapii-highlight'));
    
    // Find and highlight the new element
    const elements = document.querySelectorAll(selector);
    
    if (elements.length === 0) {
      console.log(`No elements found for selector: ${selector}`);
      return;
    }
    
    elements.forEach(el => {
      // Add highlight class
      el.classList.add('scrapii-highlight');
      
      // Create highlight style if it doesn't exist
      if (!document.getElementById('scrapii-highlight-style')) {
        const style = document.createElement('style');
        style.id = 'scrapii-highlight-style';
        style.textContent = `
          .scrapii-highlight {
            outline: 2px solid #4285F4 !important;
            background-color: rgba(66, 133, 244, 0.1) !important;
            transition: outline 0.3s ease !important;
          }
        `;
        document.head.appendChild(style);
      }
    });
  } catch (error) {
    console.error('Error highlighting element:', error);
  }
}

// Function to extract data from the page based on provided elements
function extractDataFromPage(elements) {
  const results = [];
  
  try {
    let hasMultipleItems = false;
    let itemContainers = [];
    
    // Check if there's a common container for multiple items (product list, etc)
    // This is a simplified approach, real implementation would need more sophistication
    if (elements.length > 1) {
      // Look for common parent with multiple instances
      const firstEl = document.querySelector(elements[0].selector);
      if (firstEl) {
        // Try to find parent that contains multiple similar items
        let parent = firstEl.parentElement;
        const maxLevelsUp = 3; // Don't go too far up the DOM tree
        
        for (let i = 0; i < maxLevelsUp; i++) {
          if (!parent) break;
          
          // Check if there are siblings with similar structure
          const siblings = Array.from(parent.parentElement.children)
            .filter(el => el.tagName === parent.tagName);
            
          if (siblings.length > 1) {
            hasMultipleItems = true;
            itemContainers = siblings;
            break;
          }
          
          parent = parent.parentElement;
        }
      }
    }
    
    if (hasMultipleItems) {
      // Extract data from multiple item containers
      itemContainers.forEach(container => {
        const itemData = {};
        
        elements.forEach(element => {
          try {
            // Look for the element within this container
            const selector = element.selector.replace(/^.*?(\.|\#|body)/g, '$1');
            const el = container.querySelector(selector);
            
            if (el) {
              if (element.type === 'text') {
                itemData[element.name] = el.textContent.trim();
              } else if (element.type === 'price') {
                // Extract numeric price, removing currency symbols
                const priceText = el.textContent.trim();
                const price = priceText.replace(/[^0-9.,]/g, '');
                itemData[element.name] = price;
              } else if (element.type === 'image') {
                itemData[element.name] = el.src || el.getAttribute('data-src');
              } else if (element.type === 'url') {
                itemData[element.name] = el.href || el.getAttribute('data-url');
              } else if (element.type === 'rating') {
                // Try to extract rating, this is simplified
                const ratingText = el.textContent.trim();
                const rating = ratingText.match(/(\d+(\.\d+)?)/);
                itemData[element.name] = rating ? rating[0] : '';
              }
            }
          } catch (elemError) {
            console.error(`Error extracting ${element.name}:`, elemError);
          }
        });
        
        if (Object.keys(itemData).length > 0) {
          results.push(itemData);
        }
      });
    } else {
      // Extract single item data
      const singleItemData = {};
      
      elements.forEach(element => {
        try {
          const els = document.querySelectorAll(element.selector);
          
          if (els.length > 0) {
            if (element.type === 'text') {
              singleItemData[element.name] = els[0].textContent.trim();
            } else if (element.type === 'price') {
              const priceText = els[0].textContent.trim();
              const price = priceText.replace(/[^0-9.,]/g, '');
              singleItemData[element.name] = price;
            } else if (element.type === 'image') {
              singleItemData[element.name] = els[0].src || els[0].getAttribute('data-src');
            } else if (element.type === 'url') {
              singleItemData[element.name] = els[0].href || els[0].getAttribute('data-url');
            } else if (element.type === 'rating') {
              const ratingText = els[0].textContent.trim();
              const rating = ratingText.match(/(\d+(\.\d+)?)/);
              singleItemData[element.name] = rating ? rating[0] : '';
            }
          }
        } catch (elemError) {
          console.error(`Error extracting ${element.name}:`, elemError);
        }
      });
      
      if (Object.keys(singleItemData).length > 0) {
        results.push(singleItemData);
      }
    }
  } catch (error) {
    console.error('Error extracting data:', error);
  }
  
  return results;
}

// Automatically send page info when the content script loads
// This enables automatic page analysis when the user navigates to a new page
chrome.runtime.sendMessage({
  action: 'contentScriptLoaded',
  data: {
    url: window.location.href,
    title: document.title
  }
});