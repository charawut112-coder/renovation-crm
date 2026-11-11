/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E3A8A',
        },
        unit: {
          design: '#4338CA',
          construction: '#C2410C',
          sales: '#047857',
          aftersales: '#0F766E',
          stock: '#6D28D9',
        }
      }
    },
  },
  plugins: [],
}
