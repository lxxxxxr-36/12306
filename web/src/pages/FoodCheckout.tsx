import React from 'react';
import './food.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCart, cartTotal, cartCount, clearCart } from '../data/food';

const FoodCheckout: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const merchantId = params.get('merchant') || '';
  const date = params.get('date') || '';
  const origin = params.get('origin') || '';
  const dest = params.get('dest') || '';

  const items = React.useMemo(() => getCart(merchantId), [merchantId]);
  const total = React.useMemo(() => cartTotal(merchantId), [merchantId, items]);
  const count = React.useMemo(() => cartCount(merchantId), [merchantId, items]);

  const handlePay = () => {
    clearCart(merchantId);
    navigate('/', { replace: true });
  };

  return (
    <div className="food-page">
      <h2>餐饮结算</h2>
      <div style={{marginBottom:8, color:'#666'}}>行程：{origin} → {dest} · 日期：{date}</div>
      {items.length === 0 ? (
        <div className="hint">购物车为空，请返回商家继续选购。</div>
      ) : (
        <div className="checkout-list">
          {items.map(i => (
            <div key={i.productId} className="checkout-item">
              <div className="ci-name">{i.name}</div>
              <div className="ci-qty">x{i.qty}</div>
              <div className="ci-price">￥{(i.price * i.qty).toFixed(2)}</div>
            </div>
          ))}
          <div className="checkout-summary">合计：￥{total.toFixed(2)}（{count} 件）</div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={() => navigate(-1)}>返回</button>
            <button className="primary" onClick={handlePay}>模拟结算成功</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodCheckout;

