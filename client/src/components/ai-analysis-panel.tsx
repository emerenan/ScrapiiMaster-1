import React, { useState } from "react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Dialog } from "@/components/ui/dialog";
import { DetectedElement } from "@/lib/types";
import { ElementPreviewDialog } from "./element-preview-dialog";
import { AddElementDialog } from "./add-element-dialog";

interface AIAnalysisPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  elements: DetectedElement[];
  isLoading: boolean;
  onElementToggle: (elementId: string) => void;
  onElementEdit: (element: DetectedElement) => void;
  onElementAdd: (element: Omit<DetectedElement, 'id'>) => void;
  analysisProgress?: number;
}

export function AIAnalysisPanel({
  enabled,
  onToggle,
  elements,
  isLoading,
  onElementToggle,
  onElementEdit,
  onElementAdd,
  analysisProgress = 0
}: AIAnalysisPanelProps) {
  const [previewElement, setPreviewElement] = useState<DetectedElement | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handlePreview = (element: DetectedElement) => {
    setPreviewElement(element);
  };

  const handleAddElement = (newElement: Omit<DetectedElement, 'id'>) => {
    onElementAdd(newElement);
    setIsAddDialogOpen(false);
  };

  return (
    <section className="p-4 border-b border-border">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-google-sans font-medium section-title flex items-center">
          <span className="material-icons text-primary mr-1.5 text-xl">auto_awesome</span>
          AI Analysis
        </h2>
        <ToggleSwitch 
          checked={enabled} 
          onCheckedChange={onToggle}
        />
      </div>
      
      {enabled && analysisProgress > 0 && analysisProgress < 100 && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm">Analyzing page elements...</span>
            <span className="text-sm font-medium">{analysisProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${analysisProgress}%` }}></div>
          </div>
        </div>
      )}

      <div className={`bg-muted rounded-lg p-3 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Detected Elements</span>
          {isLoading ? (
            <div className="h-5 w-16 bg-gray-200 animate-pulse rounded-full"></div>
          ) : (
            <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full">
              {elements.length} items
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : elements.length > 0 ? (
          <div>
            {elements.map((element) => (
              <div key={element.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={element.selected}
                    onChange={() => onElementToggle(element.id)}
                  />
                  <div>
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-1 text-text/60">{element.icon}</span>
                      <span className="text-sm">{element.name}</span>
                    </div>
                    <span className="text-xs text-text/60">CSS: {element.selector}</span>
                  </div>
                </div>
                <div className="flex">
                  <button 
                    className="p-1 hover:bg-white rounded" 
                    title="Edit mapping"
                    onClick={() => onElementEdit(element)}
                  >
                    <span className="material-icons text-sm text-primary">edit</span>
                  </button>
                  <button 
                    className="p-1 hover:bg-white rounded" 
                    title="Preview"
                    onClick={() => handlePreview(element)}
                  >
                    <span className="material-icons text-sm text-primary">visibility</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="material-icons text-text/40 text-3xl mb-2">search_off</span>
            <p className="text-sm text-text/60">No elements detected</p>
            <p className="text-xs text-text/40 mt-1">Try scanning a different URL or add elements manually</p>
          </div>
        )}
        
        <button 
          className="w-full mt-2 text-primary text-sm font-medium hover:bg-white py-1.5 rounded flex items-center justify-center"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <span className="material-icons text-sm mr-1">add</span>
          Add Custom Element
        </button>
      </div>

      {/* Preview Dialog */}
      {previewElement && (
        <ElementPreviewDialog 
          element={previewElement}
          onClose={() => setPreviewElement(null)}
        />
      )}

      {/* Add Custom Element Dialog */}
      <AddElementDialog 
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddElement}
      />
    </section>
  );
}
