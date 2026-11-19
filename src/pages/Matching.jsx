import React, { useState, useEffect } from 'react';
import { Sparkles, Minus, Plus, CheckCircle2 } from 'lucide-react';
import PageBackground from '../components/PageBackground';
import { TopBar, SectionTitle, cardClass } from '../components/PageChrome';

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
  const [noSide, setNoSide] = useState(false); // 자유 토론(팀 없이 각자 찬반 의견)

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

  const filledCount = names.filter(n => n.trim() !== "").length;
  const canRun = topic && names.every(n => n.trim() !== "");
  const teamPanels = [
    { key: "찬성", label: "찬성 팀", panel: "bg-blue-50/80 border-blue-100", badge: "bg-blue-600" },
    { key: "반대", label: "반대 팀", panel: "bg-red-50/80 border-red-100", badge: "bg-red-500" },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-5 md:py-8">
      <PageBackground variant="soft" />
      <TopBar onHome={onBack} step={1} />

      <main className={cardClass}>
        {!showResults ? (
          <>
            <header className="mb-6 md:mb-8">
              <h1 className="font-jalnan text-slate-800 text-3xl md:text-4xl leading-tight">발표 순서 정하기 🎲</h1>
              <p className="mt-2 text-slate-500 text-sm md:text-base break-keep">
                주제와 친구들 이름을 적으면 <b className="text-slate-700">팀과 발표 순서</b>를 공평하게 뽑아 줘요.
              </p>
            </header>

            {/* 1. 토론 주제 */}
            <section className="mb-6 md:mb-8">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <SectionTitle n={1}>토론 주제</SectionTitle>
                <button
                  onClick={setRandomTopic}
                  className="px-3 py-1.5 md:px-4 bg-violet-100 text-violet-700 rounded-full text-xs md:text-sm font-bold hover:bg-violet-200 transition-all flex items-center gap-1 active:scale-95"
                >
                  <Sparkles size={14} /> 주제 추천
                </button>
              </div>
              <input
                type="text"
                className="w-full p-3.5 md:p-4 bg-white border-2 border-blue-100 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-base md:text-xl font-bold placeholder:text-slate-400 placeholder:font-medium transition-all"
                placeholder="주제를 입력하세요!"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </section>

            {/* 2. 토론 주인공들 */}
            <section className="mb-6 md:mb-8">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <SectionTitle n={2}>
                  토론 주인공들
                  <span className="font-sans text-sm font-bold text-slate-400 tabular-nums">{filledCount}/{names.length}</span>
                </SectionTitle>
                <div className="flex items-center rounded-full bg-white border-2 border-slate-200 p-0.5">
                  <button onClick={removePerson} disabled={names.length <= 2} aria-label="2명 빼기"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-90">
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <span className="w-11 text-center text-sm font-bold text-slate-700 tabular-nums">{names.length}명</span>
                  <button onClick={addPerson} disabled={names.length >= 10} aria-label="2명 더하기"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 transition-all active:scale-90">
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
                {names.map((name, i) => (
                  <label key={i} className="flex items-center gap-2.5 rounded-2xl bg-white border-2 border-slate-100 pl-2 pr-3 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                    <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${name.trim() ? 'bg-linear-to-br from-blue-500 to-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      className="w-full py-3 bg-transparent outline-none text-base md:text-lg font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
                      placeholder={`친구 ${i + 1}`}
                      maxLength={9}
                      value={name}
                      onChange={(e) => handleNameChange(i, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </section>

            {/* 3. 토론 방식 */}
            <section className="mb-7 md:mb-9">
              <div className="mb-2.5"><SectionTitle n={3}>토론 방식</SectionTitle></div>
              <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100/80 p-1.5" role="radiogroup" aria-label="토론 방식">
                <button type="button" role="radio" aria-checked={!noSide} onClick={() => setNoSide(false)}
                  className={`rounded-xl py-2.5 md:py-3 px-2 font-bold transition-all ${!noSide ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/50'}`}>
                  <span className="text-base md:text-lg text-blue-700">🆚 팀 토론</span>
                  <span className="block text-[11px] md:text-xs font-medium text-slate-400 mt-0.5">찬성팀·반대팀으로 나눠요</span>
                </button>
                <button type="button" role="radio" aria-checked={noSide} onClick={() => setNoSide(true)}
                  className={`rounded-xl py-2.5 md:py-3 px-2 font-bold transition-all ${noSide ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/50'}`}>
                  <span className="text-base md:text-lg text-violet-700">💬 자유 토론</span>
                  <span className="block text-[11px] md:text-xs font-medium text-slate-400 mt-0.5">각자 찬성·반대를 자유롭게 정해요</span>
                </button>
              </div>
            </section>

            <button
              onClick={runLadder}
              className={`w-full py-4 md:py-5 rounded-2xl text-lg md:text-xl font-bold text-white transition-all ${
                canRun
                ? "bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-xl shadow-violet-500/30 hover:-translate-y-0.5 active:scale-[0.98]"
                : "bg-slate-300 cursor-not-allowed"
              }`}
              disabled={!canRun}
            >
              발표 순서 정하기! 🎲
            </button>
            {!canRun && (
              <p className="mt-2.5 text-center text-xs md:text-sm text-slate-400">주제와 친구들 이름을 모두 적으면 버튼이 켜져요</p>
            )}
          </>
        ) : (
          <div className="text-center">
            {isSpinning ? (
              <div className="flex flex-col items-center justify-center gap-5 py-14 md:py-20">
                <div className="relative w-28 h-28">
                  <div className="absolute inset-0 rounded-full border-[6px] border-blue-100 border-t-blue-600 border-r-violet-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-5xl animate-bounce">🎲</div>
                </div>
                <p className="font-jalnan text-xl md:text-2xl text-slate-700">발표 순서를 정하고 있어요...</p>
                <p className="text-slate-400 text-sm md:text-base">두근두근! 누가 먼저 발표할까요?</p>
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm md:text-base font-bold">
                  🎉 발표 순서가 정해졌어요!
                </span>
                <h2 className="mt-3 font-jalnan text-slate-800 text-2xl md:text-3xl leading-tight text-balance break-keep px-2">{topic}</h2>

                {noSide ? (
                  /* 자유 토론: 순서만 표시 */
                  <div className="mt-6 rounded-3xl border bg-violet-50/80 border-violet-100 p-3 md:p-4 text-left">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="px-3 py-1 rounded-full text-white font-jalnan text-base md:text-lg bg-violet-600">자유 토론 발표 순서</span>
                      <span className="text-xs font-bold text-slate-400">{results.length}명</span>
                    </div>
                    <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {results.map((res, i) => (
                        <li key={i} className="flex items-center gap-3 rounded-2xl bg-white shadow-sm p-2">
                          <span className={`w-9 h-9 md:w-10 md:h-10 rounded-xl font-jalnan flex items-center justify-center text-white text-lg ${res.color} shrink-0`}>{res.turn}</span>
                          <span className="text-lg md:text-xl font-bold text-slate-800 truncate">{res.name}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  /* 찬성 팀 / 반대 팀 */
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-left">
                    {teamPanels.map(({ key, label, panel, badge }) => {
                      const members = results.filter((res) => res.team.includes(key));
                      return (
                        <div key={key} className={`rounded-3xl border p-3 md:p-4 ${panel}`}>
                          <div className="flex items-center justify-between mb-3 px-1">
                            <span className={`px-3 py-1 rounded-full text-white font-jalnan text-base md:text-lg ${badge}`}>{label}</span>
                            <span className="text-xs font-bold text-slate-400">{members.length}명</span>
                          </div>
                          <ul className="space-y-2">
                            {members.map((res, i) => (
                              <li key={i} className="flex items-center gap-3 rounded-2xl bg-white shadow-sm p-2">
                                <span className={`w-9 h-9 md:w-10 md:h-10 rounded-xl font-jalnan flex items-center justify-center text-white text-lg ${res.color} shrink-0`}>{res.turn}</span>
                                <span className="flex-1 min-w-0 text-lg md:text-xl font-bold text-slate-800 truncate">{res.name}</span>
                                <span className="shrink-0 pr-2 text-xs font-bold text-slate-400">{res.turn}번째</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="mt-7 flex items-center justify-center gap-1.5 text-slate-500 text-xs md:text-sm break-keep">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  결과가 저장되었습니다! 토론 시작하기에서 불러올 수 있어요.
                </p>
                <button
                  onClick={onStartDebate}
                  className="mt-3 w-full py-4 md:py-5 bg-linear-to-r from-blue-600 to-violet-600 text-white rounded-2xl text-xl md:text-2xl shadow-xl shadow-violet-500/30 hover:from-blue-500 hover:to-violet-500 hover:-translate-y-0.5 transition-all active:scale-[0.98] font-jalnan"
                >
                  토론 시작하러 가기 🚀
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Matching;