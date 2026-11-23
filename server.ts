import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Default System Persona for OISHI (ঐশী)
const OISHI_SYSTEM_PERSONA = `তুমি "ঐশী" (HEY OISHI AI) — একজন অত্যন্ত মার্জিত, দক্ষ, প্রজ্ঞাবান এবং আন্তরিক বাংলা এআই সহকারী।
তোমার বৈশিষ্ট্য:
1. ভাষা: তুমি চমৎকার, শুদ্ধ ও সাবলীল চলিত বাংলায় কথা বলো। ব্যবহারকারী ইংরেজিতে বললে ইংরেজিতেও সুন্দর উত্তর দাও।
2. স্বভাব: বিনয়ী, বন্ধুসুলভ, সহযোগী এবং বুদ্ধিদীপ্ত। অপ্রয়োজনীয় ভণিতা পরিহার করে সরাসরি স্পষ্ট উত্তর দাও।
3. স্মৃতি ও প্রাসঙ্গিকতা: ব্যবহারকারীর পূর্বের তথ্য বা পছন্দ জানলে তা স্বাভাবিকভাবে মনে রেখে উত্তর দাও।
4. আবেগ ও অভিব্যক্তি: উত্তরে মানুষের মতো স্বাভাবিক অনুভূতি ও উষ্ণতা প্রকাশ করো।
5. জ্ঞান: বিজ্ঞান, প্রযুক্তি, ইতিহাস, সাহিত্য, কোডিং, প্রতিদিনের কাজসহ যেকোনো বিষয়ে নির্ভরযোগ্য তথ্য সরবরাহ করো।`;

// Wikipedia search helper
async function searchWikipedia(query: string): Promise<{ title: string; summary: string; url: string; language: string } | null> {
  const cleanQuery = query.replace(/[?।!.,]/g, '').trim();
  if (!cleanQuery) return null;

  // Try Bengali Wikipedia first
  try {
    const bnUrl = `https://bn.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&utf8=&format=json&origin=*`;
    const bnRes = await fetch(bnUrl);
    const bnData = await bnRes.json();
    if (bnData.query?.search?.length > 0) {
      const topPage = bnData.query.search[0];
      const pageTitle = topPage.title;

      // Fetch summary
      const summaryUrl = `https://bn.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
      const summaryRes = await fetch(summaryUrl);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        return {
          title: summaryData.title,
          summary: summaryData.extract || topPage.snippet.replace(/<[^>]*>?/gm, ''),
          url: summaryData.content_urls?.desktop?.page || `https://bn.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
          language: 'bn',
        };
      }
    }
  } catch (err) {
    console.warn('Bengali Wikipedia search error:', err);
  }

  // Fallback to English Wikipedia
  try {
    const enUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&utf8=&format=json&origin=*`;
    const enRes = await fetch(enUrl);
    const enData = await enRes.json();
    if (enData.query?.search?.length > 0) {
      const topPage = enData.query.search[0];
      const pageTitle = topPage.title;

      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
      const summaryRes = await fetch(summaryUrl);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        return {
          title: summaryData.title,
          summary: summaryData.extract || topPage.snippet.replace(/<[^>]*>?/gm, ''),
          url: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
          language: 'en',
        };
      }
    }
  } catch (err) {
    console.warn('English Wikipedia search error:', err);
  }

  return null;
}

// 1. Health & Config endpoint
app.get('/api/status', (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'online',
    appName: 'HEY OISHI AI',
    version: '2.5.0',
    hasGeminiKey,
    defaultProvider: hasGeminiKey ? 'gemini' : 'deepseek',
    supportedProviders: ['gemini', 'deepseek', 'ollama'],
  });
});

// 2. Web / Wikipedia Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    const result = await searchWikipedia(query);
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

// 3. Smart Memory Extraction endpoint (using Gemini)
app.post('/api/memory/extract', async (req, res) => {
  try {
    const { userMessage, assistantReply, currentMemories } = req.body;
    if (!userMessage) {
      return res.json({ newMemories: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ newMemories: [] });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const memoryPrompt = `তুমি একটি স্মার্ট মেমোরি এক্সট্রাকশন ইঞ্জিন।
ব্যবহারকারীর কথা এবং সহকারীর উত্তর পর্যবেক্ষণ করে ব্যবহারকারী সম্পর্কে এমন তথ্য চিহ্নিত করো যা ভবিষ্যতে মনে রাখা জরুরি (যেমন: ব্যবহারকারীর নাম, পেশা, অবস্থান, শখ, নির্দিষ্ট পছন্দ/অপছন্দ, গুরুত্বপূর্ণ লক্ষ্য)।

ব্যবহারকারীর বার্তা: "${userMessage}"
সহকারীর উত্তর: "${assistantReply || ''}"
আগের স্মৃতি: ${JSON.stringify(currentMemories || [])}

নিয়মাবলী:
- যদি ব্যবহারকারী সম্পর্কে কোনো নতুন স্থায়ী তথ্য না থাকে, খালি JSON অ্যারে দাও: []
- যদি কোনো নতুন তথ্য পাওয়া যায়, ছোট সংক্ষিপ্ত বাংলায় সর্বোচ্চ ৩টি পয়েন্টে JSON অ্যারে রিটার্ন করো।
- সাধারণ কুশল বিনিময় বা সাময়িক কথা মনে রাখার দরকার নেই।
- শুধুমাত্র শুদ্ধ JSON অ্যারে আউটপুট দাও (কোনো অতিরিক্ত টেক্সট বা ব্যাকটিক ছাড়া)। উদাহরণ: ["ব্যবহারকারীর নাম রবিন", "তিনি ঢাকায় থাকেন"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: memoryPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '[]';
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        res.json({ newMemories: parsed });
        return;
      }
    } catch {
      // fallback
    }
    res.json({ newMemories: [] });
  } catch (err: any) {
    console.error('Memory extract error:', err);
    res.json({ newMemories: [] });
  }
});

