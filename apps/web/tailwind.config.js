/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg1: 'var(--bg1)',
        bg2: 'var(--bg2)',
        bg3: 'var(--bg3)',
        panel: 'var(--panel)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        cyan: 'var(--cyan)',
        violet: 'var(--violet)',
        ok: 'var(--ok)',
        bad: 'var(--bad)',
        warn: 'var(--warn)',
        slate: 'var(--slate)',
      },
    },
  },
  plugins: [],
};
