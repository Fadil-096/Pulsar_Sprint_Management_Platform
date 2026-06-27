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
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          card: 'var(--color-bg-card)',
          sidebar: 'var(--color-bg-sidebar)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        line: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
        },
        accent: {
          blue: 'var(--color-accent-blue)',
          'blue-light': 'var(--color-accent-blue-light)',
        },
        input: {
          bg: 'var(--color-input-bg)',
          line: 'var(--color-input-border)',
        },
        table: {
          header: 'var(--color-table-header)',
          'row-alt': 'var(--color-table-row-alt)',
        },
        nav: {
          bg: 'var(--color-nav-bg)',
          text: 'var(--color-nav-text)',
        },
        badge: {
          'pending-bg': 'var(--color-badge-pending-bg)',
          'pending-text': 'var(--color-badge-pending-text)',
          'approved-bg': 'var(--color-badge-approved-bg)',
          'approved-text': 'var(--color-badge-approved-text)',
          'rejected-bg': 'var(--color-badge-rejected-bg)',
          'rejected-text': 'var(--color-badge-rejected-text)',
          'active-bg': 'var(--color-badge-active-bg)',
          'active-text': 'var(--color-badge-active-text)',
          'planner-bg': 'var(--color-badge-planner-bg)',
          'planner-text': 'var(--color-badge-planner-text)',
          'completed-bg': 'var(--color-badge-completed-bg)',
          'completed-text': 'var(--color-badge-completed-text)',
          'created-bg': 'var(--color-badge-created-bg)',
          'created-text': 'var(--color-badge-created-text)',
        },
        dropdown: {
          'hover-bg': 'var(--color-dropdown-hover-bg)',
          'hover-border': 'var(--color-dropdown-hover-border)',
          'active-bg': 'var(--color-dropdown-active-bg)',
          'active-text': 'var(--color-dropdown-active-text)',
        },
        sidebar: {
          'hover-bg': 'var(--color-sidebar-hover-bg)',
          'active-bg': 'var(--color-sidebar-active-bg)',
          'hover-text': 'var(--color-sidebar-hover-text)',
          'active-text': 'var(--color-sidebar-active-text)',
        },
        semantic: {
          'success-text': 'var(--color-success-text)',
          'warning-text': 'var(--color-warning-text)',
          'error-text': 'var(--color-error-text)',
          'placeholder': 'var(--color-placeholder)',
          'link': 'var(--color-link)',
        },
        overlay: 'var(--color-overlay)',
        
        // Retain original legacy colors temporarily if needed during transition

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
      },
      boxShadow: {
        'lg': 'var(--color-shadow-lg)',
        'xl': 'var(--color-shadow-xl)',
      }
    },
  },
  plugins: [],
}
