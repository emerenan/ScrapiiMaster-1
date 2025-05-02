import React from "react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { PaginationInfo, ScrapingOptions } from "@/lib/types";

interface PaginationPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  paginationInfo?: PaginationInfo;
  isLoading: boolean;
  options: ScrapingOptions;
  onOptionsChange: (options: ScrapingOptions) => void;
}

export function PaginationPanel({
  enabled,
  onToggle,
  paginationInfo,
  isLoading,
  options,
  onOptionsChange
}: PaginationPanelProps) {
  
  const handlePaginationOptionChange = (option: 'single' | 'all' | 'custom') => {
    onOptionsChange({
      ...options,
      paginationOption: option
    });
  };

  const handleCustomRangeChange = (field: keyof ScrapingOptions['customRange'], value: number | boolean) => {
    onOptionsChange({
      ...options,
      customRange: {
        ...options.customRange,
        [field]: value
      }
    });
  };

  return (
    <section className="p-4 border-b border-border">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-google-sans font-medium section-title flex items-center">
          <span className="material-icons text-primary mr-1.5">pages</span>
          Pagination
        </h2>
        <ToggleSwitch 
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>
      
      <div className={`mb-3 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {isLoading ? (
          <div className="h-5 w-64 bg-gray-200 animate-pulse rounded mb-2"></div>
        ) : paginationInfo?.detected ? (
          <p className="text-sm text-text/70 mb-2">
            Detected pagination pattern: <span className="font-medium">{paginationInfo.pattern}</span>
          </p>
        ) : (
          <p className="text-sm text-text/70 mb-2">No pagination pattern detected</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <button 
            className={`pagination-option px-3 py-1.5 rounded-full text-sm font-medium ${options.paginationOption === 'single' ? 'selected' : ''}`}
            onClick={() => handlePaginationOptionChange('single')}
          >
            Current Page
          </button>
          <button 
            className={`pagination-option px-3 py-1.5 rounded-full text-sm font-medium ${options.paginationOption === 'all' ? 'selected' : ''}`}
            onClick={() => handlePaginationOptionChange('all')}
            disabled={!paginationInfo?.detected}
          >
            All Pages
          </button>
          <button 
            className={`pagination-option px-3 py-1.5 rounded-full text-sm font-medium ${options.paginationOption === 'custom' ? 'selected' : ''}`}
            onClick={() => handlePaginationOptionChange('custom')}
            disabled={!paginationInfo?.detected}
          >
            Custom Range
          </button>
        </div>
      </div>
      
      {/* Custom Range Controls */}
      {enabled && options.paginationOption === 'custom' && (
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <label className="text-sm">From page:</label>
            <input 
              type="number" 
              min="1" 
              value={options.customRange.from} 
              onChange={(e) => handleCustomRangeChange('from', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 p-1.5 border border-border rounded text-sm"
            />
            <label className="text-sm">To page:</label>
            <input 
              type="number" 
              min={options.customRange.from} 
              value={options.customRange.to} 
              onChange={(e) => handleCustomRangeChange('to', Math.max(options.customRange.from, parseInt(e.target.value) || options.customRange.from))}
              className="w-16 p-1.5 border border-border rounded text-sm"
            />
          </div>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="limit-pages" 
              className="mr-2"
              checked={options.customRange.limitEnabled}
              onChange={(e) => handleCustomRangeChange('limitEnabled', e.target.checked)}
            />
            <label htmlFor="limit-pages" className="text-sm">Limit to max</label>
            <input 
              type="number" 
              min="1" 
              value={options.customRange.limit} 
              onChange={(e) => handleCustomRangeChange('limit', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 p-1.5 border border-border rounded text-sm ml-2"
              disabled={!options.customRange.limitEnabled}
            />
            <label className="text-sm ml-1">pages</label>
          </div>
        </div>
      )}
    </section>
  );
}
