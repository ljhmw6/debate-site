import React, { useState, useEffect } from 'react';
import { Home, Sparkles } from 'lucide-react';
import PageBackground from '../components/PageBackground';

const drumRollSound = new Audio("/drum.mp3");

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

function Matching({ onBack, onStartDebate }) { 
  const [topic, setTopic] = useState("");
  const [topicList, setTopicList] = useState([]);
  const [names, setNames] = useState(["", "", "", ""]);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [noSide, setNoSide] = useState(false); // 찬반 없이 토론하기

  // 컴포넌트가 사라질 때(Unmount) 음성 끄기
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    fetch('/topics.json')
      .then(res => res.json())
      .then(data => setTopicList(data))
      .catch(err => console.log("주제 파일을 못 찾았어!", err));
  }, []);

  const setRandomTopic = () => {
    if (topicList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * topicList.length);
    setTopic(topicList[randomIndex]);
  };
  
  const addPerson = () => {
    if (names.length < 10) {
      setNames([...names, "", ""]);
    }
  };

  const removePerson = () => {
    if (names.length > 2) {
      setNames(names.slice(0, -2));
    }
  };

  const handleNameChange = (index, value) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const runLadder = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const knock = new SpeechSynthesisUtterance(""); 
      window.speechSynthesis.speak(knock);
    }

    drumRollSound.currentTime = 0; 
    drumRollSound.play().catch(e => console.log("재생 실패:", e));
    
    setIsSpinning(true);
    setShowResults(true);

    setTimeout(() => {
      drumRollSound.currentTime = 5.1;

      speak(noSide
        ? `발표 순서가 정해졌습니다. 내 순서를 확인하세요`
        : `토론팀이 정해졌습니다. 찬성팀과 반대팀을 확인하세요`);

      const positions = names.map((_, i) => noSide
        ? { turn: i + 1, team: "", color: "bg-purple-500" }
        : {
            turn: i + 1,
            team: i % 2 === 0 ? "찬성" : "반대",
            color: i % 2 === 0 ? "bg-blue-500" : "bg-red-500"
          });

      // Fisher-Yates 셔플: 모든 순서가 같은 확률로 나오도록
      const shuffledNames = names.filter(n => n.trim() !== "");
      for (let i = shuffledNames.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]];
      }

      const finalMatch = shuffledNames.map((name, i) => ({
        name,
        ...positions[i]
      }));

      localStorage.setItem('next_debate_topic', topic);
      localStorage.setItem('next_debate_results', JSON.stringify(finalMatch));
      localStorage.setItem('next_debate_noside', noSide ? 'true' : 'false');

      setResults(finalMatch);
      setIsSpinning(false);
    }, 2000); 
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center py-6 md:py-10 px-4">
      <PageBackground variant="soft" />

      {/* 📱 모바일에서는 너비를 꽉 채우고(w-full), PC에선 2xl까지 제한 */}
      <main className="relative z-10 w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-white/80 ring-1 ring-blue-100/60 rounded-[2rem] shadow-[0_24px_60px_-20px_rgba(30,58,138,0.5)] p-5 md:p-8 overflow-hidden mt-4 md:mt-8">

        {/* 📱 헤더 텍스트 크기 조절 */}
        <header className="relative w-full mb-6 md:mb-8 mt-2 pr-12 md:px-14">
          <h1 className="md:text-center text-3xl md:text-5xl text-slate-800 font-jalnan leading-tight">
            이빨괴물들의 <span className="text-violet-600">토론</span>
          </h1>
          <button
            onClick={onBack}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/90 text-slate-600 border border-slate-200 hover:text-blue-600 hover:border-blue-300 rounded-2xl transition-all shadow-sm active:scale-90"
            title="홈으로 가기"
            aria-label="홈으로 가기"
          >
            <Home size={22} strokeWidth={2.25} />
          </button>
        </header>

        {!showResults ? (
          <>
            <section className="mb-6 md:mb-8">
              <div className="flex justify-between items-end mb-2">
                <label className="text-xl md:text-2xl font-bold text-slate-700 ml-1 font-jalnan">토론 주제</label>
                <button 
                  onClick={setRandomTopic}
                  className="px-3 py-1.5 md:px-4 bg-violet-100 text-violet-700 rounded-full text-xs md:text-sm font-bold hover:bg-violet-200 transition-all flex items-center gap-1 active:scale-95"
                >
                  <Sparkles size={14} /> 주제 추천
                </button>
              </div>
              <input 
                type="text"
                className="w-full p-3 md:p-4 bg-white/90 border-2 border-blue-100 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 md:text-xl font-bold placeholder:text-slate-400 transition-all"
                placeholder="주제를 입력하세요!"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </section>

            <section className="mb-8 md:mb-10">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xl md:text-2xl font-bold text-slate-700 font-jalnan">토론 주인공들</label>
                <div className="flex gap-2">
                  <button onClick={removePerson} className="w-9 h-9 md:w-10 md:h-10 bg-white border-2 border-slate-200 text-slate-600 rounded-full font-bold text-lg hover:border-slate-300 active:scale-90 transition-all" aria-label="2명 빼기">-</button>
                  <button onClick={addPerson} className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 text-white rounded-full font-bold text-lg shadow-md shadow-blue-500/30 hover:bg-blue-500 active:scale-90 transition-all" aria-label="2명 더하기">+</button>
                </div>
              </div>
              
              {/* 📱 모바일에선 1열(grid-cols-1), 태블릿부터 2열(md:grid-cols-2) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-y-auto md:max-h-none pr-1">
                {names.map((name, i) => (
                  <input 
                    key={i}
                    type="text"
                    className="w-full p-3 bg-white/90 border-2 border-slate-100 rounded-2xl focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none text-base md:text-lg font-medium placeholder:text-slate-400 transition-all"
                    placeholder={`친구 ${i + 1}`}
                    maxLength={9}
                    value={name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                  />
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={() => setNoSide(!noSide)}
              className={`w-full mb-3 py-3 rounded-2xl text-base md:text-lg font-bold border-2 transition-all active:scale-95 flex items-center justify-center gap-2 ${
                noSide
                  ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/30"
                  : "bg-white/90 border-violet-200 text-violet-700 hover:bg-violet-50"
              }`}
            >
              {noSide ? "✅" : "⬜"} 찬반 없이 토론하기
            </button>

            <button
              onClick={runLadder}
              className={`w-full py-4 md:py-5 rounded-2xl text-lg md:text-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                topic && names.every(n => n.trim() !== "") 
                ? "bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-violet-500/30"
                : "bg-slate-300 shadow-none cursor-not-allowed"
              }`}
              disabled={!topic || names.some(n => n.trim() === "")}
            >
              발표 순서 정하기! 🎲
            </button>
          </>
        ) : (
          <div className="text-center">
            {isSpinning ? (
              <div className="flex flex-col items-center justify-center space-y-6 py-10">
                <div className="w-16 h-16 md:w-20 md:h-20 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-xl md:text-2xl font-bold text-slate-700 animate-bounce font-jalnan mt-5 px-4">발표 순서를 정하고 있어요...</p>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-500">
                <h3 className="text-lg md:text-2xl font-bold text-violet-700 mb-6 md:mb-8 px-4 leading-tight break-keep">{topic}</h3>
                
                {noSide ? (
                  /* 찬반 없이: 순서만 표시 */
                  <div className="space-y-3 md:space-y-4">
                    <div className="text-center py-2 bg-violet-600 text-white rounded-xl font-jalnan shadow-md shadow-violet-500/20 mb-2 md:mb-4 text-lg md:text-2xl">
                      발표 순서
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {results.map((res, i) => (
                        <div key={i} className="flex items-center p-2 bg-white/90 rounded-2xl border-2 border-violet-100 shadow-sm">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full font-jalnan flex items-center justify-center text-white font-black text-lg md:text-xl mr-3 ${res.color} shrink-0`}>
                            {res.turn}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="text-lg md:text-xl font-bold text-slate-800 truncate">{res.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                /* 📱 결과 리스트: 모바일에선 세로로 1팀씩, PC에선 가로로 2팀 */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-8">
                  {/* 찬성 팀 */}
                  <div className="space-y-3 md:space-y-4 mb-5 md:mb-0">
                    <div className="text-center py-2 bg-blue-600 text-white rounded-xl font-jalnan shadow-md shadow-blue-500/20 mb-2 md:mb-4 text-lg md:text-2xl">
                      찬성 팀
                    </div>
                    {results.filter((res) => res.team.includes("찬성")).map((res, i) => (
                      <div key={i} className="flex items-center p-2 bg-white/90 rounded-2xl border-2 border-blue-100 shadow-sm">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full font-jalnan flex items-center justify-center text-white font-black text-lg md:text-xl mr-3 ${res.color} shrink-0`}>
                          {res.turn}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-lg md:text-xl font-bold text-slate-800 truncate">{res.name}</div>
                        </div> 
                      </div>
                    ))}
                  </div>

                  {/* 반대 팀 */}
                  <div className="space-y-3 md:space-y-4">
                    <div className="text-center py-2 bg-red-500 text-white rounded-xl font-jalnan shadow-md shadow-red-500/20 mb-2 md:mb-4 text-lg md:text-2xl">
                      반대 팀
                    </div>
                    {results.filter((res) => res.team.includes("반대")).map((res, i) => (
                      <div key={i} className="flex items-center p-2 bg-white/90 rounded-2xl border-2 border-red-100 shadow-sm">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full font-jalnan flex items-center justify-center text-white font-black text-lg md:text-xl mr-3 ${res.color} shrink-0`}>
                          {res.turn}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-lg md:text-xl font-bold text-slate-800 truncate">{res.name}</div>
                        </div> 
                      </div>
                    ))}
                  </div>
                </div>
                )}

                <div className="mt-8 space-y-4">
                  <p className="text-slate-500 text-xs md:text-sm px-4">
                    결과가 저장되었습니다! <br className="md:hidden" /> 토론 시작하기에서 불러올 수 있어요.
                  </p>
                  <button 
                    onClick={onStartDebate}
                    className="w-full py-4 md:py-5 bg-linear-to-r from-blue-600 to-violet-600 text-white rounded-2xl text-xl md:text-2xl font-black shadow-xl shadow-violet-500/30 hover:from-blue-500 hover:to-violet-500 transition-all active:scale-95 animate-bounce-subtle font-jalnan"
                  >
                    토론 시작하러 가기 🚀
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Matching;