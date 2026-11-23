import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Hash,
} from 'lucide-react';
import { ConversationSummary } from '../types';

interface ConversationSummaryBannerProps {
  summary: ConversationSummary | null;
  isSummarizing: boolean;
  summaryError: string | null;
  messageCount: number;
  autoSummarize: boolean;
  onGenerateSummary: () => void;
  onToggleAutoSummarize: () => void;
}

export const ConversationSummaryBanner: React.FC<ConversationSummaryBannerProps> = ({
  summary,
  isSummarizing,
  summaryError,
  messageCount,
  autoSummarize,
  onGenerateSummary,
  onToggleAutoSummarize,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (messageCount === 0) return null;

  return (
    <div className="shrink-0 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/75 backdrop-blur-md px-4 py-2.5 z-20 transition-colors">
      <div className="max-w-3xl mx-auto rounded-xl border border-indigo-200 dark:border-indigo-500/25 bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/80 dark:from-indigo-950/40 dark:via-slate-900/80 dark:to-purple-950/30 px-3.5 py-2.5 shadow-sm">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-400/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
              {isSummarizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              কথোপকথনের সারসংক্ষেপ
            </span>
            {summary?.model && (
              <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/70 text-indigo-700 dark:text-indigo-300 font-mono shrink-0">
                {summary.model}
              </span>
            )}
            {summary?.updatedAt && !isSummarizing && (
              <span className="hidden md:inline-block text-[10px] text-slate-500 shrink-0">
                · {new Date(summary.updatedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleAutoSummarize}
              title={
                autoSummarize
                  ? 'স্বয়ংক্রিয় সারসংক্ষেপ চালু আছে (বন্ধ করতে ক্লিক করুন)'
                  : 'স্বয়ংক্রিয় সারসংক্ষেপ বন্ধ আছে (চালু করতে ক্লিক করুন)'
              }
              className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                autoSummarize
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {autoSummarize ? 'অটো: চালু' : 'অটো: বন্ধ'}
            </button>

            <button
              type="button"
              onClick={onGenerateSummary}
              disabled={isSummarizing}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-600/25 hover:bg-indigo-100 dark:hover:bg-indigo-600/40 disabled:opacity-50 border border-indigo-200 dark:border-indigo-500/35 text-indigo-700 dark:text-indigo-200 text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
              title="Gemini দিয়ে কথোপকথনের নতুন সারসংক্ষেপ তৈরি করুন"
            >
              <RefreshCw className={`w-3 h-3 ${isSummarizing ? 'animate-spin' : ''}`} />
              <span>{summary ? 'হালনাগাদ' : 'সারাংশ তৈরি করুন'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition cursor-pointer"
              aria-label={isCollapsed ? 'সারসংক্ষেপ দেখুন' : 'সারসংক্ষেপ ভাঁজ করুন'}
              title={isCollapsed ? 'বিস্তারিত দেখুন' : 'সংকুচিত করুন'}
            >
              {isCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        {!isCollapsed && (
          <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/70">
            {summaryError ? (
              <div className="flex items-start justify-between gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-lg px-2.5 py-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{summaryError}</span>
                </div>
                <button
                  type="button"
                  onClick={onGenerateSummary}
                  disabled={isSummarizing}
                  className="text-[11px] underline text-rose-700 dark:text-rose-200 hover:text-rose-900 dark:hover:text-white shrink-0 cursor-pointer"
                >
                  আবার চেষ্টা
                </button>
              </div>
            ) : isSummarizing && !summary ? (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 py-0.5">
                <Loader2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <span>Gemini কথোপকথনের মূল সারসংক্ষেপ তৈরি করছে...</span>
              </div>
            ) : summary ? (
              <div className="space-y-2">
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                  {summary.summary}
                </p>
                {summary.topics && summary.topics.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {summary.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/70 text-[11px] text-indigo-700 dark:text-indigo-300"
                      >
                        <Hash className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400" />
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                কথোপকথন এগিয়ে গেলে এখানে স্বয়ংক্রিয়ভাবে সংক্ষিপ্ত সারাংশ দেখা যাবে, অথবা <span className="text-indigo-600 dark:text-indigo-300 font-medium">&ldquo;সারাংশ তৈরি করুন&rdquo;</span> বাটনে ক্লিক করুন।
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
