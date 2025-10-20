import React from 'react';
import './results.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchTrains, decrementInventory } from '../services/trains';
import { isLoggedIn, getSession } from '../services/auth';
import { addOrder } from '../services/orders';
import type { Order } from '../types/order';
import type { Train, SearchQuery } from '../types/train'


// 数据由服务层基于城市对动态生成

function timeToMinutes(t: string) {
  // 'HH:mm' or 'HH:mm+1' (next day)
  const nextDay = t.includes('+1');
  const [hh, mm] = t.replace('+1', '').split(':').map(Number);
  return (hh * 60 + mm) + (nextDay ? 24 * 60 : 0);
}
function durationToMinutes(d: string) {
  // '4h30m'
  const hMatch = d.match(/(\d+)h/);
  const mMatch = d.match(/(\d+)m/);
  const h = hMatch ? Number(hMatch[1]) : 0;
  const m = mMatch ? Number(mMatch[1]) : 0;
  return h * 60 + m;
}
function lowestPrice(p: Train['price']) {
  return Math.min(...Object.values(p).map(v => v ?? Infinity));
}
function isHighSpeed(code: string) {
  return /^G|^D/.test(code);
}

function pickSeatAndPrice(train: Train): { seatType: 'sw'|'ydz'|'edz'|'wz'; price: number } {
  const candidates: Array<{type:'sw'|'ydz'|'edz'|'wz'; avail:number; price:number|undefined}> = [
    { type:'sw', avail: train.types.sw ?? 0, price: train.price.sw },
    { type:'ydz', avail: train.types.ydz ?? 0, price: train.price.ydz },
    { type:'edz', avail: train.types.edz ?? 0, price: train.price.edz },
    { type:'wz', avail: train.types.wz ?? 0, price: train.price.wz },
  ];
  const available = candidates.filter(c => c.avail > 0);
  if (available.length === 0) return { seatType: 'wz', price: train.price.wz ?? 0 };
  // 选择价格最低的可用席别，若价格缺失则视为Infinity
  const best = available.sort((a,b)=> (a.price ?? Infinity) - (b.price ?? Infinity))[0];
  return { seatType: best.type, price: best.price ?? 0 };
}
// 新增：选择席别的默认逻辑（仅在商务/一等/二等中选择最低价且有票）
function defaultSelectableSeat(train: Train): 'sw'|'ydz'|'edz' {
  const candidates: Array<'sw'|'ydz'|'edz'> = ['edz','ydz','sw'];
  const available = candidates
    .map(t => ({ t, avail: train.types[t] ?? 0, price: train.price[t] ?? Infinity }))
    .filter(x => x.avail > 0)
    .sort((a,b)=> a.price - b.price);
  return available.length ? available[0].t : 'edz';
}

