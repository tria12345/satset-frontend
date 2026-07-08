import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function NewOrder() {
  const navigate = useNavigate();
  const [distance, setDistance] = useState('');
  const [expenses, setExpenses] = useState('');
  const [settings, setSettings] = useState(null);
  const [priceCharged, setPriceCharged] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  useEffect(() => {
    axios.get('http://localhost:5000/api/settings')
      .then(res => setSettings(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (settings && distance !== '') {
      const distVal = parseFloat(distance) || 0;
      const expVal = parseFloat(expenses) || 0;
      
      let calculatedPrice = parseFloat(settings.base_price) + (distVal * parseFloat(settings.price_per_km));
      if (calculatedPrice < parseFloat(settings.min_price)) {
        calculatedPrice = parseFloat(settings.min_price);
      }
      
      setPriceCharged(calculatedPrice);
      setNetProfit(calculatedPrice - expVal);
    } else {
      setPriceCharged(0);
      setNetProfit(0);
    }
  }, [distance, expenses, settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!distance || priceCharged <= 0) return;

    try {
      await axios.post('http://localhost:5000/api/orders', {
        distance: parseFloat(distance),
        price_charged: priceCharged,
        expenses: parseFloat(expenses) || 0,
        net_profit: netProfit
      });
      navigate('/history');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan order');
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div>
      <div className="card">
        <div className="card-title" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Input Order Baru</div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Jarak Tempuh (km)</label>
            <input 
              type="number" 
              step="0.1"
              className="form-input" 
              placeholder="Contoh: 5.5" 
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Modal / Pengeluaran Tambahan (Rp)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="Bensin, Parkir, dll (opsional)" 
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
            />
          </div>

          <div style={{ backgroundColor: 'rgba(0, 122, 255, 0.05)', padding: 16, borderRadius: 12, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Harga Tagihan Customer</span>
              <span style={{ fontWeight: 600 }}>{formatRupiah(priceCharged)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Untung Bersih (Estimasi)</span>
              <span className="text-success" style={{ fontWeight: 700 }}>{formatRupiah(netProfit)}</span>
            </div>
          </div>

          <button type="submit" className="btn" disabled={!settings}>
            Simpan Order
          </button>
        </form>
      </div>
    </div>
  );
}
