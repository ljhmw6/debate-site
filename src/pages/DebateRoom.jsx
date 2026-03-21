import React, { useState, useEffect, useRef } from 'react';

// 오디오 객체 생성 (함수 밖이나 상단에 두면 좋아)
const tickSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"); // 째깍 소리
const alertSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
const applauseSound = typeof Audio !== "undefined" ? new Audio("/applause.mp3") : null;

function DebateRoom() {
  const [topic, setTopic] = useState("");
  const [names, setNames] = useState(["", "", "", ""]);
  const hasConfirmed = useRef(false);
  const [step, setStep] = useState('input');
  const [round, setRound] = useState(0); 
  const [turn, setTurn] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(180); //타임셋팅 180
  const [isActive, setIsActive] = useState(false);
    
  // 슬라이드 6을 위한 인트로 타이머 상태도 여기로 이동!
  const [introTimer, setIntroTimer] = useState(40); //타임셋팅 90

  const roundNames = ["나의 주장", "궁금한점 & 반론", "최종 정리"]; 

  // --- 효과(Effect) 로직 ---

  useEffect(() => {
    if (hasConfirmed.current) return;

    const savedTopic = localStorage.getItem('next_debate_topic');
    const savedNames = localStorage.getItem('next_debate_names');

    if (savedTopic && savedNames) {
        hasConfirmed.current = true;
        
      if (window.confirm("지난번에 정해둔 '토론 순서'를 불러올까요?")) {
        setTopic(savedTopic);
        setNames(JSON.parse(savedNames));
      }
    }
  }, []); 

  // 인트로 자동 이동 타이머 (슬라이드 6용)
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

  // step이 'final'로 바뀔 때 재생하는 로직
  useEffect(() => {
    if (step === 'final' && applauseSound) { 
      
      // 브라우저가 차단할 수 있으니 play() 호출 시 에러 핸들링
      const playPromise = applauseSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("자동 재생이 차단됨. 사용자의 클릭이 필요합니다:", error);
        });
      }
    }
    return () => {
      if (applauseSound) {
        applauseSound.pause();
        applauseSound.currentTime = 0;
      }
    };
  }, [step]);

  const startDebate = () => {
    // 🔔 이 시점에 소리들을 한 번씩 play/pause 해줘야 나중에 자동으로 잘 들려!
    [tickSound, alertSound, applauseSound].forEach(sound => {
      if(sound) {
        sound.play().then(() => {
          sound.pause();
          sound.currentTime = 0;
        }).catch(() => {});
      }
    });
    setStep('intro');
  };


  // 2. 실제 토론 타이머 (슬라이드 7,8,9용)
  useEffect(() => {
    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          // 5, 4, 3, 2, 1초 남았을 때 째깍 소리
          if (newTime <= 10 && newTime > 0) {
            //tickSound.play().catch(e => console.log("소리 재생 실패:", e));
          }
          
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // 0초가 되면 종료 알람 소리!
      alertSound.play().catch(e => console.log("소리 재생 실패:", e));
      handleNext();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  // --- 다음 단계 제어 함수 ---
  const handleNext = () => {
    if (turn < 3) {
      setTurn(turn + 1);
      setTimeLeft(180);//타임셋팅 180
    } else if (round < 2) {
      setRound(round + 1);
      setTurn(0);
      setTimeLeft(180);//타임셋팅 180
    } else {
      setStep('final');
      setIsActive(false);
    }
  };

  const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // --- 화면 렌더링 분기 (여기서는 Hook을 쓰면 안 돼!) ---
  
  if (step === 'input') {
    return (
        <div className='min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat'
            style={{ backgroundImage: "url('/bg.png')" }} 
        >            
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
        <div className="p-10 z-10 max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl">
            <h2 className="text-3xl font-bold mb-8 border-b pb-4 text-slate-800 font-jalnan">토론 시작하기</h2>
            <div className="space-y-6">
            <div>
                <label className="block text-xl font-bold mb-2">오늘의 토론 주제</label>
                <input className="w-full p-4 border-2 rounded-xl text-lg focus:border-blue-400 outline-none" value={topic} onChange={(e)=>setTopic(e.target.value)} placeholder="주제를 입력하세요"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {["1번 찬성측 발표자", "2번 반대측 발표자", "3번 찬성측 발표자", "4번 반대측 발표자"].map((label, i) => (
                <div key={i}>
                    <label className="block font-bold mb-1 text-slate-600">{label}</label>
                    <input className="w-full p-3 border-2 rounded-lg focus:border-blue-400 outline-none" value={names[i]} onChange={(e)=>{
                    const newNames = [...names]; newNames[i] = e.target.value; setNames(newNames);
                    }} />
                </div>
                ))}
            </div>
            <button onClick={startDebate} className="w-full py-5 bg-slate-900 text-white text-2xl font-bold rounded-xl mt-6 hover:bg-black transition-colors">토론 진행 시작</button>
            </div>
        </div>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center space-y-10 bg-white">
        <h1 className="text-3xl text-slate-500 font-jalnan">오늘의 토론 주제
            <p className="text-purple-600 text-5xl mt-3 font-black">{topic}</p>
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
           <p className="text-2xl font-medium">그럼 첫 번째 발표자 <span className="text-blue-600 font-black">찬성측</span> <span className="text-green-600 font-black">{names[0]}</span>친구부터 발표를 시작합니다.</p>
           <div className="text-slate-400 font-bold bg-slate-100 py-2 px-6 rounded-full inline-block">
            {Math.floor(introTimer / 60)}분 {introTimer % 60}초 후 자동 시작
           </div>
        </div>
      </div>
    );
  }

  if (step === 'debating') {
    const isChan = turn % 2 === 0;
    return (
      <div className="h-screen flex flex-col items-center justify-center py-20 px-10 text-center bg-white">
        <div className="space-y-6">
            {/* 상단 제목: 찬성/반대측 이름 + 단계 */}
            <p className="text-purple-600 text-2xl font-black font-jalnan">{topic}</p>
            <h2 className={`text-5xl font-jalnan font-black transition-colors ${isChan ? "text-blue-600" : "text-red-600"}`}>
                {isChan ? "찬성측" : "반대측"} <span className="text-green-600">{names[turn]}</span> 
                <div className="text-7xl mt-5 text-slate-600 decoration-slate-200">
                {roundNames[round]} 시간
                </div>
            </h2>

            {/* 가이드 문구 (지향이 기획안 100% 반영!) */}
            <div className="bg-yellow-50 p-6 rounded-2xl inline-block max-w-5xl shadow-sm">
                <p className="text-2xl text-slate-700 font-bold leading-snug ">
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
                ? "text-red-600 animate-pulse"   // 3초 이하: 빨간색 + 깜빡임 (마무리!)
                : timeLeft <= 9 
                    ? "text-orange-500"            // 10초~4초: 오렌지색 (주의!)
                    : timeLeft <= 15 
                    ? "text-blue-500"           // 15초~11초: 초록색 (정리 시작!)
                    : "text-slate-800"           // 평소 상태: 진회색
            }`}
            >
            {formatTime(timeLeft)}
        </div>

        <div className="bg-slate-50 p-5 rounded-3xl w-full max-w-4xl border-2 border-slate-100 shadow-sm">
            {/* 마지막 라운드(최종 정리)의 마지막 발표자(3번 반대측)인 경우 */}
            {round === 2 && turn === 3 ? (
                <p className="text-3xl text-orange-600 font-black animate-bounce font-jalnan">
                이제 토론을 마무리할 시간이에요! ✨
                </p>
            ) : (
                /* 그 외 일반적인 경우 */
                <p className="text-2xl text-slate-600 font-bold leading-snug">
                다음 순서는 
                <span className={ (turn + 1) % 2 === 0 ? "text-blue-600 ml-2" : "text-red-600 ml-2" }>
                    {(turn + 1) % 2 === 0 ? "찬성측" : "반대측"}
                </span>  
                <span className="text-green-600 font-black mx-2 decoration-slate-200">
                    {turn < 3 ? names[turn + 1] : names[0]}
                </span> 
                친구의 
                <span className="text-purple-500 ml-1">
                    {turn < 3 ? roundNames[round] : roundNames[round + 1]}
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
            {/* 귀여운 아이콘이나 이미지 하나 있으면 좋겠지? */}
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
        </div>
    );
  }

  return (
    <div></div>
  );
}

export default DebateRoom;