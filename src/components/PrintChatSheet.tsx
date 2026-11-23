import React from 'react';
import { AIProvider, ChatMessage } from '../types';

interface PrintChatSheetProps {
  messages: ChatMessage[];
  provider: AIProvider;
  includeMetadata: boolean;
}

export const PrintChatSheet: React.FC<PrintChatSheetProps> = ({
  messages,
  provider,
  includeMetadata,
}) => {
  const providerLabel =
    provider === 'gemini'
      ? 'Google Gemini'
      : provider === 'deepseek'
      ? 'DeepSeek'
      : 'Local Ollama';

  return (
    <div id="oishi-print-sheet" className="hidden print:block bg-white text-slate-900 p-2 font-sans">
      {/* Document Header */}
      <div className="border-b-2 border-indigo-600 pb-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              HEY OISHI AI (ঐশী) — কথোপকথনের রেকর্ড
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              ব্যক্তিগত বাংলা এআই ভার্চুয়াল সহকারী · পরিপাটি প্রিন্ট ও শেয়ার সংস্করণ
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 shrink-0">
            <div>মোট বার্তা: {messages.length} টি</div>
            {includeMetadata && (
              <>
                <div>এআই ব্রেন: {providerLabel}</div>
                <div>প্রিন্টের সময়: {new Date().toLocaleString('bn-BD')}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const roleTitle = isUser
            ? '👤 আপনি (User)'
            : msg.role === 'assistant'
            ? '🌸 ঐশী (OISHI)'
            : '⚙️ সিস্টেম (System)';

          return (
            <article
              key={msg.id}
              className={`break-inside-avoid rounded-xl border p-4 ${
                isUser
                  ? 'border-indigo-200 bg-indigo-50/40'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/80">
                <span
                  className={`text-sm font-semibold ${
                    isUser ? 'text-indigo-800' : 'text-slate-900'
                  }`}
                >
                  {roleTitle}
                </span>

                {includeMetadata && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    {msg.model && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-slate-700">
                        {msg.model}
                      </span>
                    )}
                    <span>{new Date(msg.timestamp).toLocaleString('bn-BD')}</span>
                  </div>
                )}
              </div>

              {includeMetadata && msg.searchResult && (
                <div className="mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900">
                    🌐 উইকিপিডিয়া সূত্র: {msg.searchResult.title}
                  </div>
                  <p className="mt-1 text-slate-600">{msg.searchResult.summary}</p>
                  <div className="mt-1 text-[10px] text-indigo-700 break-all">
                    {msg.searchResult.url}
                  </div>
                </div>
              )}

              <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                {msg.content}
              </div>

              {includeMetadata && msg.newMemories && msg.newMemories.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-200/80 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900 mb-1">🧠 সংরক্ষিত স্মৃতি:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {msg.newMemories.map((mem, idx) => (
                      <li key={idx}>{mem}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
