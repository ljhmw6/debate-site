import React, { useState, useEffect } from 'react';
import { Home, MessageCircle, Minus, Plus, ClipboardCheck, Pencil, Clock, HeartHandshake, Eye, Timer, Droplets, ChevronRight, Lightbulb, SkipForward } from 'lucide-react';
import confetti from 'canvas-confetti';
import PageBackground from '../components/PageBackground';
import { TopBar, SectionTitle, cardClass } from '../components/PageChrome';

const MIN_TIME = 10;  // 발표시간 최소(초)
const MAX_TIME = 600; // 발표시간 최대(초)
const INTRO_TIME = 25; // 안내 화면 대기 시간(초)
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
  const [introTimer, setIntroTimer] = useState(INTRO_TIME);
  const [debateTime, setDebateTime] = useState(180);
  const [isLoaded, setIsLoaded] = useState(false);
  const [noSide, setNoSide] = useState(false); // 자유 토론(팀 없이 각자 찬반 의견)

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
    const totalMin = Math.ceil((participants.length * 3 * (Number(timeLeft) || 0)) / 60);
    const presets = [60, 120, 180, 300];
    return (
      <div className='relative min-h-screen flex flex-col items-center px-4 py-5 md:py-8'>
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
                    발표자 {savedData.results.length}명 · {savedData.noSide ? "자유 토론" : "팀 토론"}
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

        <TopBar onHome={handleGoHome} step={2} />

        <div className={cardClass}>
          <header className="mb-6 md:mb-8">
            <h1 className="font-jalnan text-slate-800 text-3xl md:text-4xl leading-tight">토론 설정 🎤</h1>
            <p className="mt-2 text-slate-500 text-sm md:text-base break-keep">주제와 발표자, 발표시간을 확인하고 토론을 시작해요.</p>
          </header>

          {isLoaded && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="flex items-center gap-2 text-emerald-800 text-sm md:text-base font-bold break-keep">
                <ClipboardCheck size={18} className="shrink-0" /> 순서 정하기에서 불러온 내용이에요
              </p>
              <button onClick={() => setIsLoaded(false)} className="shrink-0 flex items-center gap-1 rounded-full bg-white border border-emerald-200 px-3 py-1 text-xs md:text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                <Pencil size={13} /> 수정
              </button>
            </div>
          )}

          <div className="space-y-6 md:space-y-8">
            {/* 1. 오늘의 주제 */}
            <section>
              <div className="mb-2.5"><SectionTitle n={1}>오늘의 주제</SectionTitle></div>
              {isLoaded ? (
                <p className="rounded-2xl bg-violet-50/70 border border-violet-100 px-4 py-3.5 font-jalnan text-violet-700 text-xl md:text-2xl leading-snug break-keep">{topic}</p>
              ) : (
                <input className="w-full p-3.5 md:p-4 border-2 border-blue-100 rounded-2xl text-base md:text-xl font-bold bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 placeholder:font-medium outline-none transition-all" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="주제를 입력해 주세요!" />
              )}
            </section>

            {/* 2. 발표자 */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <SectionTitle n={2}>
                  발표자
                  <span className="font-sans text-sm font-bold text-slate-400 tabular-nums">{participants.length}명</span>
                </SectionTitle>
                {!isLoaded && (
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-full bg-slate-100 p-0.5 text-xs md:text-sm font-bold" role="radiogroup" aria-label="토론 방식">
                      <button type="button" role="radio" aria-checked={!noSide} onClick={() => setNoSide(false)}
                        className={`px-3 py-1.5 rounded-full transition-all ${!noSide ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>팀 토론</button>
                      <button type="button" role="radio" aria-checked={noSide} onClick={() => setNoSide(true)}
                        className={`px-3 py-1.5 rounded-full transition-all ${noSide ? 'bg-white shadow-sm text-violet-700' : 'text-slate-500'}`}>자유 토론</button>
                    </div>
                    <div className="flex items-center rounded-full bg-white border-2 border-slate-200 p-0.5">
                      <button onClick={() => adjustParticipants(-1)} disabled={participants.length <= 2} aria-label="2명 빼기"
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-all active:scale-90"><Minus size={15} strokeWidth={2.5} /></button>
                      <button onClick={() => adjustParticipants(1)} disabled={participants.length >= 10} aria-label="2명 더하기"
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 transition-all active:scale-90"><Plus size={15} strokeWidth={2.5} /></button>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
                {participants.map((p, i) => (
                  <label key={i} className={`flex items-center gap-2 rounded-2xl border-2 pl-2 pr-3 transition-all focus-within:ring-4 ${isLoaded ? 'bg-slate-50/80' : 'bg-white'} ${noSide ? 'border-violet-100 focus-within:ring-violet-100' : (i % 2 === 0 ? 'border-blue-100 focus-within:ring-blue-100' : 'border-red-100 focus-within:ring-red-100')}`}>
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${noSide ? 'bg-violet-500' : (i % 2 === 0 ? 'bg-blue-500' : 'bg-red-500')}`}>{p.turn}</span>
                    {!noSide && (
                      <span className={`text-[11px] md:text-xs font-black px-1.5 py-1 rounded-lg shrink-0 ${i % 2 === 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                        {i % 2 === 0 ? '찬성' : '반대'}
                      </span>
                    )}
                    <input className="w-full py-3 bg-transparent font-bold text-slate-800 outline-none text-base md:text-xl placeholder:text-slate-300" value={p.name} placeholder="이름" readOnly={isLoaded} maxLength={9} onChange={(e) => {
                        const newP = [...participants];
                        newP[i].name = e.target.value;
                        setParticipants(newP);
                    }} />
                  </label>
                ))}
              </div>
            </section>

            {/* 3. 발표시간 */}
            <section>
              <div className="flex items-baseline gap-2 mb-2.5">
                <SectionTitle n={3}>발표시간</SectionTitle>
                <span className="text-xs md:text-sm font-bold text-slate-400">한 사람이 한 단계에서 말하는 시간</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {presets.map((s) => (
                  <button key={s} type="button" onClick={() => setTimeLeft(s)}
                    className={`px-3.5 md:px-4 py-2 rounded-xl text-sm md:text-base font-bold border-2 transition-all active:scale-95 ${Number(timeLeft) === s ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                    {s / 60}분
                  </button>
                ))}
                <div className="flex items-center gap-2 sm:ml-2">
                  <span className="text-slate-400 text-sm font-bold">직접</span>
                  <input type="number" min={MIN_TIME} max={MAX_TIME} step={10} aria-label="발표시간(초)" className={`w-20 md:w-24 py-1.5 px-2 border-2 rounded-xl text-center text-base md:text-xl font-bold bg-white outline-none focus:ring-4 transition-all ${timeValid ? "border-blue-200 focus:border-blue-400 focus:ring-blue-100" : "border-red-500 focus:ring-red-100"}`} value={timeLeft} onChange={(e) => setTimeLeft(e.target.value === "" ? "" : Number(e.target.value))} onBlur={() => setTimeLeft(clampTime(timeLeft))} />
                  <span className="text-slate-500 font-bold text-sm md:text-base whitespace-nowrap">초 ({Math.floor((Number(timeLeft) || 0) / 60)}분 {(Number(timeLeft) || 0) % 60}초)</span>
                </div>
              </div>
              {!timeValid ? (
                <p className="mt-2 ml-1 text-red-500 text-xs md:text-sm font-bold">발표시간은 {MIN_TIME}초~{MAX_TIME / 60}분 사이로 입력해 주세요.</p>
              ) : (
                <p className="mt-3 flex items-center gap-1.5 text-slate-500 text-xs md:text-sm">
                  <Clock size={14} className="shrink-0" /> 전체 예상 시간: 약 <b className="text-slate-700">{totalMin}분</b> ({participants.length}명 × 3단계)
                </p>
              )}
            </section>

            <div>
              <button onClick={startDebate} className={`w-full py-4 md:py-5 text-white text-xl md:text-2xl font-jalnan rounded-2xl transition-all ${canStart ? "bg-linear-to-r from-blue-600 to-violet-600 shadow-xl shadow-violet-500/30 hover:from-blue-500 hover:to-violet-500 hover:-translate-y-0.5 active:scale-[0.98]" : "bg-slate-300 cursor-not-allowed"}`} disabled={!canStart}>
                토론 시작하기 🚀
              </button>
              {!canStart && (
                <p className="mt-2.5 text-center text-xs md:text-sm text-slate-400">주제와 발표자 이름, 발표시간을 모두 채우면 시작할 수 있어요</p>
              )}
            </div>
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
    const rules = [
      { icon: <MessageCircle size={20} strokeWidth={2.25} />, text: <>토론 시에는 <b className="text-slate-900">차분하고 예의 있는 존댓말</b>로 말해주세요.</> },
      { icon: <HeartHandshake size={20} strokeWidth={2.25} />, text: <>상대방의 의견을 <b className="text-slate-900">무시하거나 비방하는 말</b>은 자제해주세요.</> },
      { icon: <Eye size={20} strokeWidth={2.25} />, text: <>내 순서가 아니더라도 화면을 보며 <b className="text-slate-900">친구의 의견에 반응</b>해 주세요.</> },
      { icon: <Timer size={20} strokeWidth={2.25} />, text: <><b className="text-blue-600">{timeString}</b>이 지나면 다음 친구에게 차례가 넘어갑니다.</> },
    ];
    const ringR = 26;
    const ringC = 2 * Math.PI * ringR;
    const ringPct = Math.max(0, Math.min(1, introTimer / INTRO_TIME));
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 md:p-10 text-center overflow-y-auto">
        <PageBackground variant="focus" />
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-5 md:gap-7">

          {/* 오늘의 주제 */}
          <div className="flex flex-col items-center gap-3">
            <span className="px-4 py-1.5 rounded-full bg-white/80 border border-white text-slate-600 text-sm md:text-base font-bold shadow-sm">📣 오늘의 토론 주제</span>
            <h1 className="font-jalnan text-slate-800 leading-tight text-balance break-keep text-[clamp(1.75rem,4.5vw,3.25rem)] px-2">
              {topic}
            </h1>
          </div>

          {/* 진행 순서: 3단계 */}
          <ol className="w-full max-w-3xl grid grid-cols-3 gap-2 md:gap-4">
            {roundNames.map((r, i) => (
              <li key={r} className="relative flex flex-col items-center gap-1 md:gap-1.5 rounded-2xl md:rounded-3xl bg-white/75 backdrop-blur border border-white px-2 py-3 md:p-4 shadow-[0_12px_30px_-18px_rgba(30,58,138,0.45)]">
                <span className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-linear-to-br from-blue-500 to-violet-600 text-white font-jalnan flex items-center justify-center text-sm md:text-lg shadow-md shadow-violet-500/30">{i + 1}</span>
                <span className="font-bold text-slate-800 text-[13px] md:text-lg leading-tight break-keep">{r}</span>
                <span className="text-blue-600 font-bold text-xs md:text-base tabular-nums">{timeString}</span>
                {i < 2 && <ChevronRight className="hidden md:block absolute -right-[1.1rem] top-1/2 -translate-y-1/2 text-blue-300" size={22} strokeWidth={3} />}
              </li>
            ))}
          </ol>

          {/* 토론 시 주의 사항 */}
          <section className="w-full max-w-3xl text-left rounded-[2rem] bg-white/80 backdrop-blur-xl border border-white ring-1 ring-blue-100 shadow-[0_24px_60px_-24px_rgba(30,58,138,0.35)] p-5 md:p-8">
            <h2 className="font-jalnan text-slate-800 text-xl md:text-2xl mb-4 md:mb-5">토론 시 주의 사항</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
              {rules.map(({ icon, text }, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl bg-blue-50/70 border border-blue-100/70 p-3 md:p-4">
                  <span className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-sm">{icon}</span>
                  <span className="text-slate-600 text-[15px] md:text-lg leading-snug break-keep pt-1.5 md:pt-1">{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 md:mt-4 flex items-center gap-3 rounded-2xl bg-linear-to-r from-sky-100 to-cyan-50 border border-sky-200 p-3 md:p-4">
              <span className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white text-sky-500 flex items-center justify-center shadow-sm"><Droplets size={20} strokeWidth={2.25} /></span>
              <span className="text-sky-900 font-bold text-[15px] md:text-lg break-keep">목소리가 커지면 물을 마시고 심호흡을 해요!</span>
            </div>
          </section>

          {/* 첫 발표자 + 자동 시작 카운트다운 */}
          <div className="flex items-center gap-3 md:gap-5 rounded-3xl md:rounded-full bg-white/85 backdrop-blur border border-white shadow-[0_16px_40px_-20px_rgba(30,58,138,0.45)] pl-2 pr-5 md:pr-8 py-2">
            <div className="relative shrink-0 w-16 h-16" role="timer" aria-label={`${introTimer}초 후 자동 시작`}>
              <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r={ringR} fill="none" stroke="#e0e7ff" strokeWidth="6" />
                <circle cx="32" cy="32" r={ringR} fill="none" stroke="url(#introRing)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={ringC} strokeDashoffset={ringC * (1 - ringPct)} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
                <defs>
                  <linearGradient id="introRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center timer-font text-xl text-slate-800">{introTimer}</span>
            </div>
            <div className="text-left">
              <p className="text-xs md:text-sm font-bold text-slate-400">{introTimer}초 후 자동 시작</p>
              <p className="text-base md:text-xl font-bold text-slate-700 break-keep">
                첫 번째 발표자 {!noSide && <span className="text-blue-600 font-black">찬성측</span>}
                <span className="text-green-600 font-black"> {participants[0]?.name}</span> 친구부터 시작합니다!
              </p>
            </div>
          </div>

          {/* 발표 순서 */}
          <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 max-w-3xl">
            {participants.map((p, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-white/70 border border-white rounded-full pl-1 pr-3 py-1 text-sm font-bold text-slate-700">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${noSide ? 'bg-violet-500' : (i % 2 === 0 ? 'bg-blue-500' : 'bg-red-500')}`}>{i + 1}</span>
                {p.name}
              </span>
            ))}
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

    const team = noSide
      ? { glow: 'from-violet-300/45', badge: 'bg-violet-600' }
      : isChan
        ? { glow: 'from-blue-300/50', badge: 'bg-blue-600' }
        : { glow: 'from-red-300/45', badge: 'bg-red-500' };
    const urgent = timeLeft <= 3;
    const warn = timeLeft <= 9;
    const pct = debateTime > 0 ? Math.max(0, Math.min(100, (timeLeft / debateTime) * 100)) : 0;

    return (
      <div className="h-screen h-svh relative overflow-hidden flex flex-col px-4 md:px-8 py-4 md:py-6 text-center">
        <PageBackground variant="focus" />
        {/* 발표 팀 색으로 은은한 빛 */}
        <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-2/3 bg-linear-to-b ${team.glow} to-transparent pointer-events-none`}></div>

        {/* 상단: 주제 + 단계 */}
        <header className="relative z-10 shrink-0 flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
          <p className="max-w-full md:max-w-[55%] px-4 py-1.5 md:py-2 rounded-2xl md:rounded-full bg-white/75 backdrop-blur border border-white text-violet-700 font-jalnan text-sm md:text-xl leading-snug break-keep line-clamp-2 md:text-left shadow-sm">
            💬 {topic}
          </p>
          <ol className="flex items-center gap-1 md:gap-1.5 shrink-0">
            {roundNames.map((r, i) => (
              <li key={r} className={`flex items-center gap-1.5 rounded-full border px-2.5 md:px-3.5 py-1 md:py-1.5 text-xs md:text-sm font-bold transition-all ${
                i === round ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                : i < round ? 'bg-white/60 border-white text-slate-400'
                : 'bg-white/40 border-white/70 text-slate-500'}`}>
                <span className="tabular-nums">{i < round ? '✓' : i + 1}</span>
                <span className={i === round ? '' : 'hidden md:inline'}>{r}</span>
              </li>
            ))}
          </ol>
        </header>

        {/* 가운데: 발표자 + 안내 + 타이머 */}
        <main className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center gap-[clamp(0.5rem,2vh,1.25rem)]">
          <div className="flex flex-col items-center gap-[clamp(0.25rem,1.2vh,0.75rem)]">
            <div className="flex items-center justify-center gap-2.5 md:gap-3 flex-wrap">
              {!noSide && (
                <span className={`px-3 md:px-4 py-1 rounded-full text-white font-jalnan text-lg md:text-2xl shadow-md ${team.badge}`}>
                  {isChan ? "찬성측" : "반대측"}
                </span>
              )}
              <span className="font-jalnan text-green-600 leading-none text-[clamp(2rem,6vh,4rem)]">{currentP?.name}</span>
            </div>
            <h2 className="font-jalnan text-slate-700 leading-none text-[clamp(2.25rem,8vh,5.5rem)]">
              {roundNames[round]}
            </h2>
          </div>

          <div className="flex items-start gap-2.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl px-4 md:px-6 py-2.5 md:py-3 shadow-sm max-w-3xl">
            <Lightbulb className="shrink-0 text-amber-500 mt-0.5 md:mt-1" size={22} strokeWidth={2.25} />
            <p className="text-slate-700 font-bold leading-snug break-keep text-left text-[clamp(1rem,2.6vh,1.6rem)]">
              {round === 0 && (
                noSide
                  ? <><span className="text-orange-600">찬성인지 반대인지</span> 내 생각을 먼저 말하고,<br /><span className="text-orange-600">이유와 근거</span>를 <span className="text-orange-600">1~3가지</span> 이야기 해주세요</>
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

          {/* 타이머: 화면 높이에 맞춰 크기 조절 */}
          <div className={`timer-font tabular-nums tracking-tighter leading-none select-none transition-colors text-[min(30vw,27vh)] ${urgent ? "text-red-600 animate-pulse" : warn ? "text-orange-500" : "text-slate-800"}`}>
            {formatTime(timeLeft)}
          </div>

          {/* 남은 시간 막대 */}
          <div className="w-full max-w-4xl h-2.5 md:h-3.5 rounded-full bg-white/70 ring-1 ring-white overflow-hidden shadow-inner"
            role="progressbar" aria-valuemin={0} aria-valuemax={debateTime} aria-valuenow={timeLeft} aria-label="남은 발표 시간">
            <div className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${urgent ? "bg-red-500" : warn ? "bg-orange-400" : "bg-linear-to-r from-blue-500 to-violet-500"}`}
              style={{ width: `${pct}%` }}></div>
          </div>
        </main>

        {/* 하단: 다음 순서 + 건너뛰기 */}
        <footer className="relative z-10 shrink-0 flex flex-col items-center gap-3 md:gap-4">
          {round === 2 && isLastSpeakerOfRound ? (
            <p className="text-2xl md:text-3xl text-orange-600 font-black animate-bounce font-jalnan">마무리할 시간이에요! ✨</p>
          ) : (
            <div className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-2xl md:rounded-full bg-white/75 backdrop-blur border border-white shadow-sm px-4 md:px-6 py-2.5 text-base md:text-xl font-bold text-slate-600 break-keep">
              <span className="mr-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-white text-xs md:text-sm">다음 순서</span>
              {!noSide && (
                <span className={(nextIdx % 2 === 0) ? "text-blue-600" : "text-red-600"}>
                  {(nextIdx % 2 === 0) ? "찬성측" : "반대측"}
                </span>
              )}
              <span className="text-green-600 font-black">{nextP?.name}</span>
              <span>친구의</span>
              <span className="text-violet-600">{isLastSpeakerOfRound ? roundNames[round + 1] : roundNames[round]}</span>
              <span>시간입니다. 준비해 주세요.</span>
            </div>
          )}
          <button onClick={handleNext} className="flex items-center gap-1 px-4 py-1.5 bg-white/60 border border-white text-slate-500 hover:text-slate-800 hover:bg-white/90 rounded-full text-xs md:text-sm font-bold transition-colors">
            건너뛰기 <SkipForward size={14} />
          </button>
        </footer>
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