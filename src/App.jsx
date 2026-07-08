import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings } from 'lucide-react';
import './App.css';

function App() {
  const [settings, setSettings] = useState(null);
  const [orders, setOrders] = useState([]);
  
  // Form states
  const [distance, setDistance] = useState('');
  const [expenses, setExpenses] = useState('');
  const [notes, setNotes] = useState('');
  const [overridePrice, setOverridePrice] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  // Settings Modal state
  const [showSettings, setShowSettings] = useState(false);
  const [editSettings, setEditSettings] = useState({
    base_price: 5000, price_per_km: 2500, min_price: 10000, daily_expense: 0, daily_target: 100000
  });

  // Filter state (0: Hari ini, 1: 7 Hari, 2: Bulan ini, 3: Semua)
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resSet, resOrd] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`)
      ]);
      setSettings(resSet.data);
      setEditSettings(resSet.data);
      setOrders(resOrd.data.orders);
    } catch (err) {
      console.error(err);
    }
  };

  // Real-time price calculation
  useEffect(() => {
    if (settings && distance !== '') {
      const distVal = parseFloat(distance) || 0;
      let price = parseFloat(settings.base_price) + (distVal * parseFloat(settings.price_per_km));
      if (price < parseFloat(settings.min_price)) price = parseFloat(settings.min_price);
      setCalculatedPrice(price);
    } else {
      setCalculatedPrice(0);
    }
  }, [distance, settings]);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    const finalPrice = overridePrice !== '' ? parseFloat(overridePrice) : calculatedPrice;
    if (finalPrice <= 0) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, {
        distance: parseFloat(distance || 0),
        price_charged: finalPrice,
        expenses: parseFloat(expenses || 0),
        net_profit: finalPrice - parseFloat(expenses || 0),
        notes: notes
      });
      // Reset form
      setDistance(''); setExpenses(''); setNotes(''); setOverridePrice('');
      fetchData(); // Refresh data
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat order');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings`, editSettings);
      setShowSettings(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengaturan');
    }
  };

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  
  // Data Aggregation
  const todayStr = new Date().toISOString().split('T')[0];
  const filterDate = new Date();
  if (tab === 1) filterDate.setDate(filterDate.getDate() - 7);
  else if (tab === 2) filterDate.setMonth(filterDate.getMonth() - 1);

  let filteredOrders = orders;
  if (tab !== 3) {
    filteredOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      if (tab === 0) return d.toISOString().split('T')[0] === todayStr;
      return d >= filterDate;
    });
  }

  const activeDays = new Set(filteredOrders.map(o => new Date(o.created_at).toISOString().split('T')[0])).size;
  const totalPemasukan = filteredOrders.reduce((sum, o) => sum + parseFloat(o.price_charged), 0);
  const totalPengeluaran = filteredOrders.reduce((sum, o) => sum + parseFloat(o.expenses), 0);
  // Subtract daily_expense for each active day
  const dailyExpTotal = settings ? parseFloat(settings.daily_expense) * activeDays : 0;
  const untungBersih = totalPemasukan - totalPengeluaran - dailyExpTotal;

  // Today specific (for the top card)
  const todayOrders = orders.filter(o => new Date(o.created_at).toISOString().split('T')[0] === todayStr);
  const todayPemasukan = todayOrders.reduce((sum, o) => sum + parseFloat(o.price_charged), 0);
  const todayPengeluaran = todayOrders.reduce((sum, o) => sum + parseFloat(o.expenses), 0);
  const todayUntung = todayPemasukan - todayPengeluaran - (settings ? parseFloat(settings.daily_expense) : 0);
  const target = settings ? parseFloat(settings.daily_target) : 100000;
  const progressPct = Math.min(100, Math.max(0, (todayUntung / target) * 100));

  const chartData = [10, 30, 20, 50, 40, 80, 60]; // Dummy chart for UI representation matching the screenshot

  return (
    <div className="app-container">
      {/* Header / Target Card */}
      <div className="card dashboard-header" style={{ position: 'relative' }}>
        <button onClick={() => setShowSettings(true)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <Settings size={24} />
        </button>
        <div className="progress-circle" style={{ borderColor: progressPct > 0 ? 'var(--primary-color)' : 'var(--border-color)' }}>
          {progressPct > 0 ? `${Math.round(progressPct)}%` : '-'}
        </div>
        <div className="header-text">
          <div className="subtitle">Untung hari ini</div>
          <div className="amount">{formatRupiah(todayUntung > 0 ? todayUntung : 0)}</div>
          <div className="target">Target harian: {formatRupiah(target)}</div>
        </div>
      </div>

      {/* 3 Stats Today */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="value">{todayOrders.length}</div>
          <div className="label">Order hari ini</div>
        </div>
        <div className="stat-box">
          <div className="value">{formatRupiah(todayPemasukan)}</div>
          <div className="label">Pemasukan</div>
        </div>
        <div className="stat-box">
          <div className="value">{formatRupiah(todayUntung)}</div>
          <div className="label">Untung bersih</div>
        </div>
      </div>

      {/* Form New Order */}
      <div className="card">
        <div className="card-title">Catat order baru</div>
        <form onSubmit={handleSubmitOrder}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Jarak (km)</label>
              <input type="number" step="0.1" className="form-input" placeholder="0" value={distance} onChange={e => setDistance(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Pengeluaran (Rp)</label>
              <input type="number" className="form-input" placeholder="0" value={expenses} onChange={e => setExpenses(e.target.value)} />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Catatan (opsional)</label>
            <input type="text" className="form-input" placeholder="Antar dokumen ke Jl. Merdeka" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Harga ke customer</label>
            <div className="price-display">
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Otomatis dari jarak</span>
              <span>{formatRupiah(calculatedPrice)}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Override harga (opsional)</label>
            <input type="number" className="form-input" placeholder="Isi jika harga disepakati berbeda" value={overridePrice} onChange={e => setOverridePrice(e.target.value)} />
          </div>

          <button type="submit" className="btn">Sat-Set, catat order!</button>
        </form>
      </div>

      {/* Rekap */}
      <div className="card">
        <div className="card-title">Rekap</div>
        <div className="tabs">
          <button className={`tab ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>Hari ini</button>
          <button className={`tab ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>7 hari</button>
          <button className={`tab ${tab === 2 ? 'active' : ''}`} onClick={() => setTab(2)}>Bulan ini</button>
          <button className={`tab ${tab === 3 ? 'active' : ''}`} onClick={() => setTab(3)}>Semua</button>
        </div>
        
        <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="stat-box" style={{ textAlign: 'left' }}>
            <div className="label" style={{ marginBottom: 4 }}>Total order</div>
            <div className="value">{filteredOrders.length}</div>
          </div>
          <div className="stat-box" style={{ textAlign: 'left' }}>
            <div className="label" style={{ marginBottom: 4 }}>Total pemasukan</div>
            <div className="value">{formatRupiah(totalPemasukan)}</div>
          </div>
          <div className="stat-box" style={{ textAlign: 'left' }}>
            <div className="label" style={{ marginBottom: 4 }}>Total pengeluaran (termasuk harian)</div>
            <div className="value">{formatRupiah(totalPengeluaran + dailyExpTotal)}</div>
          </div>
          <div className="stat-box" style={{ textAlign: 'left' }}>
            <div className="label" style={{ marginBottom: 4 }}>Untung bersih</div>
            <div className="value text-success">{formatRupiah(untungBersih)}</div>
          </div>
        </div>

        {/* Simple Chart Representation */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Trend Untung</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 60, gap: 8 }}>
            {chartData.map((val, i) => (
              <div key={i} style={{ flex: 1, backgroundColor: 'var(--primary-color)', height: `${val}%`, borderRadius: '4px 4px 0 0', opacity: i === 6 ? 1 : 0.4 }}></div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: 'var(--text-secondary)', fontSize: 10 }}>
            <span>H-6</span><span>H-5</span><span>H-4</span><span>H-3</span><span>H-2</span><span>H-1</span><span>H0</span>
          </div>
        </div>
      </div>

      {/* Riwayat Order */}
      <div className="card">
        <div className="card-title">Riwayat order</div>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: 14 }}>
            Belum ada order yang dicatat.<br/>Mulai catat order pertama kamu di atas.
          </div>
        ) : (
          <div>
            {filteredOrders.map(o => (
              <div key={o.id} className="history-item">
                <div className="history-date">
                  {new Date(o.created_at).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {o.notes && ` • ${o.notes}`}
                </div>
                <div className="history-flex">
                  <div className="history-title">Jarak {parseFloat(o.distance)} km</div>
                  <div className="history-price">{formatRupiah(o.price_charged)}</div>
                </div>
                {parseFloat(o.expenses) > 0 && (
                  <div className="history-notes">Pengeluaran: -{formatRupiah(o.expenses)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn btn-outline">Hapus semua data</button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="card-title">Pengaturan</div>
            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">Tarif Dasar (Rp)</label>
                <input type="number" className="form-input" value={editSettings.base_price} onChange={e => setEditSettings({...editSettings, base_price: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Tarif per Km (Rp)</label>
                <input type="number" className="form-input" value={editSettings.price_per_km} onChange={e => setEditSettings({...editSettings, price_per_km: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Tarif Minimum (Rp)</label>
                <input type="number" className="form-input" value={editSettings.min_price} onChange={e => setEditSettings({...editSettings, min_price: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Pengeluaran Harian (Rp)</label>
                <input type="number" className="form-input" value={editSettings.daily_expense} onChange={e => setEditSettings({...editSettings, daily_expense: e.target.value})} />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Otomatis memotong untung bersih harian (misal bensin).</div>
              </div>
              <div className="form-group">
                <label className="form-label">Target Harian (Rp)</label>
                <input type="number" className="form-input" value={editSettings.daily_target} onChange={e => setEditSettings({...editSettings, daily_target: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-outline" style={{ marginTop: 0, flex: 1 }} onClick={() => setShowSettings(false)}>Batal</button>
                <button type="submit" className="btn" style={{ marginTop: 0, flex: 1 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
