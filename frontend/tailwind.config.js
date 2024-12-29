/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'alert-info',
    'alert-success',
    'alert-warning',
    'alert-error',
  ],
  theme: {
    extend: {
      fontFamily: {
        inknut: ['"Inknut Antiqua"', 'serif'],
      },
    },
  },
  plugins: [require("daisyui")],
}