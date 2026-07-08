import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const [stats, setStats] = useState({ todayIncome: 0, todayNetProfit: 0, totalIncome: 0, totalNetProfit: 0 });
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const orderRes = await axios.get('http://localhost:5000/api/orders');
      setStats(orderRes.data.stats);

      const chartRes = await axios.get('http://localhost:5000/api/chart');
      const data = chartRes.data;
      
      setChartData({
        labels: data.map(d => new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
        datasets: [
          {
            label: 'Pendapatan',
            data: data.map(d => parseFloat(d.income)),
            borderColor: '#007AFF',
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Keuntungan Bersih',
            data: data.map(d => parseFloat(d.net_profit)),
            borderColor: '#34C759',
            backgroundColor: 'rgba(52, 199, 89, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Hari Ini (Pendapatan / Untung)</div>
        <div className="card-value text-primary">{formatRupiah(stats.todayIncome)}</div>
        <div className="text-success" style={{ fontWeight: 600, marginTop: 4 }}>+ {formatRupiah(stats.todayNetProfit)}</div>
      </div>

      <div className="card">
        <div className="card-title">Total Keseluruhan</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pendapatan</div>
            <div style={{ fontWeight: 600 }}>{formatRupiah(stats.totalIncome)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Untung Bersih</div>
            <div className="text-success" style={{ fontWeight: 600 }}>{formatRupiah(stats.totalNetProfit)}</div>
          </div>
        </div>
      </div>

      {chartData && (
        <div className="card">
          <div className="card-title mb-4">Grafik 30 Hari Terakhir</div>
          <Line 
            data={chartData} 
            options={{ 
              responsive: true,
              plugins: { legend: { position: 'bottom' } },
              scales: { y: { beginAtZero: true } }
            }} 
          />
        </div>
      )}
    </div>
  );
}
