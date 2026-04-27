import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Loader2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const HistoricalChart = ({ historicalData, fromCurrency, toCurrency, days, setDays, loading, isDarkMode }) => {
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const tooltipBg = isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const tooltipText = isDarkMode ? '#e0e7ff' : '#475569';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: textColor,
        bodyColor: tooltipText,
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `1 ${fromCurrency} = ${context.parsed.y} ${toCurrency}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: gridColor,
        },
        ticks: {
          color: isDarkMode ? '#94a3b8' : '#475569',
          maxTicksLimit: 7,
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: isDarkMode ? '#94a3b8' : '#475569',
        },
      },
    },
  };

  const data = {
    labels: Array.isArray(historicalData) ? historicalData.map(item => item.date) : [],
    datasets: [
      {
        fill: true,
        label: `${fromCurrency} to ${toCurrency}`,
        data: Array.isArray(historicalData) ? historicalData.map(item => item.rate) : [],
        borderColor: '#6366f1',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
          return gradient;
        },
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6366f1',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  return (
    <div className="chart-section glass-panel">
      <div className="chart-header">
        <div className="chart-title">
          Historical Rate ({fromCurrency} to {toCurrency})
        </div>
        <div className="chart-controls">
          <button 
            className={`chart-btn ${days === 7 ? 'active' : ''}`}
            onClick={() => setDays(7)}
          >
            1W
          </button>
          <button 
            className={`chart-btn ${days === 30 ? 'active' : ''}`}
            onClick={() => setDays(30)}
          >
            1M
          </button>
          <button 
            className={`chart-btn ${days === 180 ? 'active' : ''}`}
            onClick={() => setDays(180)}
          >
            6M
          </button>
          <button 
            className={`chart-btn ${days === 365 ? 'active' : ''}`}
            onClick={() => setDays(365)}
          >
            1Y
          </button>
          <button 
            className={`chart-btn ${days === 'all' ? 'active' : ''}`}
            onClick={() => setDays('all')}
          >
            All
          </button>
        </div>
      </div>
      
      <div className="chart-container">
        {loading ? (
          <div className="loading-spinner">
            <Loader2 size={32} />
          </div>
        ) : historicalData ? (
          <Line options={options} data={data} />
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4rem' }}>
            Historical data not available
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalChart;