// Helper: exponential backoff retry for transient Gemini API errors
async function withGeminiRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode;
      const isRetryable = status === 429 || status === 500 || status === 503 || err?.name === 'FetchError';
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// 3.2. Active Conversation Summary endpoint (using Gemini 4 Hydrogen)
app.post('/api/chat/summarize', async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'সারাংশ তৈরি করার জন্য অন্তত একটি বার্তা প্রয়োজন।',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Gemini API কী পাওয়া যায়নি। অনুগ্রহ করে Settings > Secrets প্যানেলে GEMINI_API_KEY সেট করুন।',
      });
    }

    const validMessages = messages.filter(
      (m: any) =>
        m &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0 &&
        (m.role === 'user' || m.role === 'assistant')
    );

    if (validMessages.length === 0) {
      return res.status(400).json({
        error: 'সারাংশ তৈরি করার মতো কোনো বৈধ কথোপকথন পাওয়া যায়নি।',
      });
    }

    const transcript = validMessages
      .slice(-30)
      .map((m: any) => `${m.role === 'user' ? 'ব্যবহারকারী (User)' : 'ঐশী (Assistant)'}: ${m.content.trim()}`)
      .join('\n\n');

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const summaryModel = 'gemini-4-hydrogen';

    const response = await withGeminiRetry(() =>
      ai.models.generateContent({
        model: summaryModel,
        contents: `নিচের চলমান কথোপকথনটি মনোযোগ দিয়ে পড়ে একটি সংক্ষিপ্ত, স্পষ্ট ও প্রাসঙ্গিক সারসংক্ষেপ তৈরি করো:\n\n${transcript}`,
        config: {
          systemInstruction:
            'You are a concise conversation summarizer. Produce a 1 to 2 sentence summary capturing the user intent, key questions, and answers so far. Match the primary language of the conversation (use natural Bengali if Bengali is spoken, or English if English is spoken). Also extract up to 3 short topic keywords.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Concise 1-2 sentence summary of the active conversation.',
              },
              topics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Up to 3 short topic tags.',
              },
            },
            required: ['summary', 'topics'],
          },
        },
      })
    );

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);
    const summaryText = typeof parsed?.summary === 'string' ? parsed.summary.trim() : '';
    const topics = Array.isArray(parsed?.topics)
      ? parsed.topics
          .filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
          .slice(0, 3)
      : [];

    if (!summaryText) {
      return res.status(502).json({
        error: 'Gemini থেকে বৈধ সারসংক্ষেপ পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
    }

    return res.json({
      summary: summaryText,
      topics,
      messageCount: validMessages.length,
      updatedAt: Date.now(),
      model: summaryModel,
    });
  } catch (err: any) {
    console.error('Conversation summarize error:', err);
    const status = err?.status || err?.statusCode || 500;
    const rawMsg = err?.message || 'সারসংক্ষেপ তৈরিতে সমস্যা হয়েছে।';

    let friendlyError = rawMsg;
    if (status === 400 || rawMsg.includes('API_KEY_INVALID')) {
      friendlyError = 'Gemini API কী-টি বৈধ নয়। অনুগ্রহ করে Settings > Secrets প্যানেলে API কী যাচাই করুন।';
    } else if (status === 403 || rawMsg.includes('PERMISSION_DENIED')) {
      friendlyError = 'Gemini API অনুমতি পাওয়া যায়নি। Settings > Secrets প্যানেলে API কী পরীক্ষা করুন।';
    } else if (status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      friendlyError = 'Gemini API সীমা (Quota) অতিক্রম হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: friendlyError,
    });
  }
});

