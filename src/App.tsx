import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { OishiAvatar } from './components/OishiAvatar';
import { TopBar } from './components/TopBar';
import { ChatTimeline } from './components/ChatTimeline';
import { InputBar } from './components/InputBar';
import { MemoryDrawer } from './components/MemoryDrawer';
import { SettingsModal, SettingsTab } from './components/SettingsModal';
import { ShortcutsModal, ShortcutDisplayItem } from './components/ShortcutsModal';
import { PrintChatSheet } from './components/PrintChatSheet';
import { useVoice } from './hooks/useVoice';
import { useKeyboardShortcuts, ShortcutBinding } from './hooks/useKeyboardShortcuts';
import { ChatMessage, MemoryItem, AppSettings, AIProvider, ExportFormat, ConversationSummary } from './types';
import { exportChatAsJson, exportChatAsMarkdown, exportChatAsPdf } from './utils/exportChat';
import { Volume2, Sparkles, Globe, Brain, Mic, ShieldAlert } from 'lucide-react';

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting-1',
  role: 'assistant',
  content: 'নমস্কার! আমি ঐশী (HEY OISHI AI) — আপনার ব্যক্তিগত বাংলা এআই ভার্চুয়াল সহকারী।\n\nআমি চমৎকার বাংলায় কথা বলতে পারি, যেকোনো প্রশ্নের নির্ভরযোগ্য তথ্য খুঁজে দিতে পারি, এবং আপনার ব্যক্তিগত তথ্য বা পছন্দ মনে রেখে কাজ করতে পারি। আপনি কি জানতে চান?',
  timestamp: Date.now(),
  model: 'gemini-3.8-flash',
};

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'gemini',
  geminiModel: 'gemini-3.8-flash',
  deepseekEnabled: false,
  deepseekApiKey: '',
  deepseekModel: 'deepseek-chat',
  deepseekEndpoint: 'https://api.deepseek.com/chat/completions',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'qwen2.5:7b',
  voiceEnabled: true,
  selectedVoiceName: '',
  voicePitch: 1.05,
  voiceRate: 1.0,
  searchEnabled: false,
  avatarStyle: 'vibrant',
  defaultExportFormat: 'markdown',
  exportIncludeMetadata: true,
  autoSummarize: true,
  theme: 'dark',
};

const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    text: 'ব্যবহারকারী বাংলায় কথা বলতে এবং পরিষ্কার উত্তর পেতে পছন্দ করেন।',
    category: 'preference',
    createdAt: Date.now() - 3600000,
  },
];

