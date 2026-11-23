export type AIProvider = 'gemini' | 'deepseek' | 'ollama';
export type ExportFormat = 'json' | 'markdown' | 'pdf';
export type ThemeMode = 'dark' | 'light';

export interface SearchResult {
  title: string;
  summary: string;
  url: string;
  language: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: AIProvider;
  model?: string;
  searchResult?: SearchResult | null;
  newMemories?: string[];
  isThinking?: boolean;
  pinned?: boolean;
  pinnedAt?: number;
}

export interface MemoryItem {
  id: string;
  text: string;
  category?: 'identity' | 'preference' | 'work' | 'general';
  createdAt: number;
}

export interface ConversationSummary {
  summary: string;
  topics: string[];
  messageCount: number;
  updatedAt: number;
  model: string;
}

export interface AppSettings {
  provider: AIProvider;
  geminiModel: string;
  deepseekEnabled: boolean;
  deepseekApiKey: string;
  deepseekModel: string;
  deepseekEndpoint: string;
  deepseekKeyVerifiedAt?: number;
  ollamaEndpoint: string;
  ollamaModel: string;
  voiceEnabled: boolean;
  selectedVoiceName: string;
  voicePitch: number;
  voiceRate: number;
  searchEnabled: boolean;
  avatarStyle: 'vibrant' | 'hologram' | 'minimal';
  defaultExportFormat: ExportFormat;
  exportIncludeMetadata: boolean;
  autoSummarize: boolean;
  theme: ThemeMode;
}
