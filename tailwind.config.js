/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF6F91',
        primaryLight: '#FF94C2',
        secondary: '#A78BFA',
        secondaryLight: '#C8A2C8',
        background: '#FFF7FA',
        surface: '#FAFAFA',
        // Game Vibe Tokens
        p: '#9500ff', // Pure Purple
        pL: '#d6a3ff',
        acc: '#00ffa3', // Neon Mint
        acc2: '#00d1ff', // Electric Blue
        warn: '#ffb02e',
        danger: '#ff0055',
        ok: '#00ffcc',
        muted: '#818ca3',
        txt: '#f0f2f5',
        border: 'rgba(149,0,255,0.2)',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        accent: ['"Playfair Display"', 'serif'],
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'avatar-glow': 'avatarGlow 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
