import React from 'react';
import type { Order } from '../types/order';
import { getOrders, cancelOrder, refundOrder, changeOrderDest, rescheduleOrderDate } from '../services/orders';
import { useNavigate } from 'react-router-dom';
import { popularCities } from '../constants/cities';

const Orders: React.FC = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const navigate = useNavigate();
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

  // 将原来的 prompt 改为内嵌控件的开启逻辑
  const startChangeDest = (o: Order) => { setEditingDestOrderId(o.id); setNewDest(o.dest); };
  const confirmChangeDest = () => {
    if (!editingDestOrderId) return;
    const updated = changeOrderDest(editingDestOrderId, newDest);
    if (!updated) alert('不满足变更到站条件（可能已发车或无效输入）');
    setEditingDestOrderId(null); setNewDest('');
  };
  const cancelChangeDest = () => { setEditingDestOrderId(null); setNewDest(''); };

  const startReschedule = (o: Order) => { setRescheduleOrderId(o.id); setNewDate(o.date); };
  const confirmReschedule = () => {
    if (!rescheduleOrderId) return;
    if (!newDate) { alert('请选择新的出发日期'); return; }
    if (newDate < todayLocalISO) { alert('改签日期不得早于今天'); return; }
    const updated = rescheduleOrderDate(rescheduleOrderId, newDate);
    if (!updated) alert('不满足改签条件（可能已发车或无效输入）');
    setRescheduleOrderId(null); setNewDate('');
  };
  const cancelReschedule = () => { setRescheduleOrderId(null); setNewDate(''); };

  return (
    <div style={{maxWidth:1000, margin:'24px auto', padding:'0 16px'}}>
      <h2>我的订单</h2>
      {orders.length === 0 ? (
        <div style={{background:'#fafafa', padding:16, border:'1px solid #eee', borderRadius:8}}>
          暂无订单。请先在查询结果页点击“预订”生成订单草稿。
        </div>
      ) : (
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left', padding:'8px 4px'}}>订单号</th>
              <th style={{textAlign:'left', padding:'8px 4px'}}>行程</th>
              <th style={{textAlign:'left', padding:'8px 4px'}}>出发日期</th>
              <th style={{textAlign:'left', padding:'8px 4px'}}>车次/席别</th>
              <th style={{textAlign:'right', padding:'8px 4px'}}>票价</th>
              <th style={{textAlign:'left', padding:'8px 4px'}}>状态</th>
              <th style={{textAlign:'left', padding:'8px 4px'}}>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{borderTop:'1px solid #eee'}}>
                <td style={{padding:'8px 4px'}}>{o.id}</td>
                <td style={{padding:'8px 4px'}}>{o.origin} → {o.dest}</td>
                <td style={{padding:'8px 4px'}}>{o.date}</td>
                <td style={{padding:'8px 4px'}}>{o.item.trainCode} / {labelSeat(o.item.seatType)}</td>
                <td style={{padding:'8px 4px', textAlign:'right'}}>￥{o.item.price}</td>
                <td style={{padding:'8px 4px'}}>{labelStatus(o.status)}</td>
                <td style={{padding:'8px 4px'}}>
                  {o.status === 'pending' ? (
                    <>
                      <button className="primary" onClick={()=>navigate(`/checkout/${o.id}`)} style={{marginRight:8}}>去支付</button>
                      <button onClick={()=>cancelOrder(o.id)} style={{marginRight:8}}>取消</button>
                      <button onClick={()=>startChangeDest(o)} style={{marginRight:8}}>变更到站</button>
                      <button onClick={()=>startReschedule(o)}>改签</button>
                    </>
                  ) : o.status === 'paid' ? (
                    <>
                      <button onClick={()=>navigate(`/checkout/${o.id}`)} style={{marginRight:8}}>查看</button>
                      <button onClick={()=>refundOrder(o.id)} style={{marginRight:8}}>退票</button>
                      <button onClick={()=>startChangeDest(o)} style={{marginRight:8}}>变更到站</button>
                      <button onClick={()=>startReschedule(o)}>改签</button>
                    </>
                  ) : o.status === 'refunding' ? (
                    <>
                      <button onClick={()=>navigate(`/checkout/${o.id}`)} style={{marginRight:8}}>查看</button>
                      <button disabled style={{marginRight:8}}>退票处理中</button>
                      <button disabled style={{marginRight:8}}>变更到站</button>
                      <button disabled>改签</button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>navigate(`/checkout/${o.id}`)} style={{marginRight:8}}>查看</button>
                      <button disabled style={{marginRight:8}}>变更到站</button>
                      <button disabled>改签</button>
                    </>
                  )}

                  {/* 内嵌编辑控件：变更到站 */}
                  {editingDestOrderId === o.id && (
                    <div style={{marginTop:8, display:'flex', alignItems:'center', gap:8}}>
                      <label>新的到达地</label>
                      <select value={newDest} onChange={e=>setNewDest(e.target.value)}>
                        <option value="">请选择到达地</option>
                        {popularCities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button onClick={confirmChangeDest} className="primary">确定</button>
                      <button onClick={cancelChangeDest}>取消</button>
                    </div>
                  )}

                  {/* 内嵌编辑控件：改签日期 */}
                  {rescheduleOrderId === o.id && (
                    <div style={{marginTop:8, display:'flex', alignItems:'center', gap:8}}>
                      <label>新的出发日期</label>
                      <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} min={todayLocalISO} />
                      <button onClick={confirmReschedule} className="primary">确定</button>
                      <button onClick={cancelReschedule}>取消</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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

export default Orders;