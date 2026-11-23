import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  Volume2,
  Square,
  Copy,
  Check,
  Globe,
  Brain,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  ExternalLink,
  Pin,
  PinOff,
} from 'lucide-react';
import { ChatMessage, ConversationSummary } from '../types';
import { ConversationSummaryBanner } from './ConversationSummaryBanner';
import { PinnedMessagesBar } from './PinnedMessagesBar';

interface ChatTimelineProps {
  messages: ChatMessage[];
  isThinking: boolean;
  isSpeaking: boolean;
  speakingMessageId: string | null;
  onSpeakMessage: (text: string, messageId?: string) => void;
  onSendPrompt: (promptText: string) => void;
  onTogglePinMessage: (id: string) => void;
  onClearAllPinned: () => void;
  summary: ConversationSummary | null;
  isSummarizing: boolean;
  summaryError: string | null;
  autoSummarize: boolean;
  onGenerateSummary: () => void;
  onToggleAutoSummarize: () => void;
}

export const ChatTimeline: React.FC<ChatTimelineProps> = ({
  messages,
  isThinking,
  isSpeaking,
  speakingMessageId,
  onSpeakMessage,
  onSendPrompt,
  onTogglePinMessage,
  onClearAllPinned,
  summary,
  isSummarizing,
  summaryError,
  autoSummarize,
  onGenerateSummary,
  onToggleAutoSummarize,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const pinnedMessages = useMemo(
    () =>
      messages
        .filter((m) => m.pinned)
        .sort((a, b) => (b.pinnedAt ?? b.timestamp) - (a.pinnedAt ?? a.timestamp)),
    [messages]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isThinking]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleJumpToMessage = (id: string) => {
    const el = messageRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(id);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedId(null);
    }, 1800);
  };

  const starterPrompts = [
    {
      title: 'ঐশীর পরিচয়',
      desc: 'তোমার পরিচয় দাও এবং কী কী করতে পারো বলো',
      icon: '🌸',
    },
    {
      title: 'স্মৃতি পরীক্ষা',
      desc: 'আমার নাম আশরাফুল এবং আমি সফটওয়্যার পছন্দ করি, এটা মনে রাখো',
      icon: '🧠',
    },
    {
      title: 'তথ্য সন্ধান (উইকিপিডিয়া)',
      desc: 'ঢাকা শহরের প্রাচীন ইতিহাস ও গুরুত্ব কী?',
      icon: '🌐',
    },
    {
      title: 'প্রযুক্তি তুলনা',
      desc: 'ডিপসিক (DeepSeek) ও জেমিনির (Gemini) মধ্যে মূল পার্থক্য কী?',
      icon: '⚡',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ConversationSummaryBanner
        summary={summary}
        isSummarizing={isSummarizing}
        summaryError={summaryError}
        messageCount={messages.length}
        autoSummarize={autoSummarize}
        onGenerateSummary={onGenerateSummary}
        onToggleAutoSummarize={onToggleAutoSummarize}
      />

      <PinnedMessagesBar
        pinnedMessages={pinnedMessages}
        onUnpinMessage={onTogglePinMessage}
        onClearAllPinned={onClearAllPinned}
        onJumpToMessage={handleJumpToMessage}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center pt-4 pb-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-950/40">
              <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              নমস্কার! আমি <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">ঐশী (OISHI)</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md leading-relaxed mb-8">
              আপনার নিজস্ব বাংলা ভার্চুয়াল এআই সহকারী। আমি কথা শুনতে পারি, মুখে উত্তর দিতে পারি, আপনার পছন্দ মনে রাখি এবং ইন্টারনেটে তথ্য অনুসন্ধান করতে পারি।
            </p>

            {/* Quick Starters */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {starterPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendPrompt(p.desc)}
                  className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-slate-900 transition flex items-start gap-3 text-left cursor-pointer shadow-sm hover:shadow-md dark:hover:shadow-indigo-950/30"
                >
                  <span className="text-xl shrink-0 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 group-hover:scale-110 transition">
                    {p.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition flex items-center justify-between">
                      {p.title}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-indigo-600 dark:text-indigo-400" />
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isPinned = Boolean(msg.pinned);
              const isHighlighted = highlightedId === msg.id;

              return (
                <div
                  key={msg.id}
                  ref={(el) => {
                    messageRefs.current[msg.id] = el;
                  }}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 dark:shadow-indigo-900/40 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`group max-w-[85%] rounded-2xl px-4 py-3.5 shadow-sm dark:shadow-md transition-all duration-300 ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                    } ${
                      isPinned
                        ? isUser
                          ? 'ring-2 ring-amber-400/80 dark:ring-amber-400/70'
                          : 'border-amber-300 dark:border-amber-500/40 ring-1 ring-amber-300/60 dark:ring-amber-500/25'
                        : ''
                    } ${
                      isHighlighted
                        ? 'ring-2 ring-amber-500 dark:ring-amber-400 shadow-lg shadow-amber-500/20'
                        : ''
                    }`}
                  >
                    {/* Pinned Indicator Badge */}
                    {isPinned && (
                      <div
                        className={`mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          isUser
                            ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                            : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        <Pin className="w-2.5 h-2.5" />
                        পিন করা বার্তা
                      </div>
                    )}

                    {/* Internet Search Reference Badge if available */}
                    {!isUser && msg.searchResult && (
                      <div className="mb-3 p-2.5 rounded-xl bg-cyan-50/70 dark:bg-slate-950/70 border border-cyan-200 dark:border-cyan-800/40 text-xs text-cyan-800 dark:text-cyan-300 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium text-cyan-900 dark:text-cyan-200">
                            <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            উইকিপিডিয়া অনুসন্ধান: {msg.searchResult.title}
                          </span>
                          {msg.searchResult.url && (
                            <a
                              href={msg.searchResult.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
                            >
                              উৎস <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {msg.searchResult.summary}
                        </p>
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
                      {msg.content}
                    </div>

                    {/* System Memory Extraction Notification Card */}
                    {!isUser && msg.newMemories && msg.newMemories.length > 0 && (
                      <div className="mt-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-purple-800 dark:text-purple-300">
                            সিস্টেম: {msg.newMemories.length} টি নতুন তথ্য মনে রাখা হয়েছে
                          </div>
                          <ul className="list-disc list-inside text-[11px] text-purple-700/90 dark:text-purple-200/80 mt-1 space-y-0.5">
                            {msg.newMemories.map((mem, idx) => (
                              <li key={idx}>{mem}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Message Actions Footer */}
                    {!isUser ? (
                      (() => {
                        const isThisSpeaking = isSpeaking && speakingMessageId === msg.id;
                        return (
                          <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-800/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSpeakMessage(msg.content, msg.id)}
                                aria-pressed={isThisSpeaking}
                                aria-label={
                                  isThisSpeaking ? 'অডিও থামান (Stop Audio)' : 'অডিও শুনুন (Play Audio)'
                                }
                                className={`px-2 py-1 rounded-lg transition flex items-center gap-1.5 text-[11px] font-medium cursor-pointer ${
                                  isThisSpeaking
                                    ? 'bg-indigo-100 dark:bg-indigo-500/25 text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-300 dark:ring-indigo-500/40'
                                    : 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800'
                                }`}
                                title={
                                  isThisSpeaking
                                    ? 'অডিও বন্ধ করতে ক্লিক করুন'
                                    : 'টেক্সট-টু-স্পিচ (Audio) শুনুন'
                                }
                              >
                                {isThisSpeaking ? (
                                  <>
                                    <Square className="w-3 h-3 fill-current animate-pulse" />
                                    <span>Stop Audio</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>Audio</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(msg.id, msg.content)}
                                className="p-1 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 text-[11px] cursor-pointer"
                                title="কপি করুন"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-emerald-600 dark:text-emerald-400">কপি হয়েছে</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    কপি
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => onTogglePinMessage(msg.id)}
                                aria-pressed={isPinned}
                                className={`p-1 rounded-lg transition flex items-center gap-1 text-[11px] cursor-pointer ${
                                  isPinned
                                    ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 font-medium'
                                    : 'hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title={isPinned ? 'পিন সরান' : 'বার্তাটি পিন করুন'}
                              >
                                {isPinned ? (
                                  <>
                                    <PinOff className="w-3.5 h-3.5" />
                                    আনপিন
                                  </>
                                ) : (
                                  <>
                                    <Pin className="w-3.5 h-3.5" />
                                    পিন
                                  </>
                                )}
                              </button>
                            </div>

                            {msg.model && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                {msg.model}
                              </span>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="mt-2 pt-1.5 border-t border-white/15 flex items-center justify-end gap-1.5 text-[11px] text-indigo-100/85">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.id, msg.content)}
                          className="px-1.5 py-0.5 rounded-md hover:bg-white/15 hover:text-white transition flex items-center gap-1 cursor-pointer"
                          title="কপি করুন"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-300" />
                              <span className="text-emerald-200">কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              কপি
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onTogglePinMessage(msg.id)}
                          aria-pressed={isPinned}
                          className={`px-1.5 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer ${
                            isPinned
                              ? 'bg-amber-400/25 text-amber-200 hover:bg-amber-400/35 font-medium'
                              : 'hover:bg-white/15 hover:text-white'
                          }`}
                          title={isPinned ? 'পিন সরান' : 'বার্তাটি পিন করুন'}
                        >
                          {isPinned ? (
                            <>
                              <PinOff className="w-3 h-3" />
                              আনপিন
                            </>
                          ) : (
                            <>
                              <Pin className="w-3 h-3" />
                              পিন
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 shadow-sm dark:shadow-md mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking Indicator Bubble */}
            {isThinking && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/40 text-slate-700 dark:text-slate-300 flex items-center gap-2.5 shadow-sm dark:shadow-md">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-bounce" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">ঐশী উত্তর ভাবছে ও তথ্য সাজাচ্ছে...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};

