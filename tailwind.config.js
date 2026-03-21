/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 아이들이 좋아할만한 부드러운 색상 추가
        debateBlue: '#e0f2fe',
        debateGreen: '#dcfce7',
        debateCoral: '#ffedd5',
      },
    },
  },
  plugins: [],
}