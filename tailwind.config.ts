import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          black: '#171511',
          deep: '#16222B',
          DEFAULT: '#1D2A33',
          panel: '#202A30',
          border: '#3A403B',
        },
        paper: {
          DEFAULT: '#E9DDC5',
          light: '#F4EBD8',
          muted: '#D9C9AB',
          dim: '#B9AE9C',
        },
        seal: {
          red: '#9B2D20',
          'red-dark': '#6E1F18',
          'red-light': '#B94A3B',
        },
        bronze: {
          DEFAULT: '#A77B45',
          light: '#C69A5B',
          dark: '#76552E',
        },
        warm: {
          brown: '#6A5A4B',
          stone: '#B9AE9C',
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"Source Han Serif SC"', '"STSong"', 'Georgia', 'serif'],
        body: ['"Noto Sans SC"', '"Source Han Sans SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
