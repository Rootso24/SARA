import React, { useEffect, useState, useRef } from 'react';

interface OishiAvatarProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
  isListening?: boolean;
  mouthOpen?: number; // 0 to 1
  mouthShape?: 'rest' | 'open' | 'round' | 'wide';
  avatarStyle?: 'vibrant' | 'hologram' | 'minimal';
  className?: string;
  onAvatarClick?: () => void;
}

export const OishiAvatar: React.FC<OishiAvatarProps> = ({
  isSpeaking = false,
  isThinking = false,
  isListening = false,
  mouthOpen = 0,
  mouthShape = 'rest',
  avatarStyle = 'vibrant',
  className = '',
  onAvatarClick,
}) => {
  // Blinking state
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyeLook, setEyeLook] = useState({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);

  // Randomized natural blinking loop
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;

    const scheduleBlink = () => {
      // Natural blink delay between 2.5s and 5.5s
      const delay = Math.random() * 3000 + 2500;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);

        // Quick eyelid closure (120ms), with occasional double blink
        setTimeout(() => {
          setIsBlinking(false);

          if (Math.random() < 0.25) {
            // Double blink
            setTimeout(() => {
              setIsBlinking(true);
              setTimeout(() => {
                setIsBlinking(false);
                scheduleBlink();
              }, 100);
            }, 120);
          } else {
            scheduleBlink();
          }
        }, 120);
      }, delay);
    };

    scheduleBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Subtle wandering eye gaze or head tilt
  useEffect(() => {
    const gazeInterval = setInterval(() => {
      if (isThinking) {
        // Thinking: look slightly up and away
        setEyeLook({ x: 2, y: -2.5 });
        setHeadTilt(-1.5);
      } else if (isListening) {
        // Listening: focus attentive and slight curious tilt
        setEyeLook({ x: 0, y: 1 });
        setHeadTilt(2);
      } else {
        // Natural idle subtle shift
        const rx = (Math.random() - 0.5) * 3;
        const ry = (Math.random() - 0.5) * 2;
        setEyeLook({ x: rx, y: ry });
        setHeadTilt((Math.random() - 0.5) * 1.5);
      }
    }, 3500);

    return () => clearInterval(gazeInterval);
  }, [isThinking, isListening]);

  // Dynamic mouth dimensions based on props
  const mouthHeight = Math.max(3, mouthOpen * 18);
  const mouthWidth = mouthShape === 'round' ? 14 : mouthShape === 'wide' ? 26 : 20;

  const isHolo = avatarStyle === 'hologram';

  return (
    <div
      onClick={() => {
        setPulseKey(prev => prev + 1);
        onAvatarClick?.();
      }}
      className={`relative flex items-center justify-center select-none cursor-pointer group ${className}`}
      title="ঐশী (OISHI) — বাংলা এআই ভার্চুয়াল সহকারী"
    >
      {/* Background Ambient Glow & Aura */}
      <div
        className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          isThinking
            ? 'bg-gradient-to-r from-cyan-500/30 via-indigo-500/40 to-purple-500/30 scale-110 animate-pulse'
            : isSpeaking
            ? 'bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-rose-500/30 scale-105'
            : isListening
            ? 'bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 scale-105'
            : 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 scale-100'
        }`}
      />

      {/* Futuristic Orbiting Rings when Thinking */}
      {isThinking && (
        <div className="absolute inset-2 border-2 border-dashed border-cyan-400/50 rounded-full animate-spin [animation-duration:8s] pointer-events-none" />
      )}
      {isThinking && (
        <div className="absolute inset-6 border border-indigo-400/40 rounded-full animate-spin [animation-duration:12s] [animation-direction:reverse] pointer-events-none" />
      )}

      {/* Floating Stardust Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-1.5 h-1.5 rounded-full bg-cyan-300/60 animate-ping [animation-duration:3s]" />
        <div className="absolute top-1/3 right-1/5 w-1 h-1 rounded-full bg-pink-300/70 animate-ping [animation-duration:2.5s]" />
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 rounded-full bg-purple-300/40 animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-indigo-300/60 animate-ping [animation-duration:4s]" />
      </div>

      {/* Main Vector Character SVG */}
      <svg
        viewBox="0 0 320 380"
        className={`w-full h-full max-w-[360px] drop-shadow-2xl transition-transform duration-300 ${
          isHolo ? 'filter hue-rotate-180 brightness-110 contrast-125' : ''
        }`}
        style={{
          transform: `rotate(${headTilt}deg)`,
          transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.3, 1)',
        }}
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="bgVignette" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#0f172a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="1" />
          </radialGradient>

          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff1e8" />
            <stop offset="50%" stopColor="#fed7c3" />
            <stop offset="100%" stopColor="#fbc4aa" />
          </linearGradient>

          <linearGradient id="blushGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e1b2e" />
            <stop offset="50%" stopColor="#28203c" />
            <stop offset="100%" stopColor="#151224" />
          </linearGradient>

          <linearGradient id="hairHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4c3870" stopOpacity="0" />
            <stop offset="50%" stopColor="#a881e6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#4c3870" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="irisGrad" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#0284c7" />
            <stop offset="85%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#082f49" />
          </radialGradient>

          <linearGradient id="dressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="50%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>

          <linearGradient id="goldChain" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          <filter id="pendantGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- BREATHING GROUP (Sinusoidal vertical motion) --- */}
        <g className="animate-float-gentle">
          {/* Back Hair Strands (Behind neck) */}
          <path
            d="M85 140 C60 180, 50 250, 65 310 C80 325, 95 320, 100 290 C105 250, 110 200, 115 170 Z"
            fill="url(#hairGrad)"
          />
          <path
            d="M235 140 C260 180, 270 250, 255 310 C240 325, 225 320, 220 290 C215 250, 210 200, 205 170 Z"
            fill="url(#hairGrad)"
          />

          {/* Shoulders & Clothing */}
          <g id="clothing">
            {/* Base dress body */}
            <path
              d="M70 380 C80 295, 110 255, 160 255 C210 255, 240 295, 250 380 Z"
              fill="url(#dressGrad)"
            />

            {/* Left & Right Shoulder Seams & Folds */}
            <path
              d="M100 285 C115 300, 130 330, 135 380"
              stroke="#6366f1"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
              fill="none"
            />
            <path
              d="M220 285 C205 300, 190 330, 185 380"
              stroke="#6366f1"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
              fill="none"
            />

            {/* Elegant V-Neck Collar */}
            <path
              d="M125 258 C140 285, 160 298, 160 298 C160 298, 180 285, 195 258 C175 264, 145 264, 125 258 Z"
              fill="#1e1b4b"
              stroke="#818cf8"
              strokeWidth="2.5"
            />
            <path
              d="M132 260 C145 278, 160 288, 160 288 C160 288, 175 278, 188 260"
              fill="none"
              stroke="#c7d2fe"
              strokeWidth="1"
              opacity="0.7"
            />

            {/* Delicate Golden Necklace & Glowing Locket */}
            <path
              d="M136 244 C148 266, 172 266, 184 244"
              fill="none"
              stroke="url(#goldChain)"
              strokeWidth="2"
            />
            {/* Locket Pendant */}
            <g transform="translate(160, 266)" filter="url(#pendantGlow)">
              <polygon
                points="0,-6 6,0 0,6 -6,0"
                fill="#38bdf8"
                stroke="#fef08a"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="0" r="2" fill="#ffffff" />
            </g>
          </g>

          {/* Neck with subtle shadow under chin */}
          <path
            d="M138 200 L138 256 C148 260, 172 260, 182 256 L182 200 Z"
            fill="url(#skinGrad)"
          />
          <path
            d="M138 200 C150 216, 170 216, 182 200 C175 210, 145 210, 138 200 Z"
            fill="#e29f82"
            opacity="0.6"
          />

          {/* Face Base */}
          <g id="head">
            {/* Jaw and Cheeks contour */}
            <path
              d="M102 125 C98 175, 120 226, 160 226 C200 226, 222 175, 218 125 C218 80, 102 80, 102 125 Z"
              fill="url(#skinGrad)"
              stroke="#fed7c3"
              strokeWidth="1"
            />

            {/* Soft Feminine Rosy Cheeks (Blush) */}
            <ellipse cx="120" cy="168" rx="14" ry="7" fill="url(#blushGrad)" />
            <ellipse cx="200" cy="168" rx="14" ry="7" fill="url(#blushGrad)" />

            {/* Cute Subtle Nose with soft shading */}
            <path
              d="M158 152 Q160 162 163 162 Q158 163 155 162"
              fill="none"
              stroke="#d97757"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="158" cy="160" r="1.5" fill="#fca5a5" opacity="0.6" />

            {/* Delicate Arched Eyebrows (Positioned gracefully below hairline) */}
            <g id="eyebrows">
              {/* Left Brow */}
              <path
                d="M116 122 Q130 115 142 121"
                fill="none"
                stroke="#2a223e"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              {/* Right Brow */}
              <path
                d="M178 121 Q190 115 204 122"
                fill="none"
                stroke="#2a223e"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </g>

            {/* --- EYES WITH REALISTIC DEPTH & BLINKING --- */}
            <g id="eyes">
              {/* Left Eye */}
              <g transform="translate(130, 138)">
                {isBlinking ? (
                  // Closed eyelid during blink
                  <path
                    d="M-15 0 Q0 6 15 0"
                    fill="none"
                    stroke="#2e1065"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    {/* Sclera (Eye white) */}
                    <path
                      d="M-16 0 C-12 -9, 12 -9, 16 0 C 12 9, -12 9, -16 0 Z"
                      fill="#ffffff"
                    />

                    {/* Iris with Dark Limbal Ring & Radial Glow */}
                    <g transform={`translate(${eyeLook.x}, ${eyeLook.y})`}>
                      <circle cx="0" cy="0" r="7.5" fill="url(#irisGrad)" stroke="#0c4a6e" strokeWidth="1.2" />
                      {/* Pupil */}
                      <circle cx="0" cy="0" r="3.6" fill="#030712" />
                      {/* Iris bottom reflection crescent */}
                      <path
                        d="M-4.5 2 C-2 5.5, 2 5.5, 4.5 2"
                        stroke="#7dd3fc"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.8"
                      />
                      {/* 3-tier Sparkle Highlights */}
                      <circle cx="-2.5" cy="-2.5" r="2.2" fill="#ffffff" />
                      <circle cx="2.8" cy="2" r="1.1" fill="#ffffff" opacity="0.9" />
                      <circle cx="-1" cy="3" r="0.7" fill="#ffffff" opacity="0.8" />
                    </g>

                    {/* Eyelash / Upper Eyelid Shadow for depth */}
                    <path
                      d="M-17 -1 C-10 -11, 10 -11, 17 -1"
                      fill="none"
                      stroke="#1e1035"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M-15 0 C-10 -7, 10 -7, 15 0"
                      fill="#1e1035"
                      opacity="0.25"
                    />
                    {/* Outer Lash Wing */}
                    <path d="M16 -2 Q19 -6 21 -4" stroke="#1e1035" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </>
                )}
              </g>

              {/* Right Eye */}
              <g transform="translate(190, 138)">
                {isBlinking ? (
                  // Closed eyelid during blink
                  <path
                    d="M-15 0 Q0 6 15 0"
                    fill="none"
                    stroke="#2e1065"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    {/* Sclera (Eye white) */}
                    <path
                      d="M-16 0 C-12 -9, 12 -9, 16 0 C 12 9, -12 9, -16 0 Z"
                      fill="#ffffff"
                    />

                    {/* Iris with Dark Limbal Ring & Radial Glow */}
                    <g transform={`translate(${eyeLook.x}, ${eyeLook.y})`}>
                      <circle cx="0" cy="0" r="7.5" fill="url(#irisGrad)" stroke="#0c4a6e" strokeWidth="1.2" />
                      {/* Pupil */}
                      <circle cx="0" cy="0" r="3.6" fill="#030712" />
                      {/* Iris bottom reflection crescent */}
                      <path
                        d="M-4.5 2 C-2 5.5, 2 5.5, 4.5 2"
                        stroke="#7dd3fc"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.8"
                      />
                      {/* 3-tier Sparkle Highlights */}
                      <circle cx="-2.5" cy="-2.5" r="2.2" fill="#ffffff" />
                      <circle cx="2.8" cy="2" r="1.1" fill="#ffffff" opacity="0.9" />
                      <circle cx="-1" cy="3" r="0.7" fill="#ffffff" opacity="0.8" />
                    </g>

                    {/* Eyelash / Upper Eyelid Shadow for depth */}
                    <path
                      d="M-17 -1 C-10 -11, 10 -11, 17 -1"
                      fill="none"
                      stroke="#1e1035"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M-15 0 C-10 -7, 10 -7, 15 0"
                      fill="#1e1035"
                      opacity="0.25"
                    />
                    {/* Outer Lash Wing */}
                    <path d="M16 -2 Q19 -6 21 -4" stroke="#1e1035" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </>
                )}
              </g>
            </g>

            {/* --- MOUTH WITH DYNAMIC LIP SYNC --- */}
            <g id="mouth" transform="translate(160, 186)">
              {isSpeaking ? (
                // Speaking: dynamic open mouth with teeth/tongue & lip outline
                <g>
                  {/* Inside mouth chamber */}
                  <ellipse
                    cx="0"
                    cy={mouthHeight * 0.4}
                    rx={mouthWidth * 0.55}
                    ry={mouthHeight * 0.7}
                    fill="#7f1d1d"
                  />
                  {/* Top Teeth */}
                  <path
                    d={`M-${mouthWidth * 0.35} 0 Q0 3 ${mouthWidth * 0.35} 0 Z`}
                    fill="#ffffff"
                    opacity="0.9"
                  />
                  {/* Tongue */}
                  <ellipse
                    cx="0"
                    cy={mouthHeight * 0.75}
                    rx={mouthWidth * 0.35}
                    ry={mouthHeight * 0.35}
                    fill="#f43f5e"
                  />
                  {/* Upper & Lower Lips */}
                  <path
                    d={`M-${mouthWidth * 0.55} 0 Q0 -2 ${mouthWidth * 0.55} 0`}
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M-${mouthWidth * 0.45} ${mouthHeight * 0.8} Q0 ${mouthHeight * 1.1} ${mouthWidth * 0.45} ${mouthHeight * 0.8}`}
                    fill="none"
                    stroke="#fb7185"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </g>
              ) : (
                // Resting pleasant smile
                <g>
                  <path
                    d="M-12 0 Q0 6 12 0"
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  {/* Gentle lower lip highlight */}
                  <path
                    d="M-6 4 Q0 7 6 4"
                    fill="none"
                    stroke="#fda4af"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                </g>
              )}
            </g>
          </g>

          {/* --- LAYERED HAIR (Multi-layer bangs, side locks, & soft glossy highlights) --- */}
          <g id="frontHair">
            {/* Top crown hair volume */}
            <path
              d="M90 120 C85 60, 130 35, 160 35 C190 35, 235 60, 230 120 C215 80, 185 60, 160 60 C135 60, 105 80, 90 120 Z"
              fill="url(#hairGrad)"
            />

            {/* Glossy Hair Highlight Band across the crown */}
            <path
              d="M108 85 C125 72, 195 72, 212 85 C195 80, 125 80, 108 85 Z"
              fill="url(#hairHighlight)"
            />

            {/* Left Framing Bangs */}
            <path
              d="M92 110 C96 140, 112 175, 115 195 C111 170, 106 140, 108 115 Z"
              fill="url(#hairGrad)"
            />
            <path
              d="M110 80 C125 105, 136 112, 148 110 C140 100, 128 85, 110 80 Z"
              fill="url(#hairGrad)"
            />

            {/* Right Framing Bangs */}
            <path
              d="M228 110 C224 140, 208 175, 205 195 C209 170, 214 140, 212 115 Z"
              fill="url(#hairGrad)"
            />
            <path
              d="M210 80 C195 105, 184 112, 172 110 C180 100, 192 85, 210 80 Z"
              fill="url(#hairGrad)"
            />

            {/* Center soft parted strand */}
            <path
              d="M158 55 Q164 85 160 98 Q156 80 158 55 Z"
              fill="#3a3052"
            />
          </g>

          {/* Futuristic Ear-clip / Cyber Communicator */}
          <g transform="translate(97, 148)">
            <ellipse cx="0" cy="0" rx="3.5" ry="6" fill="#38bdf8" />
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
          </g>
          <g transform="translate(223, 148)">
            <ellipse cx="0" cy="0" rx="3.5" ry="6" fill="#38bdf8" />
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
          </g>
        </g>
      </svg>

      {/* Holographic Scanline Overlay when in Hologram mode */}
      {isHolo && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent bg-[length:100%_4px] pointer-events-none rounded-3xl" />
      )}

      {/* State Badge Floating below Avatar */}
      <div className="absolute -bottom-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 shadow-lg text-xs font-medium backdrop-blur-md">
        {isThinking ? (
          <>
            <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping" />
            <span className="text-cyan-700 dark:text-cyan-300">ঐশী চিন্তা করছে...</span>
          </>
        ) : isSpeaking ? (
          <>
            <span className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400 animate-pulse" />
            <span className="text-pink-700 dark:text-pink-300">ঐশী কথা বলছে</span>
          </>
        ) : isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
            <span className="text-emerald-700 dark:text-emerald-300">ঐশী শুনছে...</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
            <span className="text-slate-700 dark:text-slate-300">ঐশী প্রস্তুত 🌸</span>
          </>
        )}
      </div>
    </div>
  );
};
