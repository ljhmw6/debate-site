import React, { useState } from 'react';
import Matching from './pages/Matching';
import DebateRoom from './pages/DebateRoom';

function App() {
  const [page, setPage] = useState('home'); // 'home', 'matching', 'debate'

  return (
    <div className="min-h-screen bg-slate-50">
    
      {/* 메뉴 선택 (나중에 헤더로 빼도 좋아) */}
      {page === 'home' && (
        <div className="flex flex-col gap-4 items-center justify-center h-screen space-y-6 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('/bg.png')", // public 폴더의 파일명 그대로!
            backgroundAttachment: "fixed" // 스크롤 해도 배경은 가만히 있게!
          }}>
          <div className="absolute inset-0 bg-black/30 pointer-events-none h-full"></div>
          <div className="max-w-3xl z-10 bg-white rounded-3xl shadow-xl p-16 overflow-hidden">
            <h1 className="text-6xl font-black text-slate-800 font-jalnan mb-6">🦷 이빨괴물들의 토론</h1>
            <div className="flex gap-4">
              <button 
                onClick={() => setPage('matching')}
                className="px-8 py-4 text-2xl bg-blue-500 text-white rounded-2xl shadow-lg hover:bg-blue-600 transition-all"
              >
                🎲 다음주 순서 정하기
              </button>
              <button 
                onClick={() => setPage('debate')}
                className="px-8 py-4 text-2xl bg-green-500 text-white rounded-2xl shadow-lg hover:bg-green-600 transition-all"
              >
                🎤 오늘 토론 시작하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 페이지 전환 */}
      {page === 'matching' && <Matching onBack={() => setPage('home')} />}
      {page === 'debate' && <DebateRoom onBack={() => setPage('home')} />}
    </div>
  );
}

export default App;