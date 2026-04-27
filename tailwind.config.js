/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#16181C',
          surface: '#1C1E26',
          'surface-alt': '#1A1D24',
          'surface-hover': '#22242A',
          card: '#1C1E26',
          border: '#2A2D35',
          'border-light': '#353945',
          accent: '#A0C4FF',
          'accent-bg': '#252B3B',
          green: '#4ADE80',
          'green-bg': '#1A4D3A',
          orange: '#FFA07A',
          muted: '#888888',
          'muted-dark': '#5F6368',
          'text-primary': '#FFFFFF',
          'text-secondary': '#CCCCCC',
          'text-tertiary': '#E0E0E0',
          skin: '#FAD6B1',
          avatar: '#333333',
        },
      },
    },
  },
  plugins: [],
};
