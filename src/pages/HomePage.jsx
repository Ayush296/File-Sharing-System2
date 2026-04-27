import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CurrencyConverter from '../components/CurrencyConverter';
import HistoricalChart from '../components/HistoricalChart';
import { getCurrencies, getConversionRate, getHistoricalRates } from '../services/api';
import { Diamond } from 'lucide-react';
import { FaBitcoin } from 'react-icons/fa';

const HomePage = ({ isDarkMode }) => {
  const [currencies, setCurrencies] = useState({});
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [amount, setAmount] = useState(1);
  const [conversionRate, setConversionRate] = useState(null);
  
  const [historicalData, setHistoricalData] = useState(null);
  const [days, setDays] = useState(30);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    const fetchCurrencies = async () => {
      const data = await getCurrencies();
      if (Array.isArray(data)) {
        const sortedData = [...data].sort((a, b) => a.iso_code.localeCompare(b.iso_code));
        setCurrencies(sortedData);
      } else {
        setCurrencies(data);
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    const fetchRate = async () => {
      if (fromCurrency === toCurrency) {
        setConversionRate(1);
        return;
      }
      const data = await getConversionRate(fromCurrency, toCurrency);
      if (data && data.rate !== undefined) {
        setConversionRate(data.rate);
      } else {
        setConversionRate(null);
      }
    };
    fetchRate();
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    const fetchHistorical = async () => {
      setLoadingChart(true);
      if (fromCurrency === toCurrency) {
        setHistoricalData(null);
        setLoadingChart(false);
        return;
      }
      
      const allTime = days === 'all';
      const data = await getHistoricalRates(fromCurrency, toCurrency, days, allTime);
      if (Array.isArray(data)) {
        setHistoricalData(data);
      } else {
        setHistoricalData(null);
      }
      setLoadingChart(false);
    };
    
    const timer = setTimeout(fetchHistorical, 500);
    return () => clearTimeout(timer);
  }, [fromCurrency, toCurrency, days]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <main className="main-content">
      <CurrencyConverter 
        currencies={currencies}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        setFromCurrency={setFromCurrency}
        setToCurrency={setToCurrency}
        amount={amount}
        setAmount={setAmount}
        conversionRate={conversionRate}
        onSwap={handleSwap}
      />

      <HistoricalChart 
        historicalData={historicalData}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        days={days}
        setDays={setDays}
        loading={loadingChart}
        isDarkMode={isDarkMode}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <Link to="/metals" className="metals-banner glass-panel" style={{ marginBottom: 0 }}>
          <div className="rotate-coin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fbbf24', borderRadius: '50%', width: '32px', height: '32px', border: '2px solid #f59e0b', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)' }}>
            <span style={{ color: '#b45309', fontWeight: 'bold', fontSize: '14px' }}>$</span>
          </div>
          <span>View Live Gold, Silver & Platinum Prices</span>
        </Link>
        
        <Link to="/crypto" className="metals-banner glass-panel" style={{ marginBottom: 0 }}>
          <div className="rotate-bitcoin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <FaBitcoin size={32} />
          </div>
          <span>View Live Crypto Prices</span>
        </Link>
      </div>
    </main>
  );
};

export default HomePage;
