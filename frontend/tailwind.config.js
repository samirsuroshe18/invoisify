/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // safelist: [
  //   'alert-info',
  //   'alert-success',
  //   'alert-warning',
  //   'alert-error',
  // ],
  theme: {
    
      // mytheme: {
      //   "primary": "#3490dc",  
      //   "secondary": "#ffed4a",  
      //   "accent": "#38c172",  
        
      // },
    extend: {
      fontFamily: {
        inknut: ['"Inknut Antiqua"', 'serif'],
      },
    },
  },
  plugins: []
}