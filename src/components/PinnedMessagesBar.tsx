import React, { useState } from 'react';
import {
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  ArrowDownRight,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface PinnedMessagesBarProps {
  pinnedMessages: ChatMessage[];
  onUnpinMessage: (id: string) => void;
  onClearAllPinned: () => void;
  onJumpToMessage: (id: string) => void;
}

export const PinnedMessagesBar: React.FC<PinnedMessagesBarProps> = ({
  pinnedMessages,
  onUnpinMessage,
  onClearAllPinned,
  onJumpToMessage,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/75 backdrop-blur-md px-4 py-2 z-20 transition-colors">
      <div className="max-w-3xl mx-auto rounded-xl border border-amber-300/80 dark:border-amber-500/30 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/70 dark:from-amber-950/35 dark:via-slate-900/85 dark:to-orange-950/25 px-3.5 py-2 shadow-sm">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300/70 dark:border-amber-400/30 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
              <Pin className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              পিন করা বার্তা
            </span>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30 shrink-0">
              {pinnedMessages.length} টি
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {pinnedMessages.length > 1 && (
              <button
                type="button"
                onClick={onClearAllPinned}
                className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700/60 text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer"
                title="সব পিন সরান"
              >
                সব আনপিন
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition cursor-pointer"
              aria-label={isCollapsed ? 'পিন করা বার্তা দেখুন' : 'পিন করা বার্তা ভাঁজ করুন'}
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

        {/* Pinned Message List */}
        {!isCollapsed && (
          <div className="mt-2 pt-2 border-t border-amber-200/70 dark:border-amber-500/20 max-h-40 overflow-y-auto space-y-1.5 pr-0.5">
            {pinnedMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className="group flex items-start justify-between gap-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-amber-200/70 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40 px-2.5 py-2 transition"
                >
                  <button
                    type="button"
                    onClick={() => onJumpToMessage(msg.id)}
                    className="flex-1 min-w-0 text-left flex items-start gap-2 cursor-pointer"
                    title="মূল বার্তায় যান"
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isUser
                          ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                          : 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {isUser ? 'আপনি' : 'ঐশী (OISHI)'}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString('bn-BD', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-300 opacity-0 group-hover:opacity-100 transition">
                          <ArrowDownRight className="w-3 h-3" />
                          দেখুন
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2 mt-0.5 leading-snug">
                        {msg.content}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUnpinMessage(msg.id)}
                    className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0 cursor-pointer"
                    aria-label="পিন সরান"
                    title="পিন সরান"
                  >
                    <PinOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
