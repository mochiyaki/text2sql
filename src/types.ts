// Types for the application

export interface DataRow {
  [key: string]: string | number | null | boolean;
}

export interface TableSchema {
  [tableName: string]: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | null;
  sql?: string | null;
  data?: DataRow[];
  error?: string | null;
}

export interface Config {
  port: number;
  model: string;
  api_key: string;
  show_sql: boolean;
  show_thinking: boolean;
}

export interface FileUploadProps {
  onDataLoaded: (tableName: string, data: DataRow[]) => void;
}

export interface MessageProps {
  message: Message;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: Config;
  setConfig: (config: Config) => void;
}

// Database types
export type SqlJsModule = import('sql.js').Database;
