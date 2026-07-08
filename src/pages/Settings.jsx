import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Settings() {
  const [basePrice, setBasePrice] = useState('');
  const [pricePerKm, setPricePerKm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/settings');
      setBasePrice(res.data.base_price);
      setPricePerKm(res.data.price_per_km);
      setMinPrice(res.data.min_price);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.put('http://localhost:5000/api/settings', {
        base_price: parseFloat(basePrice),
        price_per_km: parseFloat(pricePerKm),
        min_price: parseFloat(minPrice)
      });
      alert('Pengaturan berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Pengaturan Tarif Dasar</div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tarif Dasar / Penjemputan (Rp)</label>
            <input 
              type="number" 
              className="form-input" 
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tarif per Kilometer (Rp/km)</label>
            <input 
              type="number" 
              className="form-input" 
              value={pricePerKm}
              onChange={(e) => setPricePerKm(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tarif Minimum Order (Rp)</label>
            <input 
              type="number" 
              className="form-input" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              required
            />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Jika total perhitungan di bawah tarif ini, maka tarif minimum yang akan digunakan.
            </div>
          </div>

          <button type="submit" className="btn" disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </form>
      </div>
    </div>
  );
}
