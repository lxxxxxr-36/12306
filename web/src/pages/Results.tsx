import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { popularCities } from '../constants/cities';
import { getSession, isLoggedIn } from '../services/auth';
import { addOrder } from '../services/orders';
import { decrementInventory, fetchTrains } from '../services/trains';
import type { Order } from '../types/order';
import type { SearchQuery, Train } from '../types/train';
import './results.css';


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
 // 汇总余票总数（商务/一等/二等/无座）
 function totalAvail(t: Train) {
   return (t.types.sw ?? 0) + (t.types.ydz ?? 0) + (t.types.edz ?? 0) + (t.types.wz ?? 0);
 }
 function isHighSpeed(code: string) {
   return /^G|^D/.test(code);
 }

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
// 已移至下单页处理席别选择

 // 工具：日期比较（严格晚于）
// 日期比较逻辑已移动到表单页
 function todayLocalISO() {
   const d = new Date();
   d.setHours(0,0,0,0);
   const off = d.getTimezoneOffset()*60000;
   return new Date(d.getTime()-off).toISOString().split('T')[0];
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
  const ticketType = (params.get('ticketType') as ('oneway'|'roundtrip') | null) || 'oneway';
  const returnDate = params.get('returnDate') || '';
  const doSearch = params.get('search') === '1';
  const transferParam = params.get('transfer');
  const [originFocus, setOriginFocus] = React.useState(false);
  const [destFocus, setDestFocus] = React.useState(false);
 // roundtrip 校验移至后续表单
  const isDepartValidToday = React.useMemo(() => !!date && date >= todayLocalISO(), [date]);
  const [sortBy, setSortBy] = React.useState<'depart'|'arrive'|'duration'|'price'>('depart');
   const [seatFilter, setSeatFilter] = React.useState<'all'|'sw'|'ydz'|'edz'|'wz'>('all');
   // 新增：记录每个车次的所选席别（商务/一等/二等）
  // 新增：中转换乘
  const [showTransfer, setShowTransfer] = React.useState(transferParam === '1' || transferParam === 'true');
  React.useEffect(() => {
    const p = new URLSearchParams(search);
    const t = p.get('transfer');
    setShowTransfer(t === '1' || t === 'true');
  }, [search]);
   const [transferOptions, setTransferOptions] = React.useState<Array<{ mid: string; a: Train; b: Train }>>([]);
   const [loadingTransfer, setLoadingTransfer] = React.useState(false);
  // 新增：更贴近12306的筛选项
  const [onlyAvailable, setOnlyAvailable] = React.useState(false);
  const [departSlot, setDepartSlot] = React.useState<'all'|'0-6'|'6-12'|'12-18'|'18-24'>('all');
  const [typeFilter, setTypeFilter] = React.useState<{G:boolean; D:boolean}>({ G: true, D: true });
  const [filtersCollapsed, setFiltersCollapsed] = React.useState(false);
  const [openDetail, setOpenDetail] = React.useState<Record<string, boolean>>({});
  const originStations = React.useMemo(() => {
    if (origin === '上海') return ['上海虹桥','上海','上海南'];
    if (origin === '北京') return ['北京南','北京','北京西'];
    return origin ? [origin] : [];
  }, [origin]);
  const destStations = React.useMemo(() => {
    if (dest === '上海') return ['上海虹桥','上海','上海南'];
    if (dest === '北京') return ['北京南','北京','北京西'];
    return dest ? [dest] : [];
  }, [dest]);
  const [checkedOriginStations, setCheckedOriginStations] = React.useState<string[]>([]);
  const [checkedDestStations, setCheckedDestStations] = React.useState<string[]>([]);
  React.useEffect(()=>{ setCheckedOriginStations(originStations); }, [originStations]);
  React.useEffect(()=>{ setCheckedDestStations(destStations); }, [destStations]);
  React.useEffect(() => {
    if (!date || !origin || !dest || (ticketType === 'roundtrip' && !returnDate)) {
      const today = todayLocalISO();
      const qs = new URLSearchParams({
        origin: origin || '北京',
        dest: dest || '成都',
        date: today,
        hs: hs ? '1' : '0',
        stu: stu ? '1' : '0',
        ticketType,
        ...(ticketType === 'roundtrip' ? { returnDate: returnDate || today } : {}),
        search: '0',
      });
      navigate(`/results?${qs.toString()}` , { replace: true });
    }
  }, [date, origin, dest, returnDate, ticketType]);

  const [data, setData] = React.useState<Train[]>([]);
  React.useEffect(()=>{
    if (!doSearch) { setData([]); return; }
    const q: SearchQuery = { origin, dest, date, hs, stu };
    fetchTrains(q).then(setData);
  }, [origin, dest, date, hs, stu, doSearch]);

  // 计算中转换乘候选
  React.useEffect(() => {
    if (!showTransfer) { setTransferOptions([]); return; }
    let cancelled = false;
    async function calc() {
      setLoadingTransfer(true);
      const mids = popularCities.filter(c => c !== origin && c !== dest);
      const out: Array<{ mid: string; a: Train; b: Train }> = [];

      let weightedResults: { w: number, a: Train, b: Train }[] = [];

      for (const mid of mids) {
        const leg1 = await fetchTrains({ origin, dest: mid, date, hs, stu });
        const leg2 = await fetchTrains({ origin: mid, dest, date, hs, stu });
        for (const t1 of leg1) {
          const t1Arr = timeToMinutes(t1.arrive);
          const candidates2 = leg2.filter(t2 => timeToMinutes(t2.depart) >= t1Arr + 30 && timeToMinutes(t2.depart) <= t1Arr + 180);
          for (const t2 of candidates2) {
            const w = (timeToMinutes(t1.arrive) - timeToMinutes(t1.depart)) + (timeToMinutes(t2.arrive) - timeToMinutes(t2.depart)) + (timeToMinutes(t2.depart) - t1Arr) * 3;
            weightedResults.push({ w, a: t1, b: t2 });
          }
        }
      }

      weightedResults = weightedResults.sort((x, y) => x.w - y.w).slice(0, 200);
      const byMid = new Map<string, typeof weightedResults>();
      for (const result of weightedResults) {
        if (!byMid.has(result.a.dest)) byMid.set(result.a.dest, []);
        byMid.get(result.a.dest)!.push(result);
      }
      for (const results of byMid.values()) {
        for (const result of results.slice(0, 3)) {
          out.push({ mid: result.a.dest, a: result.a, b: result.b });
        }
      }

      if (!cancelled) {
        setTransferOptions(out);
        setLoadingTransfer(false);
      }
    }
    calc();
    return () => { cancelled = true; };
  }, [showTransfer, origin, dest, date, hs, stu]);

  const filtered = React.useMemo(() => {
    let dataSrc = [...data];
    if (hs) dataSrc = dataSrc.filter(d => isHighSpeed(d.code));
    if (seatFilter !== 'all') dataSrc = dataSrc.filter(d => (d.types[seatFilter] ?? 0) > 0);
    // 仅看有票：同时剔除已截止售票的车次（距发车不足30分钟）
    if (onlyAvailable) {
      const now = Date.now();
      dataSrc = dataSrc.filter(d => {
        const hasTickets = totalAvail(d) > 0;
        const isCutoff = (combineLocalDateTimeMs(date, d.depart) - now) < 30 * 60 * 1000;
        return hasTickets && !isCutoff;
      });
    }
    // 出发时段筛选
    if (departSlot !== 'all') {
      const range = {
        '0-6': [0, 6*60],
        '6-12': [6*60, 12*60],
        '12-18': [12*60, 18*60],
        '18-24': [18*60, 24*60],
      }[departSlot];
      dataSrc = dataSrc.filter(d => {
        const m = timeToMinutes(d.depart) % (24*60);
        return m >= (range as [number, number])[0] && m < (range as [number, number])[1];
      });
    }
    // 车次类型筛选（G/D）
    const activeTypes = Object.entries(typeFilter).filter(([,v])=>v).map(([k])=>k);
    if (activeTypes.length > 0 && activeTypes.length < 2) {
      dataSrc = dataSrc.filter(d => activeTypes.includes(d.code[0]));
    }
    if (stu) dataSrc = dataSrc.sort((a, b) => (a.types.edz ?? 0) > (b.types.edz ?? 0) ? -1 : 1);
    return dataSrc;
  }, [data, hs, seatFilter, onlyAvailable, departSlot, typeFilter, stu]);

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


   // 新增：使用所选席别生成订单草稿
  // 下单逻辑移动到 /checkout/new 页面
// 新增：往返下单（生成两笔订单）
// 往返与联程逻辑暂保持原有入口
// 新增：联程（中转换乘）下单（两笔订单）
const handleBookTransfer = (opt: { mid: string; a: Train; b: Train }) => {
  if (!isDepartValidToday) { alert('出发日期不能早于今天'); return; }
  const departMs = combineLocalDateTimeMs(date, opt.a.depart);
  if (departMs - Date.now() < 30 * 60 * 1000) { alert('距发车不足30分钟，停止售票'); return; }
  if (!isLoggedIn()) { navigate('/login', { state: { from: '/results' } }); return; }
  const session = getSession();
  const groupId = 'G' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const pickA = pickSeatAndPrice(opt.a);
  const pickB = pickSeatAndPrice(opt.b);
  const orderA: Order = {
    id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    origin,
    dest: opt.mid,
    date,
    passengers: [{ name: session?.username || '乘客', idType: 'ID', idNo: '' }],
    item: { trainCode: opt.a.code, seatType: pickA.seatType, price: Math.round((pickA.price ?? 0) * (stu ? 0.9 : 1)) },
    status: 'pending',
    createdAt: Date.now(),
    groupId,
  };
  addOrder(orderA);
  decrementInventory(opt.a.code, pickA.seatType as import('../types/train').SeatType, orderA.passengers.length);
  const orderB: Order = {
    id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    origin: opt.mid,
    dest,
    date,
    passengers: [{ name: session?.username || '乘客', idType: 'ID', idNo: '' }],
    item: { trainCode: opt.b.code, seatType: pickB.seatType, price: Math.round((pickB.price ?? 0) * (stu ? 0.9 : 1)) },
    status: 'pending',
    createdAt: Date.now(),
    groupId,
  };
  addOrder(orderB);
  decrementInventory(opt.b.code, pickB.seatType as import('../types/train').SeatType, orderB.passengers.length);
  navigate(`/checkout/${orderA.id}`);
};

  const handleQuery = () => {
    const today = todayLocalISO();
    if (!date || date < today) { alert('出发日期不能早于今天'); return; }
    if (ticketType === 'roundtrip') {
      if (!returnDate) { alert('请选择返程日期'); return; }
      const depart = new Date(date);
      const back = new Date(returnDate);
      if (back.getTime() < depart.getTime()) { alert('返程日期不能早于出发日期'); return; }
    }
    const qs = new URLSearchParams({
      origin,
      dest,
      date,
      hs: hs ? '1' : '0',
      stu: stu ? '1' : '0',
      ticketType,
      ...(ticketType === 'roundtrip' && returnDate ? { returnDate } : {}),
      search: '1',
    });
    navigate(`/results?${qs.toString()}`);
  };

  return (
    <div className="results-page">
      <div className="searchbar">
        <div className="row">
          <div className="radio-group">
            <label><input type="radio" name="ticketType" value="oneway" checked={ticketType==='oneway'} onChange={()=>navigate(`/results?${new URLSearchParams({ origin, dest, date, hs: hs? '1':'0', stu: stu? '1':'0', ticketType:'oneway', search:'0' }).toString()}`)} /> 单程</label>
            <label><input type="radio" name="ticketType" value="roundtrip" checked={ticketType==='roundtrip'} onChange={()=>navigate(`/results?${new URLSearchParams({ origin, dest, date, hs: hs? '1':'0', stu: stu? '1':'0', ticketType:'roundtrip', ...(returnDate?{returnDate}:{}) , search:'0'}).toString()}`)} /> 往返</label>
          </div>
          <div className="fields">
            <div style={{position:'relative'}}>
              <input
                className="input"
                value={origin}
                placeholder="出发地"
                onFocus={e=>{ e.target.select(); setOriginFocus(true); }}
                onBlur={()=>setTimeout(()=>setOriginFocus(false),120)}
                onChange={e=>navigate(`/results?${new URLSearchParams({ origin: e.target.value, dest, date, hs: hs? '1':'0', stu: stu? '1':'0', ticketType, ...(returnDate?{returnDate}:{}) , search:'0'}).toString()}`)}
              />
              {originFocus && (
              <div className="suggestions">
                {popularCities.map(c => (
                  <button key={c} className="suggestion" onMouseDown={e=>e.preventDefault()} onClick={()=>navigate(`/results?${new URLSearchParams({ origin: c, dest, date, hs: hs? '1':'0', stu: stu? '1':'0', ticketType, ...(returnDate?{returnDate}:{}) , search:'0'}).toString()}`)}>{c}</button>
                ))}
              </div>
              )}
            </div>
            <span className="swap">→</span>
            <div style={{position:'relative'}}>
              <input
                className="input"
                value={dest}
                placeholder="目的地"
                onFocus={e=>{ e.target.select(); setDestFocus(true); }}
                onBlur={()=>setTimeout(()=>setDestFocus(false),120)}
                onChange={e=>navigate(`/results?${new URLSearchParams({ origin, dest: e.target.value, date, hs: hs? '1':'0', stu: stu? '1':'0', ticketType, ...(returnDate?{returnDate}:{}) , search:'0'}).toString()}`)}
              />
              {destFocus && (
              <div className="suggestions">
                {popularCities.map(c => (
                  <button key={c} className="suggestion" onMouseDown={e=>e.preventDefault()} onClick={()=>navigate(`/results?${new URLSearchParams({ origin, dest: c, date, hs: hs? '1':'0', stu: stu? '1':'0', ticketType, ...(returnDate?{returnDate}:{}) , search:'0'}).toString()}`)}>{c}</button>
                ))}
              </div>
              )}
            </div>
            <input type="date" className="input" value={date || todayLocalISO()} min={todayLocalISO()} onFocus={e=>{ /* 原生会弹日历 */ }} onChange={e=>navigate(`/results?${new URLSearchParams({ origin, dest, date: e.target.value, hs: hs? '1':'0', stu: stu? '1':'0', ticketType, ...(returnDate?{returnDate}:{}) , search:'0'}).toString()}`)} />
            {ticketType==='roundtrip' && (
              <input type="date" className="input" value={returnDate || date || todayLocalISO()} min={date || undefined} onChange={e=>navigate(`/results?${new URLSearchParams({ origin, dest, date, returnDate: e.target.value, hs: hs? '1':'0', stu: stu? '1':'0', ticketType, search:'0' }).toString()}`)} />
            )}
            <div className="radio-group" style={{marginLeft:12}}>
              <label><input type="radio" name="stu" checked={!stu} onChange={()=>navigate(`/results?${new URLSearchParams({ origin, dest, date, hs: hs?'1':'0', stu:'0', ticketType, ...(returnDate?{returnDate}:{}) }).toString()}`)} /> 普通</label>
              <label><input type="radio" name="stu" checked={stu} onChange={()=>navigate(`/results?${new URLSearchParams({ origin, dest, date, hs: hs?'1':'0', stu:'1', ticketType, ...(returnDate?{returnDate}:{}) }).toString()}`)} /> 学生</label>
            </div>
            <button className="search-btn" onClick={handleQuery}>查询</button>
          </div>
        </div>
        <div className="tabs-panel">
          <div className="tabs-header">
            <div className="tabs-head-scroll">
              {Array.from({length:15}).map((_,i)=>{
                const base = new Date(todayLocalISO());
                base.setDate(base.getDate()+i);
                const off = base.getTimezoneOffset()*60000;
                const dstr = new Date(base.getTime()-off).toISOString().split('T')[0];
                const disp = `${String(base.getMonth()+1).padStart(2,'0')}-${String(base.getDate()).padStart(2,'0')} ${['周日','周一','周二','周三','周四','周五','周六'][base.getDay()]}`;
                const active = dstr===date;
                return (
                  <button key={i} className={"tab"+(active?" active":"")} onClick={()=>navigate(`/results?${new URLSearchParams({ origin, dest, date: dstr, hs: hs?'1':'0', stu: stu?'1':'0', ticketType, ...(ticketType==='roundtrip' && returnDate ? { returnDate } : {}), search:'1' }).toString()}`)}>{disp}</button>
                );
              })}
            </div>
            <span className="header-right">
              <label>发车时间：</label>
              <select value={departSlot} onChange={e=>setDepartSlot(e.target.value as ('all'|'0-6'|'6-12'|'12-18'|'18-24'))}>
                <option value="all">00:00~24:00</option>
                <option value="0-6">00:00~06:00</option>
                <option value="6-12">06:00~12:00</option>
                <option value="12-18">12:00~18:00</option>
                <option value="18-24">18:00~24:00</option>
              </select>
            </span>
          </div>
          {!filtersCollapsed && (
            <div className="tabs-body">
              <div className="summary-line">{origin || '出发地'} → {dest || '目的地'}（{date || todayLocalISO()}）</div>
              <div className="checkbox-rows">
              <div className="row-line">
                <div className="row-title">车次类型：</div>
                <button className="row-all" onClick={()=>setTypeFilter({G:true,D:true})}>全选</button>
                <label className="row-check"><input type="checkbox" checked={typeFilter.G} onChange={e=>setTypeFilter(p=>({ ...p, G: e.target.checked }))} />GC-高铁/城际</label>
                <label className="row-check"><input type="checkbox" checked={typeFilter.D} onChange={e=>setTypeFilter(p=>({ ...p, D: e.target.checked }))} />D-动车</label>
                <label className="row-check disabled"><input type="checkbox" disabled />Z-直达</label>
                <label className="row-check disabled"><input type="checkbox" disabled />T-特快</label>
                <label className="row-check disabled"><input type="checkbox" disabled />K-快速</label>
                <label className="row-check disabled"><input type="checkbox" disabled />其他</label>
                <label className="row-check disabled"><input type="checkbox" disabled />复兴号</label>
                <label className="row-check disabled"><input type="checkbox" disabled />智能动车组</label>
              </div>
              <div className="row-line">
                <div className="row-title">出发车站：</div>
                <button className="row-all" onClick={()=>setCheckedOriginStations(originStations)}>全选</button>
                {originStations.map(s => (
                  <label key={s} className="row-check"><input type="checkbox" checked={checkedOriginStations.includes(s)} onChange={e=>{
                    if (e.target.checked) setCheckedOriginStations(prev => Array.from(new Set([...prev, s])));
                    else setCheckedOriginStations(prev => prev.filter(x=>x!==s));
                  }} />{s}</label>
                ))}
              </div>
              <div className="row-line">
                <div className="row-title">到达车站：</div>
                <button className="row-all" onClick={()=>setCheckedDestStations(destStations)}>全选</button>
                {destStations.map(s => (
                  <label key={s} className="row-check"><input type="checkbox" checked={checkedDestStations.includes(s)} onChange={e=>{
                    if (e.target.checked) setCheckedDestStations(prev => Array.from(new Set([...prev, s])));
                    else setCheckedDestStations(prev => prev.filter(x=>x!==s));
                  }} />{s}</label>
                ))}
              </div>
              <div className="row-line">
                <div className="row-title">车次席别：</div>
                <button className="row-all" onClick={()=>setSeatFilter('all')}>全部</button>
                <label className="row-check"><input type="checkbox" checked={seatFilter==='sw'} onChange={()=>setSeatFilter('sw')} />商务座</label>
                <label className="row-check"><input type="checkbox" checked={seatFilter==='ydz'} onChange={()=>setSeatFilter('ydz')} />一等座</label>
                <label className="row-check"><input type="checkbox" checked={seatFilter==='edz'} onChange={()=>setSeatFilter('edz')} />二等座</label>
                <label className="row-check disabled"><input type="checkbox" disabled />软卧</label>
                <label className="row-check disabled"><input type="checkbox" disabled />硬卧</label>
              </div>
              </div>
            </div>
          )}
          <div className="panel-footer">
            <button className="collapse-toggle" onClick={()=>setFiltersCollapsed(v=>!v)}>筛选</button>
          </div>
        </div>
      </div>
      <div className="filters flat">
        <label>席别：
          <select value={seatFilter} onChange={e=>setSeatFilter(e.target.value as ('all'|'sw'|'ydz'|'edz'|'wz'))}>
            <option value="all">全部</option>
            <option value="sw">商务座</option>
            <option value="ydz">一等座</option>
            <option value="edz">二等座</option>
            <option value="wz">无座</option>
          </select>
        </label>
         <label>排序：
           <select value={sortBy} onChange={e=>setSortBy(e.target.value as ('depart'|'arrive'|'duration'|'price'))}>
             <option value="depart">出发时间升序</option>
             <option value="arrive">到达时间升序</option>
             <option value="duration">历时升序</option>
             <option value="price">价格最低</option>
         </select>
        </label>
        <label style={{marginLeft:12}}>
          时段：
          <select value={departSlot} onChange={e=>setDepartSlot(e.target.value as ('all'|'0-6'|'6-12'|'12-18'|'18-24'))}>
            <option value="all">全天</option>
            <option value="0-6">00:00 - 06:00</option>
            <option value="6-12">06:00 - 12:00</option>
            <option value="12-18">12:00 - 18:00</option>
            <option value="18-24">18:00 - 24:00</option>
          </select>
        </label>
        <span style={{marginLeft:12}}>
          车次类型：
          <label className="chip"><input type="checkbox" checked={typeFilter.G} onChange={e=>setTypeFilter(p=>({ ...p, G: e.target.checked }))} /><span>G高铁</span></label>
          <label className="chip"><input type="checkbox" checked={typeFilter.D} onChange={e=>setTypeFilter(p=>({ ...p, D: e.target.checked }))} /><span>D动车</span></label>
        </span>
        <label className="chip" style={{marginLeft:12}}>
          <input type="checkbox" checked={onlyAvailable} onChange={e=>setOnlyAvailable(e.target.checked)} /><span>仅看有票</span>
        </label>
        <label className="chip" style={{marginLeft:12}}>
          <input type="checkbox" checked={showTransfer} onChange={e=>setShowTransfer(e.target.checked)} /><span>显示中转换乘</span>
        </label>
      </div>

      <table className="list flat">
        <thead>
          <tr>
            <th>车次</th>
            <th>出发站/到达站</th>
            <th>出发时间/到达时间</th>
            <th>历时</th>
            <th>商务座</th>
            <th>一等座</th>
            <th>二等座</th>
            <th>无座</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {doSearch ? sorted.map((r)=> (
            <React.Fragment key={r.code}>
            <tr>
              <td><a className="train-code" href="#" onClick={(e)=>{e.preventDefault(); setOpenDetail(p=>({ ...p, [r.code]: !p[r.code] }));}}>{r.code}</a></td>
              <td>{origin} → {dest}</td>
              <td>{r.depart} → {r.arrive}</td>
              <td>{r.duration}</td>
              <td className={((r.types.sw??0)>0)?'ok':'none'}>{(r.types.sw??0)>0?'有':'--'}</td>
              <td className={((r.types.ydz??0)>0)?'ok':'none'}>{(r.types.ydz??0)>0?'有':'--'}</td>
              <td className={((r.types.edz??0)>0)?'ok':'none'}>{(r.types.edz??0)>0?'有':'--'}</td>
              <td className={((r.types.wz??0)>0)?'ok':'none'}>{(r.types.wz??0)>0?'有':'--'}</td>
              <td>{(((r.types.sw ?? 0)+(r.types.ydz ?? 0)+(r.types.edz ?? 0)+(r.types.wz ?? 0))<=0) ? (
                <button className="primary" onClick={() => { const qs = `origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}&train=${encodeURIComponent(r.code)}`; navigate(`/standby?${qs}`); }}>候补</button>
              ) : (
                (() => { const isSaleCutoff = (combineLocalDateTimeMs(date, r.depart) - Date.now() < 30*60*1000);
                  return (
                    <span style={{display:'inline-flex', gap:8, alignItems:'center'}}>
                      <button className="primary" disabled={!isDepartValidToday || isSaleCutoff} title={isSaleCutoff ? '距发车不足30分钟，已截止售票' : undefined} onClick={() => navigate(`/checkout/new?origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}&train=${encodeURIComponent(r.code)}&stu=${stu?'1':'0'}`)}>{isSaleCutoff ? '已截止' : '预订'}</button>
                    </span>
                  );
                })()
              )}</td>
            </tr>
            {openDetail[r.code] && (
              <tr className="detail-row">
                <td colSpan={9}>
                  <div className="detail-box">
                    <div className="detail-title">票价信息</div>
                    <div className="detail-prices">
                      <span className={((r.types.sw??0)>0)?'price-tag':'price-tag disabled'}>商务座 ￥{Math.round((r.price.sw ?? 0) * (stu ? 0.9 : 1))}</span>
                      <span className={((r.types.ydz??0)>0)?'price-tag':'price-tag disabled'}>一等座 ￥{Math.round((r.price.ydz ?? 0) * (stu ? 0.9 : 1))}</span>
                      <span className={((r.types.edz??0)>0)?'price-tag':'price-tag disabled'}>二等座 ￥{Math.round((r.price.edz ?? 0) * (stu ? 0.9 : 1))}</span>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            </React.Fragment>
          )) : null}
          </tbody>
        </table>
         <div className="hint">{doSearch ? '演示数据，仅用于界面展示。无票时会在此处显示候补入口。' : '请设置出发地/目的地与日期后点击查询'}</div>
      {showTransfer && (
        <div style={{marginTop:24}}>
          <h3 style={{margin:'8px 0'}}>中转换乘候选</h3>
          {loadingTransfer ? (
            <div>正在计算联程方案...</div>
          ) : transferOptions.length === 0 ? (
            <div>暂无合适的中转换乘方案</div>
          ) : (
            <table className="list">
              <thead>
                <tr>
                  <th>去程车次</th><th>中转站</th><th>返程车次</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {transferOptions.map((opt, idx) => (
                  <tr key={idx}>
                    <td>{opt.a.code} · {origin}→{opt.mid} · {opt.a.depart}-{opt.a.arrive}</td>
                    <td>{opt.mid}</td>
                    <td>{opt.b.code} · {opt.mid}→{dest} · {opt.b.depart}-{opt.b.arrive}</td>
                    <td>
                      <button className="primary" onClick={() => handleBookTransfer(opt)}>预订联程</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
     </div>
   );
 }

 export default Results;
