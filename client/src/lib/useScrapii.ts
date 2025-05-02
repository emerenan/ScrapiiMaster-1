import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';
import type { 
  DetectedElement, 
  PageInfo, 
  PaginationInfo, 
  PreviewItem,
  ScrapingOptions,
  DatabaseConnection
} from './types';

export const useScrapii = (initialUrl: string = '') => {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState(initialUrl);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  
  const [scrapingOptions, setScrapingOptions] = useState<ScrapingOptions>({
    paginationOption: 'single',
    customRange: {
      from: 1,
      to: 5,
      limit: 10,
      limitEnabled: false
    }
  });

  // Query for page info
  const { 
    data: pageInfo,
    isLoading: isLoadingPageInfo,
    error: pageInfoError
  } = useQuery({
    queryKey: ['/api/analyze/page', url],
    enabled: !!url,
  });

  // Query for detected elements
  const { 
    data: elements = [],
    isLoading: isLoadingElements,
    error: elementsError
  } = useQuery({
    queryKey: ['/api/analyze/elements', url],
    enabled: !!url && aiEnabled,
  });

  // Query for pagination info
  const { 
    data: paginationInfo,
    isLoading: isLoadingPagination,
    error: paginationError
  } = useQuery({
    queryKey: ['/api/analyze/pagination', url],
    enabled: !!url && paginationEnabled,
  });

  // Query for premium status
  const { 
    data: isPremium = false
  } = useQuery({
    queryKey: ['/api/user/premium'],
  });

  // Query for database connections (premium only)
  const { 
    data: dbConnections = [],
    isLoading: isLoadingConnections
  } = useQuery({
    queryKey: ['/api/database/connections'],
    enabled: isPremium,
  });

  // Query for data preview based on selected elements
  const { 
    data: previewData = [],
    isLoading: isLoadingPreview,
    refetch: refreshPreview,
    error: previewError
  } = useQuery({
    queryKey: ['/api/preview', url, elements.filter(e => e.selected).map(e => e.id).join(',')],
    enabled: !!url && elements.filter(e => e.selected).length > 0,
  });

  // Rescan analysis mutation
  const { mutate: rescanPage, isPending: isRescanningPage } = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/analyze/rescan', { url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyze/page', url] });
      queryClient.invalidateQueries({ queryKey: ['/api/analyze/elements', url] });
      queryClient.invalidateQueries({ queryKey: ['/api/analyze/pagination', url] });
    }
  });

  // Toggle element selection
  const toggleElementSelection = (elementId: string) => {
    const updatedElements = elements.map(element => 
      element.id === elementId 
        ? { ...element, selected: !element.selected } 
        : element
    );
    
    // Update the query cache
    queryClient.setQueryData(['/api/analyze/elements', url], updatedElements);
  };

  // Edit element mapping
  const { mutate: updateElement } = useMutation({
    mutationFn: async (updatedElement: DetectedElement) => {
      await apiRequest('PUT', `/api/elements/${updatedElement.id}`, updatedElement);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyze/elements', url] });
    }
  });

  // Start extraction mutation
  const { mutate: startExtraction, isPending: isExtracting } = useMutation({
    mutationFn: async () => {
      const selectedElements = elements.filter(e => e.selected);
      return apiRequest('POST', '/api/extract', { 
        url, 
        elements: selectedElements,
        pagination: paginationEnabled ? {
          option: scrapingOptions.paginationOption,
          customRange: scrapingOptions.paginationOption === 'custom' ? scrapingOptions.customRange : undefined
        } : null
      });
    },
    onSuccess: async (response) => {
      const result = await response.json();
      // After extraction, refresh preview data
      refreshPreview();
      return result;
    }
  });

  // Export to CSV mutation
  const { mutate: exportToCsv, isPending: isExportingCsv } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/export/csv', { 
        url, 
        elements: elements.filter(e => e.selected),
        pagination: paginationEnabled ? {
          option: scrapingOptions.paginationOption,
          customRange: scrapingOptions.paginationOption === 'custom' ? scrapingOptions.customRange : undefined
        } : null
      });
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `scrapii-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });

  // Export to Excel mutation
  const { mutate: exportToExcel, isPending: isExportingExcel } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/export/excel', { 
        url, 
        elements: elements.filter(e => e.selected),
        pagination: paginationEnabled ? {
          option: scrapingOptions.paginationOption,
          customRange: scrapingOptions.paginationOption === 'custom' ? scrapingOptions.customRange : undefined
        } : null
      });
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `scrapii-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });

  // Export to Database mutation (premium)
  const { mutate: exportToDatabase, isPending: isExportingToDb } = useMutation({
    mutationFn: async ({ connectionId, tableName }: { connectionId: string, tableName: string }) => {
      await apiRequest('POST', '/api/export/database', { 
        url, 
        elements: elements.filter(e => e.selected),
        pagination: paginationEnabled ? {
          option: scrapingOptions.paginationOption,
          customRange: scrapingOptions.paginationOption === 'custom' ? scrapingOptions.customRange : undefined
        } : null,
        connectionId,
        tableName
      });
    }
  });

  // Add custom element mutation
  const { mutate: addCustomElement } = useMutation({
    mutationFn: async (newElement: Omit<DetectedElement, 'id'>) => {
      await apiRequest('POST', '/api/elements', { ...newElement, url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyze/elements', url] });
    }
  });

  return {
    // State
    url,
    setUrl,
    aiEnabled,
    setAiEnabled,
    paginationEnabled,
    setPaginationEnabled,
    scrapingOptions,
    setScrapingOptions,
    
    // Data
    pageInfo,
    elements,
    paginationInfo,
    previewData,
    isPremium,
    dbConnections,
    
    // Loading states
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
    
    // Errors
    pageInfoError,
    elementsError,
    paginationError,
    previewError,
    
    // Actions
    rescanPage,
    toggleElementSelection,
    updateElement,
    startExtraction,
    exportToCsv,
    exportToExcel,
    exportToDatabase,
    refreshPreview,
    addCustomElement
  };
};
