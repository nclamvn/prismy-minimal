export interface DocumentAnalysis {
  type:
    | "technical"
    | "legal"
    | "literature"
    | "business"
    | "academic"
    | "general";
  language: string;
  complexity: number;
  pageCount: number;
  insights: string[];
  estimatedTime: string;
  requirements: string[];
}

export interface ProcessOptions {
  tier: "basic" | "standard" | "premium";
  targetLanguage: string;
  preserveFormatting?: boolean;
  onProgress?: (progress: number) => void;
  onDecision?: (decision: AIDecision) => void;
}

export interface AIDecision {
  type: "strategy" | "model" | "quality";
  description: string;
  confidence: number;
  timestamp: Date;
}
