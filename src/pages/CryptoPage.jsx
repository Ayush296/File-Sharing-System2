import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HistoricalChart from '../components/HistoricalChart';
import { getCurrencies, getConversionRate, getCryptoCoins, getCryptoRate, getCryptoHistorical } from '../services/api';
import { ArrowLeft, Bitcoin } from 'lucide-react';
import { FaBitcoin } from 'react-icons/fa';

// List of fiat currencies natively supported by CoinGecko
const CG_SUPPORTED_FIAT = [
  'usd', 'aed', 'ars', 'aud', 'bdt', 'bhd', 'bmd', 'brl', 'cad', 'chf', 'clp', 'cny', 'czk', 'dkk', 'eur', 'gbp', 'gel', 'hkd', 'huf', 'idr', 'ils', 'inr', 'jpy', 'krw', 'kwd', 'lkr', 'mmk', 'mxn', 'myr', 'ngn', 'nok', 'nzd', 'php', 'pkr', 'pln', 'rub', 'sar', 'sek', 'sgd', 'thb', 'try', 'twd', 'uah', 'vef', 'vnd', 'zar', 'xdr'
];

const CryptoPage = ({ isDarkMode }) => {
  const [coins, setCoins] = useState([]);
  const [coinId, setCoinId] = useState('bitcoin');
  
  const [currencies, setCurrencies] = useState([]);
  const [toCurrency, setToCurrency] = useState('USD');
  const [quantity, setQuantity] = useState(1);
  
  const [baseRate, setBaseRate] = useState(null);
  
  const [historicalData, setHistoricalData] = useState(null);
  const [days, setDays] = useState(30);
  const [loadingChart, setLoadingChart] = useState(false);

  // Fetch lists
  useEffect(() => {
    const fetchLists = async () => {
      // Fetch crypto list
      const coinData = await getCryptoCoins();
      if (coinData && coinData.length > 0) {
        setCoins(coinData);
      }
      
      // Fetch fiat list
      const fiatData = await getCurrencies();
      if (Array.isArray(fiatData)) {
        const standardFiat = fiatData.filter(c => !['XAU', 'XAG', 'XPT'].includes(c.iso_code));
        const sortedFiat = [...standardFiat].sort((a, b) => a.iso_code.localeCompare(b.iso_code));
        setCurrencies(sortedFiat);
      }
    };
    fetchLists();
  }, []);

  // Fetch Live Rate
  useEffect(() => {
    const fetchRate = async () => {
      const targetLower = toCurrency.toLowerCase();
      
      if (CG_SUPPORTED_FIAT.includes(targetLower)) {
        // CoinGecko supports this fiat natively
        const rate = await getCryptoRate(coinId, targetLower);
        setBaseRate(rate);
      } else {
        // Fallback: 2-step conversion (Crypto -> USD -> Target Fiat)
        const cryptoUsdRate = await getCryptoRate(coinId, 'usd');
        if (!cryptoUsdRate) return setBaseRate(null);
        
        const fiatData = await getConversionRate('USD', toCurrency);
        if (fiatData && fiatData.rate !== undefined) {
          setBaseRate(cryptoUsdRate * fiatData.rate);
        } else {
          setBaseRate(null);
        }
      }
    };
    if (coinId && toCurrency) {
      fetchRate();
    }
  }, [coinId, toCurrency]);

  // Fetch Historical
  useEffect(() => {
    const fetchHistorical = async () => {
      setLoadingChart(true);
      const targetLower = toCurrency.toLowerCase();
      
      let data = null;
      if (CG_SUPPORTED_FIAT.includes(targetLower)) {
        data = await getCryptoHistorical(coinId, days, targetLower);
      } else {
        // Fallback 2-step historical approximation: grab Crypto->USD historical, and multiply by Live USD->Fiat
        const cryptoUsdHist = await getCryptoHistorical(coinId, days, 'usd');
        const fiatData = await getConversionRate('USD', toCurrency);
        
        if (cryptoUsdHist && fiatData && fiatData.rate !== undefined) {
          data = cryptoUsdHist.map(item => ({
            date: item.date,
            rate: item.rate * fiatData.rate
          }));
        }
      }
      
      setHistoricalData(data || null);
      setLoadingChart(false);
    };
    
    const timer = setTimeout(fetchHistorical, 500);
    return () => clearTimeout(timer);
  }, [coinId, toCurrency, days]);

  const finalPrice = baseRate ? (baseRate * quantity) : 0;
  const formattedPrice = finalPrice > 0 ? new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(finalPrice) : '0.00';

  const adjustedHistoricalData = historicalData ? historicalData.map(item => ({
    ...item,
    rate: item.rate * quantity
  })) : null;
  
  const selectedCoinName = coins.find(c => c.id === coinId)?.name || 'Bitcoin';

  return (
    <main className="main-content">
      <Link to="/" className="metals-banner glass-panel" style={{ justifyContent: 'flex-start' }}>
        <ArrowLeft className="metals-icon" size={24} />
        <span>Back to World Rates</span>
      </Link>

      <div className="converter-section glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#f59e0b' }}>
          <FaBitcoin size={28} className="rotate-bitcoin" />
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Cryptocurrency Live Rates</h2>
        </div>

        <div className="selectors-container" style={{ flexWrap: 'wrap' }}>
          
          <div className="input-group">
            <label className="input-label">Coin</label>
            <select 
              className="glass-input currency-select"
              value={coinId}
              onChange={(e) => setCoinId(e.target.value)}
            >
              {coins.map(c => (
                <option key={c.id} value={c.id}>{c.symbol.toUpperCase()} - {c.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Quantity</label>
            <div className="amount-input-container">
              <input 
                type="number" 
                className="glass-input amount-input"
                style={{ paddingLeft: '1rem' }}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                min="0"
                step="any"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Currency</label>
            <select 
              className="glass-input currency-select"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              {currencies.map((currency) => (
                <option key={currency.iso_code} value={currency.iso_code}>
                  {currency.iso_code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="result-container">
          <div className="result-value">
            {formattedPrice} <span style={{fontSize: '1.2rem', color: 'var(--accent-color)'}}>{toCurrency}</span>
          </div>
          <div className="result-rate">
            {baseRate ? `${quantity} ${selectedCoinName}` : 'Fetching rate...'}
          </div>
        </div>
      </div>

      <HistoricalChart 
        historicalData={adjustedHistoricalData}
        fromCurrency={selectedCoinName}
        toCurrency={toCurrency}
        days={days}
        setDays={setDays}
        loading={loadingChart}
        isDarkMode={isDarkMode}
      />
    </main>
  );
};

export default CryptoPage;
