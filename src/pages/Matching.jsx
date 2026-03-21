import React, { useState } from 'react'; 

const drumRollSound = new Audio("/drum.mp3");

function Matching({ onBack }) { 
  const [topic, setTopic] = useState("");
  const [names, setNames] = useState(["", "", "", ""]);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false); // 애니메이션 상태

  const handleNameChange = (index, value) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  // 🎲 랜덤 순서 배정 및 애니메이션 로직
  const runLadder = () => {
    drumRollSound.currentTime = 0; 
    drumRollSound.play().catch(e => console.log("재생 실패:", e));
    
    setIsSpinning(true);
    setShowResults(true);

    // 2초 뒤에 결과 공개 (두구두구 효과!)
    setTimeout(() => {

      drumRollSound.currentTime = 5.1;

      const positions = [
        { turn: 1, team: "🔵 찬성", color: "bg-blue-500" },
        { turn: 2, team: "🔴 반대", color: "bg-red-500" },
        { turn: 3, team: "🔵 찬성", color: "bg-blue-500" },
        { turn: 4, team: "🔴 반대", color: "bg-red-500" },
      ];

      // 이름만 무작위로 섞기
      const shuffledNames = [...names]
        .filter(n => n.trim() !== "")
        .sort(() => Math.random() - 0.5);

      const finalMatch = shuffledNames.map((name, i) => ({
        name,
        ...positions[i]
      }));

      const nameOrderOnly = finalMatch.map(res => res.name);
  
      localStorage.setItem('next_debate_topic', topic); // 주제 저장
      localStorage.setItem('next_debate_names', JSON.stringify(nameOrderOnly)); // 이름 순서 저장
      
      setResults(finalMatch);
      setIsSpinning(false);
    }, 2000); 
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: "url('/bg.png')", // public 폴더의 파일명 그대로!
        backgroundAttachment: "fixed" // 스크롤 해도 배경은 가만히 있게!
      }}
    > 
      <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
      <main className="w-full z-10 max-w-2xl bg-white rounded-3xl shadow-xl p-8 overflow-hidden mt-10">
        <h1 className="mb-5 text-center text-5xl font-extrabold text-slate-800 font-jalnan">이빨괴물들의 토론</h1>
        {!showResults ? (
          /* --- 1단계: 입력 화면 --- */
          <>
            <section className="mb-8">
              <label className="block text-2xl font-bold text-slate-700 mb-2 ml-1 font-jalnan">다음주 토론 주제</label>
              <input 
                type="text"
                className="w-full p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl focus:outline-none focus:border-blue-400 text-lg transition-all"
                placeholder="주제를 입력하세요"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </section>

            <section className="mb-10">
              <label className="block text-2xl font-bold text-slate-700 mb-2 ml-1 font-jalnan">토론 주인공들</label>
              <div className="grid grid-cols-2 gap-4">
                {names.map((name, i) => (
                  <input 
                    key={i}
                    type="text"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-300 outline-none"
                    placeholder={`친구 ${i + 1}`}
                    value={name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                  />
                ))}
              </div>
            </section>

            <button 
              onClick={runLadder}
              className={`w-full py-5 rounded-2xl text-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
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
          /* --- 2단계: 결과 및 애니메이션 화면 --- */
          <div className="text-center">
            {isSpinning ? (
              <div className="flex flex-col items-center justify-center space-y-6 py-10">
                <div className="w-20 h-20 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-2xl font-bold text-slate-700 animate-bounce font-jalnan">발표 순서를 정하고 있어요... 두근두근!</p>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-500">
                {/* <h2 className="text-lg font-bold text-slate-400 mb-2">다음주 토론 주제</h2> */}
                <h3 className="text-3xl font-bold text-purple-600 mb-8 px-4 font-jalnan">{topic}</h3>
                
                <div className="space-y-4">
                  {results.map((res, i) => (
                    <div key={i} className="flex items-center p-5 bg-slate-50 rounded-2xl border-2 border-white shadow-sm hover:shadow-md transition-shadow">
                      <div className={`w-12 h-12 rounded-full font-jalnan flex items-center justify-center text-white font-black text-2xl mr-4 ${res.color} shadow-lg`}>
                        {res.turn}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-slate-500 text-lg">{res.team}</span>
                        <div className="text-2xl font-bold text-slate-800">{res.name} 친구</div>
                      </div>
                      <div className="text-slate-300">
                         {res.turn === 1 && "🏁 시작!"}
                         {res.turn === 4 && "✨ 피날레"}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 space-y-3">
                  <button 
                    onClick={onBack} // 2. navigate('/') 대신 onBack을 실행!
                    className="w-full py-5 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-2xl text-2xl font-black hover:from-black hover:to-black transition-all shadow-xl font-jalnan flex items-center justify-center gap-2 cursor-pointer"
                    style={{ position: 'relative', zIndex: 50 }} // 혹시 덮개에 가려졌을까 봐 추가!
                  >
                    🏠 메인 화면으로 가기
                  </button>
                  <p className="text-slate-400 text-sm">
                    결과가 자동으로 저장되었습니다! 토론방에서 불러올 수 있어요.
                  </p>
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