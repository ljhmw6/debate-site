import React, { useState, useEffect, useRef } from 'react';

// 오디오 객체 (유지) 
const alertSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
const applauseSound = typeof Audio !== "undefined" ? new Audio("/applause.mp3") : null;

const speak = (text) => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR"; // 한국어 설정
    utterance.rate = 1.0;     // 속도 (0.1 ~ 10)
    utterance.pitch = 1.0;    // 음높이 (0 ~ 2)

    window.speechSynthesis.speak(utterance);
  }
};

const fadeOutAudio = (audio, duration = 2000) => {
  if (!audio) return;
  const startVolume = audio.volume;
  const interval = 100; // 0.05초마다 줄임
  const step = startVolume / (duration / interval);

  const fadeTimer = setInterval(() => {
    if (audio.volume > step) {
      audio.volume -= step;
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
  const hasConfirmed = useRef(false);
  const [step, setStep] = useState('input');
  const [round, setRound] = useState(0); 
  const [turn, setTurn] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(180); 
  const [isActive, setIsActive] = useState(false);
  const [introTimer, setIntroTimer] = useState(20);
  const [debateTime, setDebateTime] = useState(180);
  const [isLoaded, setIsLoaded] = useState(false);

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
 
  useEffect(() => {
    const savedTopic = localStorage.getItem('next_debate_topic');
    const savedResults = localStorage.getItem('next_debate_results');
    if (savedTopic && savedResults && !hasConfirmed.current) {
      if (window.confirm("내용을 불러올까요?")) {
        setTopic(savedTopic);
        setParticipants(JSON.parse(savedResults));
        setIsLoaded(true);
        hasConfirmed.current = true;
      } else {
        setIsLoaded(false);
        hasConfirmed.current = true;
      }
    }
  }, []);

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
      const side = turn % 2 === 0 ? "찬성측" : "반대측"; 
      speak(`오늘의 토론 주제는 ${topic}입니다. 주의 사항을 확인하고 준비해 주세요. 첫 번째 발표자 ${side} ${currentP.name} 친구부터 시작합니다.!`);
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
      const side = turn % 2 === 0 ? "찬성측" : "반대측";
      speak(`${side} ${currentP.name} 친구, ${roundNames[round]} 시작해 주세요!`);
    }
    if (step === 'final') {
      speak("모두 수고했어요! 정답을 찾는 것보다 서로의 의견을 존중하며 대화한 여러분 모두가 오늘의 주인공입니다.");
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
    setDebateTime(timeLeft);  
    setStep('intro');
  };

  const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // --- 1. 설정 화면 (Input) ---
  if (step === 'input') {
    return (
      <div className='min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat'
          style={{ backgroundImage: "url('/bg.png')", backgroundAttachment: 'fixed' }}>
        <div className="fixed inset-0 bg-black/40 pointer-events-none"></div>
        
        {/* 📱 p-6 md:p-10 모바일 여백 조절 */}
        <div className="p-6 md:p-10 z-10 w-full max-w-3xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl relative">
          <header className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 font-jalnan">🎤 토론 설정</h2>
            <button onClick={handleGoHome} className="text-xl p-2 bg-slate-100 rounded-xl hover:bg-slate-200">🏠</button>
          </header>
          
          <div className="space-y-6 md:space-y-8"> 
            <section>
              <label className="block text-lg md:text-xl font-bold mb-2 ml-1">오늘의 주제</label>
              {isLoaded ? (
                <div className="group relative py-2"> 
                  <p className="text-xl md:text-3xl font-black text-purple-600 font-jalnan break-keep">
                    {topic}
                  </p> 
                  <button onClick={() => setIsLoaded(false)} className="absolute -top-8 -right-2 bg-white border border-slate-200 rounded-full px-2 py-1 text-xs shadow-sm hover:bg-slate-50">✏️ 수정</button>
                </div>
              ) : ( 
                <input className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm md:text-xl font-bold bg-white focus:border-blue-400 outline-none transition-all" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="주제를 입력해 주세요!" />
              )}
            </section>
 
            <section>
              <div className="flex justify-between items-center mb-4">
                <label className="text-lg md:text-xl font-bold ml-1">발표자 ({participants.length}명)</label>
                {!isLoaded && (
                  <div className="flex gap-2">
                    <button onClick={() => adjustParticipants(-1)} className="px-2 py-1 bg-slate-200 rounded-lg text-xs md:text-sm font-bold">- 2명</button>
                    <button onClick={() => adjustParticipants(1)} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs md:text-sm font-bold">+ 2명</button>
                  </div>
                )}
              </div>              
              {/* 📱 모바일에선 1열, PC에선 2열 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-x-6 md:gap-y-2 md:max-h-none overflow-y-auto pr-1">
                {participants.map((p, i) => (
                  <div key={i} className={`p-3 rounded-xl border-2 flex items-center gap-2 md:gap-3 bg-white ${p.team.includes('찬성') ? 'border-blue-100' : 'border-red-100'}`}>
                    <span className={`w-8 h-6 md:w-11 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shrink-0 ${p.color}`}>{p.turn}</span>
                    <span className={`text-[10px] md:text-xs font-black px-1.5 py-1 rounded-lg shrink-0 ${p.team.includes('찬성') ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                      {p.team.includes('찬성') ? '찬성' : '반대'}
                    </span>
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
                <span className="text-slate-500 font-bold text-base md:text-xl">발표시간</span>
                <input type="number" className="w-10 md:w-20 p-1 md:p-1 border-2 rounded-lg text-center text-sm md:text-xl font-bold bg-white outline-none border-slate-500 " value={timeLeft} onChange={(e) => setTimeLeft(Number(e.target.value))} />
                <span className="text-slate-400 font-bold text-sm md:text-lg">초 ({Math.floor(timeLeft / 60)}분 {timeLeft % 60}초)</span>
              </div>
            </section>
            
            <button onClick={startDebate} className={`w-full py-4 md:py-5 text-white text-xl md:text-2xl font-bold rounded-2xl shadow-xl transition-all ${topic && participants.every(p => p.name.trim() !== "") ? "bg-blue-600 shadow-blue-200" : "bg-slate-300 cursor-not-allowed"}`} disabled={!topic || participants.some(p => p.name.trim() === "")}>
              토론 시작하기 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. 안내 화면 (Intro) ---
  if (step === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-10 text-center space-y-6 md:space-y-10 bg-white overflow-y-auto">
        <h1 className="text-xl md:text-4xl text-slate-500 font-jalnan">오늘의 주제
            <p className="text-purple-600 text-lg md:text-3xl mt-2 font-black break-keep px-4">{topic}</p>
        </h1>
        <div className="bg-slate-50 p-6 md:p-10 rounded-3xl border-2 border-slate-100 text-left w-full max-w-3xl relative">
          <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-slate-800 font-jalnan">토론 시 주의 사항</h3>
          <ul className="space-y-3 md:space-y-4 text-base md:text-xl text-slate-700 font-medium list-disc ml-4 md:ml-6">            
            <li>토론 시에는 차분하고 예의 있는 존댓말로 말해주세요.</li>
            <li>상대방의 의견을 무시하거나 비방하는 말은 자제해주세요.</li>
            <li>각 나의 주장 3분, 궁금한점 또는 반론 3분, 최종 정리 3분씩 주어집니다.</li>
            <li>내 순서가 아니더라도 화면을 보며 친구의 의견에 반응해 주세요.</li>
            <li>3분이 지나면 타이머가 울리고 다음 친구에게 차례가 넘어갑니다.</li>
          </ul> 
          <div className="mt-8 md:absolute md:-right-20 md:-bottom-10 bg-blue-50 border-2 border-blue-400 shadow-lg p-4 md:p-6 rounded-3xl md:rounded-full md:w-44 md:h-44 flex items-center justify-center text-center text-sm md:text-lg font-bold text-blue-800 animate-pulse"> 
            목소리가 커지면<br className="hidden md:block" /> 물을 마시고<br/> 심호흡을 해요!
          </div>
        </div>
        <div className="space-y-4">
           <p className="text-lg md:text-2xl font-medium px-4">
            첫 번째 발표자 <br className="md:hidden" /><span className="text-blue-600 font-black">찬성측</span> 
            <span className="text-green-600 font-black"> {participants[0]?.name}</span> 친구부터 시작합니다!
          </p>
          <div className="text-slate-400 font-bold bg-slate-100 py-2 px-6 rounded-full inline-block text-sm">
            {Math.floor(introTimer / 60)}분 {introTimer % 60}초 후 자동 시작
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
      <div className="h-screen flex flex-col items-center justify-center py-10 px-6 text-center bg-white overflow-hidden relative">
        <div className="space-y-4 md:space-y-6 z-10 w-full"> 
          <p className="text-purple-600 text-sm md:text-2xl font-black font-jalnan opacity-70">{topic}</p>
          <h2 className={`text-3xl md:text-5xl font-jalnan font-black transition-colors ${isChan ? "text-blue-600" : "text-red-600"}`}>
            {isChan ? "찬성측" : "반대측"} <span className="text-green-600">{currentP?.name}</span> 
            <div className="text-4xl md:text-7xl mt-2 md:mt-5 text-slate-600">
              {roundNames[round]}
            </div>
          </h2> 

          <div className="bg-yellow-50 p-3 md:p-4 rounded-2xl inline-block max-w-7xl shadow-sm mx-4">
          <p className="text-xl md:text-2xl text-slate-700 font-bold leading-snug break-keep">
            {round === 0 && (
              <>{isChan ? '찬성' : '반대'}하는 <span className="text-orange-600">이유와 근거</span>를 <br className="md:hidden" /><span className="text-orange-600">1~3가지</span> 이야기 해주세요</>
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
        <div className={`text-9xl sm:text-[10rem] md:text-[15rem] lg:text-[17rem] mt-6 md:mt-10 mb-4 md:mb-7 font-black tabular-nums timer-font tracking-tighter leading-none select-none transition-colors 
            ${timeLeft <= 3 ? "text-red-600 animate-pulse" : timeLeft <= 9 ? "text-orange-500" : "text-slate-800"}`}
        >
          {formatTime(timeLeft)}
        </div> 

        <div className="w-full max-w-6xl px-4"> 
          {round === 2 && isLastSpeakerOfRound ? (
            <p className="text-2xl md:text-3xl text-orange-600 font-black animate-bounce font-jalnan mt-5">마무리할 시간이에요! ✨</p>
          ) : ( 
            <p className="text-lg md:text-2xl text-slate-600 font-bold leading-snug  mt-3 md:mt-0">
            다음 순서는 
            <span className={ (nextIdx % 2 === 0) ? "text-blue-600 ml-2" : "text-red-600 ml-2" }>
              {(nextIdx % 2 === 0) ? "찬성측" : "반대측"}
            </span>  
            <span className="text-green-600 font-black mx-2">
              {nextP?.name}
            </span> 
            친구의 <br className="md:hidden" />
            <span className="text-purple-500 ml-1">
              {isLastSpeakerOfRound ? roundNames[round + 1] : roundNames[round]}
            </span> 시간입니다. <br className="md:hidden" />준비해 주세요.
          </p>
          )}
        </div>
        
        {/* 📱 모바일용 다음 버튼 (작게 배치) */}
        <button onClick={handleNext} className="mt-8 px-6 py-2 bg-slate-100 text-slate-400 rounded-full text-xs font-bold ">건너뛰기</button>
      </div>
    );
  }

  // --- 4. 종료 화면 (Final) ---
  if (step === 'final') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-6 md:space-y-10 text-center bg-slate-50"> 
            <div className="text-6xl md:text-8xl mb-8 md:mb-16 animate-bounce">👏</div>            
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 font-jalnan">모두 수고했어요!</h1>
            
            <div className="space-y-6 max-w-3xl px-4">
                <div className="text-lg md:text-2xl leading-relaxed text-slate-600 font-medium break-keep">
                  정답을 찾는 것보다 <br className="md:hidden" />서로의 의견을 존중하며 대화한<br/>
                  <p className="mt-4 text-2xl md:text-3xl text-green-600 font-bold md:underline decoration-green-200 underline-offset-8 font-jalnan">
                    여러분 모두가 <br className="md:hidden" />오늘의 주인공입니다.
                  </p>
                </div>
            </div> 
            <button onClick={handleGoHome} className="flex items-center gap-3 px-8 py-4 md:px-12 md:py-5 bg-slate-900 text-white rounded-2xl md:rounded-3xl text-xl md:text-2xl font-bold shadow-2xl active:scale-95 transition-all">
              🏠 메인으로 돌아가기
            </button> 
        </div>
    );
  }
  return null;
}

export default DebateRoom;