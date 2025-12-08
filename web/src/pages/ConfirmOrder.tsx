import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Order } from '../types/order';
import { getOrder, payOrder, cancelOrder, refundOrder, addOrder } from '../services/orders';
import { getTrainByCode, decrementInventory } from '../services/trains';
import { getSession } from '../services/auth';
import { getPassengers, type Passenger as SavedPassenger } from '../services/passengers';

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
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const navigate = useNavigate();
  const [order, setOrder] = React.useState<Order | undefined>(undefined);
  const isNew = id === 'new';

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

  if (isNew) {
    const origin = params.get('origin') || '';
    const dest = params.get('dest') || '';
    const date = params.get('date') || '';
    const trainCode = params.get('train') || '';
    const stu = params.get('stu') === '1';
    const train = getTrainByCode(trainCode);
    const session = getSession();
    const owner = session?.username || '';
    const saved = owner ? getPassengers(owner) : [];
    const [selectedIds, setSelectedIds] = React.useState<string[]>(saved.filter(x=>x.isSelf).map(x=>x.id));
    const [seatType, setSeatType] = React.useState<'sw'|'ydz'|'edz'>('edz');
    const [benefits, setBenefits] = React.useState<Record<string, SavedPassenger['benefit']>>(Object.fromEntries(saved.map(s=>[s.id, s.benefit])));
    const priceBase = train ? (train.price[seatType] ?? 0) : 0;
    const priceWithBenefit = (bid: SavedPassenger['benefit']) => Math.round(priceBase * (bid === '学生' || stu ? 0.9 : 1));
    const valid = !!train && !!origin && !!dest && !!date;
    const departMs = train ? combineLocalDateTimeMs(date, train.depart) : 0;
    const saleCutoff = train ? (departMs - Date.now() < 30*60*1000) : false;
    return (
      <div style={{maxWidth:1000, margin:'24px auto', padding:'0 16px'}}>
        <div style={{background:'#eaf4ff', border:'1px solid #bcd7ff', borderRadius:8, padding:12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontSize:18, fontWeight:600}}>{date} · {trainCode} 次 · {origin}（{train?.depart}开）→ {dest}（{train?.arrive}到）</div>
            <div style={{display:'inline-flex', gap:8}}>
              <span style={{background:'#fff7f0', border:'1px solid #ffd7b0', borderRadius:4, padding:'4px 8px', color:'#f19939'}}>二等座 ￥{Math.round((train?.price.edz ?? 0) * (stu ? 0.9 : 1))}</span>
              <span style={{background:'#fff7f0', border:'1px solid #ffd7b0', borderRadius:4, padding:'4px 8px', color:'#f19939'}}>一等座 ￥{Math.round((train?.price.ydz ?? 0) * (stu ? 0.9 : 1))}</span>
              <span style={{background:'#fff7f0', border:'1px solid #ffd7b0', borderRadius:4, padding:'4px 8px', color:'#f19939'}}>商务座 ￥{Math.round((train?.price.sw ?? 0) * (stu ? 0.9 : 1))}</span>
            </div>
          </div>
          <div style={{color:'#888', marginTop:6}}>显示的价格为学生优惠示例价，最终以实际购票价格为准。</div>
        </div>

        <div style={{marginTop:12, border:'1px solid #eaeef5', borderRadius:8}}>
          <div style={{background:'#f5f7fb', padding:10, borderBottom:'1px solid #eaeef5', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontWeight:600}}>乘客信息（可勾选）</div>
            <input type="text" placeholder="输入乘客姓名" style={{border:'1px solid #dfe3eb', borderRadius:4, padding:'4px 8px'}} onChange={(e)=>{
              const kw = e.target.value.trim();
              const filt = kw ? saved.filter(p => p.name.includes(kw)) : saved;
              setSelectedIds(filt.filter(x=>x.isSelf).map(x=>x.id));
            }} />
          </div>
          <div style={{padding:10}}>
            {saved.length === 0 ? (
              <div style={{color:'#888'}}>暂无预存乘客，请在“个人中心-乘车人”添加后再选择。</div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
                {saved.map(p => (
                  <label key={p.id} style={{display:'flex', alignItems:'center', gap:6, border:'1px solid #eaeef5', borderRadius:6, padding:'6px 8px'}}>
                    <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={(e)=>{
                      setSelectedIds(prev => e.target.checked ? Array.from(new Set([...prev, p.id])) : prev.filter(id => id !== p.id));
                    }} />
                    <span>{p.name}</span>
                    <span style={{color:'#888'}}>（{p.benefit}）</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{marginTop:12, border:'1px solid #eaeef5', borderRadius:8}}>
          <div style={{background:'#f5f7fb', padding:10, borderBottom:'1px solid #eaeef5', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontWeight:600}}>选票与选座</div>
          </div>
          <div style={{padding:10}}>
            <div style={{display:'flex', gap:12, alignItems:'center'}}>
              <label>票种：</label>
              <span>按乘客逐项设置</span>
            </div>
            <div style={{marginTop:8}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#fafafa'}}>
                    <th style={{border:'1px solid #eee', padding:6}}>序号</th>
                    <th style={{border:'1px solid #eee', padding:6}}>乘客</th>
                    <th style={{border:'1px solid #eee', padding:6}}>票种</th>
                    <th style={{border:'1px solid #eee', padding:6}}>席别</th>
                    <th style={{border:'1px solid #eee', padding:6}}>票价</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedIds.map((pid, idx) => {
                    const p = saved.find(x=>x.id===pid)!;
                    const benefit = benefits[pid] || p.benefit;
                    const price = priceWithBenefit(benefit);
                    return (
                      <tr key={pid}>
                        <td style={{border:'1px solid #eee', padding:6}}>{idx+1}</td>
                        <td style={{border:'1px solid #eee', padding:6}}>{p.name}</td>
                        <td style={{border:'1px solid #eee', padding:6}}>
                          <select value={benefit} onChange={e=>setBenefits(prev=>({ ...prev, [pid]: (e.target.value as SavedPassenger['benefit']) }))}>
                            <option value="成人">成人票</option>
                            <option value="学生">学生票</option>
                          </select>
                        </td>
                        <td style={{border:'1px solid #eee', padding:6}}>
                          <select value={seatType} onChange={e=>setSeatType(e.target.value as ('sw'|'ydz'|'edz'))}>
                            <option value="edz" disabled={(train?.types.edz ?? 0) <= 0}>二等座</option>
                            <option value="ydz" disabled={(train?.types.ydz ?? 0) <= 0}>一等座</option>
                            <option value="sw" disabled={(train?.types.sw ?? 0) <= 0}>商务座</option>
                          </select>
                        </td>
                        <td style={{border:'1px solid #eee', padding:6}}>￥{price}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{marginTop:12, display:'flex', gap:8}}>
          <button className="primary" disabled={!valid || selectedIds.length===0 || saleCutoff} title={saleCutoff ? '距发车不足30分钟，已截止售票' : undefined} onClick={()=>{
            if (!train) return;
            // 为每位乘客创建一笔订单（演示）
            selectedIds.forEach(pid => {
              const p = saved.find(x=>x.id===pid)!;
              const ticketPrice = priceWithBenefit(benefits[pid] || p.benefit);
              const order: Order = {
                id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
                origin, dest, date,
                passengers: [{ name: p.name, idType: 'ID', idNo: p.idNo, student: (benefits[pid] || p.benefit) === '学生' }],
                item: { trainCode: trainCode, seatType, price: ticketPrice },
                status: 'pending',
                createdAt: Date.now(),
              };
              addOrder(order);
            });
            decrementInventory(trainCode, seatType as import('../types/train').SeatType, selectedIds.length);
            navigate('/orders');
          }}>提交订单</button>
          <button onClick={()=>navigate(-1)}>上一步</button>
        </div>
      </div>
    );
  }

  // 订单确认模式：在校验到订单存在后再定义下列函数与变量

  if (!order) {
    return (
      <div style={{maxWidth:800, margin:'24px auto', padding:'0 16px'}}>
        <h2>确认订单</h2>
        <div style={{background:'#fffbe6', border:'1px solid #ffe58f', padding:16, borderRadius:8}}>未找到订单或订单已被删除。</div>
      </div>
    );
  }
  const train = getTrainByCode(order.item.trainCode);
  const departMs = train ? combineLocalDateTimeMs(order.date, train.depart) : 0;
  const canRefundNow = departMs - Date.now() >= 60 * 60 * 1000;
  const handlePay = () => { const paid = payOrder(order.id); if (paid) navigate('/orders', { replace: true }); };
  const handleCancel = () => { cancelOrder(order.id); navigate('/orders', { replace: true }); };
  const handleRefund = () => { if (!canRefundNow) { alert('距发车不足1小时，无法退票'); return; } const res = refundOrder(order.id); if (!res) { alert('退票失败：距发车不足1小时或订单状态不支持'); } };
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
