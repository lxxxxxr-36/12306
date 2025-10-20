import React from 'react';
import type { Order } from '../types/order';
import { getOrders, cancelOrder, refundOrder } from '../services/orders';
import { useNavigate } from 'react-router-dom';

const Orders: React.FC = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const navigate = useNavigate();
  React.useEffect(()=>{
    setOrders(getOrders());
    const handleOrdersChange = (evt: Event) => setOrders(getOrders());
    const handleStorage = (e: StorageEvent) => { if (e.key === 'orders') setOrders(getOrders()); };
    window.addEventListener('orderschange', handleOrdersChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('orderschange', handleOrdersChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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
                      <button onClick={()=>cancelOrder(o.id)}>取消</button>
                    </>
                  ) : o.status === 'paid' ? (
                    <>
                      <button onClick={()=>navigate(`/checkout/${o.id}`)} style={{marginRight:8}}>查看</button>
                      <button onClick={()=>refundOrder(o.id)}>退票</button>
                    </>
                  ) : o.status === 'refunding' ? (
                    <>
                      <button onClick={()=>navigate(`/checkout/${o.id}`)} style={{marginRight:8}}>查看</button>
                      <button disabled>退票处理中</button>
                    </>
                  ) : (
                    <button onClick={()=>navigate(`/checkout/${o.id}`)}>查看</button>
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