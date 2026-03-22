import React, { useState } from 'react';
import Matching from './pages/Matching';
import DebateRoom from './pages/DebateRoom';


function App() {
  const [page, setPage] = useState('home');

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
    
      {/* 🏠 홈 화면 */}
      {page === 'home' && (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat px-4"
          style={{ 
            backgroundImage: "url('/bg.png')", 
            backgroundAttachment: "fixed" 
          }}>
          
          {/* 배경 어둡게 처리 (글자 가독성 업!) */}
          <div className="fixed inset-0 bg-black/40 pointer-events-none"></div>
          
          {/* 📱 메인 카드: 모바일에선 p-8, PC에선 p-16 */}
          <div className="w-full max-w-3xl z-10 bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-8 md:p-10 text-center animate-in fade-in zoom-in duration-700">
            
            {/* 📱 타이틀: 모바일에선 4xl, PC에선 6xl */}
            <h1 className="text-3xl md:text-6xl font-black text-slate-800 font-jalnan mb-4 md:mb-8 leading-tight">
              이빨괴물들의 토론
            </h1>
            
            <p className="text-slate-500 mb-8 md:mb-12 font-medium text-sm md:text-lg">
              논리로 세상을 구하는 꼬마 철학자들의 시간
            </p>

            {/* 📱 버튼 그룹: 모바일에선 세로로 쌓기(flex-col), PC에선 가로(flex-row) */}
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => setPage('matching')}
                className="w-full md:w-auto px-8 py-5 text-xl md:text-2xl bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-95 font-bold"
              >
                🎲 순서 정하기
              </button>
              
              <button 
                onClick={() => setPage('debate')}
                className="w-full md:w-auto px-8 py-5 text-xl md:text-2xl bg-green-500 text-white rounded-2xl shadow-lg shadow-green-200 hover:bg-green-600 hover:-translate-y-1 transition-all active:scale-95 font-bold"
              >
                🎤 토론 시작하기
              </button>
            </div>
            
            {/* 💡 하단 깨알 팁 */}
            <p className="mt-8 text-slate-400 text-xs md:text-sm">
              순서를 먼저 정하면 토론을 바로 불러올 수 있어요!
            </p>
          </div>
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