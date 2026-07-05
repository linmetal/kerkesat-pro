/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050506',
        ink: '#0a0a0c',
        graphite: '#141417',
        steel: '#8a8f98',
        mist: '#c8ccd4',
        signal: '#7fd9ff',
        ember: '#ff6a3d',
        platinum: '#e8e9ec',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['var(--font-body)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
