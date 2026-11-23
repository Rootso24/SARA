import React from 'react';
import { X, Keyboard, MessageSquare, Compass, Sliders } from 'lucide-react';
import { isMacPlatform } from '../hooks/useKeyboardShortcuts';

export interface ShortcutDisplayItem {
  id: string;
  description: string;
  category: 'chat' | 'navigation' | 'tools';
  displayKeys: string[];
}

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutDisplayItem[];
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
}) => {
  if (!isOpen) return null;

  const isMac = isMacPlatform();

  const formatKeyLabel = (key: string) => {
    if (key === 'Ctrl') return isMac ? '⌘' : 'Ctrl';
    return key;
  };

  const categories: {
    id: 'chat' | 'navigation' | 'tools';
    title: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'chat',
      title: 'কথোপকথন ও ইনপুট',
      icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'navigation',
      title: 'নেভিগেশন ও প্যানেল',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'tools',
      title: 'ভয়েস, সার্চ ও রপ্তানি',
      icon: <Sliders className="w-4 h-4 text-purple-400" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">কীবোর্ড শর্টকাটসমূহ</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">দ্রুত নেভিগেশন ও চ্যাট নিয়ন্ত্রণের জন্য শর্টকাট গাইড</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcut Groups */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {categories.map((cat) => {
            const items = shortcuts.filter((s) => s.category === cat.id);
            if (items.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                  {cat.icon}
                  <span>{cat.title}</span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 divide-y divide-slate-200 dark:divide-slate-800/70">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
                    >
                      <span className="text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
                        {item.description}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.displayKeys.map((k, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 px-0.5">+</span>
                            )}
                            <kbd className="min-w-[26px] px-2 py-1 text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-lg shadow-sm text-center">
                              {formatKeyLabel(k)}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>টিপস: যেকোনো সময় <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">Esc</kbd> চেপে পপআপ বন্ধ করা যায়</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition cursor-pointer"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};
