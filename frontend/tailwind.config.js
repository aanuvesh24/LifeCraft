/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mc: ['"Pixelify Sans"', '"Press Start 2P"', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        mc: {
          stone: '#8b8b8b',
          darkstone: '#3c3c3c',
          bedrock: '#1e1e1e',
          deepslate: '#262626',
          dirt: '#866043',
          'dirt-dark': '#573d26',
          wood: '#a07449',
          'wood-dark': '#674728',
          heart: '#ff0000',
          'heart-dark': '#8f0000',
          xp: '#55ff55',
          'xp-dark': '#2a802a',
          gold: '#fca800',
          'gold-light': '#ffff55',
          diamond: '#4dedf4',
          btn: '#707070',
          'btn-hover': '#858585',
          'btn-active': '#505050',
          panel: '#c6c6c6',
          'panel-dark': '#555555',
        },
      },
      boxShadow: {
        'mc-btn': 'inset -4px -4px 0px 0px #373737, inset 4px 4px 0px 0px #ffffff',
        'mc-btn-hover': 'inset -4px -4px 0px 0px #373737, inset 4px 4px 0px 0px #ffffff, 0 0 10px rgba(255,255,160,0.3)',
        'mc-btn-active': 'inset 4px 4px 0px 0px #222222, inset -4px -4px 0px 0px #555555',
        'mc-panel': 'inset -4px -4px 0px 0px #555555, inset 4px 4px 0px 0px #ffffff',
        'mc-panel-dark': 'inset -4px -4px 0px 0px #1e1e1e, inset 4px 4px 0px 0px #5a5a5a',
        'mc-slot': 'inset 3px 3px 0px 0px #373737, inset -3px -3px 0px 0px #ffffff',
      },
    },
  },
  plugins: [],
}
