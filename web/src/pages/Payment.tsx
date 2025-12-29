import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getOrders, payOrder } from '../services/orders';
import { getTrainByCode } from '../services/trains';

function labelSeat(s: 'sw'|'ydz'|'edz'|'wz'){ switch(s){ case 'sw': return '商务座'; case 'ydz': return '一等座'; case 'edz': return '二等座'; case 'wz': return '无座'; default: return s; } }

function weekLabel(dateStr: string){ const d = new Date(dateStr + 'T00:00:00'); const n = d.getDay(); return ['周日','周一','周二','周三','周四','周五','周六'][n]; }

const PaymentPage: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const groupId = params.get('group') || '';
  const origin = params.get('origin') || '';
  const dest = params.get('dest') || '';
  const date = params.get('date') || '';
  const trainCode = params.get('train') || '';
  const orders = React.useMemo(()=> getOrders().filter(o => o.groupId === groupId), [groupId]);
  const train = getTrainByCode(trainCode);
  const total = orders.reduce((sum, o)=> sum + (o.item.price || 0), 0);

  const [leftMs, setLeftMs] = React.useState(20 * 60 * 1000);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [showPayModal, setShowPayModal] = React.useState(false);
  React.useEffect(()=>{
    const startedAt = Date.now();
    const timer = setInterval(()=>{
      const gone = Date.now() - startedAt;
      const rest = Math.max(0, 20*60*1000 - gone);
      setLeftMs(rest);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const mins = Math.floor(leftMs / 60000);
  const secs = Math.floor((leftMs % 60000) / 1000);

  const toResults = () => {
    const stu = orders.some(o => o.passengers.some(p => p.student));
    const url = `/results?origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}&hs=0&stu=${stu?1:0}&ticketType=oneway&search=0`;
    navigate(url, { replace: true });
  };

  return (
    <div style={{maxWidth: 1000, margin: '24px auto', padding: '0 16px'}}>
      <div style={{background:'#fff', border:'1px solid #bcd7ff', borderRadius:8, padding:12, display:'flex', alignItems:'center', gap:12}}>
        <div style={{width:24, height:24, borderRadius:12, background:'#2b66e7', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>🔒</div>
        <div style={{flex:1}}>
          <div style={{fontSize:16}}>席位已锁定，请在提示时间内尽快完成支付，完成网上购票。</div>
          <div style={{marginTop:4}}>支付剩余时间：<span style={{color:'#e74a3b', fontWeight:700}}>{String(mins)}分{String(secs).padStart(2,'0')}秒</span></div>
        </div>
      </div>

      <div style={{marginTop:12, border:'1px solid #eaeef5', borderRadius:8}}>
        <div style={{background:'linear-gradient(0deg, #1e5bd4, #2b66e7)', color:'#fff', padding:'10px 12px', borderRadius:'8px 8px 0 0', fontWeight:700}}>订单信息</div>
        <div style={{padding:'10px 12px'}}>
          <div style={{border:'1px solid #eaeef5', borderRadius:8}}>
            <div style={{padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <span style={{marginRight:12}}>{date}（{weekLabel(date)}）</span>
                <span style={{marginRight:12}}>{trainCode} 次</span>
                <span style={{marginRight:12}}>{origin} 站（{train?.depart}开）— {dest} 站（{train?.arrive}到）</span>
              </div>
              <div style={{color:'#666'}}>{labelSeat(orders[0]?.item.seatType || 'edz')}</div>
            </div>

            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f5f7fb'}}>
                  <th style={{border:'1px solid #eee', padding:6}}>序号</th>
                  <th style={{border:'1px solid #eee', padding:6}}>姓名</th>
                  <th style={{border:'1px solid #eee', padding:6}}>证件类型</th>
                  <th style={{border:'1px solid #eee', padding:6}}>证件号码</th>
                  <th style={{border:'1px solid #eee', padding:6}}>票种</th>
                  <th style={{border:'1px solid #eee', padding:6}}>席别</th>
                  <th style={{border:'1px solid #eee', padding:6}}>车厢</th>
                  <th style={{border:'1px solid #eee', padding:6}}>席位号</th>
                  <th style={{border:'1px solid #eee', padding:6}}>票价（元）</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx)=> (
                  <tr key={o.id}>
                    <td style={{border:'1px solid #eee', padding:6}}>{idx+1}</td>
                    <td style={{border:'1px solid #eee', padding:6}}>{o.passengers[0]?.name}</td>
                    <td style={{border:'1px solid #eee', padding:6}}>{o.passengers[0]?.idType === 'Passport' ? '护照' : '居民身份证'}</td>
                    <td style={{border:'1px solid #eee', padding:6}}>{o.passengers[0]?.idNo}</td>
                    <td style={{border:'1px solid #eee', padding:6}}>{o.passengers[0]?.student ? '学生票' : '成人票'}</td>
                    <td style={{border:'1px solid #eee', padding:6}}>{labelSeat(o.item.seatType)}</td>
                    <td style={{border:'1px solid #eee', padding:6}}>{o.item.carriage ? String(o.item.carriage).padStart(2,'0') : '--'}</td>
                    <td style={{border:'1px solid #eee', padding:6}}>{o.item.seatNo ? `${o.item.seatNo}` : '--'}</td>
                    <td style={{border:'1px solid #eee', padding:6}}>{o.item.price.toFixed(1)}元</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{margin:'12px 12px', border:'1px solid #eaeef5', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:12}}>
              <div style={{width:64, height:64, background:'#eaf4ff', borderRadius:8}}></div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700}}>添加铁路乘意险保障</div>
                <div style={{color:'#666', fontSize:12}}>旅行意外险（按天投保 保额高 保障范围广）为购票人提供乘车期间意外伤害保障，发生意外给予相应赔付。</div>
              </div>
              <button className="primary">前往投保</button>
            </div>

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px'}}>
              <div style={{color:'#666'}}>总金额：<span style={{fontWeight:700}}>{total.toFixed(1)} 元</span></div>
              <div style={{display:'flex', gap:12}}>
                <button onClick={() => { setShowCancelModal(true); }}>取消订单</button>
                <button className="primary" style={{background:'#FF7A00'}} onClick={()=>{
                  orders.forEach(o => { if (o.status === 'pending') payOrder(o.id); });
                  setShowPayModal(true);
                }}>网上支付</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showCancelModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{width:360, background:'#fff', borderRadius:8, boxShadow:'0 10px 20px rgba(0,0,0,0.2)'}}>
            <div style={{padding:'16px 20px', fontWeight:700, borderBottom:'1px solid #eee'}}>成功取消</div>
            <div style={{padding:'16px 20px'}}>
              <div style={{textAlign:'center'}}>
                <button className="primary" onClick={()=>{ setShowCancelModal(false); toResults(); }}>确认</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPayModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{width:360, background:'#fff', borderRadius:8, boxShadow:'0 10px 20px rgba(0,0,0,0.2)'}}>
            <div style={{padding:'16px 20px', fontWeight:700, borderBottom:'1px solid #eee'}}>支付成功</div>
            <div style={{padding:'16px 20px'}}>
              <div style={{textAlign:'center'}}>
                <button className="primary" onClick={()=>{ setShowPayModal(false); toResults(); }}>确认</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
