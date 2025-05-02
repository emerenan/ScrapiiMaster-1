import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DetectedElement {
  id: string;
  type: 'text' | 'price' | 'image' | 'rating' | 'url' | 'custom';
  name: string;
  selector: string;
  icon: string;
  selected: boolean;
}

interface PaginationInfo {
  pattern: string | null;
  currentPage: number;
  totalPages: number | null;
  detected: boolean;
}

// Analyze HTML content and identify scraping elements
export async function analyzeHtml(html: string, url: string): Promise<{
  elements: DetectedElement[];
  pagination: PaginationInfo;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in web scraping that can analyze HTML to identify elements for scraping. 
          Identify common data elements like titles, prices, images, ratings, and URLs. 
          For each element, provide a css selector that would extract it accurately.
          Also identify pagination patterns if present.
          Respond with JSON in the following format:
          {
            "elements": [
              {
                "id": "unique-id",
                "type": "text|price|image|rating|url",
                "name": "Element Name",
                "selector": "CSS Selector",
                "icon": "appropriate_material_icon_name",
                "selected": true
              }
            ],
            "pagination": {
              "pattern": "pagination_url_pattern or null",
              "currentPage": 1,
              "totalPages": "number or null",
              "detected": true|false
            }
          }`
        },
        {
          role: "user",
          content: `URL: ${url}\n\nHTML: ${html.substring(0, 15000)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    // Parse and validate the response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Assign unique IDs if they're missing
    if (result.elements) {
      result.elements = result.elements.map((element: any, index: number) => ({
        ...element,
        id: element.id || `element-${index}`
      }));
    }
    
    return result;
  } catch (error) {
    console.error("Error analyzing HTML:", error);
    return {
      elements: [],
      pagination: {
        pattern: null,
        currentPage: 1,
        totalPages: null,
        detected: false
      }
    };
  }
}

// Extract data from HTML based on elements
export async function extractDataFromHtml(
  html: string, 
  elements: DetectedElement[]
): Promise<any[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in web scraping that can extract data from HTML based on CSS selectors.
          For each CSS selector provided, extract the matching data from the HTML.
          Respond with a JSON array of objects, where each object contains the extracted data.
          If multiple items are found (like in a product list), return multiple objects.
          For image selectors, extract the src attribute.
          For link selectors, extract the href attribute.
          Format prices as numbers without currency symbols.`
        },
        {
          role: "user",
          content: `Extract the following elements from this HTML:
          ${JSON.stringify(elements)}
          
          HTML: ${html.substring(0, 15000)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error("Error extracting data:", error);
    return [];
  }
}
