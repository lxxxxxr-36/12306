import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Order } from '../types/order';
import { getOrder, payOrder, cancelOrder, refundOrder } from '../services/orders';
import { getTrainByCode } from '../services/trains';

// 组合本地日期+时间为毫秒时间戳（支持+1跨天）
function combineLocalDateTimeMs(dateStr: string, timeStr: string): number {
  if (!dateStr || !timeStr) return 0;
  const [y, m, d] = dateStr.split('-').map(Number);
  const nextDay = timeStr.includes('+1');
  const [hh, mm] = timeStr.replace('+1','').split(':').map(Number);
  const dt = new Date(y, (m-1), d, hh, mm, 0, 0);
  if (nextDay) dt.setDate(dt.getDate() + 1);
  return dt.getTime();
}

const ConfirmOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = React.useState<Order | undefined>(undefined);

  React.useEffect(()=>{
    if (id) setOrder(getOrder(id));
    const handleOrdersChange = () => { if (id) setOrder(getOrder(id)); };
    const handleStorage = (e: StorageEvent) => { if (e.key === 'orders') handleOrdersChange(); };
    window.addEventListener('orderschange', handleOrdersChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('orderschange', handleOrdersChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [id]);

  if (!order) {
    return (
      <div style={{maxWidth:800, margin:'24px auto', padding:'0 16px'}}>
        <h2>确认订单</h2>
        <div style={{background:'#fffbe6', border:'1px solid #ffe58f', padding:16, borderRadius:8}}>未找到订单或订单已被删除。</div>
      </div>
    );
  }

  const handlePay = () => {
    const paid = payOrder(order.id);
    if (paid) {
      navigate('/orders', { replace: true });
    }
  };
  const handleCancel = () => {
    cancelOrder(order.id);
    navigate('/orders', { replace: true });
  };
  const train = getTrainByCode(order.item.trainCode);
  const departMs = train ? combineLocalDateTimeMs(order.date, train.depart) : 0;
  const canRefundNow = departMs - Date.now() >= 60 * 60 * 1000;
  const handleRefund = () => {
    if (!canRefundNow) { alert('距发车不足1小时，无法退票'); return; }
    const res = refundOrder(order.id);
    if (!res) { alert('退票失败：距发车不足1小时或订单状态不支持'); }
  };

  return (
    <div style={{maxWidth:800, margin:'24px auto', padding:'0 16px'}}>
      <h2>确认订单</h2>
      <div style={{border:'1px solid #eee', borderRadius:8, padding:16}}>
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:18, fontWeight:600}}>{order.origin} → {order.dest}</div>
            <div style={{color:'#666'}}>出发日期：{order.date}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div>订单号：{order.id}</div>
            <div>状态：{labelStatus(order.status)}</div>
          </div>
        </div>
        <hr style={{border:'none', borderTop:'1px dashed #eaeaea', margin:'12px 0'}} />
        <div>
          <div>车次：{order.item.trainCode}</div>
          <div>席别：{labelSeat(order.item.seatType)}</div>
          {order.item.carriage && order.item.seatNo && (
            <div>座位：{order.item.carriage}车厢 {order.item.seatNo}</div>
          )}
          <div style={{marginTop:8, fontSize:18}}><b>票价：￥{order.item.price}</b></div>
        </div>
      </div>

      <div style={{marginTop:16, display:'flex', gap:8}}>
        {order.status === 'pending' ? (
          <>
            <button className="primary" onClick={handlePay}>立即支付</button>
            <button onClick={handleCancel}>取消订单</button>
            <button onClick={()=>navigate(-1)}>返回</button>
          </>
        ) : order.status === 'paid' ? (
          <>
-            <button onClick={handleRefund} disabled={!canRefundNow}>申请退票</button>
+            <button onClick={handleRefund} disabled={!canRefundNow} title={!canRefundNow ? '距发车不足1小时，已截止退票' : undefined}>{!canRefundNow ? '已截止' : '申请退票'}</button>
             <button onClick={()=>navigate('/orders')}>返回订单中心</button>
          </>
        ) : order.status === 'refunding' ? (
          <>
            <button disabled>退票处理中...</button>
            <button onClick={()=>navigate('/orders')}>返回订单中心</button>
          </>
        ) : (
          <>
            <button onClick={()=>navigate('/orders')}>返回订单中心</button>
          </>
        )}
      </div>
    </div>
  );
}

function labelStatus(s: Order['status']){
  switch(s){
    case 'pending': return '待支付';
    case 'paid': return '已支付';
    case 'cancelled': return '已取消';
    case 'refunding': return '退票中';
    default: return s;
  }
}
function labelSeat(s: Order['item']['seatType']){
  switch(s){
    case 'sw': return '商务座';
    case 'ydz': return '一等座';
    case 'edz': return '二等座';
    case 'wz': return '无座';
    default: return s;
  }
}

export default ConfirmOrder;