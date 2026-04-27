import React from 'react';
import { ArrowRightLeft } from 'lucide-react';

const getFlagEmoji = (currencyCode) => {
  if (!currencyCode || currencyCode.length < 2) return '🌐';
  const specialCases = {
    'EUR': 'EU',
    'ANG': 'CW',
    'XAF': 'CM',
    'XOF': 'SN',
    'XCD': 'AG',
    'XPF': 'PF',
    'BTC': '₿',
  };
  const countryCode = specialCases[currencyCode] || currencyCode.substring(0, 2);
  if (countryCode === '₿') return '₿';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🌐';
  }
};

const CurrencyConverter = ({ 
  currencies, 
  fromCurrency, 
  toCurrency, 
  setFromCurrency, 
  setToCurrency,
  amount,
  setAmount,
  conversionRate,
  onSwap
}) => {
  const convertedValue = conversionRate ? (amount * conversionRate) : 0;
  const convertedAmount = convertedValue > 0 ? new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(convertedValue) : '0.00';

  return (
    <div className="converter-section glass-panel">
      <div className="selectors-container">
        
        <div className="input-group">
          <label className="input-label">Amount</label>
          <div className="amount-input-container">
            <span className="currency-symbol">$</span>
            <input 
              type="number" 
              className="glass-input amount-input"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">From</label>
          <select 
            className="glass-input currency-select"
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
          >
            {Array.isArray(currencies) && currencies.map((currency) => (
              <option key={currency.iso_code} value={currency.iso_code}>
                {getFlagEmoji(currency.iso_code)} {currency.iso_code} - {currency.name}
              </option>
            ))}
          </select>
        </div>

        <button className="swap-button" onClick={onSwap} aria-label="Swap currencies">
          <ArrowRightLeft size={20} />
        </button>

        <div className="input-group">
          <label className="input-label">To</label>
          <select 
            className="glass-input currency-select"
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
          >
            {Array.isArray(currencies) && currencies.map((currency) => (
              <option key={currency.iso_code} value={currency.iso_code}>
                {getFlagEmoji(currency.iso_code)} {currency.iso_code} - {currency.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      <div className="result-container">
        <div className="result-value">
          {convertedAmount} <span style={{fontSize: '1.2rem', color: 'var(--accent-color)'}}>{toCurrency}</span>
        </div>
        <div className="result-rate">
          {conversionRate ? `1 ${fromCurrency} = ${conversionRate} ${toCurrency}` : 'Fetching rate...'}
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
