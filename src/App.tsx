import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { Send, Settings, Database, Code, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import Papa from 'papaparse';
import initSqlJs from 'sql.js';
import { DataRow, FileUploadProps, MessageProps as MessagePropsType, SettingsModalProps, Config, Message, SqlJsModule } from './types';
import { cn } from './utils';

// --- Components ---

function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploading(true);
    setError(null);
    let loadedCount = 0;

    acceptedFiles.forEach(file => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results: { data: DataRow[] }) => {
          try {
            const tableName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
            onDataLoaded(tableName, results.data);
            loadedCount++;
            if (loadedCount === acceptedFiles.length) {
              setUploading(false);
            }
          } catch (err) {
            console.error(err);
            setError(`Failed to parse ${file.name}`);
            setUploading(false);
          }
        },
        error: (err: Papa.ParseError) => {
          console.error(err);
          setError(`Error reading ${file.name}: ${err.message}`);
          setUploading(false);
        }
      });
    });
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] }
  });

  return (
    <div className="mb-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive ? "border-primary-500 bg-primary-500/10" : "border-dark-border hover:border-gray-400 hover:bg-dark-surface/50",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-400 font-medium">
            {uploading ? "Processing..." : "Drag & drop CSV files here, or click to select"}
          </p>
          <p className="text-xs text-gray-500">Supported formats: .csv</p>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function ChatMessage({ message }: MessagePropsType) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full mb-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[85%] rounded-2xl px-5 py-4 shadow-sm",
        isUser
          ? "bg-primary-600 text-white rounded-br-sm"
          : "bg-dark-surface border border-dark-border text-gray-200 rounded-bl-sm"
      )}>
        {/* Text Content */}
        {message.content && (
          <div className="whitespace-pre-wrap leading-relaxed pb-2">
            {message.content}
          </div>
        )}

        {/* SQL Code Block */}
        {message.sql && (
          <div className="mt-3 mb-3">
            <div className="flex items-center justify-between bg-black/30 px-3 py-1.5 rounded-t-lg border-b border-dark-border">
              <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                <Code className="w-3 h-3" /> SQL Query
              </span>
            </div>
            <div className="bg-[#0d1117] rounded-b-lg border border-dark-border p-3 overflow-x-auto">
              <code className="text-sm font-mono text-green-400 block whitespace-pre">
                {message.sql}
              </code>
            </div>
          </div>
        )}

        {/* Data Table */}
        {message.data && message.data.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-dark-border bg-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-dark-bg/50 border-b border-dark-border">
                  <tr>
                    {Object.keys(message.data[0]).map((key) => (
                      <th key={key} className="px-4 py-3 font-medium whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {message.data.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-4 py-3 whitespace-nowrap text-gray-300">
                          {val === null ? <span className="text-gray-600 italic">null</span> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-dark-bg/30 text-xs text-gray-500 border-t border-dark-border text-right">
              {message.data.length} rows loaded
            </div>
          </div>
        )}
        {message.error && (
          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{message.error}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SettingsModal({ isOpen, onClose, config, setConfig }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-dark-surface border border-dark-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-bg/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-400" />
            Settings
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Endpoint Config */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Model Configuration</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Port</label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 11434 })}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">API Key</label>
                <input
                  type="text"
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  placeholder="EMPTY"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Model Name</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* SQL Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-dark-border pt-4">
            <div>
              <span className="block text-sm font-medium text-gray-300">Show SQL Query</span>
              <span className="text-xs text-gray-500">Display the generated SQL alongside results</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.show_sql}
                onChange={(e) => setConfig({ ...config, show_sql: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-bg peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Thinking Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-dark-border pt-4">
            <div>
              <span className="block text-sm font-medium text-gray-300">Show Thinking Process</span>
              <span className="text-xs text-gray-500">Display the model's thinking process in responses</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.show_thinking}
                onChange={(e) => setConfig({ ...config, show_thinking: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-bg peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-dark-bg/50 px-6 py-4 flex justify-end border-t border-dark-border">
          <button
            onClick={onClose}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}


function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I can help you query your CSV data using SQL. Please upload a dataset to get started.' }
  ]);
  const [input, setInput] = useState('');
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Database State
  const dbRef = useRef<SqlJsModule | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [schemas, setSchemas] = useState<{ [tableName: string]: string }>({});

  // Configuration State
  const [config, setConfig] = useState<Config>({
    port: 1234,
    model: "t2sql",
    api_key: "EMPTY",
    show_sql: true,
    show_thinking: true
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize SQL.js
  useEffect(() => {
    const initDB = async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: (file: string) => `/sql-wasm.wasm`
        });
        dbRef.current = new SQL.Database();
        setDbReady(true);
        console.log("SQL.js initialized successfully");
      } catch (err) {
        console.error("Failed to initialize SQL.js:", err);
      }
    };
    initDB();
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDataLoaded = useCallback((tableName: string, data: DataRow[]) => {
    if (!dbRef.current || data.length === 0) return;

    try {
      // 1. Infer Columns and Types
      const columns = Object.keys(data[0]);
      const colDefs = columns.map(col => {
        // Simple type inference based on first row
        const val = data[0][col];
        let type = "TEXT";
        if (typeof val === 'number') {
          type = Number.isInteger(val) ? "INTEGER" : "REAL";
        }
        return `"${col}" ${type}`;
      });

      // 2. Create Table
      const createStmt = `CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefs.join(", ")});`;
      dbRef.current.run(createStmt);

      // 3. Insert Data
      const insertStmt = `INSERT INTO "${tableName}" VALUES (${columns.map(() => '?').join(", ")});`;
      const stmt = dbRef.current.prepare(insertStmt);

      dbRef.current.exec("BEGIN TRANSACTION");
      data.forEach(row => {
        const values = columns.map(col => row[col]) as import('sql.js').SqlValue[];
        stmt.run(values);
      });
      dbRef.current.exec("COMMIT");
      stmt.free();

      // 4. Update Schema for LLM
      setSchemas(prev => ({
        ...prev,
        [tableName]: createStmt
      }));

      setTables(prev => prev.includes(tableName) ? prev : [...prev, tableName]);

    } catch (err) {
      console.error("Error loading table into DB:", err);
    }
  }, []);

  // Helper function to remove <thinking> tags from content
  const stripThinkingTags = useCallback((content: string | null): string | null => {
    if (!content) return null;
    // Remove <think>...</think> or <thinking>...</thinking> blocks and the tags themselves, handling potential truncations
    return content.replace(/<think(?:ing)?[\s\S]*?(?:<\/think(?:ing)?>|$)/gi, '').trim();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!dbReady || tables.length === 0) {
      setMessages(prev => [...prev, { role: 'user', content: input }]);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Please upload a CSV dataset first so I can query it!"
        }]);
      }, 500);
      setInput('');
      return;
    }

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 1. Construct Schema Prompt
      const schemaStr = Object.values(schemas).join("\n\n");
      const systemPrompt = `You are a problem solving model working on task_description XML block:
<task_description>You are given a database schema and a natural language question. Generate the SQL query that answers the question.

Input:
- Schema: One or two table definitions in SQL DDL format
- Question: Natural language question about the data

Output:
- A single SQL query that answers the question
- No explanations, comments, or additional text

Rules:
- Use only tables and columns from the provided schema
- Use uppercase SQL keywords (SELECT, FROM, WHERE, etc.)
- Use SQLite-compatible syntax</task_description>
You will be given a single task in the question XML block
Solve only the task in question block.
Generate only the solution, do not generate anything else`;

      const userPrompt = `
Now for the real task, solve the task in question block.
Generate only the solution, do not generate anything else
<question>
Schema:
${schemaStr}

Question: ${userMessage.content}
</question>
`;

      // 2. Call LLM (Server.py)
      // Note: We access the server directly from browser. 
      // Ensure your server handles CORS or you might need a proxy.
      const chatResponse = await axios.post(`http://localhost:${config.port}/v1/chat/completions`, {
        model: config.model,
        messages: [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: userPrompt }
        ],
        temperature: 0,
        max_tokens: 1024
      });

      let rawContent = (chatResponse.data as any).choices[0].message.content.trim();

      // Clean SQL - remove thinking tags and markdown
      // We always strip thinking tags for execution to avoid syntax errors
      const strippedContent = stripThinkingTags(rawContent);
      let sqlContent = strippedContent !== null ? strippedContent : rawContent;
      let sql = sqlContent.replace(/```sql/g, '').replace(/```/g, '').trim();

      // 3. Execute SQL
      let results: DataRow[] = [];
      let error: string | null = null;

      try {
        const stmt = dbRef.current?.prepare(sql);
        while (stmt?.step()) {
          const row = stmt.getAsObject() as DataRow;
          results.push(row);
        }
        stmt?.free();
      } catch (e) {
        error = (e as Error).message;
        console.error("SQL Execution Error:", e);
      }

      // Process content - remove thinking tags if disabled
      // Extract content from LLM response

      // The AI response contains both thinking process and the SQL answer
      // We need to extract just the SQL part, and strip thinking tags if disabled
      let contentFromLlm = rawContent.replace(/```sql/g, '').replace(/```/g, '').trim();

      // If thinking is disabled, strip the thinking tags from content
      const finalContent = config.show_thinking ? contentFromLlm : stripThinkingTags(contentFromLlm);

      const aiMessage: Message = {
        role: 'assistant',
        content: finalContent,
        sql: config.show_sql ? sql : null,
        data: results,
        error: error
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't connect to the model server. Is it running on the correct port?",
        error: (err as Error).message
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-screen w-full bg-dark-bg text-gray-100 overflow-hidden font-sans selection:bg-primary-500/30">

      {/* Sidebar - Data & Config */}
      <div className="w-80 border-r border-dark-border bg-dark-bg flex flex-col hidden md:flex">
        <div className="p-6 border-b border-dark-border">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent flex items-center gap-2">
            <Database className="w-6 h-6 text-primary-500" />
            Text2SQL
          </h1>
          <p className="text-xs text-gray-500 mt-1">Natural Language to SQL</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* Upload Section */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Dataset</h3>
            <FileUpload onDataLoaded={handleDataLoaded} />

            {tables.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-medium text-gray-500 mb-2 px-2 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Loaded Tables
                </h4>
                <ul className="space-y-1">
                  {tables.map(table => (
                    <li key={table} className="px-3 py-2 bg-dark-surface rounded-lg text-sm text-gray-300 border border-dark-border flex items-center gap-2">
                      <Database className="w-3 h-3 text-gray-500" />
                      {table}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!dbReady && (
              <div className="px-2 text-xs text-amber-500">Initializing Database Engine...</div>
            )}
          </section>

          {/* Quick Config Summary */}
          <section>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuration</h3>
              <button onClick={() => setIsSettingsOpen(true)} className="text-primary-400 hover:text-primary-300 transition-colors p-1">
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-dark-surface rounded-xl p-4 border border-dark-border text-xs space-y-2 text-gray-400">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="text-gray-300 truncate max-w-[120px]">{config.model}</span>
              </div>
              <div className="flex justify-between">
                <span>Port:</span>
                <span className="text-gray-300">{config.port}</span>
              </div>
              <div className="flex justify-between">
                <span>Show SQL:</span>
                <span className={config.show_sql ? "text-green-400" : "text-gray-500"}>{config.show_sql ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border text-xs text-gray-600 text-center">
          Powered by distillabs x gguf.org
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-gradient-to-b from-dark-bg to-[#0b1221]">

        {/* Header (Mobile only or minimal) */}
        <div className="h-14 border-b border-dark-border flex items-center justify-between px-6 md:justify-end bg-dark-bg/80 backdrop-blur-md sticky top-0 z-10">
          <div className="md:hidden font-bold text-primary-500">Text2SQL</div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-dark-surface rounded-lg transition-colors md:hidden"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} />
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-6"
              >
                <div className="bg-dark-surface border border-dark-border rounded-2xl px-5 py-4 rounded-bl-sm flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-gray-400">Generating SQL...</span>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-dark-bg border-t border-dark-border">
          <div className="max-w-4xl mx-auto relative cursor-text">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your data..."
              className="w-full bg-dark-surface border border-dark-border text-white placeholder-gray-500 text-sm md:text-base rounded-2xl pl-5 pr-14 py-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all shadow-lg resize-none overflow-hidden min-h-[60px]"
              rows={1}
              style={{ height: '60px' }} // Fixed height for simple implementation, usually dynamic
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-primary-900/20"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-600 mt-3">
            AI can make mistakes. Please verify generated SQL queries.
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            config={config}
            setConfig={setConfig}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
