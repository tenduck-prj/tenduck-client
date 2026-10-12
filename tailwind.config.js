/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lotte: {
          // [Core Primary] 롯데백화점 샴페인 골드 (메인 색상)
          gold: {
            DEFAULT: '#C5A880',
            hover: '#B5966D',
            dark: '#8F7249',
            light: '#FAF7F2',
            tint: '#F3ECE2',
            border: '#E8DEC8',
          },
          // [Secondary / Accent] 롯데 시그니처 레드 (보조 색상: 상태/알림/하이라이트)
          red: {
            DEFAULT: '#DA291C',
            hover: '#BD2014',
            light: '#FDF1F0',
            border: '#F9D4D1',
          },
          dark: '#121212',
          charcoal: '#1E1E1E',
          surface: '#FFFFFF',
          background: '#F9F9FA',
          border: '#E8E5DF',
          muted: '#6B6864',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
