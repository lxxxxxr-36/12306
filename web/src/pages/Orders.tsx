import React from 'react';
import type { Order } from '../types/order';
import { getOrders, cancelOrder, refundOrder, changeOrderDest, rescheduleOrderDate } from '../services/orders';
import { useNavigate, useLocation } from 'react-router-dom';
import { popularCities } from '../constants/cities';

const Orders: React.FC = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const navigate = useNavigate();
  const { search } = useLocation();
  const op = React.useMemo(() => new URLSearchParams(search).get('op'), [search]);
  React.useEffect(()=>{
    setOrders(getOrders());
    const handleOrdersChange = () => setOrders(getOrders());
    const handleStorage = (e: StorageEvent) => { if (e.key === 'orders') setOrders(getOrders()); };
    window.addEventListener('orderschange', handleOrdersChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('orderschange', handleOrdersChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const todayLocalISO = (() => { const d = new Date(); d.setHours(0,0,0,0); const off = d.getTimezoneOffset()*60000; return new Date(d.getTime()-off).toISOString().split('T')[0]; })();
  const [editingDestOrderId, setEditingDestOrderId] = React.useState<string|null>(null);
  const [newDest, setNewDest] = React.useState('');
  const [rescheduleOrderId, setRescheduleOrderId] = React.useState<string|null>(null);
  const [newDate, setNewDate] = React.useState('');

  // 城市选项按字母表（locale）排序
  const sortedCities = React.useMemo(() => {
    return [...popularCities].sort((a,b)=>a.localeCompare(b,'zh'));
  }, []);

  const startChangeDest = (orderId: string) => {
    const od = orders.find(o => o.id === orderId);
    setEditingDestOrderId(orderId);
    setNewDest(od?.dest || '');
  };
  const confirmChangeDest = async () => {
    if (!editingDestOrderId) return;
    if (!newDest) { alert('请输入新的到达地'); return; }
    if (!sortedCities.includes(newDest)) { alert('输入的到达地不存在，请选择有效站点'); return; }
    const updated = changeOrderDest(editingDestOrderId, newDest);
    if (!updated) { alert('变更失败：订单不可变更或未找到'); return; }
    setEditingDestOrderId(null);
    setNewDest('');
  };
  const cancelChangeDest = () => { setEditingDestOrderId(null); setNewDest(''); };

  const startReschedule = (orderId: string) => {
    const od = orders.find(o => o.id === orderId);
    setRescheduleOrderId(orderId);
    setNewDate(od?.date || todayLocalISO);
  };
  const confirmReschedule = async () => {
    if (!rescheduleOrderId) return;
    if (!newDate) { alert('请选择新的出发日期'); return; }
    if (newDate < todayLocalISO) { alert('改签日期不能早于今天'); return; }
    const updated = rescheduleOrderDate(rescheduleOrderId, newDate);
    if (!updated) { alert('改签失败：订单不可改签或未找到'); return; }
    setRescheduleOrderId(null);
    setNewDate('');
  };
  const cancelReschedule = () => { setRescheduleOrderId(null); setNewDate(''); };

  const canModify = (o: Order) => {
    const now = Date.now();
    const [y, m, d] = o.date.split('-').map(Number);
    const departMs = new Date(y, m-1, d, 0, 0, 0, 0).getTime();
    const beforeDepart = now < departMs;
    return (o.status === 'pending' || o.status === 'paid') && beforeDepart;
  };

  return (
    <div className="orders-page">
      <h2>订单中心</h2>
      {op ? (
        <div style={{margin:'8px 0', padding:'8px 12px', background:'#fff8e1', border:'1px solid #ffe082', borderRadius:4, color:'#8d6e63'}}>
          {op === 'refund' ? '请在已支付订单中点击“退票”进行退票' :
           op === 'reschedule' ? '请在符合条件的订单中点击“改签”并选择新的出发日期' :
           op === 'change_dest' ? '请在符合条件的订单中点击“变更到站”并选择新的到达地' :
           '请选择需要操作的订单'}
        </div>
      ) : null}
      <table className="orders-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>行程</th>
            <th>出发日期</th>
            <th>乘客</th>
            <th>座位</th>
            <th>金额</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.origin} → {o.dest} · {o.item.trainCode}</td>
              <td>{o.date}</td>
              <td>{o.passengers.map(p=>p.name||'乘客').join('、')}</td>
              <td>{o.item.carriage ? `${o.item.carriage}车厢 ${o.item.seatNo || ''}` : (o.item.seatNo || '--')}</td>
              <td>{o.item.price} 元</td>
              <td>{o.status}</td>
              <td>
                <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                  {canModify(o) ? (
                    <>
                      <button onClick={()=>startChangeDest(o.id)}>变更到站</button>
                      <button onClick={()=>startReschedule(o.id)}>改签</button>
                    </>
                  ) : (
                    <>
                      <button disabled>变更到站</button>
                      <button disabled>改签</button>
                    </>
                  )}
                  {o.status === 'pending' && (
                    <>
                      <button className="primary" onClick={()=>navigate(`/checkout/${o.id}`)}>去支付</button>
                      <button onClick={()=>cancelOrder(o.id)}>取消订单</button>
                    </>
                  )}
                  {o.status === 'paid' && (
                    <button onClick={()=>refundOrder(o.id)}>退票</button>
                  )}
                </div>
                {/* 内嵌变更到站输入 */}
                {editingDestOrderId === o.id && (
                  <div style={{marginTop:8, display:'flex', gap:8, alignItems:'center'}}>
                    <label>新的到达地：</label>

                <div>
                  <input
                    list="change-dest-cities"
                    value={newDest}
                    placeholder="搜索到达地"
                    onChange={e => setNewDest(e.target.value)}
                    onBlur={() => {
                      if (newDest && !sortedCities.includes(newDest)) {
                        alert('请选择有效的到达地城市');
                        setNewDest('');
                      }
                    }}
                  />
                  <datalist id="change-dest-cities">
                    {sortedCities.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                    <button className="primary" onClick={confirmChangeDest}>确定</button>
                    <button onClick={cancelChangeDest}>取消</button>
                  </div>
                )}
                {/* 内嵌改签日期输入 */}
                {rescheduleOrderId === o.id && (
                  <div style={{marginTop:8, display:'flex', gap:8, alignItems:'center'}}>
                    <label>新的出发日期：</label>
                    <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} min={todayLocalISO} />
                    <button className="primary" onClick={confirmReschedule}>确定</button>
                    <button onClick={cancelReschedule}>取消</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Orders;
