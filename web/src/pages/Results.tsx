import React from 'react';
import './results.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchTrains } from '../services/trains';
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
      navigate(`/checkout/${order.id}`);
    }
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
              <td><button className="primary" onClick={() => handleBook(r)}>{((r.types.sw ?? 0)+(r.types.ydz ?? 0)+(r.types.edz ?? 0)+(r.types.wz ?? 0))<=0 ? '候补' : '预订'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="hint">演示数据，仅用于界面展示。无票时会在此处显示候补入口。</div>
    </div>
  );
}

export default Results;