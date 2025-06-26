/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',
        secondary: '#FFFFFF',
        korean: {
          red: '#CD2E3A',
          blue: '#0E4A84'
        }
      },
      fontFamily: {
        'noto': ['Noto Sans KR', 'sans-serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}