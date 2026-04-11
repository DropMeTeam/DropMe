/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // High-end dark palette
        'brand-dark': '#020617',  // Deepest background
        'brand-card': '#0f172a',  // Slightly lighter slate for cards
        'brand-accent': '#63E6BE', // The emerald/teal highlight
        'brand-blue': '#2563eb',   // Primary action blue
      },
      boxShadow: { 
        'soft': "0 20px 60px rgba(0,0,0,.35)",
        'accent': "0 0 20px rgba(99, 230, 190, 0.15)", // Subtle glow for buttons
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
      }
    },
  },
  plugins: [],
};