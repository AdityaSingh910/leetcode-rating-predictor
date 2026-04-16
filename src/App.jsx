import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Compare from './pages/Compare';
import Leaderboard from './pages/Leaderboard';
import Simulate from './pages/SimulatePage';

// Theme Context
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('lc-theme') || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('lc-theme', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <BrowserRouter>
        <div className="app-wrapper">
          <div className="bg-animation">
            <div className="bg-orb bg-orb-1"></div>
            <div className="bg-orb bg-orb-2"></div>
            <div className="bg-orb bg-orb-3"></div>
          </div>
          <Navbar />
          <main className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/simulate" element={<Simulate />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}
