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
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        accent: ['"Playfair Display"', 'serif'],
      },
    },
  },
  plugins: [],
}
