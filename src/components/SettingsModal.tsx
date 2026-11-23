import React, { useState, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Sparkles,
  Volume2,
  Cpu,
  Palette,
  ExternalLink,
  CheckCircle,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Trash2,
  Download,
  FileJson,
  FileText,
  Printer,
} from 'lucide-react';
import { AppSettings, ExportFormat } from '../types';

export type SettingsTab = 'ai' | 'deepseek' | 'voice' | 'avatar' | 'export';

interface ValidationResult {
  status: 'idle' | 'validating' | 'valid' | 'invalid';
  message?: string;
  details?: {
    endpointType?: string;
    latencyMs?: number;
    models?: string[];
    balanceInfo?: string;
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  voices: SpeechSynthesisVoice[];
  onTestVoice: (voiceName: string, rate: number, pitch: number) => void;
  initialTab?: SettingsTab;
  onQuickExport?: (format: ExportFormat, includeMetadata: boolean) => void;
  messageCount?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  voices,
  onTestVoice,
  initialTab = 'ai',
  onQuickExport,
  messageCount = 0,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({ status: 'idle' });

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setActiveTab(initialTab);
      setShowApiKey(false);
      setSaveWarning(null);
      setValidation(
        settings.deepseekKeyVerifiedAt && settings.deepseekApiKey
          ? {
              status: 'valid',
              message: `সর্বশেষ যাচাইকৃত (${new Date(settings.deepseekKeyVerifiedAt).toLocaleTimeString('bn-BD')})`,
            }
          : { status: 'idle' }
      );
    }
  }, [isOpen, settings, initialTab]);

  if (!isOpen) return null;

  const handleValidateDeepSeekKey = async () => {
    const trimmedKey = localSettings.deepseekApiKey.trim();
    if (!trimmedKey) {
      setValidation({
        status: 'invalid',
        message: 'যাচাই করার আগে অনুগ্রহ করে আপনার DeepSeek API কী ইনপুট করুন।',
      });
      return;
    }

    setValidation({ status: 'validating' });
    setSaveWarning(null);

    try {
      const response = await fetch('/api/deepseek/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: trimmedKey,
          endpoint: localSettings.deepseekEndpoint,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setValidation({
          status: 'valid',
          message: data.message || 'API কী সফলভাবে যাচাই হয়েছে!',
          details: data.details,
        });
        setLocalSettings((prev) => ({
          ...prev,
          deepseekApiKey: trimmedKey,
          deepseekKeyVerifiedAt: Date.now(),
        }));
      } else {
        setValidation({
          status: 'invalid',
          message: data.message || 'API কী যাচাই ব্যর্থ হয়েছে। অনুগ্রহ করে কী-টি পুনরায় পরীক্ষা করুন।',
          details: data.details,
        });
        setLocalSettings((prev) => ({
          ...prev,
          deepseekKeyVerifiedAt: undefined,
        }));
      }
    } catch {
      setValidation({
        status: 'invalid',
        message: 'সার্ভারের সাথে সংযোগ করা যায়নি। অনুগ্রহ করে ইন্টারনেট বা সার্ভার স্ট্যাটাস দেখুন।',
      });
    }
  };

  const handleDeepSeekKeyChange = (value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      deepseekApiKey: value,
      deepseekKeyVerifiedAt: undefined,
    }));
    setValidation({ status: 'idle' });
    setSaveWarning(null);
  };

  const handleDeepSeekEndpointChange = (value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      deepseekEndpoint: value,
      deepseekKeyVerifiedAt: undefined,
    }));
    setValidation({ status: 'idle' });
    setSaveWarning(null);
  };

  const handleToggleDeepSeek = () => {
    const nextEnabled = !localSettings.deepseekEnabled;
    setSaveWarning(null);
    setLocalSettings((prev) => ({
      ...prev,
      deepseekEnabled: nextEnabled,
      provider:
        !nextEnabled && prev.provider === 'deepseek'
          ? 'gemini'
          : prev.provider,
    }));
  };

  const handleSave = () => {
    if (localSettings.deepseekEnabled && !localSettings.deepseekApiKey.trim()) {
      setActiveTab('deepseek');
      setSaveWarning('DeepSeek ইন্টিগ্রেশন চালু রাখতে অনুগ্রহ করে আপনার DeepSeek API কী প্রদান করুন অথবা টগলটি বন্ধ করুন।');
      return;
    }

    const sanitizedSettings: AppSettings = {
      ...localSettings,
      deepseekApiKey: localSettings.deepseekApiKey.trim(),
      provider:
        !localSettings.deepseekEnabled && localSettings.provider === 'deepseek'
          ? 'gemini'
          : localSettings.provider,
    };

    onSave(sanitizedSettings);
    onClose();
  };

  const bengaliVoices = voices.filter(
    (v) =>
      v.lang.toLowerCase().includes('bn') ||
      v.name.includes('Bangla') ||
      v.name.includes('Bengali')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">ঐশী সেটিংস ও কনফিগারেশন</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">এআই ইঞ্জিন, DeepSeek API, বাংলা ভয়েস, অ্যাভাটার ও চ্যাট রপ্তানি</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/20 px-6 pt-2 gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`pb-3 px-2 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'ai'
                ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            এআই ইঞ্জিন
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deepseek')}
            className={`pb-3 px-2 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'deepseek'
                ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            DeepSeek API
            <span
              className={`w-2 h-2 rounded-full ${
                localSettings.deepseekEnabled
                  ? validation.status === 'valid'
                    ? 'bg-emerald-500 dark:bg-emerald-400'
                    : 'bg-cyan-500 dark:bg-cyan-400'
                  : 'bg-slate-400 dark:bg-slate-600'
              }`}
              title={localSettings.deepseekEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`pb-3 px-2 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'voice'
                ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            বাংলা কণ্ঠস্বর (TTS)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`pb-3 px-2 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'avatar'
                ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            অ্যাভাটার লুক
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-2 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'export'
                ? 'border-pink-600 dark:border-pink-400 text-pink-600 dark:text-pink-300'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            ডাউনলোড চ্যাট
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveWarning && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-700/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{saveWarning}</span>
            </div>
          )}

          {/* TAB 1: AI ENGINE */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  প্রাথমিক এআই ব্রেন নির্বাচন করুন
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Gemini */}
                  <div
                    onClick={() => setLocalSettings({ ...localSettings, provider: 'gemini' })}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      localSettings.provider === 'gemini'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 text-slate-900 dark:text-slate-100 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-900/30 ring-1 ring-indigo-500'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Google Gemini</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-medium">
                          ১০০% ফ্রি
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        সরাসরি সংযুক্ত ও সচল। কোনো কী বা ক্রেডিট সেটআপের ঝামেলা নেই।
                      </p>
                    </div>
                    {localSettings.provider === 'gemini' && (
                      <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> সক্রিয় ব্রেন
                      </div>
                    )}
                  </div>

                  {/* Option 2: DeepSeek */}
                  <div
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        provider: 'deepseek',
                        deepseekEnabled: true,
                      })
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      localSettings.provider === 'deepseek'
                        ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-500 text-slate-900 dark:text-slate-100 shadow-lg shadow-cyan-500/10 dark:shadow-cyan-950/30 ring-1 ring-cyan-500'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">DeepSeek</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60 font-medium">
                          V3 / R1
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        আপনার নিজস্ব DeepSeek বা OpenRouter API কী দিয়ে চালান।
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {localSettings.provider === 'deepseek' ? (
                        <span className="text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> সক্রিয় ব্রেন
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          {localSettings.deepseekEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Option 3: Ollama */}
                  <div
                    onClick={() => setLocalSettings({ ...localSettings, provider: 'ollama' })}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      localSettings.provider === 'ollama'
                        ? 'bg-purple-50/80 dark:bg-indigo-950/50 border-purple-500 dark:border-indigo-500 text-slate-900 dark:text-slate-100 shadow-lg shadow-purple-500/10 dark:shadow-indigo-900/30 ring-1 ring-purple-500 dark:ring-indigo-500'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Local Ollama</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 font-medium">
                          অফলাইন
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        আপনার পিসিতে চলা Ollama লোকাল মডেল (যেমন Qwen 2.5 বা DeepSeek)।
                      </p>
                    </div>
                    {localSettings.provider === 'ollama' && (
                      <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> সক্রিয় ব্রেন
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Provider Specific Settings */}
              {localSettings.provider === 'gemini' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Google Gemini প্রস্তুত ও সম্পূর্ণ ফ্রি
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    AI Studio এর পরিবেশের সাথে স্বয়ংক্রিয়ভাবে সংযুক্ত। বাংলায় দ্রুত ও নির্ভুল বুদ্ধিমত্তা প্রদান করে।
                  </p>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">মডেল সংস্করণ</label>
                    <select
                      value={localSettings.geminiModel}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, geminiModel: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="gemini-4-hydrogen">gemini-4-hydrogen (Gemini 4 Flash — সর্বশেষ ও দ্রুত)</option>
                      <option value="gemini-3.8-flash">gemini-3.8-flash (সর্বোত্তম বাংলা বোধ ও গতি)</option>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (অতি দ্রুত)</option>
                    </select>
                  </div>
                </div>
              )}

              {localSettings.provider === 'deepseek' && (
                <div className="p-4 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      DeepSeek API সেটআপ ও যাচাইকরণ
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {localSettings.deepseekApiKey
                        ? `কী যুক্ত আছে (${localSettings.deepseekModel}) — নতুন DeepSeek API ট্যাবে গিয়ে সংযোগ যাচাই করুন।`
                        : 'আপনার নিজস্ব DeepSeek বা OpenRouter API কী যুক্ত করতে ও পরীক্ষা করতে DeepSeek API ট্যাবে যান।'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('deepseek')}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-md shadow-cyan-600/20 dark:shadow-cyan-950/40"
                  >
                    DeepSeek ট্যাবে যান
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {localSettings.provider === 'ollama' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-sm font-medium">
                    <Cpu className="w-4 h-4" />
                    লোকাল Ollama সার্ভার
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Ollama Endpoint URL</label>
                      <input
                        type="text"
                        value={localSettings.ollamaEndpoint}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, ollamaEndpoint: e.target.value })
                        }
                        placeholder="http://localhost:11434"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">মডেল নাম</label>
                      <input
                        type="text"
                        value={localSettings.ollamaModel}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, ollamaModel: e.target.value })
                        }
                        placeholder="SUMON360/ASRAFUL"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">দ্রুত মডেল:</span>
                    {['SUMON360/ASRAFUL', 'llama3.2', 'qwen2.5:7b', 'deepseek-r1:8b'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, ollamaModel: m })}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition cursor-pointer ${
                          localSettings.ollamaModel === m
                            ? 'bg-purple-100 dark:bg-purple-950/70 border-purple-400 dark:border-purple-500/70 text-purple-800 dark:text-purple-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-purple-50 dark:bg-purple-950/30 p-2.5 rounded-lg border border-purple-200 dark:border-purple-900/40">
                    💡 নোট: আপনার কাস্টম <code>SUMON360/ASRAFUL</code> বা <code>llama3.2</code> মডেল চালাতে পিসিতে <code>ollama serve</code> চালু রাখুন।
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEDICATED DEEPSEEK API INTEGRATION SECTION */}
          {activeTab === 'deepseek' && (
            <div className="space-y-5">
              {/* Section Header + Enable/Disable Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        DeepSeek API ইন্টিগ্রেশন
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                          localSettings.deepseekEnabled
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60'
                            : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {localSettings.deepseekEnabled ? 'চালু (Enabled)' : 'বন্ধ (Disabled)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      আপনার নিজস্ব DeepSeek অথবা OpenRouter API কী দিয়ে ঐশীর কথোপকথন পরিচালনা করুন।
                    </p>
                  </div>
                </div>

                {/* Accessible Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={localSettings.deepseekEnabled}
                  aria-label="DeepSeek API চালু বা বন্ধ করুন"
                  onClick={handleToggleDeepSeek}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 ${
                    localSettings.deepseekEnabled ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      localSettings.deepseekEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Dedicated API Key Input + Validation Section */}
              <div
                className={`p-4 rounded-xl border space-y-4 transition ${
                  localSettings.deepseekEnabled
                    ? 'bg-slate-50 dark:bg-slate-950/60 border-cyan-200 dark:border-cyan-900/50'
                    : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800/70 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label htmlFor="deepseek-api-key-input" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    নিজস্ব DeepSeek API Key
                  </label>
                  <a
                    href="https://platform.deepseek.com/api_keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    নতুন কী সংগ্রহ করুন <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Input + Show/Hide + Clear + Validate Button */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      id="deepseek-api-key-input"
                      type={showApiKey ? 'text' : 'password'}
                      value={localSettings.deepseekApiKey}
                      onChange={(e) => handleDeepSeekKeyChange(e.target.value)}
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-3.5 pr-16 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {localSettings.deepseekApiKey && (
                        <button
                          type="button"
                          onClick={() => handleDeepSeekKeyChange('')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="কী মুছুন"
                          aria-label="API কী মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title={showApiKey ? 'কী লুকান' : 'কী দেখুন'}
                        aria-label={showApiKey ? 'API কী লুকান' : 'API কী দেখুন'}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Validation Button */}
                  <button
                    type="button"
                    onClick={handleValidateDeepSeekKey}
                    disabled={validation.status === 'validating' || !localSettings.deepseekApiKey.trim()}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white text-sm font-medium flex items-center justify-center gap-2 transition shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-cyan-600/20 dark:shadow-cyan-950/40"
                  >
                    {validation.status === 'validating' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        যাচাই হচ্ছে...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        কী যাচাই করুন
                      </>
                    )}
                  </button>
                </div>

                {/* Validation Result Banner */}
                {validation.status === 'valid' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700/60 text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        {validation.message}
                      </span>
                      {validation.details?.latencyMs !== undefined && (
                        <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400/90 shrink-0">
                          {validation.details.latencyMs}ms
                        </span>
                      )}
                    </div>
                    {(validation.details?.balanceInfo || (validation.details?.models && validation.details.models.length > 0)) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-emerald-800/80 dark:text-emerald-200/80">
                        {validation.details.endpointType && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/50">
                            {validation.details.endpointType}
                          </span>
                        )}
                        {validation.details.balanceInfo && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/50">
                            ব্যালেন্স: {validation.details.balanceInfo}
                          </span>
                        )}
                        {validation.details.models && validation.details.models.length > 0 && (
                          <span className="text-emerald-700 dark:text-emerald-300/80">
                            উপলব্ধ মডেল: {validation.details.models.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {validation.status === 'invalid' && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-700/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-semibold text-rose-800 dark:text-rose-300">যাচাইকরণ ব্যর্থ হয়েছে</div>
                      <p>{validation.message}</p>
                    </div>
                  </div>
                )}

                {/* Endpoint & Model Configuration */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">দ্রুত এন্ডপয়েন্ট প্রিসেট:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleDeepSeekEndpointChange('https://api.deepseek.com/chat/completions');
                          setLocalSettings((prev) => ({
                            ...prev,
                            deepseekEndpoint: 'https://api.deepseek.com/chat/completions',
                            deepseekModel: 'deepseek-chat',
                            deepseekKeyVerifiedAt: undefined,
                          }));
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          localSettings.deepseekEndpoint.includes('api.deepseek.com')
                            ? 'bg-cyan-100 dark:bg-cyan-950/70 border-cyan-400 dark:border-cyan-600/60 text-cyan-800 dark:text-cyan-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Official DeepSeek API
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDeepSeekEndpointChange('https://openrouter.ai/api/v1/chat/completions');
                          setLocalSettings((prev) => ({
                            ...prev,
                            deepseekEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
                            deepseekModel: 'deepseek/deepseek-r1:free',
                            deepseekKeyVerifiedAt: undefined,
                          }));
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          localSettings.deepseekEndpoint.includes('openrouter.ai')
                            ? 'bg-cyan-100 dark:bg-cyan-950/70 border-cyan-400 dark:border-cyan-600/60 text-cyan-800 dark:text-cyan-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        OpenRouter (ফ্রি টিয়ার)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">মডেল নাম</label>
                      <input
                        type="text"
                        value={localSettings.deepseekModel}
                        onChange={(e) =>
                          setLocalSettings({ ...localSettings, deepseekModel: e.target.value })
                        }
                        placeholder="deepseek-chat"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings({ ...localSettings, deepseekModel: 'deepseek-chat' })
                          }
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          deepseek-chat (V3)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLocalSettings({ ...localSettings, deepseekModel: 'deepseek-reasoner' })
                          }
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          deepseek-reasoner (R1)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">API Endpoint</label>
                      <input
                        type="text"
                        value={localSettings.deepseekEndpoint}
                        onChange={(e) => handleDeepSeekEndpointChange(e.target.value)}
                        placeholder="https://api.deepseek.com/chat/completions"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Activate as active provider shortcut */}
                {localSettings.deepseekEnabled && (
                  <label className="flex items-center gap-2.5 pt-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={localSettings.provider === 'deepseek'}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          provider: e.target.checked ? 'deepseek' : 'gemini',
                        })
                      }
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>সংরক্ষণের পর DeepSeek-কে বর্তমান চ্যাটের প্রধান এআই ব্রেন হিসেবে ব্যবহার করুন</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VOICE */}
          {activeTab === 'voice' && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  বাংলা ভয়েস নির্বাচন (সিস্টেম স্পিচ ইঞ্জিন)
                </label>
                <select
                  value={localSettings.selectedVoiceName}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, selectedVoiceName: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">স্বয়ংক্রিয় বাংলা ভয়েস (ডিফল্ট)</option>
                  {bengaliVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      ⭐ {v.name} ({v.lang})
                    </option>
                  ))}
                  {voices
                    .filter((v) => !bengaliVoices.includes(v))
                    .slice(0, 15)
                    .map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Windows/Chrome-এ &apos;Microsoft Nabanita&apos; (বাংলাদেশি) বা &apos;Microsoft Tanishaa&apos; (ভারত) কণ্ঠ চমৎকার শোনায়।
                </p>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                    <span>কথার গতি (Speed)</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{localSettings.voiceRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.5"
                    step="0.05"
                    value={localSettings.voiceRate}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        voiceRate: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-600 dark:accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                    <span>কণ্ঠের সুর (Pitch)</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{localSettings.voicePitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={localSettings.voicePitch}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        voicePitch: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-600 dark:accent-indigo-500"
                  />
                </div>
              </div>

              {/* Test Voice Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onTestVoice(
                      localSettings.selectedVoiceName,
                      localSettings.voiceRate,
                      localSettings.voicePitch
                    );
                    setTestStatus('কণ্ঠ বাজানো হচ্ছে...');
                    setTimeout(() => setTestStatus(null), 3000);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  কণ্ঠ টেস্ট শুনুন
                </button>
                {testStatus && <span className="text-xs text-indigo-600 dark:text-indigo-400 ml-3">{testStatus}</span>}
              </div>
            </div>
          )}

          {/* TAB 4: AVATAR */}
          {activeTab === 'avatar' && (
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                অ্যাভাটারের ভিজ্যুয়াল শৈলী
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setLocalSettings({ ...localSettings, avatarStyle: 'vibrant' })}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    localSettings.avatarStyle === 'vibrant'
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 text-slate-900 dark:text-slate-100 ring-1 ring-indigo-500'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium text-slate-900 dark:text-slate-200 mb-1">রঙিন সজীব শৈলী (Vibrant)</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    গভীর চোখের হাইলাইট, স্তরীভূত চুল, অলঙ্কার এবং প্রাণবন্ত চলন।
                  </p>
                </div>

                <div
                  onClick={() => setLocalSettings({ ...localSettings, avatarStyle: 'hologram' })}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    localSettings.avatarStyle === 'hologram'
                      ? 'bg-cyan-50/80 dark:bg-cyan-950/50 border-cyan-500 text-slate-900 dark:text-slate-100 ring-1 ring-cyan-500'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium text-cyan-800 dark:text-cyan-200 mb-1">সাইবার হলোগ্রাম (Hologram)</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    ভবিষ্যতমুখী নিয়ন গ্লো, স্ক্যানলাইন এবং সায়েন্স-ফিকশন আলো।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOWNLOAD CHAT SETTINGS */}
          {activeTab === 'export' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  ডাউনলোড চ্যাট ফরম্যাট নির্বাচন করুন
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  টপ বার বা শর্টকাট (<code className="text-indigo-600 dark:text-indigo-300">Ctrl+Shift+E</code>) দিয়ে চ্যাট রপ্তানি করার জন্য আপনার পছন্দের ডিফল্ট ফরম্যাট নির্ধারণ করুন।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Raw JSON */}
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, defaultExportFormat: 'json' })
                  }
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    localSettings.defaultExportFormat === 'json'
                      ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-500 text-slate-900 dark:text-slate-100 ring-1 ring-cyan-500 shadow-lg shadow-cyan-500/10 dark:shadow-cyan-950/30'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FileJson className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-cyan-700 dark:text-cyan-300">
                        .json
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Raw JSON
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      র জেএসওন ফরম্যাট — ব্যাকআপ ও ডেভেলপার ব্যবহারের জন্য সম্পূর্ণ কাঠামোগত ডেটা।
                    </p>
                  </div>
                  {localSettings.defaultExportFormat === 'json' && (
                    <div className="mt-3 text-xs text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> নির্বাচিত ডিফল্ট
                    </div>
                  )}
                </button>

                {/* Cleaned Markdown */}
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, defaultExportFormat: 'markdown' })
                  }
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    localSettings.defaultExportFormat === 'markdown'
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 text-slate-900 dark:text-slate-100 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-950/30'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-indigo-700 dark:text-indigo-300">
                        .md
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Cleaned Markdown
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      পরিচ্ছন্ন মার্কডাউন — অতিরিক্ত স্পেস ছাড়া পড়া ও নোট নেওয়ার উপযোগী ফরম্যাট।
                    </p>
                  </div>
                  {localSettings.defaultExportFormat === 'markdown' && (
                    <div className="mt-3 text-xs text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> নির্বাচিত ডিফল্ট
                    </div>
                  )}
                </button>

                {/* Pretty-printed PDF */}
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, defaultExportFormat: 'pdf' })
                  }
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    localSettings.defaultExportFormat === 'pdf'
                      ? 'bg-pink-50/80 dark:bg-pink-950/40 border-pink-500 text-slate-900 dark:text-slate-100 ring-1 ring-pink-500 shadow-lg shadow-pink-500/10 dark:shadow-pink-950/30'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Printer className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-pink-700 dark:text-pink-300">
                        .pdf
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Pretty-printed PDF
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      সাজানো প্রিন্টযোগ্য পিডিএফ — বাংলা ফন্টসহ শেয়ার ও প্রিন্টের জন্য আদর্শ।
                    </p>
                  </div>
                  {localSettings.defaultExportFormat === 'pdf' && (
                    <div className="mt-3 text-xs text-pink-700 dark:text-pink-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> নির্বাচিত ডিফল্ট
                    </div>
                  )}
                </button>
              </div>

              {/* Metadata Toggle */}
              <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer select-none hover:border-slate-300 dark:hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={localSettings.exportIncludeMetadata}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      exportIncludeMetadata: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    রপ্তানিতে সময়, মডেল নাম ও উইকিপিডিয়া সূত্র অন্তর্ভুক্ত করুন
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    বন্ধ রাখলে শুধুমাত্র আপনার এবং ঐশীর মূল কথোপকথনের টেক্সট পরিষ্কারভাবে রপ্তানি হবে।
                  </p>
                </div>
              </label>

              {/* Quick Export Now Button */}
              {onQuickExport && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40">
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    বর্তমান কথোপকথনে <span className="font-semibold text-indigo-700 dark:text-indigo-300">{messageCount} টি</span> বার্তা রয়েছে।
                  </div>
                  <button
                    type="button"
                    disabled={messageCount === 0}
                    onClick={() => {
                      onSave(localSettings);
                      onQuickExport(
                        localSettings.defaultExportFormat,
                        localSettings.exportIncludeMetadata
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    নির্বাচিত ফরম্যাটে এখনই ডাউনলোড করুন
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            পরিবর্তনগুলো ব্রাউজারে সুরক্ষিত সংরক্ষিত থাকে
          </span>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm font-medium transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
