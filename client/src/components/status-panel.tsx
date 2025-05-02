import React from "react";
import { PageInfo } from "@/lib/types";

interface StatusPanelProps {
  pageInfo?: PageInfo;
  isLoading: boolean;
  onRescan: () => void;
  isRescanning: boolean;
}

export function StatusPanel({ 
  pageInfo, 
  isLoading, 
  onRescan, 
  isRescanning 
}: StatusPanelProps) {
  return (
    <section className="p-3 border-b border-border bg-muted">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          {isLoading ? (
            <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4 mb-2"></div>
          ) : (
            <p className="text-sm text-text/70 truncate">
              {pageInfo?.url || "No URL detected"}
            </p>
          )}
          
          <div className="flex items-center">
            {isLoading ? (
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
            ) : (
              <>
                {pageInfo ? (
                  <>
                    <span className="material-icons text-secondary mr-1 text-sm">check_circle</span>
                    <p className="text-sm font-medium">Page ready for scraping</p>
                  </>
                ) : (
                  <>
                    <span className="material-icons text-accent mr-1 text-sm">info</span>
                    <p className="text-sm font-medium">Enter a URL to analyze</p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        
        <button 
          className="bg-primary text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-primary/90 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onRescan}
          disabled={isRescanning || !pageInfo}
        >
          <span className="material-icons text-sm mr-1">
            {isRescanning ? "sync" : "refresh"}
          </span>
          {isRescanning ? "Scanning..." : "Rescan"}
        </button>
      </div>
    </section>
  );
}
