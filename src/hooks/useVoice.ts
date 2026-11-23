import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoice() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [listeningTranscript, setListeningTranscript] = useState('');
  const [mouthOpen, setMouthOpen] = useState(0); // 0 to 1 for avatar lip-sync
  const [mouthShape, setMouthShape] = useState<'rest' | 'open' | 'round' | 'wide'>('rest');
  
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const utteranceSeqRef = useRef(0);

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // Animate mouth when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0);
      setMouthShape('rest');
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const startTime = Date.now();
    const shapes: ('open' | 'round' | 'wide')[] = ['open', 'round', 'wide', 'open'];

    const animateMouth = () => {
      const elapsed = Date.now() - startTime;
      // Oscillate mouth openness naturally with some randomness
      const cycle = (elapsed % 450) / 450;
      const rawOpen = Math.sin(cycle * Math.PI);
      const randomizedOpen = Math.max(0.15, rawOpen * (0.6 + Math.sin(elapsed * 0.02) * 0.4));
      
      setMouthOpen(randomizedOpen);

      const shapeIdx = Math.floor((elapsed / 220) % shapes.length);
      setMouthShape(shapes[shapeIdx]);

      animFrameRef.current = requestAnimationFrame(animateMouth);
    };

    animFrameRef.current = requestAnimationFrame(animateMouth);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSpeaking]);

  // Clean text for speech
  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/```[\s\S]*?```/g, 'কোড ব্লক বাদ দেওয়া হয়েছে।') // remove large code blocks
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~#>-]/g, '') // remove markdown symbols
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/https?:\/\/\S+/g, '') // URLs
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // emojis
      .trim();
  };

  // Speak text using SpeechSynthesis
  const speak = useCallback(
    (
      text: string,
      options?: {
        voiceName?: string;
        rate?: number;
        pitch?: number;
        messageId?: string;
        onEnd?: () => void;
        onStart?: () => void;
      }
    ) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const seq = ++utteranceSeqRef.current;
      window.speechSynthesis.cancel();

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      const availableVoices = window.speechSynthesis.getVoices();

      // Find best Bengali voice, or selected voice
      let selectedVoice: SpeechSynthesisVoice | undefined;
      if (options?.voiceName) {
        selectedVoice = availableVoices.find(v => v.name === options.voiceName);
      }

      if (!selectedVoice) {
        // Prioritize bn-BD, then bn-IN, then any Bengali
        selectedVoice = availableVoices.find(
          v => v.lang === 'bn-BD' || v.lang.startsWith('bn_BD')
        ) ||
        availableVoices.find(
          v => v.lang === 'bn-IN' || v.lang.startsWith('bn_IN')
        ) ||
        availableVoices.find(v => v.lang.toLowerCase().includes('bn')) ||
        availableVoices.find(v => v.name.includes('Bangla') || v.name.includes('Bengali'));
      }

      // If no Bengali voice found, use a clear natural female/en voice
      if (!selectedVoice) {
        selectedVoice = availableVoices.find(
          v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female'))
        ) || availableVoices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.05;

      utterance.onstart = () => {
        if (utteranceSeqRef.current !== seq) return;
        setIsSpeaking(true);
        setSpeakingMessageId(options?.messageId ?? null);
        options?.onStart?.();
      };

      utterance.onend = () => {
        if (utteranceSeqRef.current !== seq) return;
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        setMouthOpen(0);
        setMouthShape('rest');
        options?.onEnd?.();
      };

      utterance.onerror = () => {
        if (utteranceSeqRef.current !== seq) return;
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        setMouthOpen(0);
        setMouthShape('rest');
        options?.onEnd?.();
      };

      setSpeakingMessageId(options?.messageId ?? null);
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const stopSpeaking = useCallback(() => {
    utteranceSeqRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    setMouthOpen(0);
    setMouthShape('rest');
  }, []);

  // Voice Input (Speech Recognition)
  const startListening = useCallback(
    (onResult: (text: string) => void, onError?: (err: string) => void) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        onError?.('আপনার ব্রাউজার স্পিচ রিকগনিশন সমর্থন করে না (Chrome/Edge ব্যবহার করুন)।');
        return;
      }

      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'bn-BD'; // Bengali (Bangladesh)
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          setListeningTranscript('');
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setListeningTranscript(currentTranscript);
          if (event.results[0].isFinal) {
            onResult(currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          setListeningTranscript('');
          if (event.error !== 'no-speech') {
            onError?.(`ভয়েস ইনপুট সমস্যা: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        setIsListening(false);
        onError?.(err.message || 'মাইক্রোফোন চালু করা যায়নি।');
      }
    },
    []
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
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
  };
}
