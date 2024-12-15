/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        'primary': '#5F6FFF',
        'secondary': '#04ae8c',
      }
    },
  },
  plugins: [],
}