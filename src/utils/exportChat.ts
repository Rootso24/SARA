import { AIProvider, ChatMessage } from '../types';

export interface ExportOptions {
  provider?: AIProvider;
  includeMetadata?: boolean;
}

function formatTimestampForFilename(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}-${hh}${min}`;
}

function cleanMarkdownBody(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportChatAsJson(
  messages: ChatMessage[],
  options?: ExportOptions
): string {
  const now = new Date();
  const filename = `hey-oishi-chat-${formatTimestampForFilename(now)}.json`;
  const includeMetadata = options?.includeMetadata ?? true;

  const payload = {
    app: 'HEY OISHI AI (ঐশী)',
    version: '2.5.0',
    exportedAt: now.toISOString(),
    ...(includeMetadata ? { activeProvider: options?.provider ?? 'gemini' } : {}),
    messageCount: messages.length,
    messages: messages.map((m) => {
      if (!includeMetadata) {
        return {
          role: m.role,
          content: m.content,
        };
      }
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        isoTime: new Date(m.timestamp).toISOString(),
        ...(m.provider ? { provider: m.provider } : {}),
        ...(m.model ? { model: m.model } : {}),
        ...(m.searchResult ? { searchResult: m.searchResult } : {}),
        ...(m.newMemories && m.newMemories.length > 0 ? { newMemories: m.newMemories } : {}),
      };
    }),
  };

  triggerFileDownload(
    JSON.stringify(payload, null, 2),
    filename,
    'application/json;charset=utf-8'
  );
  return filename;
}

export function exportChatAsMarkdown(
  messages: ChatMessage[],
  options?: ExportOptions
): string {
  const now = new Date();
  const filename = `hey-oishi-chat-${formatTimestampForFilename(now)}.md`;
  const includeMetadata = options?.includeMetadata ?? true;

  const lines: string[] = [
    '# HEY OISHI AI (ঐশী) — কথোপকথনের রেকর্ড',
    '',
  ];

  if (includeMetadata) {
    lines.push(
      `- **রপ্তানির সময়:** ${now.toLocaleString('bn-BD')} (${now.toISOString()})`,
      `- **সক্রিয় এআই ব্রেন:** ${options?.provider ?? 'gemini'}`,
      `- **মোট বার্তা:** ${messages.length} টি`,
      ''
    );
  }

  lines.push('---', '');

  for (const msg of messages) {
    const timeStr = new Date(msg.timestamp).toLocaleString('bn-BD');
    const roleHeading =
      msg.role === 'user'
        ? '### 👤 আপনি (User)'
        : msg.role === 'assistant'
        ? '### 🌸 ঐশী (OISHI)'
        : '### ⚙️ সিস্টেম (System)';

    lines.push(roleHeading);

    if (includeMetadata) {
      const metaTags = [`*${timeStr}*`];
      if (msg.model) {
        metaTags.push(`\`${msg.model}\``);
      }
      lines.push(metaTags.join(' · '));
    }

    lines.push('');

    if (includeMetadata && msg.searchResult) {
      lines.push(`> 🌐 **উইকিপিডিয়া সূত্র:** [${msg.searchResult.title}](${msg.searchResult.url})`);
      lines.push(`> ${cleanMarkdownBody(msg.searchResult.summary)}`);
      lines.push('');
    }

    lines.push(cleanMarkdownBody(msg.content));
    lines.push('');

    if (includeMetadata && msg.newMemories && msg.newMemories.length > 0) {
      lines.push('**🧠 সংরক্ষিত স্মৃতি:**');
      for (const mem of msg.newMemories) {
        lines.push(`- ${mem.trim()}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  const cleanedOutput = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  triggerFileDownload(cleanedOutput, filename, 'text/markdown;charset=utf-8');
  return filename;
}

export function exportChatAsPdf(): string {
  const now = new Date();
  const filename = `hey-oishi-chat-${formatTimestampForFilename(now)}.pdf`;
  const previousTitle = document.title;

  document.title = filename.replace(/\.pdf$/, '');

  // Schedule print on next frame so React print sheet reflects latest state
  requestAnimationFrame(() => {
    window.print();
    setTimeout(() => {
      document.title = previousTitle;
    }, 500);
  });

  return filename;
}
