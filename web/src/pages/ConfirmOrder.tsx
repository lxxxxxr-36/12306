import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Order } from '../types/order';
import { getOrder, payOrder, cancelOrder, refundOrder, addOrder } from '../services/orders';
import { getTrainByCode, decrementInventory } from '../services/trains';
import { getSession } from '../services/auth';
import { getPassengers, type Passenger as SavedPassenger } from '../services/passengers';
import { getBeneficiaries, type Beneficiary, type IdType } from '../services/beneficiaries';

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
    const savedPassengers = owner ? getPassengers(owner) : [];
    const savedBeneficiaries = owner ? getBeneficiaries(owner) : [];
    const [kw, setKw] = React.useState('');
    const filteredPassengers = React.useMemo(()=> kw ? savedPassengers.filter(p=>p.name.includes(kw)) : savedPassengers, [kw, savedPassengers]);
    const filteredBeneficiaries = React.useMemo(()=> kw ? savedBeneficiaries.filter(b=>b.name.includes(kw)) : savedBeneficiaries, [kw, savedBeneficiaries]);
    const [currentKind, setCurrentKind] = React.useState<'passenger'|'beneficiary'|null>(null);
    type Row = {
      sourceKind?: 'passenger'|'beneficiary',
      sourceId?: string,
      benefit: SavedPassenger['benefit'],
      seatType: 'sw'|'ydz'|'edz',
      name?: string,
      idType?: string,
      idNo?: string,
    }
    const [rows, setRows] = React.useState<Row[]>([
      { benefit: (stu?'学生':'成人'), seatType: 'edz', name: undefined, idType: undefined, idNo: undefined }
    ]);
    const idTypeOptions: IdType[] = [
      '居民身份证','港澳居民居住证','台湾居民居住证','外国人永久居留身份证','外国护照','中国护照','港澳居民来往内地通行证','台湾居民来往大陆通行证'
    ];
    const priceBase = train ? (train.price['edz'] ?? 0) : 0;
    const priceFor = (seat: 'sw'|'ydz'|'edz', bid: SavedPassenger['benefit']) => {
      const base = train ? (train.price[seat] ?? 0) : 0;
      return Math.round(base * (bid === '学生' || stu ? 0.9 : 1));
    };
    const valid = !!train && !!origin && !!dest && !!date;
    const departMs = train ? combineLocalDateTimeMs(date, train.depart) : 0;
    const saleCutoff = train ? (departMs - Date.now() < 30*60*1000) : false;
    const [showSeatModal, setShowSeatModal] = React.useState(false);
    const [pendingRows, setPendingRows] = React.useState<Row[]>([]);
    const [seatChoices, setSeatChoices] = React.useState<Record<number, string>>({});
    const seatLetters = ['A','B','C','D','F'];
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
          <div style={{color:'#888', marginTop:6}}>显示的价格为实际活动优惠会价格，最终以实际购票价格为准。</div>
        </div>

        <div style={{marginTop:12, border:'1px solid #eaeef5', borderRadius:8}}>
          <div style={{background:'#f5f7fb', padding:10, borderBottom:'1px solid #eaeef5', display:'flex', alignItems:'center', gap:12, justifyContent:'space-between'}}>
            <div style={{fontWeight:600}}>乘客信息</div>
            <div style={{display:'inline-flex', alignItems:'center', gap:6}}>
              <input type="text" placeholder="输入乘客姓名" value={kw} onChange={e=>setKw(e.target.value)} style={{border:'1px solid #dfe3eb', borderRadius:4, padding:'4px 8px'}} />
            </div>
          </div>
          <div style={{padding:10}}>
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              <div>
                <div style={{fontWeight:600, marginBottom:6}}>受让人</div>
                {filteredBeneficiaries.length === 0 ? <div style={{color:'#888'}}>暂无受让人</div> : (
                  <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8}}>
                    {filteredBeneficiaries.map(b => {
                      const checked = rows.some(r => r.sourceKind==='beneficiary' && r.sourceId===b.id);
                      return (
                        <label key={b.id} style={{display:'flex', alignItems:'center', gap:6, border:'1px solid #eaeef5', borderRadius:6, padding:'6px 8px'}}>
                          <input type="checkbox" checked={checked} onChange={(e)=>{
                            if (e.target.checked) {
                              if (currentKind && currentKind!=='beneficiary' && rows.some(r=>r.sourceKind)) { alert('不支持混合选择'); return; }
                              setCurrentKind('beneficiary');
                              setRows(prev => {
                                const firstEmpty = prev.findIndex(r => !r.name);
                                const rowData: Row = { sourceKind:'beneficiary', sourceId: b.id, benefit: '成人', seatType: 'edz', name: b.name, idType: b.idType, idNo: b.idNo };
                                if (firstEmpty >= 0) { const next=[...prev]; next[firstEmpty]=rowData; return next; }
                                return [...prev, rowData];
                              });
                            } else {
                              setRows(prev => {
                                const idx = prev.findIndex(r=>r.sourceKind==='beneficiary' && r.sourceId===b.id);
                                if (idx===-1) return prev;
                                const next=[...prev];
                                if (idx===0) next[0]={ ...next[0], sourceKind:undefined, sourceId:undefined, name: undefined, idType: undefined, idNo: undefined };
                                else next.splice(idx,1);
                                if (!next.some(r=>r.sourceKind)) setCurrentKind(null);
                                return next;
                              });
                            }
                          }} />
                          <span>{b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <div style={{fontWeight:600, marginBottom:6}}>乘车人</div>
                {filteredPassengers.length === 0 ? <div style={{color:'#888'}}>暂无乘车人</div> : (
                  <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8}}>
                    {filteredPassengers.map(p => {
                      const checked = rows.some(r => r.sourceKind==='passenger' && r.sourceId===p.id);
                      return (
                        <label key={p.id} style={{display:'flex', alignItems:'center', gap:6, border:'1px solid #eaeef5', borderRadius:6, padding:'6px 8px'}}>
                          <input type="checkbox" checked={checked} onChange={(e)=>{
                            if (e.target.checked) {
                              if (currentKind && currentKind!=='passenger' && rows.some(r=>r.sourceKind)) { alert('不支持混合选择'); return; }
                              setCurrentKind('passenger');
                              setRows(prev => {
                                const firstEmpty = prev.findIndex(r => !r.name);
                                const rowData: Row = { sourceKind:'passenger', sourceId: p.id, benefit: p.benefit, seatType: 'edz', name: p.name, idType: p.idType, idNo: p.idNo };
                                if (firstEmpty >= 0) { const next=[...prev]; next[firstEmpty]=rowData; return next; }
                                return [...prev, rowData];
                              });
                            } else {
                              setRows(prev => {
                                const idx = prev.findIndex(r=>r.sourceKind==='passenger' && r.sourceId===p.id);
                                if (idx===-1) return prev;
                                const next=[...prev];
                                if (idx===0) next[0]={ ...next[0], sourceKind:undefined, sourceId:undefined, name: undefined, idType: undefined, idNo: undefined };
                                else next.splice(idx,1);
                                if (!next.some(r=>r.sourceKind)) setCurrentKind(null);
                                return next;
                              });
                            }
                          }} />
                          <span>{p.name}{p.benefit==='学生'?'（学生）':''}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{marginTop:12, border:'1px solid #eaeef5', borderRadius:8}}>
          <div style={{padding:10}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#fafafa'}}>
                  <th style={{border:'1px solid #eee', padding:6}}>序号</th>
                  <th style={{border:'1px solid #eee', padding:6}}>票种</th>
                  <th style={{border:'1px solid #eee', padding:6}}>席别</th>
                  <th style={{border:'1px solid #eee', padding:6}}>姓名</th>
                  <th style={{border:'1px solid #eee', padding:6}}>证件类型</th>
                  <th style={{border:'1px solid #eee', padding:6}}>证件号码</th>
                  <th style={{border:'1px solid #eee', padding:6}}>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const seatOpts = [
                    {key:'edz', label:'二等座', disabled:(train?.types.edz ?? 0) <= 0},
                    {key:'ydz', label:'一等座', disabled:(train?.types.ydz ?? 0) <= 0},
                    {key:'sw', label:'商务座', disabled:(train?.types.sw ?? 0) <= 0},
                  ] as Array<{key:'edz'|'ydz'|'sw', label:string, disabled:boolean}>;
                  return (
                    <tr key={idx}>
                      <td style={{border:'1px solid #eee', padding:6}}>{idx+1}</td>
                      <td style={{border:'1px solid #eee', padding:6}}>
                        <select value={r.benefit} onChange={e=>setRows(prev=>{ const next=[...prev]; next[idx]={...next[idx], benefit: e.target.value as Row['benefit']}; return next; })}>
                          <option value="成人">成人票</option>
                          <option value="学生">学生票</option>
                        </select>
                      </td>
                      <td style={{border:'1px solid #eee', padding:6}}>
                        <select value={r.seatType} onChange={e=>setRows(prev=>{ const next=[...prev]; next[idx]={...next[idx], seatType: e.target.value as Row['seatType']}; return next; })}>
                          {seatOpts.map(s => (<option key={s.key} value={s.key} disabled={s.disabled}>{s.label}</option>))}
                        </select>
                      </td>
                      <td style={{border:'1px solid #eee', padding:6}}>{r.name ?? ''}</td>
                      <td style={{border:'1px solid #eee', padding:6}}>
                        {r.idType ? r.idType : (
                          <select value={r.idType ?? ''} onChange={e=>setRows(prev=>{ const next=[...prev]; next[idx]={...next[idx], idType: e.target.value as IdType}; return next; })}>
                            <option value="" disabled>选择证件类型</option>
                            {idTypeOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                          </select>
                        )}
                      </td>
                      <td style={{border:'1px solid #eee', padding:6}}>{r.idNo ?? ''}</td>
                      <td style={{border:'1px solid #eee', padding:6}}>
                        <button className="secondary" onClick={()=>{
                          setRows(prev=>{
                            const next=[...prev];
                            if (idx===0) next[0]={ ...next[0], sourceKind:undefined, sourceId:undefined, name: undefined, idType: undefined, idNo: undefined };
                            else next.splice(idx,1);
                            if (!next.some(x=>x.sourceKind)) setCurrentKind(null);
                            return next;
                          });
                        }}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{marginTop:12, display:'flex', justifyContent:'center', gap:40}}>
          <button onClick={()=>navigate(-1)}>上一步</button>
          <button className="primary" style={{background:'#FF7A00'}} disabled={!valid || saleCutoff} title={saleCutoff ? '距发车不足30分钟，已截止售票' : undefined} onClick={()=>{
            if (!train) return;
            const effectiveRows = rows.filter(r=> r.name && r.idNo);
            if (effectiveRows.length === 0) { alert('请选择乘车人'); return; }
            setPendingRows(effectiveRows);
            setSeatChoices({});
            setShowSeatModal(true);
          }}>提交订单</button>
        </div>
        {showSeatModal && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
            <div style={{width:640, background:'#fff', borderRadius:8, boxShadow:'0 10px 20px rgba(0,0,0,0.2)'}}>
              <div style={{background:'#eaf4ff', borderBottom:'1px solid #bcd7ff', padding:'10px 12px', fontWeight:700}}>请选择座位（不选将随机分配）</div>
              <div style={{padding:'10px 12px'}}>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#fafafa'}}>
                      <th style={{border:'1px solid #eee', padding:6}}>序号</th>
                      <th style={{border:'1px solid #eee', padding:6}}>姓名</th>
                      <th style={{border:'1px solid #eee', padding:6}}>席别</th>
                      <th style={{border:'1px solid #eee', padding:6}}>可选座位</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRows.map((r, idx)=>(
                      <tr key={idx}>
                        <td style={{border:'1px solid #eee', padding:6}}>{idx+1}</td>
                        <td style={{border:'1px solid #eee', padding:6}}>{r.name}</td>
                        <td style={{border:'1px solid #eee', padding:6}}>{r.seatType==='edz'?'二等座': r.seatType==='ydz'?'一等座':'商务座'}</td>
                        <td style={{border:'1px solid #eee', padding:6}}>
                          <div style={{display:'flex', gap:8, alignItems:'center'}}>
                            {seatLetters.map(letter=>(
                              <button
                                key={letter}
                                className={seatChoices[idx]===letter?'primary':'secondary'}
                                onClick={()=>setSeatChoices(prev=>({ ...prev, [idx]: letter }))}
                              >{letter}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{marginTop:12, display:'flex', justifyContent:'center', gap:20}}>
                  <button onClick={()=>{ setShowSeatModal(false); }}>返回修改</button>
                  <button className="primary" style={{background:'#FF7A00'}} onClick={()=>{
                    // 生成订单，席位按选择或随机
                    pendingRows.forEach((r, idx) => {
                      const letter = seatChoices[idx] || seatLetters[Math.floor(Math.random()*seatLetters.length)];
                      const rowNo = Math.floor(Math.random()*20) + 1;
                      const ticketPrice = priceFor(r.seatType, r.benefit);
                      const order: Order = {
                        id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
                        origin, dest, date,
                        passengers: [{ name: r.name!, idType: (r.idType as any) || 'ID', idNo: r.idNo!, student: r.benefit === '学生' }],
                        item: { trainCode: trainCode, seatType: r.seatType, carriage: Math.floor(Math.random()*8)+1, seatNo: `${rowNo}${letter}`, price: ticketPrice },
                        status: 'pending',
                        createdAt: Date.now(),
                      };
                      addOrder(order);
                    });
                    decrementInventory(trainCode, pendingRows[0]?.seatType as import('../types/train').SeatType, pendingRows.length);
                    setShowSeatModal(false);
                    navigate('/orders');
                  }}>确认</button>
                </div>
              </div>
            </div>
          </div>
        )}
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
