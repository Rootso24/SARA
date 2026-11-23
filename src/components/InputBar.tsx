import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Globe,
  Volume2,
  VolumeX,
  Sparkles,
  Keyboard,
} from 'lucide-react';

interface InputBarProps {
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  isListening: boolean;
  listeningTranscript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  searchEnabled: boolean;
  onToggleSearch: () => void;
  currentProvider: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onOpenShortcuts?: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  isThinking,
  isListening,
  listeningTranscript,
  onStartListening,
  onStopListening,
  voiceEnabled,
  onToggleVoice,
  searchEnabled,
  onToggleSearch,
  currentProvider,
  inputRef,
  onOpenShortcuts,
}) => {
  const [inputText, setInputText] = useState('');
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? internalRef;

  // Sync listening transcript to input text
  useEffect(() => {
    if (listeningTranscript) {
      setInputText(listeningTranscript);
    }
  }, [listeningTranscript]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isThinking) return;

    if (isListening) {
      onStopListening();
    }

    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    // Send on Ctrl+Enter / Cmd+Enter or plain Enter (without Shift)
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (e.key === 'Escape') {
      textareaRef.current?.blur();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  return (
    <div className="w-full bg-white/90 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-4 py-3 transition-colors">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Floating Listening Waveform Banner when Mic is active */}
        {isListening && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-200 text-xs shadow-lg animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
              <span>ঐশী আপনার বাংলা কথা শুনছে... স্পষ্টভাবে বলুন</span>
            </div>
            <div className="flex items-center gap-1 h-3">
              <span className="w-1 bg-emerald-500 dark:bg-emerald-400 h-2 animate-bounce [animation-delay:-0.3s] rounded-full" />
              <span className="w-1 bg-emerald-500 dark:bg-emerald-400 h-3 animate-bounce [animation-delay:-0.15s] rounded-full" />
              <span className="w-1 bg-emerald-500 dark:bg-emerald-400 h-1.5 animate-bounce rounded-full" />
              <span className="w-1 bg-emerald-500 dark:bg-emerald-400 h-3 animate-bounce [animation-delay:-0.2s] rounded-full" />
            </div>
          </div>
        )}

        {/* Input Controls Bar */}
        <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm dark:shadow-xl focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/40 transition">
          {/* Quick Toggles: Voice & Search */}
          <div className="flex items-center gap-1 self-center pl-1">
            {/* 1. Voice Toggle (🔊 ⇄ 🔇 as requested in transcript) */}
            <button
              type="button"
              onClick={onToggleVoice}
              className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                voiceEnabled
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-200/70 dark:hover:bg-purple-900/50'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
              title={voiceEnabled ? 'কণ্ঠস্বর চালু (ক্লিক করে বন্ধ করুন)' : 'কণ্ঠস্বর বন্ধ (ক্লিক করে চালু করুন)'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* 2. Web Search Toggle (🌐 as requested in transcript) */}
            <button
              type="button"
              onClick={onToggleSearch}
              className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                searchEnabled
                  ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-200/70 dark:hover:bg-cyan-900/50 shadow-sm dark:shadow-cyan-900/40'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
              title={searchEnabled ? 'ইন্টারনেট সার্চ সক্রিয় (উইকিপিডিয়া তথ্য যুক্ত হবে)' : 'ইন্টারনেট সার্চ বন্ধ'}
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>

          {/* Text Input Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="ঐশীকে বাংলায় কিছু জিজ্ঞাসা করুন... (যেমন: ঢাকা কোন দেশের রাজধানী?)"
            className="flex-1 bg-transparent border-0 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 resize-none py-2 px-2 max-h-36 leading-relaxed"
          />

          {/* Right Action Buttons: Mic & Send */}
          <div className="flex items-center gap-1.5 self-center pr-1">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={isListening ? onStopListening : onStartListening}
              className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center ${
                isListening
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 animate-pulse'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
              title={isListening ? 'কথা বলা শেষ করতে ক্লিক করুন' : 'বাংলায় কথা বলতে ক্লিক করুন'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!inputText.trim() || isThinking}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
              title="পাঠান"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Sub-bar */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              ব্রেন: <strong className="text-slate-700 dark:text-slate-400 capitalize">{currentProvider}</strong>
            </span>
            {searchEnabled && (
              <span className="text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                <Globe className="w-3 h-3" /> সার্চ অন
              </span>
            )}
            {voiceEnabled && (
              <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> কণ্ঠ অন
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-600">
            <span className="hidden sm:inline">
              Ctrl+Enter / Enter পাঠাতে · Shift+Enter নতুন লাইন
            </span>
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                title="সকল কীবোর্ড শর্টকাট দেখুন (?)"
              >
                <Keyboard className="w-3 h-3" />
                <span>শর্টকাট (?)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
