/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        border: {
          light: 'var(--border-light)',
          medium: 'var(--border-medium)',
        },
        blue: {
          50: 'var(--blue-50)',
          200: 'var(--blue-200)',
          400: 'var(--blue-400)',
          600: 'var(--blue-600)',
          800: 'var(--blue-800)',
        },
        green: {
          50: 'var(--green-50)',
          600: 'var(--green-600)',
          800: 'var(--green-800)',
        },
        red: {
          50: 'var(--red-50)',
          600: 'var(--red-600)',
          800: 'var(--red-800)',
        },
        amber: {
          50: 'var(--amber-50)',
          600: 'var(--amber-600)',
        },
        teal: {
          50: 'var(--teal-50)',
          600: 'var(--teal-600)',
        }
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
      }
    },
  },
  plugins: [],
}
