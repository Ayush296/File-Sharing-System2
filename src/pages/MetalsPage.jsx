import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HistoricalChart from '../components/HistoricalChart';
import { getCurrencies, getConversionRate, getHistoricalRates } from '../services/api';
import { ArrowLeft, Diamond } from 'lucide-react';

const METALS = [
  { code: 'XAU', name: 'Gold' },
  { code: 'XAG', name: 'Silver' },
  { code: 'XPT', name: 'Platinum' }
];

const UNITS = [
  { value: 'gram', label: 'Grams', toTroyOz: 1 / 31.1034768 },
  { value: 'ounce', label: 'Ounces (Troy)', toTroyOz: 1 },
  { value: 'kg', label: 'Kilograms', toTroyOz: 1 / 0.0311034768 }
];

const MetalsPage = ({ isDarkMode }) => {
  const [metal, setMetal] = useState('XAU');
  const [currencies, setCurrencies] = useState([]);
  const [toCurrency, setToCurrency] = useState('USD');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('gram');
  
  const [baseRate, setBaseRate] = useState(null); // Price for 1 Troy Ounce
  
  const [historicalData, setHistoricalData] = useState(null);
  const [days, setDays] = useState(30);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    const fetchCurrencies = async () => {
      const data = await getCurrencies();
      if (Array.isArray(data)) {
        // Filter out the metals themselves from the target currency list
        const fiatCurrencies = data.filter(c => !['XAU', 'XAG', 'XPT'].includes(c.iso_code));
        const sortedData = [...fiatCurrencies].sort((a, b) => a.iso_code.localeCompare(b.iso_code));
        setCurrencies(sortedData);
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    const fetchRate = async () => {
      const data = await getConversionRate(metal, toCurrency);
      if (data && data.rate !== undefined) {
        setBaseRate(data.rate);
      } else {
        setBaseRate(null);
      }
    };
    fetchRate();
  }, [metal, toCurrency]);

  useEffect(() => {
    const fetchHistorical = async () => {
      setLoadingChart(true);
      const allTime = days === 'all';
      const data = await getHistoricalRates(metal, toCurrency, days, allTime);
      if (Array.isArray(data)) {
        setHistoricalData(data);
      } else {
        setHistoricalData(null);
      }
      setLoadingChart(false);
    };
    
    const timer = setTimeout(fetchHistorical, 500);
    return () => clearTimeout(timer);
  }, [metal, toCurrency, days]);

  // Calculate the final price based on quantity and unit
  const activeUnit = UNITS.find(u => u.value === unit);
  const unitMultiplier = activeUnit ? activeUnit.toTroyOz : 1;
  const finalPrice = baseRate ? (baseRate * unitMultiplier * quantity) : 0;
  
  const formattedPrice = finalPrice > 0 ? new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(finalPrice) : '0.00';

  // Adjust historical data to reflect the quantity and unit selected
  const adjustedHistoricalData = historicalData ? historicalData.map(item => ({
    ...item,
    rate: item.rate * unitMultiplier * quantity
  })) : null;

  return (
    <main className="main-content">
      <Link to="/" className="metals-banner glass-panel" style={{ justifyContent: 'flex-start' }}>
        <ArrowLeft className="metals-icon" size={24} />
        <span>Back to Currency Converter</span>
      </Link>

      <div className="converter-section glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
          <Diamond size={28} />
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Precious Metals Live Rates</h2>
        </div>

        <div className="selectors-container" style={{ flexWrap: 'wrap' }}>
          
          <div className="input-group">
            <label className="input-label">Metal</label>
            <select 
              className="glass-input currency-select"
              value={metal}
              onChange={(e) => setMetal(e.target.value)}
            >
              {METALS.map(m => (
                <option key={m.code} value={m.code}>{m.name}</option>
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
            <label className="input-label">Unit</label>
            <select 
              className="glass-input currency-select"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {UNITS.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
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
            {baseRate ? `${quantity} ${activeUnit.label} of ${METALS.find(m => m.code === metal)?.name}` : 'Fetching rate...'}
          </div>
        </div>
      </div>

      <HistoricalChart 
        historicalData={adjustedHistoricalData}
        fromCurrency={METALS.find(m => m.code === metal)?.name}
        toCurrency={toCurrency}
        days={days}
        setDays={setDays}
        loading={loadingChart}
        isDarkMode={isDarkMode}
      />
    </main>
  );
};

export default MetalsPage;
