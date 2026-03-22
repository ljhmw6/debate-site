import React, { useState, useEffect, useRef } from 'react';

// 오디오 객체
const tickSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
const alertSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
const applauseSound = typeof Audio !== "undefined" ? new Audio("/applause.mp3") : null;

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
  const [introTimer, setIntroTimer] = useState(10);//시작화면 타임
  const [debateTime, setDebateTime] = useState(180);
  const [isLoaded, setIsLoaded] = useState(false);

  const roundNames = ["나의 주장", "궁금한점 & 반론", "최종 정리"]; 

  useEffect(() => {
    const savedTopic = localStorage.getItem('next_debate_topic');
    const savedResults = localStorage.getItem('next_debate_results');

    if (savedTopic && savedResults && !hasConfirmed.current) {
      if (window.confirm("내용을 불러올까요? (확인: 불러오기 / 취소: 직접 입력)")) {
        setTopic(savedTopic);
        setParticipants(JSON.parse(savedResults));
        setIsLoaded(true);
        hasConfirmed.current = true;
      } else {
        setIsLoaded(false);
        hasConfirmed.current = true; // 취소해도 다시 묻지 않게 설정
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
    if (step === 'final' && applauseSound) { 
      applauseSound.play().catch(() => {});
    }
    return () => {
      if (applauseSound) {
        applauseSound.pause();
        applauseSound.currentTime = 0;
      }
    };
  }, [step]);

  useEffect(() => {
    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      alertSound.play().catch(() => {});
      handleNext();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);
 
  const handleNext = () => {
    if (turn < participants.length - 1) {
      setTurn(turn + 1);
      setTimeLeft(debateTime);  
    } else if (round < 2) {
      setRound(round + 1);
      setTurn(0);
      setTimeLeft(debateTime);  
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

  // --- 화면 렌더링 ---
  if (step === 'input') {
    return (
      <div className='min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat'
          style={{ backgroundImage: "url('/bg.png')", backgroundAttachment: 'fixed' }}>
        <div className="fixed inset-0 bg-black/40 pointer-events-none"></div>
        
        <div className="p-10 z-10 w-full max-w-4xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl relative">
          <header className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 font-jalnan">🎤 토론 설정하기</h2>
            <button onClick={onBack} className="text-2xl p-2 bg-slate-100 rounded-xl hover:bg-slate-200">🏠</button>
          </header>
          
          <div className="space-y-8"> 
            <section>
              <label className="block text-xl font-bold mb-2 ml-1">오늘의 주제</label>
              {isLoaded ? (
                /* 불러왔을 때: 수정 불가능한 멋진 텍스트 상자 */
                <div className="group relative"> 
                    <p className="text-3xl font-black text-purple-600 font-jalnan">
                      {topic}
                    </p> 
                  <button 
                    onClick={() => setIsLoaded(false)} 
                    className="absolute -top-10 -right-3 bg-white border-2 border-slate-200 rounded-full p-2 text-sm shadow-sm hover:bg-slate-50 transition-all"
                    title="수정하기"
                  >
                    ✏️ 수정
                  </button>
                </div>
              ) : ( 
                <input 
                  className="w-full p-3 border-2 border-slate-200 rounded-2xl text-2xl font-bold bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-inner" 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  placeholder="주제를 입력해 주세요!"
                />
              )}
            </section>
 
            <section>
              <div className="flex justify-between items-center mb-4">
                <label className="text-xl font-bold ml-1">발표자 명단 ({participants.length}명)</label>
                {!isLoaded && (
                  <div className="flex gap-2 animate-in fade-in duration-300">
                    <button onClick={() => adjustParticipants(-1)} className="px-3 py-1 bg-slate-200 rounded-lg font-bold hover:bg-slate-300">- 2명</button>
                    <button onClick={() => adjustParticipants(1)} className="px-3 py-1 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600">+ 2명</button>
                  </div>
                )}
              </div>              
              <div className="grid grid-cols-2 gap-x-10 gap-y-2 overflow-y-auto p-1 rounded-2xl border-inner">
                {participants.map((p, i) => (
                  <div key={i} className={`p-3 rounded-xl border-2 flex items-center gap-3 bg-white ${p.team.includes('찬성') ? 'border-blue-100' : 'border-red-100'} ${isLoaded ? 'opacity-90' : ''}`}>
                    <span className={`w-11 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${p.color}`}>{p.turn}</span>
                    <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${p.team.includes('찬성') ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                      {p.team.includes('찬성') ? '찬성측' : '반대측'}
                    </span>
                    <input 
                      className={`w-full bg-transparent font-bold outline-none ${isLoaded ? 'cursor-default' : 'cursor-text'}`} 
                      value={p.name}
                      placeholder="이름" 
                      readOnly={isLoaded} 
                      onChange={(e) => {
                        const newP = [...participants];
                        newP[i].name = e.target.value;
                        setParticipants(newP);
                      }} 
                    />
                  </div>
                ))}
              </div>
            </section>
  
            <section> 
              <div className="flex items-center gap-4">
                <span className="text-slate-500 font-bold text-xl">발표시간</span>
                <input 
                  type="number" 
                  className="w-30 p-1 border-2 rounded-xl text-center text-2xl font-bold bg-white outline-none"
                  value={timeLeft}
                  onChange={(e) => setTimeLeft(Number(e.target.value))}
                />
                <span className="text-slate-500 font-bold text-xl">초 (현재: {Math.floor(timeLeft / 60)}분 {timeLeft % 60}초) </span>
              </div>
            </section>
            
            <button 
              onClick={startDebate} 
              className={`w-full py-5 text-white text-2xl font-bold rounded-2xl shadow-xl transition-all active:scale-95 ${
                topic && participants.every(p => p.name.trim() !== "") ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"
              }`}
              disabled={!topic || participants.some(p => p.name.trim() === "")}
            >
              토론 시작하기 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }
    if (step === 'intro') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center space-y-10 bg-white">
        <h1 className="text-5xl text-slate-500 font-jalnan">오늘의 토론 주제
            <p className="text-purple-600 text-3xl mt-3 font-black">{topic}</p>
        </h1>
        <div className="bg-slate-50 p-10 rounded-3xl border-2 border-slate-100 text-left w-full max-w-3xl relative">
          <h3 className="text-3xl font-bold mb-6 text-slate-800  font-jalnan">토론 시 주의 사항</h3>
          <ul className="space-y-4 text-xl text-slate-700 font-medium">
            <li>1. 토론 시에는 차분하고 예의 있는 존댓말로 말해주세요.</li>
            <li>2. 상대방의 의견을 무시하거나 비방하는 말은 자제해주세요.</li>
            <li>3. 각 나의 주장 3분, 궁금한점&반론 3분, 최종 정리 3분씩 주어집니다.</li>
            <li>4. 내 순서가 아니더라도 화면을 보며 친구의 의견에 반응해 주세요.</li>
            <li>5. 3분이 지나면 타이머가 울리고 다음 친구에게 차례가 넘어갑니다.</li>
          </ul>
          <div className="absolute -right-20 -bottom-10 bg-white border-2 border-blue-400 shadow-xl p-6 rounded-full w-44 h-44 flex items-center justify-center text-center text-lg font-bold text-blue-800 animate-pulse">
            목소리가 커지면<br/>물을 마시고<br/>심호흡을 해요!
          </div>
        </div>
        <div className="space-y-4">
           <p className="text-2xl font-medium">
            그럼 첫 번째 발표자 <span className="text-blue-600 font-black">찬성측</span> 
            <span className="text-green-600 font-black"> {participants[0]?.name}</span> 친구부터 발표를 시작합니다.
          </p>
          <div className="text-slate-400 font-bold bg-slate-100 py-2 px-6 rounded-full inline-block">
            {Math.floor(introTimer / 60)}분 {introTimer % 60}초 후 자동 시작
           </div>
        </div>
      </div>
    );
  }
  if (step === 'debating') {
  const isChan = turn % 2 === 0;
  const currentP = participants[turn];
  const nextIdx = (turn + 1) % participants.length;
  const nextP = participants[nextIdx];
  const isLastSpeakerOfRound = turn === participants.length - 1;

  return (
    <div className="h-screen flex flex-col items-center justify-center py-20 px-10 text-center bg-white">
      <div className="space-y-6"> 
        <p className="text-purple-600 text-2xl font-black font-jalnan">{topic}</p>
        <h2 className={`text-5xl font-jalnan font-black transition-colors ${isChan ? "text-blue-600" : "text-red-600"}`}>
          {isChan ? "찬성측" : "반대측"} <span className="text-green-600">{currentP?.name}</span> 
          <div className="text-7xl mt-5 text-slate-600">
            {roundNames[round]} 시간
          </div>
        </h2>
 
        <div className="bg-yellow-50 p-4 rounded-2xl inline-block max-w-5xl shadow-sm">
          <p className="text-2xl text-slate-700 font-bold leading-snug">
            {round === 0 && (
              <>{isChan ? '찬성' : '반대'}하는 <span className="text-orange-600">이유와 근거</span>를 <span className="text-orange-600">1~3가지</span> 이야기 해주세요</>
            )}
            {round === 1 && (
              <>친구의 말에서 <span className="text-orange-500">궁금한 거나, 생각이 다른 부분</span>을 말해보세요</>
            )}
            {round === 2 && (
              <>토론한 내용을 바탕으로 <span className="text-orange-600">내 생각을 마지막으로 정리</span>해주세요</>
            )}
          </p>
        </div>
      </div>
 
      <div className={`text-[17rem] mt-10 mb-7 font-black tabular-nums timer-font tracking-tighter leading-none select-none transition-colors 
          ${
            timeLeft <= 3 
            ? "text-red-600 animate-pulse" 
            : timeLeft <= 9 
              ? "text-orange-500" 
              : timeLeft <= 15 
                ? "text-blue-500" 
                : "text-slate-800"
          }`}
      >
        {formatTime(timeLeft)}
      </div> 

      <div className="w-full max-w-4xl"> 
        {round === 2 && isLastSpeakerOfRound ? (
          <p className="text-3xl text-orange-600 font-black animate-bounce font-jalnan">
            이제 토론을 마무리할 시간이에요! ✨
          </p>
        ) : (
          <p className="text-2xl text-slate-600 font-bold leading-snug">
            다음 순서는 
            <span className={ (nextIdx % 2 === 0) ? "text-blue-600 ml-2" : "text-red-600 ml-2" }>
              {(nextIdx % 2 === 0) ? "찬성측" : "반대측"}
            </span>  
            <span className="text-green-600 font-black mx-2">
              {nextP?.name}
            </span> 
            친구의 
            <span className="text-purple-500 ml-1">
              {isLastSpeakerOfRound ? roundNames[round + 1] : roundNames[round]}
            </span> 시간입니다. 준비해 주세요.
          </p>
        )}
      </div>
    </div>
  );
}

  if (step === 'final') {
    return (
        <div className="h-screen flex flex-col items-center justify-center space-y-10 text-center bg-slate-50 animate-in fade-in duration-1000"> 
            <div className="text-8xl mb-16 animate-bounce">👏</div>            
            <h1 className="text-6xl font-black text-slate-800 tracking-tight font-jalnan">
                모두 수고했어요! ✨
            </h1>
            
            <div className="space-y-6 max-w-3xl">
                <div className="text-2xl leading-relaxed text-slate-600 font-medium ">
                오늘 친구들의 다양한 생각을 들어보니 어땠나요?<br/>
                정답을 찾는 것보다 서로의 의견을 존중하며 대화한<br/>
                    <p className="mt-4 text-3xl text-green-600 font-bold underline decoration-green-200 underline-offset-8 font-jalnan">
                        여러분 모두가 오늘의 주인공입니다.
                    </p>
                </div>
            </div> 
            <div className="pt-10">
            <button 
              onClick={onBack} 
              className="group relative flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-3xl text-2xl font-bold shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
            >
              <span className="text-3xl transition-transform group-hover:-translate-x-1">🏠</span>
              메인으로 돌아가기
            </button> 
          </div>
        </div>
    );
  }

  return null;
}

export default DebateRoom;