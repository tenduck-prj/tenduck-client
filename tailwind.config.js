/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lotte: {
          red: {
            DEFAULT: '#DA291C',
            hover: '#BD2014',
            light: '#FDF1F0',
            border: '#F9D4D1',
          },
          gold: {
            DEFAULT: '#C5A880',
            dark: '#A68962',
            light: '#F8F5F0',
          },
          dark: '#111111',
          charcoal: '#1E1E1E',
          surface: '#FFFFFF',
          background: '#F8F9FA',
          border: '#E8EAED',
          muted: '#666666',
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
