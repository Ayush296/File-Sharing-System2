const API_URL = 'https://api.frankfurter.dev/v2';

export const getCurrencies = async () => {
  try {
    const response = await fetch(`${API_URL}/currencies`);
    if (!response.ok) throw new Error('Failed to fetch currencies');
    return await response.json();
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return {};
  }
};

export const getConversionRate = async (from, to) => {
  try {
    const response = await fetch(`${API_URL}/rate/${from}/${to}`);
    if (!response.ok) throw new Error('Failed to fetch conversion rate');
    return await response.json();
  } catch (error) {
    console.error('Error fetching rate:', error);
    return null;
  }
};

export const getHistoricalRates = async (from, to, days = 30, allTime = false) => {
  try {
    const endDate = new Date();
    let startDateStr = '';
    let groupParam = '';

    if (allTime) {
      startDateStr = '1999-01-04'; // Frankfurter data starts here
      groupParam = '&group=month';
    } else {
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      startDateStr = startDate.toISOString().split('T')[0];
    }
    
    // API v2 time series uses ?from=YYYY-MM-DD
    const response = await fetch(`${API_URL}/rates?base=${from}&quotes=${to}&from=${startDateStr}${groupParam}`);
    if (!response.ok) throw new Error('Failed to fetch historical rates');
    return await response.json();
  } catch (error) {
    console.error('Error fetching historical rates:', error);
    return null;
  }
};

// CoinGecko API integration
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const getCryptoCoins = async () => {
  try {
    const response = await fetch(`${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`);
    if (!response.ok) throw new Error('Failed to fetch crypto coins');
    return await response.json();
  } catch (error) {
    console.error('Error fetching crypto coins:', error);
    return [];
  }
};

export const getCryptoRate = async (coinId, vsCurrency = 'usd') => {
  try {
    const response = await fetch(`${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}`);
    if (!response.ok) throw new Error('Failed to fetch crypto rate');
    const data = await response.json();
    return data[coinId]?.[vsCurrency] || null;
  } catch (error) {
    console.error('Error fetching crypto rate:', error);
    return null;
  }
};

export const getCryptoHistorical = async (coinId, days, vsCurrency = 'usd') => {
  try {
    let queryDays = days === 'all' ? 'max' : days;
    const response = await fetch(`${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${queryDays}`);
    if (!response.ok) throw new Error('Failed to fetch crypto historical');
    const data = await response.json();
    
    // Map CoinGecko structure to our standard app structure
    // CoinGecko: prices: [[timestamp, price], ...]
    if (data && data.prices) {
      return data.prices.map(item => {
        const dateObj = new Date(item[0]);
        return {
          date: dateObj.toISOString().split('T')[0],
          rate: item[1]
        };
      });
    }
    return null;
  } catch (error) {
    console.error('Error fetching crypto historical:', error);
    return null;
  }
};
