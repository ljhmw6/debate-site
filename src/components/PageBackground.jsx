// 페이지 공통 배경 (스타일은 index.css의 .page-bg 참고)
// soft  : 배경 이미지 + 옅은 푸른 막 (설정/입력 화면)
// focus : 배경 이미지를 흐리게 + 밝은 막 (토론 진행 화면처럼 글자가 주인공인 곳)
export default function PageBackground({ variant = 'soft' }) {
  return (
    <div className={`page-bg page-bg--${variant}`} aria-hidden="true">
      <div className="page-bg__img"></div>
      <div className="page-bg__veil"></div>
    </div>
  );
}
