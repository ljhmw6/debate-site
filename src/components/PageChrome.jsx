import { Home } from 'lucide-react';

const STEPS = ['순서 정하기', '토론 설정', '토론'];

// 상단 바: 홈 버튼 + 진행 단계 표시
export function TopBar({ onHome, step }) {
  return (
    <div className="relative z-10 w-full max-w-3xl flex items-center justify-between gap-2 mb-4 md:mb-6">
      <button
        onClick={onHome}
        title="홈으로 가기"
        aria-label="홈으로 가기"
        className="flex items-center gap-2 pl-1.5 pr-3 md:pr-4 h-10 md:h-11 rounded-2xl bg-white/85 backdrop-blur border border-white text-slate-700 shadow-sm hover:text-blue-700 transition-all active:scale-95"
      >
        <span className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-linear-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center">
          <Home size={16} strokeWidth={2.5} />
        </span>
        <span className="font-jalnan text-sm md:text-base whitespace-nowrap">이빨괴물들의 토론</span>
      </button>

      <ol className="flex items-center gap-0.5 rounded-full bg-white/70 backdrop-blur border border-white p-1 shadow-sm" aria-label="진행 단계">
        {STEPS.map((s, i) => {
          const active = i + 1 === step;
          return (
            <li key={s} aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-1 rounded-full px-2.5 md:px-3 py-1 text-xs md:text-sm font-bold whitespace-nowrap ${active ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>
              <span className="tabular-nums">{i + 1}</span>
              <span className={active ? '' : 'hidden md:inline'}>{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// 번호가 붙은 섹션 제목
export function SectionTitle({ n, children }) {
  return (
    <h2 className="flex items-center gap-2 font-jalnan text-slate-700 text-lg md:text-xl">
      <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-sans font-black text-sm flex items-center justify-center">{n}</span>
      {children}
    </h2>
  );
}

// 공통 카드 스타일
export const cardClass =
  'relative z-10 w-full max-w-3xl rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white ring-1 ring-blue-100/60 shadow-[0_24px_60px_-20px_rgba(30,58,138,0.5)] p-5 md:p-9';
