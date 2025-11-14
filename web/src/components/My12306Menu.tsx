import React from 'react';
import { useNavigate } from 'react-router-dom';

const items = [
  { label: '火车票订单', path: '/my/orders/train' },
  { label: '候补订单', path: '/my/orders/waitlist' },
  { label: '计次·定期票订单', path: '/my/orders/timescard' },
  { label: '约号订单', path: '/my/orders/appointment' },
  { label: '雪具快运订单', path: '/my/orders/ski' },
  { label: '电子发票', path: '/my/orders/invoice' },
  { label: '本人车票', path: '/my/ticket' },
  { label: '我的餐饮·特产', path: '/my/orders/food' },
  { label: '我的保险', path: '/my/orders/insurance' },
  { label: '我的会员', path: '/member' },
  { label: '查看个人信息', path: '/my/profile/view' },
  { label: '账户安全', path: '/my/profile/security' },
  { label: '乘车人', path: '/my/common/passengers' },
  { label: '地址管理', path: '/my/common/addresses' },
  { label: '温馨服务查询', path: '/my/service/query' },
];

const My12306Menu: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="my12306">
      <span className="my-trigger" onClick={() => navigate('/my')}>我的12306</span>
      <div className="my-dropdown">
        {items.map((it) => (
          <div key={it.label} className="my-item" onMouseDown={(e) => e.preventDefault()} onClick={() => navigate(it.path)}>
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default My12306Menu;