export interface DetectedElement {
  id: string;
  type: 'text' | 'price' | 'image' | 'rating' | 'url' | 'custom';
  name: string;
  selector: string;
  icon: string;
  selected: boolean;
}

export interface PageInfo {
  url: string;
  title: string;
  favicon?: string;
}

export interface PreviewItem {
  [key: string]: string | number;
}

export interface PaginationInfo {
  pattern: string | null;
  currentPage: number;
  totalPages: number | null;
  detected: boolean;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  table?: string;
}

export interface ExtractionJob {
  id: string;
  url: string;
  timestamp: number;
  status: 'completed' | 'in-progress' | 'failed';
  elements: DetectedElement[];
  results?: any[];
}

export interface User {
  id: string;
  username: string;
  isPremium: boolean;
}

export interface ScrapingOptions {
  paginationOption: 'single' | 'all' | 'custom';
  customRange: {
    from: number;
    to: number;
    limit: number;
    limitEnabled: boolean;
  };
}
