import React, { useState } from 'react';
import { Shuffle, Mic, Lightbulb } from 'lucide-react';
import Matching from './pages/Matching';
import DebateRoom from './pages/DebateRoom';


function App() {
  
  const [page, setPage] = useState('home');

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
    
      {/* 🏠 홈 화면 */}
      {page === 'home' && (
        <div className="home-hero">
          {/* 배경: 넓은 화면은 전체 배경, 세로 화면은 흐린 배경 + 하단 이미지 띠 (index.css) */}
          <div className="home-bg" aria-hidden="true"></div>
          <div className="home-veil" aria-hidden="true"></div>

          {/* 메인 카드: 아이들 얼굴을 가리지 않도록 하늘(상단) 영역에 배치 */}
          <div className="home-content">
            <div className="w-full max-w-xl text-center rounded-[2rem] bg-white/75 backdrop-blur-xl border border-white/80 ring-1 ring-blue-100/60 shadow-[0_24px_60px_-20px_rgba(37,64,160,0.45)] px-6 md:px-10 py-[clamp(1.25rem,3.5vh,2.25rem)] animate-in fade-in zoom-in duration-700">

              <h1 className="font-jalnan text-slate-800 leading-tight text-[clamp(1.75rem,min(8.5vw,6vh),3.5rem)]">
                이빨괴물들의 <span className="text-violet-600">토론</span>
              </h1>

              <p className="mt-2 text-balance text-slate-600 font-medium text-[clamp(0.9rem,2.2vh,1.15rem)]">
                논리로 세상을 구하는 꼬마 철학자들의 시간
              </p>

              {/* 버튼: 순서 정하기(보조) / 토론 시작하기(주요) */}
              <div className="mt-[clamp(1.25rem,3.5vh,2rem)] flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setPage('matching')}
                  className="flex items-center justify-center gap-2 h-[clamp(3.25rem,7vh,3.75rem)] px-7 rounded-2xl bg-white/90 text-blue-700 border-2 border-blue-200 font-bold text-lg shadow-sm hover:bg-white hover:border-blue-400 hover:-translate-y-0.5 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                >
                  <Shuffle size={20} strokeWidth={2.5} />
                  순서 정하기
                </button>

                <button
                  onClick={() => setPage('debate')}
                  className="flex items-center justify-center gap-2 h-[clamp(3.25rem,7vh,3.75rem)] px-8 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 text-white font-bold text-lg shadow-lg shadow-violet-500/30 hover:from-blue-500 hover:to-violet-500 hover:-translate-y-0.5 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
                >
                  <Mic size={20} strokeWidth={2.5} />
                  토론 시작하기
                </button>
              </div>

              {/* 하단 팁 */}
              <p className="mt-4 flex items-center justify-center gap-1.5 text-slate-500 text-xs md:text-sm">
                <Lightbulb size={14} className="text-amber-500 shrink-0" />
                순서를 먼저 정하면 토론을 바로 불러올 수 있어요!
              </p>
            </div>
          </div>

          {/* 세로 화면 전용: 아이들이 모두 보이는 이미지 띠 */}
          <div className="home-strip" aria-hidden="true"></div>
        </div>
      )}

      {/* 페이지 전환 로직은 그대로 유지 */}
      {page === 'matching' && (
        <Matching 
          onBack={() => setPage('home')} 
          onStartDebate={() => setPage('debate')} 
        />
      )}
      {page === 'debate' && <DebateRoom onBack={() => setPage('home')} />}
    </div>
  );
}

export default App;