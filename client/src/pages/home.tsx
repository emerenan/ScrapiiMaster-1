import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/status-panel";
import { AIAnalysisPanel } from "@/components/ai-analysis-panel";
import { PaginationPanel } from "@/components/pagination-panel";
import { DataPreviewPanel } from "@/components/data-preview-panel";
import { ExportPanel } from "@/components/export-panel";
import { useScrapii } from "@/lib/useScrapii";

export default function Home() {
  const [inputUrl, setInputUrl] = useState("");
  const {
    url,
    setUrl,
    aiEnabled,
    setAiEnabled,
    paginationEnabled,
    setPaginationEnabled,
    scrapingOptions,
    setScrapingOptions,
    pageInfo,
    elements,
    paginationInfo,
    previewData,
    isPremium,
    dbConnections,
    isLoadingPageInfo,
    isLoadingElements,
    isLoadingPagination,
    isLoadingPreview,
    isLoadingConnections,
    isRescanningPage,
    isExtracting,
    isExportingCsv,
    isExportingExcel,
    isExportingToDb,
    rescanPage,
    toggleElementSelection,
    updateElement,
    startExtraction,
    exportToCsv,
    exportToExcel,
    exportToDatabase,
    refreshPreview,
    addCustomElement
  } = useScrapii();

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl) {
      setUrl(inputUrl);
    }
  };

  const selectedElementsCount = elements.filter(e => e.selected).length;

  return (
    <div className="flex flex-col h-screen w-full max-w-[400px] mx-auto border border-border shadow-lg overflow-hidden">
      {/* Header Section */}
      <header className="bg-primary text-white py-3 px-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <span className="material-icons">data_exploration</span>
          <h1 className="text-xl font-google-sans font-medium">Scrapii</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-white hover:bg-white/10 rounded-full p-1.5" title="Settings">
            <span className="material-icons text-xl">settings</span>
          </button>
          <button className="text-white hover:bg-white/10 rounded-full p-1.5" title="Help">
            <span className="material-icons text-xl">help_outline</span>
          </button>
        </div>
      </header>

      {/* URL Input Section */}
      <div className="p-3 border-b border-border">
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <Input
            type="url"
            placeholder="Enter website URL"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1"
            required
          />
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90"
            disabled={isLoadingPageInfo || !inputUrl}
          >
            <span className="material-icons text-sm mr-1">search</span>
            Analyze
          </Button>
        </form>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <StatusPanel 
          pageInfo={pageInfo}
          isLoading={isLoadingPageInfo}
          onRescan={rescanPage}
          isRescanning={isRescanningPage}
        />

        <AIAnalysisPanel
          enabled={aiEnabled}
          onToggle={setAiEnabled}
          elements={elements}
          isLoading={isLoadingElements}
          onElementToggle={toggleElementSelection}
          onElementEdit={updateElement}
          onElementAdd={addCustomElement}
        />

        <PaginationPanel
          enabled={paginationEnabled}
          onToggle={setPaginationEnabled}
          paginationInfo={paginationInfo}
          isLoading={isLoadingPagination}
          options={scrapingOptions}
          onOptionsChange={setScrapingOptions}
        />

        <DataPreviewPanel
          previewData={previewData}
          isLoading={isLoadingPreview}
          onRefresh={refreshPreview}
          elements={elements}
        />

        <ExportPanel
          isPremium={isPremium}
          dbConnections={dbConnections}
          isLoadingConnections={isLoadingConnections}
          onExportCsv={exportToCsv}
          onExportExcel={exportToExcel}
          onExportDatabase={exportToDatabase}
          isExportingCsv={isExportingCsv}
          isExportingExcel={isExportingExcel}
          isExportingToDb={isExportingToDb}
        />
      </main>

      {/* Footer/Action Section */}
      <footer className="bg-muted border-t border-border p-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs text-text/60">
              {selectedElementsCount} {selectedElementsCount === 1 ? 'item' : 'items'} selected
            </span>
            <div className="flex items-center text-xs text-primary cursor-pointer">
              <span className="material-icons text-xs mr-0.5">history</span>
              View extraction history
            </div>
          </div>
          <Button 
            className="bg-primary text-white flex items-center"
            onClick={() => startExtraction()}
            disabled={isExtracting || selectedElementsCount === 0 || !url}
          >
            <span className="material-icons text-sm mr-1">
              {isExtracting ? "sync" : "play_arrow"}
            </span>
            {isExtracting ? "Extracting..." : "Start Extraction"}
          </Button>
        </div>
      </footer>
    </div>
  );
}
