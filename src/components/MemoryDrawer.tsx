import React, { useState } from 'react';
import { Brain, X, Plus, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (text: string) => void;
  onDeleteMemory: (id: string) => void;
  onClearMemories: () => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearMemories,
}) => {
  const [newText, setNewText] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddMemory(newText.trim());
    setNewText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col p-6 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                ঐশীর দীর্ঘমেয়াদী স্মৃতি
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50">
                  {memories.length} টি তথ্য
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">ঐশী আপনার এই তথ্যগুলো সবসময় মনে রাখবে</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mt-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <span>
            কথোপকথন চলাকালীন ঐশী নিজে থেকেই আপনার নাম, পছন্দ, কাজ বা গুরুত্বপূর্ণ তথ্য চিহ্নিত করে স্মৃতিতে জমা রাখে।
          </span>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="নতুন তথ্য যোগ করুন (যেমন: আমি চা পছন্দ করি)..."
            className="flex-1 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          />
          <button
            type="submit"
            className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-lg shadow-purple-600/30"
          >
            <Plus className="w-4 h-4" />
            যোগ
          </button>
        </form>

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto my-4 space-y-2.5 pr-1">
          {memories.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Brain className="w-10 h-10 mb-2 opacity-30 stroke-1" />
              <p className="text-sm">এখনো কোনো স্মৃতি জমা হয়নি।</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                চ্যাটে আপনার নাম বা পছন্দের কথা বললে ঐশী স্বয়ংক্রিয়ভাবে তা মনে রাখবে!
              </p>
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                className="group p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 flex items-start justify-between gap-3 transition"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug">{m.text}</p>
                    <span className="text-[10px] text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteMemory(m.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {memories.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">মোট {memories.length} টি সক্রিয় স্মৃতি</span>
            <button
              onClick={onClearMemories}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline transition cursor-pointer"
            >
              সব স্মৃতি মুছে ফেলুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
