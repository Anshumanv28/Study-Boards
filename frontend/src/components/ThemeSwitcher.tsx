import React, { useState, useEffect } from 'react';
import './ThemeSwitcher.css';

type Theme = 'light' | 'warm' | 'dark';

const ThemeSwitcher: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const changeTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    setIsOpen(false);
  };

  const getThemeIcon = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'warm':
        return '🌅';
      case 'dark':
        return '🌙';
      default:
        return '🎨';
    }
  };

  const getThemeName = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'warm':
        return 'Warm';
      case 'dark':
        return 'Dark';
      default:
        return 'Theme';
    }
  };

  return (
    <div className="theme-switcher">
      <button
        className="theme-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle theme menu"
      >
        <span className="theme-icon">{getThemeIcon(currentTheme)}</span>
        <span className="theme-label">{getThemeName(currentTheme)}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-option" onClick={() => changeTheme('light')}>
            <span className="theme-icon">☀️</span>
            <span className="theme-name">Light</span>
            {currentTheme === 'light' && <span className="checkmark">✓</span>}
          </div>
          <div className="theme-option" onClick={() => changeTheme('warm')}>
            <span className="theme-icon">🌅</span>
            <span className="theme-name">Warm</span>
            {currentTheme === 'warm' && <span className="checkmark">✓</span>}
          </div>
          <div className="theme-option" onClick={() => changeTheme('dark')}>
            <span className="theme-icon">🌙</span>
            <span className="theme-name">Dark</span>
            {currentTheme === 'dark' && <span className="checkmark">✓</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
