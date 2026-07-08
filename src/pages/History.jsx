import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function History() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders');
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="card">
        <div className="card-title" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Riwayat Transaksi</div>
        
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
            Belum ada data order.
          </div>
        ) : (
          <div>
            {orders.map(order => (
              <div key={order.id} className="history-item">
                <div className="history-item-left">
                  <div className="date">{formatDate(order.created_at)}</div>
                  <div className="desc">Jarak: {parseFloat(order.distance)} km</div>
                </div>
                <div className="history-item-right">
                  <div className="price">{formatRupiah(order.price_charged)}</div>
                  <div className="profit">Untung: <span className="text-success">{formatRupiah(order.net_profit)}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
