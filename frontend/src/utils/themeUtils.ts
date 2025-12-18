export type Theme = 'light' | 'warm' | 'dark';

export const initializeTheme = (): Theme => {
  // Check if user has a saved theme preference
  const savedTheme = localStorage.getItem('theme') as Theme;
  
  if (savedTheme && ['light', 'warm', 'dark'].includes(savedTheme)) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    return savedTheme;
  }
  
  // Check system preference for dark mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (prefersDark) {
    const darkTheme: Theme = 'dark';
    document.documentElement.setAttribute('data-theme', darkTheme);
    localStorage.setItem('theme', darkTheme);
    return darkTheme;
  }
  
  // Default to light theme
  const lightTheme: Theme = 'light';
  document.documentElement.setAttribute('data-theme', lightTheme);
  localStorage.setItem('theme', lightTheme);
  return lightTheme;
};

export const setTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

export const getCurrentTheme = (): Theme => {
  return (localStorage.getItem('theme') as Theme) || 'light';
};