export default function App() {
  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('oishi_chat_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [INITIAL_GREETING];
  });

  // Memories State
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('oishi_ai_memories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_MEMORIES;
  });

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('oishi_ai_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          deepseekEnabled:
            typeof parsed.deepseekEnabled === 'boolean'
              ? parsed.deepseekEnabled
              : Boolean(parsed.deepseekApiKey),
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // UI state
  const [isThinking, setIsThinking] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('ai');
  const [showAvatarPanel, setShowAvatarPanel] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const [conversationSummary, setConversationSummary] = useState<ConversationSummary | null>(() => {
    try {
      const saved = localStorage.getItem('oishi_chat_summary');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setShortcutToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShortcutToast(null), 2200);
  }, []);

  const openSettingsModal = useCallback((tab: SettingsTab = 'ai') => {
    setSettingsInitialTab(tab);
    setIsSettingsOpen(true);
  }, []);

  // Voice Engine
  const {
    voices,
    isSpeaking,
    speakingMessageId,
    isListening,
    listeningTranscript,
    mouthOpen,
    mouthShape,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  } = useVoice();

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('oishi_chat_messages', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Save memories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('oishi_ai_memories', JSON.stringify(memories));
    } catch {
      // ignore
    }
  }, [memories]);

  // Save settings to localStorage & sync document root theme class
  useEffect(() => {
    try {
      localStorage.setItem('oishi_ai_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle('dark', settings.theme !== 'light');
  }, [settings]);

  const handleToggleTheme = useCallback(() => {
    setSettings((prev) => {
      const nextTheme = prev.theme === 'dark' ? 'light' : 'dark';
      showToast(nextTheme === 'light' ? '☀️ লাইট মোড চালু হয়েছে' : '🌙 ডার্ক মোড চালু হয়েছে');
      return { ...prev, theme: nextTheme };
    });
  }, [showToast]);

  // Save conversation summary to localStorage
  useEffect(() => {
    try {
      if (conversationSummary) {
        localStorage.setItem('oishi_chat_summary', JSON.stringify(conversationSummary));
      } else {
        localStorage.removeItem('oishi_chat_summary');
      }
    } catch {
      // ignore
    }
  }, [conversationSummary]);

  // Generate Gemini conversation summary
  const handleGenerateSummary = useCallback(
    async (targetMessages: ChatMessage[] = messages) => {
      if (!targetMessages || targetMessages.length === 0) return;

      setIsSummarizing(true);
      setSummaryError(null);

      try {
        const res = await fetch('/api/chat/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: targetMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `সারসংক্ষেপ ত্রুটি (${res.status})`);
        }

        setConversationSummary({
          summary: data.summary,
          topics: Array.isArray(data.topics) ? data.topics : [],
          messageCount: data.messageCount || targetMessages.length,
          updatedAt: data.updatedAt || Date.now(),
          model: data.model || 'gemini-4-hydrogen',
        });
      } catch (err: any) {
        setSummaryError(err?.message || 'সারসংক্ষেপ তৈরি করা যায়নি।');
      } finally {
        setIsSummarizing(false);
      }
    },
    [messages]
  );

  // Handle Voice Speak Action (supports toggling playback for a specific message)
  const handleSpeak = useCallback(
    (text: string, messageId?: string) => {
      if (messageId && isSpeaking && speakingMessageId === messageId) {
        stopSpeaking();
        return;
      }
      speak(text, {
        voiceName: settings.selectedVoiceName,
        rate: settings.voiceRate,
        pitch: settings.voicePitch,
        messageId,
      });
    },
    [
      isSpeaking,
      speakingMessageId,
      stopSpeaking,
      speak,
      settings.selectedVoiceName,
      settings.voiceRate,
      settings.voicePitch,
    ]
  );

  // Send Message Logic
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;

    if (settings.provider === 'deepseek' && (!settings.deepseekEnabled || !settings.deepseekApiKey.trim())) {
      setErrorMessage('DeepSeek ব্যবহার করতে অনুগ্রহ করে DeepSeek API ট্যাব থেকে এটি চালু করুন এবং বৈধ API কী সংরক্ষণ করুন।');
      openSettingsModal('deepseek');
      return;
    }

    setErrorMessage(null);
    stopSpeaking();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsThinking(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          provider: settings.provider,
          apiKey: settings.provider === 'deepseek' ? settings.deepseekApiKey : undefined,
          model:
            settings.provider === 'deepseek'
              ? settings.deepseekModel
              : settings.provider === 'gemini'
              ? settings.geminiModel
              : settings.ollamaModel,
          enableSearch: settings.searchEnabled,
          memories: memories.map((m) => m.text),
          deepseekEndpoint: settings.deepseekEndpoint,
          ollamaEndpoint: settings.ollamaEndpoint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `সার্ভার ত্রুটি: ${response.status}`);
      }

      const assistantReply = data.reply || 'দুঃখিত, কোনো উত্তর প্রস্তুত করা যায়নি।';

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantReply,
        timestamp: Date.now(),
        provider: data.provider,
        model: data.model,
        searchResult: data.searchResult,
      };

      const updatedMessages = [...nextMessages, assistantMsg];
      setMessages(updatedMessages);

      // If voice enabled, speak the answer
      if (settings.voiceEnabled) {
        handleSpeak(assistantReply, assistantMsg.id);
      }

      // Background Smart Memory Extraction
      extractMemories(text, assistantReply, assistantMsg.id);

      // Background Conversation Summary update if auto-summarize is enabled
      if (settings.autoSummarize) {
        handleGenerateSummary(updatedMessages);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errText = err.message || 'একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে সেটিংস বা ইন্টারনেট পরীক্ষা করুন।';
      setErrorMessage(errText);

      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${errText}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  // Smart Memory Extraction helper
  const extractMemories = async (userText: string, assistantReply: string, msgId: string) => {
    try {
      const res = await fetch('/api/memory/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userText,
          assistantReply,
          currentMemories: memories.map((m) => m.text),
        }),
      });

      const data = await res.json();
      if (data.newMemories && Array.isArray(data.newMemories) && data.newMemories.length > 0) {
        const newItems: MemoryItem[] = data.newMemories.map((text: string, i: number) => ({
          id: `mem-${Date.now()}-${i}`,
          text,
          category: 'general',
          createdAt: Date.now(),
        }));

        setMemories((prev) => [...prev, ...newItems]);

        // Attach to the assistant message for the badge
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, newMemories: data.newMemories } : m
          )
        );
      }
    } catch (err) {
      console.warn('Memory extraction failed silently:', err);
    }
  };

  // Memory Actions
  const handleAddMemory = (text: string) => {
    const newItem: MemoryItem = {
      id: `mem-${Date.now()}`,
      text,
      category: 'general',
      createdAt: Date.now(),
    };
    setMemories((prev) => [newItem, ...prev]);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearMemories = () => {
    if (window.confirm('আপনি কি সত্যিই সব স্মৃতি মুছে ফেলতে চান?')) {
      setMemories([]);
    }
  };

  // Pin / Unpin Messages
  const handleTogglePinMessage = useCallback(
    (messageId: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const nextPinned = !m.pinned;
          showToast(nextPinned ? '📌 বার্তাটি পিন করা হয়েছে' : '📌 বার্তার পিন সরানো হয়েছে');
          return {
            ...m,
            pinned: nextPinned,
            pinnedAt: nextPinned ? Date.now() : undefined,
          };
        })
      );
    },
    [showToast]
  );

  const handleClearAllPinned = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) => (m.pinned ? { ...m, pinned: false, pinnedAt: undefined } : m))
    );
    showToast('📌 সব পিন করা বার্তা সরানো হয়েছে');
  }, [showToast]);

  // Reset Chat
  const handleResetChat = useCallback(() => {
    if (window.confirm('কথোপকথন মুছে নতুন চ্যাট শুরু করতে চান?')) {
      stopSpeaking();
      setMessages([INITIAL_GREETING]);
      setConversationSummary(null);
      setSummaryError(null);
    }
  }, [stopSpeaking]);

  // Export Chat Handler (JSON / Markdown / PDF)
  const handleExportChat = useCallback(
    (
      format: ExportFormat = settings.defaultExportFormat,
      includeMetadata: boolean = settings.exportIncludeMetadata
    ) => {
      if (messages.length === 0) return;

      if (format === 'json') {
        exportChatAsJson(messages, { provider: settings.provider, includeMetadata });
        showToast('📥 কথোপকথন Raw JSON (.json) ডাউনলোড হয়েছে');
      } else if (format === 'pdf') {
        exportChatAsPdf();
        showToast('🖨️ Pretty-printed PDF প্রিন্ট ডায়ালগ খোলা হয়েছে');
      } else {
        exportChatAsMarkdown(messages, { provider: settings.provider, includeMetadata });
        showToast('📥 কথোপকথন Cleaned Markdown (.md) ডাউনলোড হয়েছে');
      }
    },
    [messages, settings.defaultExportFormat, settings.exportIncludeMetadata, settings.provider, showToast]
  );

  // Keyboard Shortcuts System
  const shortcutBindings: ShortcutBinding[] = useMemo(
    () => [
      {
        id: 'open-settings',
        key: 'k',
        ctrlOrMeta: true,
        allowInInput: true,
        category: 'navigation',
        displayKeys: ['Ctrl', 'K'],
        description: 'সেটিংস ও এপিআই কনফিগারেশন খুলুন / বন্ধ করুন',
        handler: () => {
          setIsMemoryOpen(false);
          setIsShortcutsOpen(false);
          setIsSettingsOpen((prev) => !prev);
        },
      },
      {
        id: 'open-memory',
        key: 'm',
        ctrlOrMeta: true,
        allowInInput: true,
        category: 'navigation',
        displayKeys: ['Ctrl', 'M'],
        description: 'ঐশীর দীর্ঘমেয়াদী স্মৃতি প্যানেল খুলুন / বন্ধ করুন',
        handler: () => {
          setIsSettingsOpen(false);
          setIsShortcutsOpen(false);
          setIsMemoryOpen((prev) => !prev);
        },
      },
      {
        id: 'focus-input-slash',
        key: '/',
        allowInInput: false,
        category: 'chat',
        displayKeys: ['/'],
        description: 'চ্যাট ইনপুট বক্সে দ্রুত ফোকাস করুন',
        handler: () => {
          if (!isSettingsOpen && !isMemoryOpen && !isShortcutsOpen) {
            chatInputRef.current?.focus();
          }
        },
      },
      {
        id: 'focus-input-ctrl',
        key: 'l',
        ctrlOrMeta: true,
        allowInInput: true,
        category: 'chat',
        displayKeys: ['Ctrl', 'L'],
        description: 'যেকোনো জায়গা থেকে চ্যাট ইনপুটে ফোকাস করুন',
        handler: () => {
          setIsSettingsOpen(false);
          setIsMemoryOpen(false);
          setIsShortcutsOpen(false);
          setTimeout(() => chatInputRef.current?.focus(), 0);
        },
      },
      {
        id: 'toggle-voice-tts',
        key: 'v',
        ctrlOrMeta: true,
        shift: true,
        allowInInput: true,
        category: 'tools',
        displayKeys: ['Ctrl', 'Shift', 'V'],
        description: 'ঐশীর বাংলা কণ্ঠস্বর (TTS) চালু বা বন্ধ করুন',
        handler: () => {
          setSettings((prev) => {
            const next = !prev.voiceEnabled;
            if (!next) stopSpeaking();
            showToast(next ? '🔊 বাংলা কণ্ঠস্বর চালু হয়েছে' : '🔇 বাংলা কণ্ঠস্বর বন্ধ হয়েছে');
            return { ...prev, voiceEnabled: next };
          });
        },
      },
      {
        id: 'toggle-web-search',
        key: 's',
        ctrlOrMeta: true,
        shift: true,
        allowInInput: true,
        category: 'tools',
        displayKeys: ['Ctrl', 'Shift', 'S'],
        description: 'উইকিপিডিয়া ইন্টারনেট সার্চ চালু বা বন্ধ করুন',
        handler: () => {
          setSettings((prev) => {
            const next = !prev.searchEnabled;
            showToast(next ? '🌐 ইন্টারনেট সার্চ চালু হয়েছে' : '🌐 ইন্টারনেট সার্চ বন্ধ হয়েছে');
            return { ...prev, searchEnabled: next };
          });
        },
      },
      {
        id: 'toggle-mic',
        key: 'm',
        ctrlOrMeta: true,
        shift: true,
        allowInInput: true,
        category: 'tools',
        displayKeys: ['Ctrl', 'Shift', 'M'],
        description: 'ভয়েস ইনপুট (মাইক্রোফোন) চালু বা বন্ধ করুন',
        handler: () => {
          if (isListening) {
            stopListening();
            showToast('🎙️ ভয়েস ইনপুট বন্ধ হয়েছে');
          } else {
            stopSpeaking();
            startListening(
              (text) => handleSendMessage(text),
              (err) => setErrorMessage(err)
            );
            showToast('🎙️ ঐশী আপনার কথা শুনছে...');
          }
        },
      },
      {
        id: 'export-chat',
        key: 'e',
        ctrlOrMeta: true,
        shift: true,
        allowInInput: true,
        category: 'tools',
        displayKeys: ['Ctrl', 'Shift', 'E'],
        description: 'ডিফল্ট ফরম্যাটে (PDF / Markdown / JSON) কথোপকথন ডাউনলোড করুন',
        handler: () => {
          handleExportChat(settings.defaultExportFormat, settings.exportIncludeMetadata);
        },
      },
      {
        id: 'reset-chat',
        key: 'n',
        ctrlOrMeta: true,
        shift: true,
        allowInInput: true,
        category: 'chat',
        displayKeys: ['Ctrl', 'Shift', 'N'],
        description: 'কথোপকথন রিসেট করে নতুন চ্যাট শুরু করুন',
        handler: () => {
          handleResetChat();
        },
      },
      {
        id: 'open-shortcuts-help',
        key: '?',
        shift: true,
        allowInInput: false,
        category: 'navigation',
        displayKeys: ['?'],
        description: 'কীবোর্ড শর্টকাটের তালিকা খুলুন',
        handler: () => {
          setIsShortcutsOpen((prev) => !prev);
        },
      },
      {
        id: 'open-shortcuts-help-direct',
        key: '?',
        allowInInput: false,
        category: 'navigation',
        displayKeys: ['?'],
        description: 'কীবোর্ড শর্টকাটের তালিকা খুলুন',
        handler: () => {
          setIsShortcutsOpen((prev) => !prev);
        },
      },
      {
        id: 'escape-close',
        key: 'Escape',
        allowInInput: true,
        category: 'navigation',
        displayKeys: ['Esc'],
        description: 'খোলা পপআপ বন্ধ করুন অথবা কণ্ঠ থামান',
        handler: () => {
          if (isShortcutsOpen) {
            setIsShortcutsOpen(false);
          } else if (isSettingsOpen) {
            setIsSettingsOpen(false);
          } else if (isMemoryOpen) {
            setIsMemoryOpen(false);
          } else if (document.activeElement === chatInputRef.current) {
            chatInputRef.current?.blur();
          } else if (isSpeaking) {
            stopSpeaking();
            showToast('🔇 কথা বলা থামানো হয়েছে');
          } else if (isListening) {
            stopListening();
          }
        },
      },
    ],
    [
      isSettingsOpen,
      isMemoryOpen,
      isShortcutsOpen,
      isListening,
      isSpeaking,
      settings.defaultExportFormat,
      settings.exportIncludeMetadata,
      stopSpeaking,
      stopListening,
      startListening,
      handleExportChat,
      handleResetChat,
      showToast,
    ]
  );

  useKeyboardShortcuts(shortcutBindings);

  const shortcutDisplayList: ShortcutDisplayItem[] = useMemo(() => {
    const inputShortcuts: ShortcutDisplayItem[] = [
      {
        id: 'send-ctrl-enter',
        category: 'chat',
        displayKeys: ['Ctrl', 'Enter'],
        description: 'বার্তা পাঠান (অথবা সরাসরি Enter চাপুন)',
      },
      {
        id: 'newline-shift-enter',
        category: 'chat',
        displayKeys: ['Shift', 'Enter'],
        description: 'চ্যাট ইনপুটে নতুন লাইন যোগ করুন',
      },
    ];

    const seen = new Set<string>();
    const uniqueBindings: ShortcutDisplayItem[] = [];
    for (const b of shortcutBindings) {
      const sig = `${b.category}:${b.displayKeys.join('+')}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      uniqueBindings.push({
        id: b.id,
        category: b.category,
        displayKeys: b.displayKeys,
        description: b.description,
      });
    }

    return [...inputShortcuts, ...uniqueBindings];
  }, [shortcutBindings]);

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans print:hidden transition-colors">
      {/* LEFT COLUMN: OISHI AVATAR STUDIO */}
      <aside
        className={`${
          showAvatarPanel ? 'flex' : 'hidden'
        } lg:flex w-full lg:w-[380px] xl:w-[420px] flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl relative z-20 shrink-0 p-6 justify-between select-none overflow-y-auto transition-colors`}
      >
        {/* Top Info Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
              OISHI AVATAR LIVE
            </span>
          </div>

          <button
            onClick={() => {
              setSettings((prev) => ({
                ...prev,
                avatarStyle: prev.avatarStyle === 'hologram' ? 'vibrant' : 'hologram',
              }));
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition cursor-pointer"
            title="লুক পরিবর্তন"
          >
            {settings.avatarStyle === 'hologram' ? '🌈 ভাইব্রেন্ট মোড' : '💠 হলোগ্রাম মোড'}
          </button>
        </div>

        {/* Center: The Animated Oishi Avatar */}
        <div className="my-auto py-6 flex flex-col items-center justify-center">
          <div className="w-64 h-76 sm:w-72 sm:h-84 relative">
            <OishiAvatar
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              isListening={isListening}
              mouthOpen={mouthOpen}
              mouthShape={mouthShape}
              avatarStyle={settings.avatarStyle}
              onAvatarClick={() => {
                if (!isSpeaking) {
                  handleSpeak('হ্যাঁ, আমি শুনছি! বলুন কীভাবে সাহায্য করতে পারি?');
                }
              }}
            />
          </div>

          {/* Dynamic Audio Waveform Visualizer */}
          <div className="mt-4 flex items-center gap-1.5 h-5 px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/60 shadow-inner">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => {
              const heightClass = isSpeaking
                ? bar % 2 === 0
                  ? 'h-4 bg-pink-500 dark:bg-pink-400'
                  : 'h-2 bg-indigo-500 dark:bg-indigo-400'
                : isListening
                ? bar % 3 === 0
                  ? 'h-4 bg-emerald-500 dark:bg-emerald-400'
                  : 'h-1.5 bg-teal-500 dark:bg-teal-400'
                : 'h-1 bg-slate-300 dark:bg-slate-700';

              return (
                <span
                  key={bar}
                  className={`w-1 rounded-full transition-all duration-150 ${heightClass}`}
                />
              );
            })}
          </div>

          {/* Friendly Interactive Hint */}
          <p className="text-[11px] text-slate-500 mt-2 text-center">
            অ্যাভাটারের উপরে ক্লিক করে কথা শুনতে পারেন
          </p>
        </div>

        {/* Bottom Feature Badges & Quick Action */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] text-slate-500">বাংলা কণ্ঠ</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {settings.voiceEnabled ? 'সক্রিয় (TTS)' : 'নিঃশব্দ'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] text-slate-500">স্মৃতি</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{memories.length} টি তথ্য</span>
              </div>
            </div>
          </div>

          {/* Quick Greeting Button */}
          <button
            onClick={() => handleSendMessage('হ্যালো ঐশী! কেমন আছো?')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 dark:from-indigo-600/30 dark:via-purple-600/30 dark:to-pink-600/30 hover:from-indigo-500/25 hover:via-purple-500/25 hover:to-pink-500/25 dark:hover:from-indigo-600/40 dark:hover:via-purple-600/40 dark:hover:to-pink-600/40 border border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-200 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            হ্যালো বলো ঐশীকে 👋
          </button>
        </div>
      </aside>

      {/* RIGHT COLUMN: CHAT & INTERACTION SUITE */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/60 dark:bg-slate-950/40 relative transition-colors">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-800 px-4 py-2 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              {errorMessage}
            </span>
            <button
              onClick={() => openSettingsModal(settings.provider === 'deepseek' ? 'deepseek' : 'ai')}
              className="underline hover:text-rose-950 dark:hover:text-white ml-2 shrink-0 cursor-pointer"
            >
              সেটিংস খুলুন
            </button>
          </div>
        )}

        {/* Top Bar */}
        <TopBar
          currentProvider={settings.provider}
          deepseekEnabled={settings.deepseekEnabled && Boolean(settings.deepseekApiKey.trim())}
          onSelectProvider={(p: AIProvider) => {
            if (p === 'deepseek' && (!settings.deepseekEnabled || !settings.deepseekApiKey.trim())) {
              openSettingsModal('deepseek');
              return;
            }
            setSettings({ ...settings, provider: p });
          }}
          memoryCount={memories.length}
          messageCount={messages.length}
          defaultExportFormat={settings.defaultExportFormat}
          onExportChat={(format) => handleExportChat(format)}
          onOpenExportSettings={() => openSettingsModal('export')}
          onOpenMemory={() => setIsMemoryOpen(true)}
          onOpenSettings={() => openSettingsModal('ai')}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onResetChat={handleResetChat}
          showAvatarPanel={showAvatarPanel}
          onToggleAvatarPanel={() => setShowAvatarPanel(!showAvatarPanel)}
          theme={settings.theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Chat Timeline */}
        <ChatTimeline
          messages={messages}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          speakingMessageId={speakingMessageId}
          onSpeakMessage={handleSpeak}
          onSendPrompt={handleSendMessage}
          onTogglePinMessage={handleTogglePinMessage}
          onClearAllPinned={handleClearAllPinned}
          summary={conversationSummary}
          isSummarizing={isSummarizing}
          summaryError={summaryError}
          autoSummarize={settings.autoSummarize}
          onGenerateSummary={() => handleGenerateSummary(messages)}
          onToggleAutoSummarize={() =>
            setSettings((prev) => {
              const next = !prev.autoSummarize;
              showToast(next ? '✨ অটো সারসংক্ষেপ চালু হয়েছে' : '✨ অটো সারসংক্ষেপ বন্ধ হয়েছে');
              return { ...prev, autoSummarize: next };
            })
          }
        />

        {/* Bottom Input Controls */}
        <InputBar
          onSendMessage={handleSendMessage}
          isThinking={isThinking}
          isListening={isListening}
          listeningTranscript={listeningTranscript}
          onStartListening={() => {
            stopSpeaking();
            startListening(
              (text) => handleSendMessage(text),
              (err) => setErrorMessage(err)
            );
          }}
          onStopListening={stopListening}
          voiceEnabled={settings.voiceEnabled}
          onToggleVoice={() => {
            const next = !settings.voiceEnabled;
            setSettings({ ...settings, voiceEnabled: next });
            if (!next) stopSpeaking();
          }}
          searchEnabled={settings.searchEnabled}
          onToggleSearch={() => {
            setSettings({ ...settings, searchEnabled: !settings.searchEnabled });
          }}
          currentProvider={
            settings.provider === 'gemini'
              ? 'Gemini 3.8 Flash (ফ্রি)'
              : settings.provider === 'deepseek'
              ? settings.deepseekModel || 'DeepSeek'
              : 'Ollama লোকাল'
          }
          inputRef={chatInputRef}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        {/* Subtle Keyboard Shortcut Feedback Toast */}
        {shortcutToast && (
          <div className="pointer-events-none fixed bottom-24 right-6 z-40 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-indigo-300 dark:border-indigo-500/40 text-xs font-medium text-slate-900 dark:text-slate-100 shadow-2xl backdrop-blur-md">
            {shortcutToast}
          </div>
        )}
      </main>

      {/* MODALS & DRAWERS */}
      <MemoryDrawer
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearMemories={handleClearMemories}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          setErrorMessage(null);
          setSettings(newSettings);
        }}
        voices={voices}
        initialTab={settingsInitialTab}
        messageCount={messages.length}
        onQuickExport={(format, includeMetadata) => handleExportChat(format, includeMetadata)}
        onTestVoice={(voiceName, rate, pitch) => {
          speak('নমস্কার! আমি ঐশী, আপনার ব্যক্তিগত বাংলা এআই সহকারী।', {
            voiceName,
            rate,
            pitch,
          });
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        shortcuts={shortcutDisplayList}
      />
    </div>

    <PrintChatSheet
      messages={messages}
      provider={settings.provider}
      includeMetadata={settings.exportIncludeMetadata}
    />
  </>
  );
}
