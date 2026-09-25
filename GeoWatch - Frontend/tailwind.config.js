/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        deepest: '#06141B',
        surface: '#11212D',
        deep: '#253745',
        mid: '#4A5C6A',
        muted: '#9BA8AB',
        light: '#CCD0CF',
      },
    },
  },
  plugins: [],
}