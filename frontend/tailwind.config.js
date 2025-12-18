/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Light Theme Colors
        'light': {
          'primary-dark': '#800000',
          'primary-medium': '#982b1c',
          'secondary-light': '#dad4b5',
          'secondary-lighter': '#f2e8c6',
        },
        // Warm Theme Colors
        'warm': {
          'primary-dark': '#504b38',
          'primary-medium': '#b9b28a',
          'secondary-light': '#ebe5c2',
          'secondary-lighter': '#f8f3d9',
        },
        // Dark Theme Colors
        'dark': {
          'primary-dark': '#0f0f0f',
          'primary-medium': '#232d3f',
          'secondary-light': '#005b41',
          'secondary-lighter': '#008170',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--bg-gradient-primary))',
        'gradient-hero': 'linear-gradient(135deg, var(--bg-gradient-hero))',
        'gradient-accent': 'linear-gradient(90deg, var(--bg-gradient-accent))',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'theme': '0 10px 30px var(--card-shadow)',
        'theme-hover': '0 20px 40px var(--card-shadow)',
      },
    },
  },
  plugins: [],
}
