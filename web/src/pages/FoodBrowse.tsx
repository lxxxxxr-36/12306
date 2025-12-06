import React from 'react';
import './food.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTrainProducts, getMerchants } from '../data/food';
import type { Merchant } from '../data/food';

const FoodBrowse: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const date = params.get('date') || '';
  const train = params.get('train') || '';
  const origin = params.get('origin') || '';
  const dest = params.get('dest') || '';
  const [onlyReservable, setOnlyReservable] = React.useState(false);

  const trainProducts = React.useMemo(() => getTrainProducts(train), [train]);
  const originMerchants = React.useMemo(() => getMerchants(origin), [origin]);
  const destMerchants = React.useMemo(() => getMerchants(dest), [dest]);

  const filterMerchants = (list: Merchant[]) => {
    return list.filter(m => (onlyReservable ? m.status === 'open' : true));
  };

  const goMerchant = (m: Merchant) => {
    if (m.status !== 'open') return;
    const qs = new URLSearchParams({ date, train, origin, dest }).toString();
    navigate(`/food/merchant/${m.id}?${qs}`);
  };

  return (
    <div className="food-page">
      <div className="food-topbar">
        <div className="topbar-fields">
          <input type="date" value={date} readOnly />
          <input value={train} readOnly />
          <input value={origin} readOnly />
          <input value={dest} readOnly />
          <button className="primary" onClick={() => navigate(`/food?date=${encodeURIComponent(date)}&train=${encodeURIComponent(train)}&origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}`)}>查询</button>
        </div>
        <div className="topbar-filters">
          <label className="chip"><input type="checkbox" checked={onlyReservable} onChange={e=>setOnlyReservable(e.target.checked)} /> 显示可预订商家</label>
        </div>
      </div>

      <div className="section">
        <div className="section-title">列车自营商品</div>
        <div className="product-grid">
          {trainProducts.map(p => (
            <div key={p.id} className="product-card">
              <div className="product-name">{p.name}</div>
              <div className="product-tag">{p.tag || ''}</div>
              <div className="product-price">￥{p.price.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">{origin}（乘车站）</div>
        <div className="merchant-grid">
          {filterMerchants(originMerchants).map(m => (
            <div key={m.id} className={"merchant-card" + (m.status === 'rest' ? ' resting' : '')} onClick={() => goMerchant(m)} title={m.status === 'rest' ? '休息中' : '进入商家'}>
              <div className="merchant-name">{m.name}</div>
              <div className="merchant-meta">起送费￥{(m.startFee ?? 0).toFixed(0)} 配送费￥{(m.deliveryFee ?? 0).toFixed(0)}</div>
              <div className="merchant-status">{m.status === 'open' ? '正常' : '休息中'}</div>
            </div>
          ))}
          {filterMerchants(originMerchants).length === 0 && (
            <div className="hint">暂无符合条件的商家</div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-title">{dest}（到达站）</div>
        <div className="merchant-grid">
          {filterMerchants(destMerchants).map(m => (
            <div key={m.id} className={"merchant-card" + (m.status === 'rest' ? ' resting' : '')} onClick={() => goMerchant(m)} title={m.status === 'rest' ? '休息中' : '进入商家'}>
              <div className="merchant-name">{m.name}</div>
              <div className="merchant-meta">起送费￥{(m.startFee ?? 0).toFixed(0)} 配送费￥{(m.deliveryFee ?? 0).toFixed(0)}</div>
              <div className="merchant-status">{m.status === 'open' ? '正常' : '休息中'}</div>
            </div>
          ))}
          {filterMerchants(destMerchants).length === 0 && (
            <div className="hint">暂无符合条件的商家</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodBrowse;
