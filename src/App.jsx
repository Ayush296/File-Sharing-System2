import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import MetalsPage from './pages/MetalsPage';
import CryptoPage from './pages/CryptoPage';
import { Globe, Sun, Moon } from 'lucide-react';
import { FaInstagram, FaGithub, FaLinkedin } from 'react-icons/fa';

const FIAT_SYMBOLS = ['$', '€', '£', '¥', '₹', '₽', '₩', '₺', '฿', '₴', '₪', '₫', '₡', 'R$', 'Fr', 'kr', 'A$', 'C$', 'NZ$'];
const CRYPTO_SYMBOLS = ['₿', 'Ξ', 'Ɖ', '₮', 'XRP', 'ADA', 'SOL', 'DOT', 'LTC', 'LINK', 'UNI', 'BCH', 'XLM', 'USDC'];

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [titleSymbolIndex, setTitleSymbolIndex] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setIsDarkMode(false);
  }, []);

  // Cycle through title symbols every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      setTitleSymbolIndex((prev) => (prev + 1) % FIAT_SYMBOLS.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const isCryptoRoute = location.pathname === '/crypto';
  const activeSymbols = isCryptoRoute ? CRYPTO_SYMBOLS : FIAT_SYMBOLS;

  // Pre-calculate random styles so they don't regenerate every 1s when titleSymbolIndex changes
  const symbolProps = React.useMemo(() => {
    const maxLen = Math.max(FIAT_SYMBOLS.length, CRYPTO_SYMBOLS.length);
    return Array.from({ length: maxLen }).map(() => ({
      left: `${Math.random() * 100}vw`,
      duration: `${15 + Math.random() * 10}s`,
      delay: `-${Math.random() * 20}s`
    }));
  }, []);

  return (
    <>
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      
      <div className="flying-symbols-container">
        {activeSymbols.map((symbol, i) => (
          <div 
            key={`${symbol}-${i}`} 
            className="currency-flyer"
            style={{ 
              left: symbolProps[i].left, 
              animationDuration: symbolProps[i].duration,
              animationDelay: symbolProps[i].delay
            }}
          >
            {symbol}
          </div>
        ))}
      </div>
      
      <div className="app-container">
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>

        <header className="header">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 className="title">
              <span style={{ minWidth: '70px', display: 'inline-block', textAlign: 'right', marginRight: '10px', color: 'var(--accent-color)' }}>
                {FIAT_SYMBOLS[titleSymbolIndex]}
              </span>
              World Rates
            </h1>
          </Link>
          <p className="subtitle">Real-time global currency exchange rates & historical trends</p>
        </header>

        <Routes>
          <Route path="/" element={<HomePage isDarkMode={isDarkMode} />} />
          <Route path="/metals" element={<MetalsPage isDarkMode={isDarkMode} />} />
          <Route path="/crypto" element={<CryptoPage isDarkMode={isDarkMode} />} />
        </Routes>

        <footer className="social-footer">
          <a href="https://www.instagram.com/ayush.sharmaa/" target="_blank" rel="noopener noreferrer" className="social-link">
            <FaInstagram size={20} />
            <span>ayush.sharmaa</span>
          </a>
          <a href="https://github.com/Ayush296" target="_blank" rel="noopener noreferrer" className="social-link">
            <FaGithub size={20} />
            <span>Ayush296</span>
          </a>
          <a href="https://www.linkedin.com/in/ayush-sharma-216464276/" target="_blank" rel="noopener noreferrer" className="social-link">
            <FaLinkedin size={20} />
            <span>Ayush Sharma</span>
          </a>
        </footer>
      </div>
    </>
  );
}

export default App;
