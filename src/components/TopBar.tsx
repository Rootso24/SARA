import React, { useState, useRef, useEffect } from 'react';
import {
  Brain,
  Settings as SettingsIcon,
  RotateCcw,
  Sparkles,
  Cpu,
  Download,
  FileJson,
  FileText,
  Printer,
  SlidersHorizontal,
  Check,
  ChevronDown,
  Keyboard,
  Sun,
  Moon,
} from 'lucide-react';
import { AIProvider, ExportFormat, ThemeMode } from '../types';

interface TopBarProps {
  currentProvider: AIProvider;
  deepseekEnabled: boolean;
  onSelectProvider: (p: AIProvider) => void;
  memoryCount: number;
  messageCount: number;
  defaultExportFormat: ExportFormat;
  onExportChat: (format: ExportFormat) => void;
  onOpenExportSettings: () => void;
  onOpenMemory: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onResetChat: () => void;
  showAvatarPanel: boolean;
  onToggleAvatarPanel: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentProvider,
  deepseekEnabled,
  onSelectProvider,
  memoryCount,
  messageCount,
  defaultExportFormat,
  onExportChat,
  onOpenExportSettings,
  onOpenMemory,
  onOpenSettings,
  onOpenShortcuts,
  onResetChat,
  showAvatarPanel,
  onToggleAvatarPanel,
  theme,
  onToggleTheme,
}) => {
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloadedFormat, setDownloadedFormat] = useState<ExportFormat | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!downloadMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target as Node)
      ) {
        setDownloadMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDownloadMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [downloadMenuOpen]);

  const handleSelectFormat = (format: ExportFormat) => {
    onExportChat(format);
    setDownloadMenuOpen(false);
    setDownloadedFormat(format);
    setTimeout(() => setDownloadedFormat(null), 2000);
  };

  return (
    <header className="h-16 px-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/70 backdrop-blur-md flex items-center justify-between z-30 shrink-0 transition-colors">
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-950/40">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-indigo-700 dark:text-white text-base">
              ঐ
            </div>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg tracking-tight">
              HEY OISHI AI
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 font-medium">
              ঐশী v2.5
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            স্মার্ট বাংলা এআই সহকারী · অ্যানিমেটেড অ্যাভাটার ও ভয়েস
          </p>
        </div>
      </div>

      {/* Center: Fast Brain Switcher */}
      <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
        <button
          onClick={() => onSelectProvider('gemini')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
            currentProvider === 'gemini'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Gemini (ফ্রি)
        </button>
        <button
          onClick={() => onSelectProvider('deepseek')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
            currentProvider === 'deepseek'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title={deepseekEnabled ? 'DeepSeek চালু আছে' : 'DeepSeek সেটআপ ও চালু করতে ক্লিক করুন'}
        >
          <Cpu className="w-3.5 h-3.5" />
          DeepSeek
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              deepseekEnabled ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400 dark:bg-slate-600'
            }`}
          />
        </button>
        <button
          onClick={() => onSelectProvider('ollama')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
            currentProvider === 'ollama'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Ollama
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Toggle Avatar View on Mobile/Tablet */}
        <button
          onClick={onToggleAvatarPanel}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 lg:hidden ${
            showAvatarPanel
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>👩 অ্যাভাটার</span>
        </button>

        {/* Global Theme Toggle (Dark / Light) */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
          aria-pressed={theme === 'light'}
          title={theme === 'dark' ? 'লাইট মোড চালু করুন (Light Mode)' : 'ডার্ক মোড চালু করুন (Dark Mode)'}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400/70 dark:hover:border-amber-500/50 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline">লাইট</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden xl:inline">ডার্ক</span>
            </>
          )}
        </button>

        {/* Memory Drawer Trigger */}
        <button
          onClick={onOpenMemory}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-purple-400/70 dark:hover:border-purple-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs font-medium text-purple-700 dark:text-purple-300 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          title="স্মৃতি দেখুন ও পরিচালনা করুন"
        >
          <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="hidden sm:inline">স্মৃতি</span>
          <span className="px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-200 text-[10px]">
            {memoryCount}
          </span>
        </button>

        {/* Download Chat Dropdown */}
        <div className="relative" ref={downloadMenuRef}>
          <button
            type="button"
            disabled={messageCount === 0}
            onClick={() => setDownloadMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={downloadMenuOpen}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm ${
              downloadedFormat
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700/70 text-emerald-700 dark:text-emerald-300'
                : downloadMenuOpen
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-600/70 text-indigo-700 dark:text-indigo-200'
                : 'bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-400/70 dark:hover:border-indigo-700/60 hover:bg-slate-200/70 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
            }`}
            title="কথোপকথন ডাউনলোড করুন (PDF / Markdown / JSON)"
          >
            {downloadedFormat ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            )}
            <span className="hidden sm:inline">
              {downloadedFormat ? 'ডাউনলোড হয়েছে' : 'ডাউনলোড'}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-slate-500 dark:text-slate-400 transition-transform ${
                downloadMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {downloadMenuOpen && (
            <div
              role="menu"
              aria-label="Download Chat Format"
              className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 backdrop-blur-xl"
            >
              <div className="px-2.5 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                <span>চ্যাট রপ্তানি ফরম্যাট</span>
                <span className="text-slate-400 dark:text-slate-500">{messageCount} টি বার্তা</span>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelectFormat('pdf')}
                className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/90 transition flex items-start gap-2.5 cursor-pointer group"
              >
                <Printer className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2">
                    <span>Pretty-printed PDF (.pdf)</span>
                    {defaultExportFormat === 'pdf' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60">
                        ডিফল্ট
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    প্রিন্ট ও শেয়ারের উপযোগী পরিপাটি নথি
                  </div>
                </div>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelectFormat('markdown')}
                className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/90 transition flex items-start gap-2.5 cursor-pointer group"
              >
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2">
                    <span>Cleaned Markdown (.md)</span>
                    {defaultExportFormat === 'markdown' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60">
                        ডিফল্ট
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    পরিচ্ছন্ন ফরম্যাটেড টেক্সট ডকুমেন্ট
                  </div>
                </div>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelectFormat('json')}
                className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/90 transition flex items-start gap-2.5 cursor-pointer group"
              >
                <FileJson className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2">
                    <span>Raw JSON (.json)</span>
                    {defaultExportFormat === 'json' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60">
                        ডিফল্ট
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    মূল কাঠামো ও সম্পূর্ণ ডেটা রেকর্ড
                  </div>
                </div>
              </button>

              <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onOpenExportSettings();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/70 text-[11px] text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    ডাউনলোড সেটিংস পরিবর্তন করুন
                  </span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset Chat */}
        <button
          onClick={onResetChat}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
          title="নতুন চ্যাট শুরু করুন (Ctrl+Shift+N)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
          title="কীবোর্ড শর্টকাটসমূহ (?)"
          aria-label="কীবোর্ড শর্টকাট"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
          title="সেটিংস ও এপিআই (Ctrl+K)"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
