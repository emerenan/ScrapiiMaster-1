import React from "react";
import { DetectedElement, PreviewItem } from "@/lib/types";

interface DataPreviewPanelProps {
  previewData: PreviewItem[];
  isLoading: boolean;
  onRefresh: () => void;
  elements: DetectedElement[];
}

export function DataPreviewPanel({
  previewData,
  isLoading,
  onRefresh,
  elements
}: DataPreviewPanelProps) {
  // Get selected elements for table headers
  const selectedElements = elements.filter(e => e.selected);
  
  return (
    <section className="p-4 border-b border-border">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-google-sans font-medium section-title flex items-center">
          <span className="material-icons text-primary mr-1.5">table_view</span>
          Data Preview
        </h2>
        <button 
          className="text-primary text-sm hover:bg-muted px-2 py-1 rounded flex items-center"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <span className="material-icons text-sm align-middle mr-0.5">
            {isLoading ? "sync" : "refresh"}
          </span>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>
      
      <div className="bg-muted rounded-lg p-2 overflow-x-auto">
        {selectedElements.length === 0 ? (
          <div className="text-center py-6">
            <span className="material-icons text-text/40 text-3xl mb-2">view_list</span>
            <p className="text-sm text-text/60">No elements selected</p>
            <p className="text-xs text-text/40 mt-1">Select elements from the AI Analysis panel to see a preview</p>
          </div>
        ) : isLoading ? (
          <div className="animate-pulse">
            <div className="flex border-b border-border">
              {selectedElements.map((element, idx) => (
                <div key={idx} className="py-2 px-2 w-24 h-8 bg-gray-200 rounded mr-2"></div>
              ))}
            </div>
            {[1, 2, 3].map((_, idx) => (
              <div key={idx} className="flex border-b border-border/50 last:border-0">
                {selectedElements.map((_, cellIdx) => (
                  <div key={cellIdx} className="py-2 px-2 w-24 h-6 bg-gray-200 rounded my-1 mr-2"></div>
                ))}
              </div>
            ))}
          </div>
        ) : previewData.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {selectedElements.map((element) => (
                  <th key={element.id} className="py-2 px-2 text-left font-medium">
                    {element.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((item, idx) => (
                <tr key={idx} className="border-b border-border/50 last:border-0">
                  {selectedElements.map((element) => {
                    const value = item[element.name];
                    const displayValue = typeof value === 'string' && element.type === 'image'
                      ? <span className="text-primary underline truncate">{(value as string).substring(0, 20)}</span>
                      : value;
                    
                    return (
                      <td 
                        key={element.id} 
                        className="py-2 px-2 whitespace-nowrap truncate max-w-[120px]"
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-6">
            <span className="material-icons text-text/40 text-3xl mb-2">search</span>
            <p className="text-sm text-text/60">No data available</p>
            <p className="text-xs text-text/40 mt-1">Click "Start Extraction" to fetch data from the page</p>
          </div>
        )}
      </div>
    </section>
  );
}
