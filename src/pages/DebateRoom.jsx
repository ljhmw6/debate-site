import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import PageBackground from '../components/PageBackground';

const MIN_TIME = 10;  // 발표시간 최소(초)
const MAX_TIME = 600; // 발표시간 최대(초)
const clampTime = (v) => Math.min(MAX_TIME, Math.max(MIN_TIME, Math.round(Number(v) || 0)));

// 순서 정하기에서 저장한 내용 읽기 (없거나 깨졌으면 null)
const readSaved = () => {
  try {
    const topic = localStorage.getItem('next_debate_topic');
    const results = JSON.parse(localStorage.getItem('next_debate_results') || 'null');
    if (!topic || !Array.isArray(results) || results.length === 0) return null;
    return { topic, results, noSide: localStorage.getItem('next_debate_noside') === 'true' };
  } catch {
    return null;
  }
};

// 오디오 객체 (유지) 
const alertSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
const applauseSound = typeof Audio !== "undefined" ? new Audio("/applause.mp3") : null;

const speak = (text) => {
  if (typeof window !== "undefined" && window.speechSynthesis) { 
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
 
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find(v => v.lang === 'ko-KR' || v.lang === 'ko_KR');
      if (koVoice) utterance.voice = koVoice;
      window.speechSynthesis.speak(utterance);
    };
 
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    }
  }
};

const fadeOutAudio = (audio, duration = 3000) => {
  if (!audio) return;

  const startVolume = audio.volume;
  const interval = 50; 
  const steps = duration / interval;
  const fadeFactor = Math.pow(0.01 / startVolume, 1 / steps); 

  const fadeTimer = setInterval(() => {
    if (audio.volume > 0.02) {
      audio.volume *= fadeFactor; 
    } else {
      audio.volume = 0;
      audio.pause();
      clearInterval(fadeTimer);
      audio.volume = startVolume;
    }
  }, interval);
};

