import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../services/auth';
import { createStandby, checkStandbyStatus, cancelStandby, payStandby } from '../services/standby';
import { fetchTrains } from '../services/trains';
import { popularCities } from '../constants/cities';
import type { SeatType } from '../types/train';
import type { Passenger } from '../types/order';

const seatLabels: Record<SeatType, string> = { sw:'商务座', ydz:'一等座', edz:'二等座', wz:'无座' };

// 与购票页一致的日期/时间工具
function todayLocalISO() {
  const d = new Date();
  d.setHours(0,0,0,0);
  const off = d.getTimezoneOffset()*60000;
  return new Date(d.getTime()-off).toISOString().split('T')[0];
}
function combineLocalDateTimeMs(dateStr: string, timeStr: string): number {
  if (!dateStr || !timeStr) return 0;
  const [y, m, d] = dateStr.split('-').map(Number);
  const nextDay = timeStr.includes('+1');
  const [hh, mm] = timeStr.replace('+1','').split(':').map(Number);
  const dt = new Date(y, (m-1), d, hh, mm, 0, 0);
  if (nextDay) dt.setDate(dt.getDate() + 1);
  return dt.getTime();
}

const Standby: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const originParam = params.get('origin') || '';
  const destParam = params.get('dest') || '';
  const dateParam = params.get('date') || '';
  const trainParam = params.get('train') || '';

  // 可选日期与车次
  const [originVal, setOriginVal] = useState<string>(originParam);
  const [destVal, setDestVal] = useState<string>(destParam);
  // 初始化日期：若传入日期早于今天，则校正为今天
  const [dateVal, setDateVal] = useState<string>(dateParam && dateParam >= todayLocalISO() ? dateParam : todayLocalISO());
  const [trainCode, setTrainCode] = useState<string>(trainParam);
  const [trainList, setTrainList] = useState<{code:string; depart:string; arrive:string}[]>([]);
  const [loadingTrains, setLoadingTrains] = useState(false);

  // 购票同逻辑：日期不可早于今天
  const isDepartValidToday = useMemo(() => !!dateVal && dateVal >= todayLocalISO(), [dateVal]);

  useEffect(() => {
    // 必须选择出发地与目的地后再加载车次
    if (!originVal || !destVal) { setTrainList([]); return; }
    setLoadingTrains(true);
    fetchTrains({ origin: originVal, dest: destVal, date: dateVal }).then(res => {
      setTrainList(res.map(t => ({ code: t.code, depart: t.depart, arrive: t.arrive })));
      if (!trainCode && res.length > 0) setTrainCode(res[0].code);
    }).finally(() => setLoadingTrains(false));
  }, [originVal, destVal, dateVal]);

  // 乘客与偏好
  const [passengers, setPassengers] = useState<Passenger[]>([{ name:'', idType:'ID', idNo:'' }]);
  const [seatPrefs, setSeatPrefs] = useState<SeatType[]>(['edz','wz']);
  const [deadline, setDeadline] = useState<number>(120); // minutes
  const [priority, setPriority] = useState<'time'|'price'>('time');
  const deposit = useMemo(() => Math.max(50, passengers.length * 50), [passengers.length]);

  const [standbyId, setStandbyId] = useState<string>('');
  const [status, setStatus] = useState<'submitted'|'matching'|'success'|'expired'|'cancelled'|''>('');
  const [matchedSeat, setMatchedSeat] = useState<SeatType | undefined>(undefined);

  const addPassenger = () => setPassengers(ps => [...ps, { name:'', idType:'ID', idNo:'' }]);
  const removePassenger = (idx: number) => setPassengers(ps => ps.filter((_,i)=>i!==idx));
  const updatePassenger = (idx:number, patch: Partial<Passenger>) => setPassengers(ps => ps.map((p,i)=> i===idx ? { ...p, ...patch } : p));

  const toggleSeatPref = (s: SeatType) => setSeatPrefs(p => p.includes(s) ? p.filter(x=>x!==s) : [...p, s]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 登录校验
    if (!isLoggedIn()) {
      navigate('/login', { state: { from: `/standby?origin=${encodeURIComponent(originVal)}&dest=${encodeURIComponent(destVal)}&date=${encodeURIComponent(dateVal)}&train=${encodeURIComponent(trainCode)}` } });
      return;
    }
    // 基础校验
    if (!originVal || !destVal) { alert('请选择出发地与目的地'); return; }
    if (originVal === destVal) { alert('出发地与目的地不能相同'); return; }
    if (!dateVal) { alert('请选择出发日期'); return; }
    if (!isDepartValidToday) { alert('出发日期不能早于今天'); return; }
    if (!trainCode) { alert('请选择候补车次'); return; }
    // 购票同逻辑：距发车不足30分钟，截止候补提交
    const sel = trainList.find(t => t.code === trainCode);
    if (sel) {
      const departMs = combineLocalDateTimeMs(dateVal, sel.depart);
      if (departMs - Date.now() < 30 * 60 * 1000) { alert('距发车不足30分钟，已截止候补'); return; }
    }
    if (passengers.length === 0 || passengers.some(p => !p.name || !p.idNo)) { alert('请填写乘客姓名与证件号'); return; }
    if (seatPrefs.length === 0) { alert('请至少选择一个席别偏好'); return; }
    const req = createStandby({ origin: originVal, dest: destVal, date: dateVal, trainCode, passengers, seatPrefs, deadlineMinutes: deadline, priority, deposit });
    setStandbyId(req.id);
    setStatus(req.status);
  };

  useEffect(() => {
    if (!standbyId) return;
    const t = window.setInterval(() => {
      const s = checkStandbyStatus(standbyId);
      if (s) {
        setStatus(s.status);
        setMatchedSeat(s.matchedSeatType);
        if (s.status === 'success' || s.status === 'expired' || s.status === 'cancelled') {
          window.clearInterval(t);
        }
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [standbyId]);

  const handleCancel = () => {
    if (!standbyId) return;
    cancelStandby(standbyId);
    setStatus('cancelled');
  };
  const handlePay = () => {
    if (!standbyId) return;
    const s = payStandby(standbyId);
    if (s) setStatus(s.status);
  };

  return (
    <div style={{maxWidth: 900, margin: '24px auto', background:'#fff', padding: 16, border:'1px solid #eee'}}>
      <h2 style={{color:'var(--brand)'}}>候补购票</h2>
      <p>当所选车次或席别无票时，可发起候补申请。系统将为您在有退票或新增放票时自动分配。</p>
      <div style={{marginTop:12, padding:12, background:'#f7faff', border:'1px solid #e1efff'}}>
        <div style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
          <label style={{display:'inline-flex', alignItems:'center', gap:6}}>出发地：
            <select value={originVal} onChange={e=>setOriginVal(e.target.value)}>
              <option value="">请选择城市</option>
              {popularCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <span>→</span>
          <label style={{display:'inline-flex', alignItems:'center', gap:6}}>目的地：
            <select value={destVal} onChange={e=>setDestVal(e.target.value)}>
              <option value="">请选择城市</option>
              {popularCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{display:'inline-flex', alignItems:'center', gap:6}}>日期：
            <input type="date" value={dateVal} min={todayLocalISO()} onChange={e=>setDateVal(e.target.value)} />
          </label>
        </div>
        {/* 此处不显示车次，车次选择在下方区域 */}
      </div>

      {!standbyId && (
        <form className="form" onSubmit={handleSubmit} style={{marginTop:16}}>
          <h3>选择出发日期与车次</h3>
          <div style={{display:'flex', gap:16, alignItems:'center'}}>
            <label>出发日期：
              <input type="date" value={dateVal} min={todayLocalISO()} onChange={e=>setDateVal(e.target.value)} />
            </label>
            <label>候补车次：
              <select value={trainCode} onChange={e=>setTrainCode(e.target.value)}>
                <option value="">请选择车次</option>
                {trainList.map(t => (
                  <option key={t.code} value={t.code}>{t.code} {t.depart}-{t.arrive}</option>
                ))}
              </select>
            </label>
          </div>
          {loadingTrains && <div className="hint" style={{marginTop:8}}>正在加载车次...</div>}
          {!loadingTrains && trainList.length === 0 && <div className="hint" style={{marginTop:8}}>该日期暂无可候补车次，请更换日期</div>}

          <h3 style={{marginTop:16}}>乘客信息</h3>
          {passengers.map((p,idx)=> (
            <div key={idx} style={{display:'flex', gap:8, marginBottom:8}}>
              <input type="text" placeholder="姓名" value={p.name} onChange={e=>updatePassenger(idx,{name:e.target.value})} />
              <select value={p.idType} onChange={e=>updatePassenger(idx, { idType: e.target.value as ('ID'|'Passport') })}>
                <option value="ID">身份证</option>
                <option value="Passport">护照</option>
              </select>
              <input type="text" placeholder="证件号" value={p.idNo} onChange={e=>updatePassenger(idx,{idNo:e.target.value})} style={{flex:1}} />
              <button type="button" className="link" onClick={() => removePassenger(idx)} disabled={passengers.length===1}>删除</button>
            </div>
          ))}
          <button type="button" className="link" onClick={addPassenger}>+ 添加乘客</button>

          <h3 style={{marginTop:16}}>席别偏好</h3>
          <div style={{display:'flex', gap:16}}>
            {(['sw','ydz','edz','wz'] as SeatType[]).map(s => (
              <label key={s}><input type="checkbox" checked={seatPrefs.includes(s)} onChange={()=>toggleSeatPref(s)} /> {seatLabels[s]}</label>
            ))}
          </div>

          <h3 style={{marginTop:16}}>截止时间与优先级</h3>
          <div style={{display:'flex', gap:16}}>
            <label>候补截止：
              <select value={deadline} onChange={e=>setDeadline(Number(e.target.value))}>
                <option value={120}>2小时</option>
                <option value={360}>6小时</option>
                <option value={1440}>24小时</option>
              </select>
            </label>
            <label>优先级：
              <select value={priority} onChange={e=>setPriority(e.target.value as ('time'|'price'))}>
                <option value="time">时间优先</option>
                <option value="price">价格优先</option>
              </select>
            </label>
          </div>

          <div style={{marginTop:16, padding:12, background:'#fffdf7', border:'1px solid #ffe6bf'}}>
            候补定金（演示）：¥{deposit}（按每位乘客¥50计）
          </div>

          <div style={{marginTop:16}}>
            <button className="primary" type="submit">发起候补</button>
            <NavLink to="/results" style={{marginLeft:12}}>返回查询结果</NavLink>
          </div>
        </form>
      )}

      {standbyId && (
        <div style={{marginTop:16}}>
          <h3>候补申请已提交</h3>
          <div>编号：{standbyId}</div>
          <div>当前状态：{
            status === 'submitted' ? '待支付' :
            status === 'matching' ? '匹配中' :
            status === 'success' ? '候补成功' :
            status === 'expired' ? '已过期' :
            status === 'cancelled' ? '已取消' :
            '未知'
          }</div>
          {status === 'success' && (
            <div style={{marginTop:8}}>已候补到席别：{matchedSeat ? seatLabels[matchedSeat] : '无'}</div>
          )}
          <div style={{marginTop:12}}>
            {status === 'submitted' && <button className="primary" onClick={handlePay}>支付定金</button>}
            {status === 'matching' && <button className="link" onClick={handleCancel}>取消候补</button>}
            <NavLink to="/results" style={{marginLeft:12}}>返回查询结果</NavLink>
          </div>
        </div>
      )}
    </div>
  );
};

export default Standby;
