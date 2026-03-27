export interface CsvColumnStats {
  min: number;
  max: number;
  mean: number;
}

export interface CsvExpData {
  type: "csv";
  filename: string;
  columns: string[];
  numericColumns: string[];
  rowCount: number;
  preview: Record<string, string>[];
  stats: Record<string, CsvColumnStats>;
  uploadedAt: string;
}

export interface VisionAnalysis {
  available: boolean;
  caption?: string;
  captionConfidence?: number;
  ocrText?: string;
  objects?: Array<{ name: string; confidence: number }>;
  analyzedAt: string;
  error?: string;
}

export interface ImageExpData {
  type: "image";
  filename: string;
  mimeType: string;
  base64: string;
  uploadedAt: string;
  visionAnalysis?: VisionAnalysis;
}

export interface PdfDocumentIntelligence {
  available: boolean;
  analyzedAt: string;
  error?: string;
}

export interface PdfExpData {
  type: "pdf";
  filename: string;
  pageCount: number;
  chunkCount: number;
  uploadedAt: string;
  documentIntelligence?: PdfDocumentIntelligence;
  preview?: string[];
}
