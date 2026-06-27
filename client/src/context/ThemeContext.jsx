import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('nokia-sprint-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('nokia-sprint-theme', theme);
  }, [theme]);

  // Remove preload class after initial load to enable transitions
  useEffect(() => {
    const timeout = setTimeout(() => {
      document.body.classList.remove('preload');
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  const toggleTheme = () => {
    if (isToggling) return;
    
    setIsToggling(true);
    document.body.classList.add('theme-switching');
    
    // Wait for overlay to fade in before applying theme change
    setTimeout(() => {
      setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    }, 200);
    
    // Remove overlay
    setTimeout(() => {
      document.body.classList.remove('theme-switching');
      setIsToggling(false);
    }, 600);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      
      {/* Theme Transition Overlay */}
      <div 
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-primary transition-opacity duration-200 ease-in-out ${isToggling ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="w-10 h-10 border-4 border-line border-t-accent-blue rounded-full animate-spin mb-4"></div>
        <div className="text-text-primary font-bold tracking-widest text-xs uppercase opacity-80">
          Loading...
        </div>
      </div>
    </ThemeContext.Provider>
  );
};