function DebateRoom({ onBack }) { 
  const [topic, setTopic] = useState("");
  const [participants, setParticipants] = useState([
    { name: "", turn: 1, team: "찬성측", color: "bg-blue-500" },
    { name: "", turn: 2, team: "반대측", color: "bg-red-500" },
    { name: "", turn: 3, team: "찬성측", color: "bg-blue-500" },
    { name: "", turn: 4, team: "반대측", color: "bg-red-500" },
  ]);
  const [savedData, setSavedData] = useState(readSaved); // 불러오기 안내창용
  const [step, setStep] = useState('input');
  const [round, setRound] = useState(0); 
  const [turn, setTurn] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(180); 
  const [isActive, setIsActive] = useState(false);
  const [introTimer, setIntroTimer] = useState(25);
  const [debateTime, setDebateTime] = useState(180);
  const [isLoaded, setIsLoaded] = useState(false);
  const [noSide, setNoSide] = useState(false); // 찬반 없이 토론하기

  const roundNames = ["나의 주장", "궁금한점 또는 반론", "최종 정리"]; 

  const handleGoHome = () => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (applauseSound) {
    applauseSound.pause();
    applauseSound.currentTime = 0;
  }
  if (onBack) {
    onBack(); 
    } else {
      console.error("onBack 함수가 전달되지 않았어!");
    }
  }; 
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    let timer = null;

    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 4) {
            speak("발언 시간이 종료되었습니다.");
          }
          return prev - 1;
        });
      }, 1000);
    } 
    else if (timeLeft <= 0 && isActive) {
      setIsActive(false); 
      alertSound.play().catch(() => {});
      setTimeout(() => {
        handleNext();
      }, 500);
    }

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);
 
  const loadSaved = () => {
    setTopic(savedData.topic);
    setParticipants(savedData.results);
    setNoSide(savedData.noSide);
    setIsLoaded(true);
    setSavedData(null);
  };

  const adjustParticipants = (amount) => {
    if (amount > 0 && participants.length < 10) {
      const newCount = participants.length;
      setParticipants([
        ...participants,
        { name: "", turn: newCount + 1, team: "찬성측", color: "bg-blue-500" },
        { name: "", turn: newCount + 2, team: "반대측", color: "bg-red-500" }
      ]);
    } else if (amount < 0 && participants.length > 2) {
      setParticipants(participants.slice(0, -2));
    }
  };

  useEffect(() => {
    let timer;
    if (step === 'intro') {
      const currentP = participants[turn];
      const side = noSide ? "" : (turn % 2 === 0 ? "찬성측 " : "반대측 ");
      speak(`오늘의 토론 주제는 ${topic}입니다. 주의 사항을 확인하고 준비해 주세요. 첫 번째 발표자 ${side}${currentP.name} 친구부터 시작합니다!`);
      timer = setInterval(() => {
        setIntroTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setStep('debating');
            setIsActive(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step === 'debating') {
      const currentP = participants[turn];
      const side = noSide ? "" : (turn % 2 === 0 ? "찬성측 " : "반대측 ");
      speak(`${side}${currentP.name} 친구, ${roundNames[round]} 시작해 주세요!`);
    }
    if (step === 'final') {
      speak("정말 멋진 토론이었어요! 내 생각을 용기 있게 말하고, 친구의 이야기에 끝까지 귀 기울인 여러분 모두가 오늘의 주인공입니다. 모두 서로에게 큰 박수를 보내 주세요!");
    }
  }, [turn, round, step]);

  useEffect(() => {
    if (step === 'final' && applauseSound) {
      applauseSound.volume = 1.0; // 볼륨 초기화
      applauseSound.play().catch(() => {});
      
      const fadeTimeout = setTimeout(() => {
        fadeOutAudio(applauseSound, 3000); // 3초 동안 서서히 꺼짐
      }, 4000);

      return () => clearTimeout(fadeTimeout);
    }
  }, [step]);

  // 종료 화면 축하 꽃가루 (움직임 줄이기 설정이면 생략)
  useEffect(() => {
    if (step !== 'final') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#3b82f6', '#8b5cf6', '#facc15', '#38bdf8', '#ffffff'];
    const fire = (opts) => confetti({ particleCount: 70, spread: 65, startVelocity: 48, colors, ...opts });
    fire({ origin: { x: 0.1, y: 0.75 }, angle: 60 });
    fire({ origin: { x: 0.9, y: 0.75 }, angle: 120 });
    const t = setTimeout(() => fire({ origin: { x: 0.5, y: 0.25 }, spread: 120, particleCount: 50, startVelocity: 30 }), 800);
    return () => { clearTimeout(t); confetti.reset(); };
  }, [step]);

  const handleNext = () => { 
    if (turn < participants.length - 1) {
      setTurn(turn + 1);
      setTimeLeft(debateTime);
      setIsActive(true); // 다시 활성화
    } else if (round < 2) {
      setRound(round + 1);
      setTurn(0);
      setTimeLeft(debateTime);
      setIsActive(true); // 다시 활성화
    } else {
      setStep('final');
      setIsActive(false);
    }
  };

  const startDebate = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const wakeup = new SpeechSynthesisUtterance(" "); 
      window.speechSynthesis.speak(wakeup);
    }
    if (applauseSound) {
      applauseSound.play().then(() => {
        applauseSound.pause();
        applauseSound.currentTime = 0;
      }).catch(() => {});
    }

    const t = clampTime(timeLeft);
    setTimeLeft(t);
    setDebateTime(t);
    setStep('intro');
  };

  const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // --- 1. 설정 화면 (Input) ---
  if (step === 'input') {
    const timeValid = timeLeft !== "" && Number(timeLeft) >= MIN_TIME && Number(timeLeft) <= MAX_TIME;
    const canStart = topic && participants.every(p => p.name.trim() !== "") && timeValid;
    return (
      <div className='relative min-h-screen flex items-center justify-center p-4 py-6 md:py-10'>
        <PageBackground variant="soft" />

        {/* 💾 지난번에 정한 순서 불러오기 안내창 */}
        {savedData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl ring-1 ring-blue-100 p-6 md:p-8 animate-in fade-in zoom-in duration-300">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 font-jalnan mb-1">📋 정해둔 순서가 있어요!</h3>
              <p className="text-slate-500 text-sm md:text-base mb-5">순서 정하기에서 만든 내용을 불러올까요?</p>

              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 mb-6 space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-400">주제</span>
                  <p className="text-base md:text-lg font-black text-violet-700 break-keep">{savedData.topic}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400">
                    발표자 {savedData.results.length}명 · {savedData.noSide ? "찬반 없이" : "찬반 토론"}
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1 max-h-40 overflow-y-auto">
                    {savedData.results.map((p, i) => (
                      <span key={i} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full pl-1 pr-3 py-1 text-sm font-bold text-slate-700">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${savedData.noSide ? 'bg-violet-500' : (i % 2 === 0 ? 'bg-blue-500' : 'bg-red-500')}`}>{i + 1}</span>
                        {p.name}
                        {!savedData.noSide && (
                          <span className={`text-[10px] ${i % 2 === 0 ? 'text-blue-600' : 'text-red-600'}`}>{i % 2 === 0 ? '찬성' : '반대'}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSavedData(null)} className="flex-1 py-3 md:py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold text-base md:text-lg hover:border-slate-300 active:scale-95 transition-all">
                  새로 입력할게요
                </button>
                <button onClick={loadSaved} className="flex-1 py-3 md:py-4 bg-linear-to-r from-blue-600 to-violet-600 text-white rounded-2xl font-bold text-base md:text-lg shadow-lg shadow-violet-500/30 hover:from-blue-500 hover:to-violet-500 active:scale-95 transition-all">
                  불러오기
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 📱 p-6 md:p-10 모바일 여백 조절 */}
        <div className="p-6 md:p-10 z-10 w-full max-w-3xl bg-white/90 backdrop-blur-xl border border-white/80 ring-1 ring-blue-100/60 shadow-[0_24px_60px_-20px_rgba(30,58,138,0.5)] rounded-[2rem] relative">
          <header className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl text-slate-800 font-jalnan">🎤 토론 설정</h2>
            <button onClick={handleGoHome} title="홈으로 가기" aria-label="홈으로 가기" className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/90 text-slate-600 border border-slate-200 hover:text-blue-600 hover:border-blue-300 rounded-2xl shadow-sm transition-all active:scale-90"><Home size={22} strokeWidth={2.25} /></button>
          </header>
          
          <div className="space-y-6 md:space-y-8"> 
            <section>
              <label className="block text-lg md:text-xl font-bold text-slate-700 mb-2 ml-1">오늘의 주제</label>
              {isLoaded ? (
                <div className="group relative py-2"> 
                  <p className="text-xl md:text-3xl font-black text-violet-700 font-jalnan break-keep">
                    {topic}
                  </p> 
                  <button onClick={() => setIsLoaded(false)} className="absolute -top-8 -right-2 bg-white border border-slate-200 rounded-full px-2 py-1 text-xs shadow-sm hover:bg-slate-50">✏️ 수정</button>
                </div>
              ) : ( 
                <input className="w-full p-3 md:p-4 border-2 border-blue-100 rounded-2xl text-sm md:text-xl font-bold bg-white/90 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 outline-none transition-all"value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="주제를 입력해 주세요!" />
              )}
            </section>
 
            <section>
              <div className="flex justify-between items-center mb-4">
                <label className="text-lg md:text-xl font-bold text-slate-700 ml-1">발표자 ({participants.length}명)</label>
                {!isLoaded && (
                  <div className="flex gap-1.5 md:gap-2">
                    <button onClick={() => setNoSide(!noSide)} className={`px-2.5 py-1.5 rounded-xl text-xs md:text-sm font-bold border-2 transition-all active:scale-95 ${noSide ? "bg-violet-600 border-violet-600 text-white" : "bg-white/90 border-violet-200 text-violet-700 hover:bg-violet-50"}`}>{noSide ? "✅" : "⬜"} 찬반 없이</button>
                    <button onClick={() => adjustParticipants(-1)} className="px-2.5 py-1.5 bg-white/90 border-2 border-slate-200 text-slate-600 rounded-xl text-xs md:text-sm font-bold hover:border-slate-300 transition-all active:scale-95">- 2명</button>
                    <button onClick={() => adjustParticipants(1)} className="px-2.5 py-1.5 bg-blue-600 border-2 border-blue-600 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-blue-500 transition-all active:scale-95">+ 2명</button>
                  </div>
                )}
              </div>              
              {/* 📱 모바일에선 1열, PC에선 2열 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-x-6 md:gap-y-2 md:max-h-none overflow-y-auto pr-1">
                {participants.map((p, i) => (
                  <div key={i} className={`p-3 rounded-2xl border-2 flex items-center gap-2 md:gap-3 bg-white/90 transition-all focus-within:ring-4 ${noSide ? 'border-violet-100 focus-within:ring-violet-100' : (i % 2 === 0 ? 'border-blue-100 focus-within:ring-blue-100' : 'border-red-100 focus-within:ring-red-100')}`}>
                    <span className={`w-8 h-6 md:w-11 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shrink-0 ${noSide ? 'bg-violet-500' : (i % 2 === 0 ? 'bg-blue-500' : 'bg-red-500')}`}>{p.turn}</span>
                    {!noSide && (
                      <span className={`text-[10px] md:text-xs font-black px-1.5 py-1 rounded-lg shrink-0 ${i % 2 === 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                        {i % 2 === 0 ? '찬성' : '반대'}
                      </span>
                    )}
                    <input className="w-full bg-transparent font-bold outline-none text-2sm md:text-2xl" value={p.name} placeholder="이름" readOnly={isLoaded} maxLength={9} onChange={(e) => {
                        const newP = [...participants];
                        newP[i].name = e.target.value;
                        setParticipants(newP);
                    }} />
                  </div>
                ))}
              </div>
            </section>
  
            <section className="rounded-2xl"> 
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-700 font-bold text-base md:text-xl">발표시간</span>
                <input type="number" min={MIN_TIME} max={MAX_TIME} step={10} className={`w-16 md:w-24 p-1.5 border-2 rounded-xl text-center text-sm md:text-xl font-bold bg-white/90 outline-none focus:ring-4 transition-all ${timeValid ? "border-blue-200 focus:border-blue-400 focus:ring-blue-100" : "border-red-500 focus:ring-red-100"}`} value={timeLeft} onChange={(e) => setTimeLeft(e.target.value === "" ? "" : Number(e.target.value))} onBlur={() => setTimeLeft(clampTime(timeLeft))} />
                <span className="text-slate-400 font-bold text-sm md:text-lg">초 ({Math.floor((Number(timeLeft) || 0) / 60)}분 {(Number(timeLeft) || 0) % 60}초)</span>
              </div>
              {!timeValid && (
                <p className="mt-2 ml-1 text-red-500 text-xs md:text-sm font-bold">발표시간은 {MIN_TIME}초~{MAX_TIME / 60}분 사이로 입력해 주세요.</p>
              )}
            </section>
            
            <button onClick={startDebate} className={`w-full py-4 md:py-5 text-white text-xl md:text-2xl font-bold rounded-2xl transition-all ${canStart ? "bg-linear-to-r from-blue-600 to-violet-600 shadow-xl shadow-violet-500/30 hover:from-blue-500 hover:to-violet-500 hover:-translate-y-0.5 active:scale-[0.98]" : "bg-slate-300 cursor-not-allowed"}`} disabled={!canStart}>
              토론 시작하기 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. 안내 화면 (Intro) ---
  if (step === 'intro') {
    const displayMin = Math.floor(debateTime / 60);
    const displaySec = debateTime % 60;
    const timeString = displayMin > 0 
      ? `${displayMin}분 ${displaySec > 0 ? displaySec + '초' : ''}` 
      : `${displaySec}초`;
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-10 text-center overflow-y-auto">
        <PageBackground variant="focus" />
        <div className="relative z-10 w-full flex flex-col items-center space-y-6 md:space-y-10">
        <h1 className="text-xl md:text-4xl text-slate-500 font-jalnan">오늘의 주제
            <p className="text-violet-700 text-lg md:text-3xl mt-2 font-black break-keep px-4">{topic}</p>
        </h1>
        <div className="bg-white/80 backdrop-blur-xl p-6 md:p-10 rounded-[2rem] border border-white ring-1 ring-blue-100 shadow-[0_24px_60px_-24px_rgba(30,58,138,0.35)] text-left w-full max-w-3xl relative">
          <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-slate-800 font-jalnan">토론 시 주의 사항</h3>
          <ul className="space-y-3 md:space-y-4 text-base md:text-xl text-slate-700 font-medium list-disc ml-4 md:ml-6">            
            <li>토론 시에는 차분하고 예의 있는 존댓말로 말해주세요.</li>
            <li>상대방의 의견을 무시하거나 비방하는 말은 자제해주세요.</li>
            <li>각 나의 주장 <span className="text-blue-600 font-bold">{timeString}</span>, 궁금한점&반론 <span className="text-blue-600 font-bold">{timeString}</span>, 최종 정리 <span className="text-blue-600 font-bold">
            {timeString}</span>씩 주어집니다.</li>
            <li>내 순서가 아니더라도 화면을 보며 친구의 의견에 반응해 주세요.</li>
            <li>{timeString}이 지나면 다음 친구에게 차례가 넘어갑니다.</li>
          </ul> 
          <div className="mt-8 md:absolute md:-right-20 md:-bottom-10 bg-sky-50 border-2 border-sky-300 shadow-lg shadow-sky-500/20 p-4 md:p-6 rounded-3xl md:rounded-full md:w-44 md:h-44 flex items-center justify-center text-center text-sm md:text-lg font-bold text-blue-800 animate-pulse"> 
            목소리가 커지면<br className="hidden md:block" /> 물을 마시고<br/> 심호흡을 해요!
          </div>
        </div>
        <div className="space-y-4">
           <p className="text-lg md:text-2xl font-medium px-4">
            첫 번째 발표자 <br className="md:hidden" />{!noSide && <span className="text-blue-600 font-black">찬성측</span>} 
            <span className="text-green-600 font-black"> {participants[0]?.name}</span> 친구부터 시작합니다!
          </p>
          <div className="text-slate-500 font-bold bg-white/80 border border-slate-200 py-2 px-6 rounded-full inline-block text-sm tabular-nums">
            {Math.floor(introTimer / 60)}분 {introTimer % 60}초 후 자동 시작
          </div>
        </div>
        </div>
      </div>
    );
  }

  // --- 3. 토론 중 화면 (Debating) ---
  if (step === 'debating') {
    const isChan = turn % 2 === 0;
    const currentP = participants[turn];
    const nextIdx = (turn + 1) % participants.length;
    const nextP = participants[nextIdx];
    const isLastSpeakerOfRound = turn === participants.length - 1;

    return (
      <div className="h-screen h-svh flex flex-col items-center justify-center py-10 px-6 text-center overflow-hidden relative">
        <PageBackground variant="focus" />
        <div className="space-y-4 md:space-y-6 relative z-10 w-full">
          <p className="inline-block max-w-full px-4 py-1.5 md:px-6 md:py-2 rounded-full bg-white/70 border border-violet-100 text-violet-700 text-sm md:text-2xl font-black font-jalnan break-keep">{topic}</p>
          <h2 className={`text-3xl md:text-5xl font-jalnan font-black transition-colors ${noSide ? "text-slate-700" : isChan ? "text-blue-600" : "text-red-600"}`}>
            {!noSide && (isChan ? "찬성측" : "반대측")} <span className="text-green-600">{currentP?.name}</span> 
            <div className="text-4xl md:text-7xl mt-2 md:mt-5 text-slate-600">
              {roundNames[round]}
            </div>
          </h2> 

          <div className="bg-amber-50/90 border border-amber-100 p-3 md:p-4 md:px-6 rounded-2xl inline-block max-w-7xl shadow-sm mx-4">
          <p className="text-xl md:text-2xl text-slate-700 font-bold leading-snug break-keep">
            {round === 0 && (
              noSide
                ? <>나의 생각과 <span className="text-orange-600">이유와 근거</span>를 <br className="md:hidden" /><span className="text-orange-600">1~3가지</span> 이야기 해주세요</>
                : <>{isChan ? '찬성' : '반대'}하는 <span className="text-orange-600">이유와 근거</span>를 <br className="md:hidden" /><span className="text-orange-600">1~3가지</span> 이야기 해주세요</>
            )}
            {round === 1 && (
              <>친구의 말에서 <span className="text-orange-500">궁금한 거나, <br className="md:hidden" />생각이 다른 부분</span>을 말해보세요</>
            )}
            {round === 2 && (
              <>토론한 내용을 바탕으로 <br className="md:hidden" /><span className="text-orange-600">내 생각을 마지막으로 <br className="md:hidden" />정리</span>해주세요</>
            )}
          </p>
        </div>

        </div>
   
        {/* 📱 타이머 크기 핵심! 모바일에선 text-7xl, PC에선 17rem */}
        <div className={`relative z-10 text-9xl sm:text-[10rem] md:text-[15rem] lg:text-[17rem] mt-6 md:mt-10 mb-4 md:mb-7 font-black tabular-nums timer-font tracking-tighter leading-none select-none transition-colors 
            ${timeLeft <= 3 ? "text-red-600 animate-pulse" : timeLeft <= 9 ? "text-orange-500" : "text-slate-800"}`}
        >
          {formatTime(timeLeft)}
        </div> 

        <div className="relative z-10 w-full max-w-6xl px-4">
          {round === 2 && isLastSpeakerOfRound ? (
            <p className="text-2xl md:text-3xl text-orange-600 font-black animate-bounce font-jalnan mt-5">마무리할 시간이에요! ✨</p>
          ) : ( 
            <p className="text-lg md:text-2xl text-slate-600 font-bold leading-snug  mt-3 md:mt-0">
            다음 순서는 
            {!noSide && (
              <span className={ (nextIdx % 2 === 0) ? "text-blue-600 ml-2" : "text-red-600 ml-2" }>
                {(nextIdx % 2 === 0) ? "찬성측" : "반대측"}
              </span>
            )}
            <span className="text-green-600 font-black mx-2">
              {nextP?.name}
            </span> 
            친구의 <br className="md:hidden" />
            <span className="text-violet-600 ml-1">
              {isLastSpeakerOfRound ? roundNames[round + 1] : roundNames[round]}
            </span> 시간입니다. <br className="md:hidden" />준비해 주세요.
          </p>
          )}
        </div>
        
        {/* 📱 모바일용 다음 버튼 (작게 배치) */}
        <button onClick={handleNext} className="relative z-10 mt-8 px-6 py-2 bg-white/70 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-full text-xs font-bold transition-colors">건너뛰기</button>
      </div>
    );
  }

  // --- 4. 종료 화면 (Final) ---
  if (step === 'final') {
    return (
        <div className="final-hero text-center">
          {/* 배경: 넓은 화면은 전체 배경, 세로 화면은 흐린 배경 + 하단 이미지 띠 (index.css) */}
          <div className="final-bg" aria-hidden="true"></div>
          <div className="final-glow" aria-hidden="true"></div>

          {/* 가운데 하늘 영역에만 배치 → 양옆 아이들 얼굴은 가리지 않음 */}
          <div className="final-content">
            <div className="final-column flex flex-col items-center gap-[clamp(0.75rem,2.2vh,1.25rem)] animate-in fade-in zoom-in duration-700">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 border border-white text-blue-700 text-sm md:text-base font-bold shadow-sm">
                🏆 오늘의 토론 완주!
              </span>

              <h1 className="font-jalnan text-slate-800 leading-tight text-balance text-[clamp(2rem,min(9vw,6.5vh),3.75rem)] drop-shadow-[0_2px_12px_rgba(255,255,255,0.9)]">
                정말 <span className="text-violet-600">멋진</span> 토론이었어요!
              </h1>

              <p className="text-slate-700 font-medium text-balance leading-relaxed text-[clamp(0.95rem,2.3vh,1.3rem)]">
                내 생각을 용기 있게 말하고,<br />
                친구의 이야기에 끝까지 귀 기울인<br />
                <b className="text-blue-700">여러분 모두가 오늘의 주인공</b>이에요.
              </p>

              {/* 칭찬 배지 */}
              <ul className="flex flex-wrap justify-center gap-2">
                {["🗣️ 용기 있게 말했어요", "👂 끝까지 잘 들었어요", "🤝 서로 존중했어요"].map((t) => (
                  <li key={t} className="px-3 py-1.5 rounded-full bg-white/75 backdrop-blur border border-white text-slate-700 text-xs md:text-sm font-bold shadow-sm">
                    {t}
                  </li>
                ))}
              </ul>

              {/* 오늘의 주인공 이름 */}
              {participants.some(p => p.name.trim()) && (
                <div className="w-full rounded-3xl bg-white/60 backdrop-blur-md border border-white/80 px-4 py-3 shadow-[0_12px_30px_-15px_rgba(30,58,138,0.35)]">
                  <p className="text-xs md:text-sm font-bold text-slate-500 mb-2">⭐ 오늘의 주인공 ⭐</p>
                  <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                    {participants.filter(p => p.name.trim()).map((p, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-linear-to-r from-amber-100 to-yellow-50 border border-amber-200 text-amber-900 text-sm md:text-base font-bold">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleGoHome} className="mt-1 flex items-center gap-2.5 px-8 h-[clamp(3.25rem,7vh,4rem)] bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-2xl text-lg md:text-xl font-bold shadow-xl shadow-violet-500/30 hover:-translate-y-0.5 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300">
                <Home size={22} strokeWidth={2.25} /> 메인으로 돌아가기
              </button>
            </div>
          </div>

          {/* 세로 화면 전용: 아이들이 모두 보이는 이미지 띠 */}
          <div className="final-strip" aria-hidden="true"></div>
        </div>
    );
  }
  return null;
}

export default DebateRoom;