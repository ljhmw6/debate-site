import React, { useState, useEffect } from 'react';

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

      speak(`토론팀이 정해졌습니다. 찬성팀과 반대팀을 확인하세요`);

      const positions = names.map((_, i) => ({
        turn: i + 1,
        team: i % 2 === 0 ? "찬성" : "반대",
        color: i % 2 === 0 ? "bg-blue-500" : "bg-red-500"
      }));

      const shuffledNames = [...names]
        .filter(n => n.trim() !== "")
        .sort(() => Math.random() - 0.5);

      const finalMatch = shuffledNames.map((name, i) => ({
        name,
        ...positions[i]
      }));

      localStorage.setItem('next_debate_topic', topic);
      localStorage.setItem('next_debate_results', JSON.stringify(finalMatch));

      setResults(finalMatch);
      setIsSpinning(false);
    }, 2000); 
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 md:py-10 px-4 bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: "url('/bg.png')", 
        backgroundAttachment: "fixed"
      }}
    > 
      <div className="fixed inset-0 bg-black/30 pointer-events-none"></div>
      
      {/* 📱 모바일에서는 너비를 꽉 채우고(w-full), PC에선 2xl까지 제한 */}
      <main className="w-full z-10 max-w-2xl bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-5 md:p-8 overflow-hidden mt-6 md:mt-10">
        
        {/* 📱 헤더 텍스트 크기 조절 */}
        <header className="relative w-full mb-6 md:mb-8 mt-2">
          <h1 className="md:text-center text-3xl md:text-5xl font-extrabold text-slate-800 font-jalnan">
            이빨괴물들의 토론
          </h1>
          <button 
            onClick={onBack} 
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all text-xl md:text-2xl shadow-sm active:scale-90"
            title="홈으로 가기"
          >
            🏠
          </button>
        </header>

        {!showResults ? (
          <>
            <section className="mb-6 md:mb-8">
              <div className="flex justify-between items-end mb-2">
                <label className="text-xl md:text-2xl font-bold text-slate-700 ml-1 font-jalnan">토론 주제</label>
                <button 
                  onClick={setRandomTopic}
                  className="px-3 py-1 md:px-4 md:py-1.5 bg-purple-100 text-purple-600 rounded-xl text-xs md:text-sm font-black hover:bg-purple-200 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                >
                  주제 추천
                </button>
              </div>
              <input 
                type="text"
                className="w-full p-3 bg-blue-50 border-2 border-blue-100 rounded-2xl focus:outline-none focus:border-blue-400 md:text-xl font-bold transition-all shadow-inner"
                placeholder="주제를 입력하세요!"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </section>

            <section className="mb-8 md:mb-10">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xl md:text-2xl font-bold text-slate-700 font-jalnan">토론 주인공들</label>
                <div className="flex gap-2">
                  <button onClick={removePerson} className="w-8 h-8 md:w-10 md:h-10 bg-slate-200 rounded-full font-bold">-</button>
                  <button onClick={addPerson} className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 text-white rounded-full font-bold">+</button>
                </div>
              </div>
              
              {/* 📱 모바일에선 1열(grid-cols-1), 태블릿부터 2열(md:grid-cols-2) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 overflow-y-auto md:max-h-none pr-1">
                {names.map((name, i) => (
                  <input 
                    key={i}
                    type="text"
                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-300 outline-none text-base md:text-lg"
                    placeholder={`친구 ${i + 1}`}
                    maxLength={9}
                    value={name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                  />
                ))}
              </div>
            </section>

            <button 
              onClick={runLadder}
              className={`w-full py-4 md:py-5 rounded-2xl text-lg md:text-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                topic && names.every(n => n.trim() !== "") 
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" 
                : "bg-slate-300 cursor-not-allowed"
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
                <h3 className="text-lg md:text-2xl font-bold text-purple-600 mb-6 md:mb-8 px-4 leading-tight">{topic} </h3>
                
                {/* 📱 결과 리스트: 모바일에선 세로로 1팀씩, PC에선 가로로 2팀 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-8">
                  {/* 찬성 팀 */}
                  <div className="space-y-3 md:space-y-4 mb-5 md:mb-0">
                    <div className="text-center py-2 bg-blue-500 text-white rounded-xl font-jalnan shadow-md mb-2 md:mb-4 text-lg md:text-2xl">
                      찬성 팀
                    </div>
                    {results.filter((res) => res.team.includes("찬성")).map((res, i) => (
                      <div key={i} className="flex items-center p-2 bg-white rounded-2xl border-2 border-blue-50 shadow-sm">
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
                    <div className="text-center py-2 bg-red-500 text-white rounded-xl font-jalnan shadow-md mb-2 md:mb-4 text-lg md:text-2xl">
                      반대 팀
                    </div>
                    {results.filter((res) => res.team.includes("반대")).map((res, i) => (
                      <div key={i} className="flex items-center p-2 bg-white rounded-2xl border-2 border-red-50 shadow-sm">
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

                <div className="mt-8 space-y-4">
                  <p className="text-slate-400 text-xs md:text-sm px-4">
                    결과가 저장되었습니다! <br className="md:hidden" /> 토론 시작하기에서 불러올 수 있어요.
                  </p>
                  <button 
                    onClick={onStartDebate}
                    className="w-full py-4 md:py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl text-xl md:text-2xl font-black shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all active:scale-95 animate-bounce-subtle font-jalnan"
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