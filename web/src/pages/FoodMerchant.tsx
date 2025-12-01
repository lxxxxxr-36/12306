import React from 'react';
import './food.css';
import { useLocation, useParams } from 'react-router-dom';
import { getMerchantById, getCart, addToCart, cartTotal, cartCount, clearCart } from '../data/food';

const FoodMerchant: React.FC = () => {
  const { id } = useParams();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const date = params.get('date') || '';
  const origin = params.get('origin') || '';
  const dest = params.get('dest') || '';

  const merchant = React.useMemo(() => id ? getMerchantById(id) : undefined, [id]);
  const [cartItems, setCartItems] = React.useState(() => (id ? getCart(id) : []));
  React.useEffect(() => { if (id) setCartItems(getCart(id)); }, [id]);

  const qtyOf = (pid: string) => (cartItems.find(i => i.productId === pid)?.qty || 0);
  const inc = (pid: string) => { if (!id) return; const list = addToCart(id, pid, 1); setCartItems(list.filter(i=>i.merchantId===id)); };
  const dec = (pid: string) => { if (!id) return; const list = addToCart(id, pid, -1); setCartItems(list.filter(i=>i.merchantId===id)); };
  const totalPrice = id ? cartTotal(id) : 0;
  const totalCount = id ? cartCount(id) : 0;

  if (!merchant) {
    return (
      <div className="food-page">
        <div className="hint">未找到商家</div>
      </div>
    );
  }

  const deadlineOrder = `${date} 09:05`;
  const deadlineRefund = `${date} 08:37`;

  return (
    <div className="food-page">
      <div className="merchant-header">
        <div className="merchant-header-main">
          <div className="merchant-logo">{merchant.name.slice(0,1)}</div>
          <div className="merchant-info">
            <div className="merchant-title">{merchant.name}</div>
            <div className="merchant-sub">{origin} → {dest}</div>
            <div className="merchant-sub">起送费 ￥{(merchant.startFee ?? 0).toFixed(0)} 配送费 ￥{(merchant.deliveryFee ?? 0).toFixed(0)}</div>
            <div className="merchant-sub">下单截止 {deadlineOrder} 退单截止 {deadlineRefund}</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">商品</div>
        <div className="product-grid">
          {merchant.products.map(p => (
            <div key={p.id} className="product-card">
              <div className="product-name">{p.name}</div>
              <div className="product-price">￥{p.price.toFixed(2)}</div>
              <div className="product-actions">
                <button className="secondary" onClick={() => dec(p.id)}>-</button>
                <span className="qty">{qtyOf(p.id)}</span>
                <button className="primary" onClick={() => inc(p.id)}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-bar">
          <div>已选 {totalCount} 件 · 合计 ￥{totalPrice.toFixed(2)}</div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={() => { if (!id) return; clearCart(id); setCartItems([]); }}>清空</button>
            <button className="primary" disabled={totalCount<=0} onClick={() => {
              const back = new URLSearchParams({ date, origin, dest, merchant: id! }).toString();
              window.location.href = `/food/checkout?${back}`;
            }}>去结算</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodMerchant;