const Results: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const origin = params.get('origin') || '';
  const dest = params.get('dest') || '';
  const date = params.get('date') || '';
  const hs = params.get('hs') === '1';
  const stu = params.get('stu') === '1';

  const [sortBy, setSortBy] = React.useState<'depart'|'arrive'|'duration'|'price'>('depart');
  const [seatFilter, setSeatFilter] = React.useState<'all'|'sw'|'ydz'|'edz'|'wz'>('all');
  // 新增：记录每个车次的所选席别（商务/一等/二等）
  const [selectedSeats, setSelectedSeats] = React.useState<Record<string, 'sw'|'ydz'|'edz'>>({});

  const [data, setData] = React.useState<Train[]>([]);
  React.useEffect(()=>{
    const q: SearchQuery = { origin, dest, date, hs, stu };
    fetchTrains(q).then(setData);
  }, [origin, dest, date, hs, stu]);

  const filtered = React.useMemo(() => {
    let dataSrc = [...data];
    if (hs) dataSrc = dataSrc.filter(d => isHighSpeed(d.code));
    if (seatFilter !== 'all') dataSrc = dataSrc.filter(d => (d.types[seatFilter] ?? 0) > 0);
    if (stu) dataSrc = dataSrc.sort((a, b) => (a.types.edz ?? 0) > (b.types.edz ?? 0) ? -1 : 1);
    return dataSrc;
  }, [data, hs, seatFilter, stu]);

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'depart': return timeToMinutes(a.depart) - timeToMinutes(b.depart);
        case 'arrive': return timeToMinutes(a.arrive) - timeToMinutes(b.arrive);
        case 'duration': return durationToMinutes(a.duration) - durationToMinutes(b.duration);
        case 'price': return lowestPrice(a.price) - lowestPrice(b.price);
      }
    });
  }, [filtered, sortBy]);

  const handleBook = (train: Train) => {
    const available = (train.types.sw ?? 0) + (train.types.ydz ?? 0) + (train.types.edz ?? 0) + (train.types.wz ?? 0);
    if (available <= 0) {
      const qs = `origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}&train=${encodeURIComponent(train.code)}`;
      navigate(`/standby?${qs}`);
      return;
    }
    if (!isLoggedIn()) {
      navigate('/login', { state: { from: '/results' } });
    } else {
      // 已登录：生成订单草稿并跳转订单中心
      const session = getSession();
      const { seatType, price } = pickSeatAndPrice(train);
      const order: Order = {
        id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
        origin,
        dest,
        date,
        passengers: [{ name: session?.username || '乘客', idType: 'ID', idNo: '' }],
        item: { trainCode: train.code, seatType, price },
        status: 'pending',
        createdAt: Date.now(),
      };
      addOrder(order);
      // 扣减库存：所选席别余票 - 乘客人数
      decrementInventory(train.code, seatType as any, order.passengers.length);
      navigate(`/checkout/${order.id}`);
    }
  };
  // 新增：使用所选席别生成订单草稿
  const handleBookWithSeat = (train: Train, seatType: 'sw'|'ydz'|'edz') => {
    const totalAvail = (train.types.sw ?? 0) + (train.types.ydz ?? 0) + (train.types.edz ?? 0) + (train.types.wz ?? 0);
    if (totalAvail <= 0) {
      const qs = `origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}&train=${encodeURIComponent(train.code)}`;
      navigate(`/standby?${qs}`);
      return;
    }
    if (!isLoggedIn()) {
      navigate('/login', { state: { from: '/results' } });
      return;
    }
    const session = getSession();
    const price = train.price[seatType] ?? 0;
    const order: Order = {
      id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      origin,
      dest,
      date,
      passengers: [{ name: session?.username || '乘客', idType: 'ID', idNo: '' }],
      item: { trainCode: train.code, seatType, price },
      status: 'pending',
      createdAt: Date.now(),
    };
    addOrder(order);
    // 扣减库存：所选席别余票 - 乘客人数
    decrementInventory(train.code, seatType as any, order.passengers.length);
    navigate(`/checkout/${order.id}`);
  };

  return (
    <div className="results-page">
      <div className="summary">{origin || '出发地'} → {dest || '目的地'} · {date || '出发日期'} {hs? '· 高铁动车':''} {stu? '· 学生':''}</div>
      <div className="filters">
        <label>席别：
          <select value={seatFilter} onChange={e=>setSeatFilter(e.target.value as any)}>
            <option value="all">全部</option>
            <option value="sw">商务座</option>
            <option value="ydz">一等座</option>
            <option value="edz">二等座</option>
            <option value="wz">无座</option>
          </select>
        </label>
        <label>排序：
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}>
            <option value="depart">出发时间升序</option>
            <option value="arrive">到达时间升序</option>
            <option value="duration">历时升序</option>
            <option value="price">价格最低</option>
          </select>
        </label>
      </div>

      <table className="list">
        <thead>
          <tr>
            <th>车次</th><th>出发-到达</th><th>历时</th><th>商务座</th><th>一等座</th><th>二等座</th><th>无座</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r)=> (
            <tr key={r.code}>
              <td>{r.code}</td>
              <td>{r.depart} - {r.arrive}</td>
              <td>{r.duration}</td>
              <td>{r.types.sw ?? '--'}</td>
              <td>{r.types.ydz ?? '--'}</td>
              <td>{r.types.edz ?? '--'}</td>
              <td>{r.types.wz ?? '--'}</td>
              <td>{(((r.types.sw ?? 0)+(r.types.ydz ?? 0)+(r.types.edz ?? 0)+(r.types.wz ?? 0))<=0) ? (
                <button className="primary" onClick={() => { const qs = `origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}&train=${encodeURIComponent(r.code)}`; navigate(`/standby?${qs}`); }}>候补</button>
              ) : (
                (() => {
                  const selected = selectedSeats[r.code] ?? defaultSelectableSeat(r);
                  const setSelected = (val: 'sw'|'ydz'|'edz') => setSelectedSeats(prev => ({ ...prev, [r.code]: val }));
                  const swLabel = `商务座${r.price.sw? ' ￥'+r.price.sw:''}（余票${r.types.sw ?? 0}）`;
                  const ydzLabel = `一等座${r.price.ydz? ' ￥'+r.price.ydz:''}（余票${r.types.ydz ?? 0}）`;
                  const edzLabel = `二等座${r.price.edz? ' ￥'+r.price.edz:''}（余票${r.types.edz ?? 0}）`;
                  const selectedAvail = (r.types as any)[selected] ?? 0;
                  return (
                    <span style={{display:'inline-flex', gap:8, alignItems:'center'}}>
                      <select value={selected} onChange={e => setSelected(e.target.value as 'sw'|'ydz'|'edz')}>
                        <option value="sw" disabled={(r.types.sw ?? 0) <= 0}>{swLabel}</option>
                        <option value="ydz" disabled={(r.types.ydz ?? 0) <= 0}>{ydzLabel}</option>
                        <option value="edz" disabled={(r.types.edz ?? 0) <= 0}>{edzLabel}</option>
                      </select>
                      <button className="primary" disabled={selectedAvail <= 0} onClick={() => handleBookWithSeat(r, selected)}>预订</button>
                    </span>
                  );
                })()
              )}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="hint">演示数据，仅用于界面展示。无票时会在此处显示候补入口。</div>
    </div>
  );
}

export default Results;