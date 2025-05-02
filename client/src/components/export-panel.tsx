import React, { useState } from "react";
import { DatabaseConnection } from "@/lib/types";

interface ExportPanelProps {
  isPremium: boolean;
  dbConnections: DatabaseConnection[];
  isLoadingConnections: boolean;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onExportDatabase: (params: { connectionId: string; tableName: string }) => void;
  isExportingCsv: boolean;
  isExportingExcel: boolean;
  isExportingToDb: boolean;
}

export function ExportPanel({
  isPremium,
  dbConnections,
  isLoadingConnections,
  onExportCsv,
  onExportExcel,
  onExportDatabase,
  isExportingCsv,
  isExportingExcel,
  isExportingToDb
}: ExportPanelProps) {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [tableName, setTableName] = useState<string>("scrapii_data");
  
  const handleDbExport = () => {
    if (selectedConnectionId && tableName) {
      onExportDatabase({ connectionId: selectedConnectionId, tableName });
    }
  };

  return (
    <section className="p-4">
      <h2 className="text-base font-google-sans font-medium section-title mb-3 flex items-center">
        <span className="material-icons text-primary mr-1.5">download</span>
        Export Options
      </h2>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <button 
            className="flex-1 bg-white border border-border hover:bg-muted py-2 px-3 rounded flex items-center justify-center text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onExportCsv}
            disabled={isExportingCsv}
          >
            <span className="material-icons text-sm mr-1.5">description</span>
            {isExportingCsv ? "Exporting..." : "Export as CSV"}
          </button>
          <button 
            className="flex-1 bg-white border border-border hover:bg-muted py-2 px-3 rounded flex items-center justify-center text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onExportExcel}
            disabled={isExportingExcel}
          >
            <span className="material-icons text-sm mr-1.5">grid_on</span>
            {isExportingExcel ? "Exporting..." : "Export as Excel"}
          </button>
        </div>
        
        {/* Database Export (Premium Feature) */}
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="material-icons text-accent mr-1">star</span>
              <span className="text-sm font-medium">Database Export</span>
            </div>
            <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">Premium</span>
          </div>
          
          {!isPremium ? (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text/70">Connect to your PostgreSQL database for direct data export</span>
              <button className="text-primary text-sm font-medium hover:underline">Upgrade</button>
            </div>
          ) : isLoadingConnections ? (
            <div className="animate-pulse space-y-2">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-full">
                  <select 
                    className="w-full p-2 border border-border rounded text-sm bg-white"
                    value={selectedConnectionId}
                    onChange={(e) => setSelectedConnectionId(e.target.value)}
                  >
                    <option value="">Select Database Connection</option>
                    {dbConnections.map((conn) => (
                      <option key={conn.id} value={conn.id}>{conn.name}</option>
                    ))}
                    <option value="new">+ Add New Connection</option>
                  </select>
                </div>
                <button 
                  className="bg-primary text-white p-2 rounded hover:bg-primary/90" 
                  title="Configure"
                >
                  <span className="material-icons text-sm">settings</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-full">
                  <input
                    type="text"
                    className="w-full p-2 border border-border rounded text-sm bg-white"
                    placeholder="Table name"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    disabled={!selectedConnectionId || selectedConnectionId === "new"}
                  />
                </div>
                <button 
                  className="bg-secondary text-white px-3 py-2 rounded text-sm font-medium hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDbExport}
                  disabled={!selectedConnectionId || selectedConnectionId === "new" || !tableName || isExportingToDb}
                >
                  {isExportingToDb ? "Exporting..." : "Export"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