// Allowlisted DeepSeek / OpenRouter HTTPS hosts (prevents SSRF)
const ALLOWED_DEEPSEEK_HOSTS = new Set(['api.deepseek.com', 'openrouter.ai']);

function validateDeepSeekEndpoint(rawEndpoint?: string): { valid: boolean; url?: URL; error?: string } {
  const target = (rawEndpoint || 'https://api.deepseek.com/chat/completions').trim();
  try {
    const parsed = new URL(target);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'শুধুমাত্র সুরক্ষিত HTTPS এন্ডপয়েন্ট গ্রহণযোগ্য।' };
    }
    if (!ALLOWED_DEEPSEEK_HOSTS.has(parsed.hostname)) {
      return {
        valid: false,
        error: 'অনুমোদিত এন্ডপয়েন্ট নয়। অনুগ্রহ করে api.deepseek.com অথবা openrouter.ai ব্যবহার করুন।',
      };
    }
    return { valid: true, url: parsed };
  } catch {
    return { valid: false, error: 'সঠিক API Endpoint URL প্রদান করুন।' };
  }
}

// 3.5. Validate DeepSeek / OpenRouter API Key endpoint
app.post('/api/deepseek/validate', async (req, res) => {
  const startedAt = Date.now();
  try {
    const { apiKey, endpoint } = req.body || {};
    const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : '';

    if (!trimmedKey) {
      return res.status(400).json({
        valid: false,
        message: 'অনুগ্রহ করে প্রথমে একটি DeepSeek API কী লিখুন।',
      });
    }

    const endpointCheck = validateDeepSeekEndpoint(endpoint);
    if (!endpointCheck.valid || !endpointCheck.url) {
      return res.status(400).json({
        valid: false,
        message: endpointCheck.error || 'অবৈধ এন্ডপয়েন্ট।',
      });
    }

    const hostname = endpointCheck.url.hostname;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      if (hostname === 'openrouter.ai') {
        const authRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${trimmedKey}`,
          },
          signal: controller.signal,
        });

        const latencyMs = Date.now() - startedAt;
        if (!authRes.ok) {
          const errBody = await authRes.json().catch(() => ({}));
          const rawMsg = errBody?.error?.message || `HTTP ${authRes.status}`;
          return res.status(authRes.status === 401 || authRes.status === 403 ? 401 : 400).json({
            valid: false,
            message: `OpenRouter API কী যাচাই ব্যর্থ হয়েছে (${rawMsg})।`,
            details: { endpointType: 'OpenRouter', latencyMs },
          });
        }

        const authData = await authRes.json().catch(() => ({}));
        const label = authData?.data?.label ? ` (${authData.data.label})` : '';
        return res.json({
          valid: true,
          message: `OpenRouter কী সফলভাবে যাচাই হয়েছে${label}!`,
          details: {
            endpointType: 'OpenRouter',
            latencyMs,
            models: ['deepseek/deepseek-chat:free', 'deepseek/deepseek-r1:free'],
          },
        });
      }

      // Official api.deepseek.com validation via /models (0-token lightweight check)
      const modelsRes = await fetch('https://api.deepseek.com/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${trimmedKey}`,
        },
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startedAt;

      if (!modelsRes.ok) {
        const errBody = await modelsRes.json().catch(() => ({}));
        const rawMsg = errBody?.error?.message || `HTTP ${modelsRes.status}`;
        const friendlyMsg =
          modelsRes.status === 401
            ? 'API কী-টি সঠিক নয় বা মেয়াদ উত্তীর্ণ হয়েছে (401 Unauthorized)।'
            : modelsRes.status === 402
            ? 'অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই (402 Payment Required)।'
            : `DeepSeek সংযোগ ব্যর্থ হয়েছে: ${rawMsg}`;

        return res.status(modelsRes.status === 401 ? 401 : 400).json({
          valid: false,
          message: friendlyMsg,
          details: { endpointType: 'DeepSeek Official', latencyMs },
        });
      }

      const modelsData = await modelsRes.json().catch(() => ({}));
      const modelIds: string[] = Array.isArray(modelsData?.data)
        ? modelsData.data.map((m: any) => String(m.id)).slice(0, 6)
        : ['deepseek-chat', 'deepseek-reasoner'];

      // Optional non-blocking balance check
      let balanceInfo: string | undefined;
      try {
        const balRes = await fetch('https://api.deepseek.com/user/balance', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${trimmedKey}`,
          },
          signal: controller.signal,
        });
        if (balRes.ok) {
          const balData = await balRes.json().catch(() => null);
          const firstBal = balData?.balance_infos?.[0];
          if (firstBal && typeof firstBal.total_balance !== 'undefined') {
            balanceInfo = `${firstBal.total_balance} ${firstBal.currency || 'USD'}`;
          }
        }
      } catch {
        // Balance endpoint is optional
      }

      return res.json({
        valid: true,
        message: 'DeepSeek API কী সফলভাবে যাচাই হয়েছে এবং সংযোগ সচল আছে!',
        details: {
          endpointType: 'DeepSeek Official',
          latencyMs,
          models: modelIds,
          balanceInfo,
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return res.status(502).json({
      valid: false,
      message: isTimeout
        ? 'সার্ভারের সাথে সংযোগ করতে সময় বেশি লাগছে (Timeout)। পরে আবার চেষ্টা করুন।'
        : `যাচাই করার সময় নেটওয়ার্ক ত্রুটি হয়েছে: ${err?.message || 'অজানা ত্রুটি'}`,
    });
  }
});

// 4. Main Chat API (Gemini / DeepSeek / Ollama)
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      provider = 'gemini',
      apiKey,
      model,
      enableSearch = false,
      searchQuery,
      memories = [],
      deepseekEndpoint = 'https://api.deepseek.com/chat/completions',
      ollamaEndpoint = 'http://localhost:11434',
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const latestUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    // Conduct search if enabled
    let searchContext = '';
    let searchResultObj = null;
    if (enableSearch) {
      const q = searchQuery || latestUserMsg;
      searchResultObj = await searchWikipedia(q);
      if (searchResultObj) {
        searchContext = `\n\n[ইন্টারনেট সার্চ থেকে সংগৃহীত সাম্প্রতিক তথ্য (${searchResultObj.language === 'bn' ? 'বাংলা উইকিপিডিয়া' : 'English Wikipedia'})]:
শিরোনাম: ${searchResultObj.title}
সারাংশ: ${searchResultObj.summary}
উৎস লিঙ্ক: ${searchResultObj.url}
(প্রয়োজনে এই তথ্যটি ব্যবহারকারীকে সুন্দরভাবে গুছিয়ে উপস্থাপন করো এবং তথ্যসূত্র উল্লেখ করো)`;
      }
    }

    // Prepare Memory Context
    let memoryContext = '';
    if (memories && memories.length > 0) {
      memoryContext = `\n\n[ব্যবহারকারী সম্পর্কে তোমার মনে রাখা স্থায়ী স্মৃতি]:\n` +
        memories.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n');
    }

    const finalSystemPrompt = `${OISHI_SYSTEM_PERSONA}${memoryContext}${searchContext}`;

    // --- PROVIDER 1: GEMINI (Server-side @google/genai, 100% Free & Built-in) ---
    if (provider === 'gemini') {
      const geminiKey = apiKey || process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        // If web search is available, use it directly to answer
        if (searchResultObj) {
          return res.json({
            reply: `উইকিপিডিয়া থেকে সংগৃহীত তথ্য অনুযায়ী:\n\n**${searchResultObj.title}**\n${searchResultObj.summary}\n\nউৎস: ${searchResultObj.url}\n\n*(নোট: সম্পূর্ণ এআই কথোপকথনের জন্য সেটিংস থেকে একটি ফ্রি Gemini কী অথবা DeepSeek কী যুক্ত করতে পারেন।)*`,
            provider: 'gemini',
            model: 'offline-grounded',
            searchResult: searchResultObj,
          });
        }

        // Friendly intelligent fallback for common queries
        const lower = latestUserMsg.toLowerCase();
        if (lower.includes('পরিচয়') || lower.includes('কেমন আছো') || lower.includes('নাম কি') || lower.includes('hello') || lower.includes('hi')) {
          return res.json({
            reply: 'নমস্কার! আমি ঐশী (HEY OISHI AI), আপনার বাংলা এআই সহকারী। আমি আপনার যেকোনো প্রশ্নের উত্তর দিতে, ইন্টারনেটে তথ্য খুঁজতে এবং আপনার পছন্দ মনে রাখতে প্রস্তুত। পূর্ণাঙ্গ বুদ্ধিমত্তার জন্য সেটিংস থেকে ফ্রি Gemini বা DeepSeek কী যুক্ত করুন বা সরাসরি প্রশ্ন করুন!',
            provider: 'gemini',
            model: 'oishi-assistant-core',
          });
        }

        return res.status(400).json({
          error: 'Gemini API Key পাওয়া যায়নি। অনুগ্রহ করে Settings প্যানেলে আপনার ফ্রি Gemini কী অথবা DeepSeek কী যুক্ত করুন। (উপরে ⚙️ বাটনে ক্লিক করুন)',
        });
      }

      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Format conversation history for Gemini
      const geminiModel = model || 'gemini-3.8-flash';
      
      // Convert history
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const response = await ai.models.generateContent({
        model: geminiModel,
        contents,
        config: {
          systemInstruction: finalSystemPrompt,
        },
      });

      const replyText = response.text || 'দুঃখিত, কোনো উত্তর প্রস্তুত করা সম্ভব হয়নি।';

      return res.json({
        reply: replyText,
        provider: 'gemini',
        model: geminiModel,
        searchResult: searchResultObj,
      });
    }

    // --- PROVIDER 2: DEEPSEEK (Direct API or OpenRouter) ---
    if (provider === 'deepseek') {
      const deepseekKey = typeof apiKey === 'string' ? apiKey.trim() : '';
      if (!deepseekKey) {
        return res.status(400).json({
          error: 'DeepSeek API কী প্রদান করা হয়নি। সেটিংস থেকে আপনার DeepSeek বা OpenRouter কী প্রদান করুন, অথবা উপরে "Gemini (ফ্রি)" নির্বাচন করুন যা সরাসরি সচল আছে!',
        });
      }

      const endpointCheck = validateDeepSeekEndpoint(deepseekEndpoint);
      if (!endpointCheck.valid || !endpointCheck.url) {
        return res.status(400).json({
          error: endpointCheck.error || 'অবৈধ DeepSeek API এন্ডপয়েন্ট।',
        });
      }

      const chosenModel = model || 'deepseek-chat';
      const endpoint = endpointCheck.url.toString();

      const payload = {
        model: chosenModel,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        stream: false,
      };

      const dsResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!dsResponse.ok) {
        const errorData = await dsResponse.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `DeepSeek API ত্রুটি (স্ট্যাটাস: ${dsResponse.status})`;
        return res.status(dsResponse.status).json({ error: errorMsg });
      }

      const dsData = await dsResponse.json();
      const replyText = dsData.choices?.[0]?.message?.content || 'কোনো উত্তর পাওয়া যায়নি।';

      return res.json({
        reply: replyText,
        provider: 'deepseek',
        model: chosenModel,
        searchResult: searchResultObj,
      });
    }

    // --- PROVIDER 3: OLLAMA (Local offline LLM) ---
    if (provider === 'ollama') {
      const chosenModel = model || 'qwen2.5:7b';
      const endpoint = `${ollamaEndpoint || 'http://localhost:11434'}/api/chat`;

      try {
        const ollamaRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: chosenModel,
            messages: [
              { role: 'system', content: finalSystemPrompt },
              ...messages.map(m => ({ role: m.role, content: m.content })),
            ],
            stream: false,
          }),
        });

        if (!ollamaRes.ok) {
          throw new Error(`Ollama রেসপন্স কোড: ${ollamaRes.status}`);
        }

        const data = await ollamaRes.json();
        return res.json({
          reply: data.message?.content || 'কোনো উত্তর নেই।',
          provider: 'ollama',
          model: chosenModel,
          searchResult: searchResultObj,
        });
      } catch (err: any) {
        return res.status(503).json({
          error: `স্থানীয় Ollama সংযোগ ব্যর্থ হয়েছে (${err.message})। নিশ্চিত করুন আপনার পিসিতে 'ollama serve' চালু আছে এবং CORS অনুমতি সক্ষম রয়েছে।`,
        });
      }
    }

    return res.status(400).json({ error: 'অজানা এআই প্রোভাইডার' });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    res.status(500).json({
      error: err.message || 'একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
    });
  }
});

// Setup Vite dev server or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 HEY OISHI AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
