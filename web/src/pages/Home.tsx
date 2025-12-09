import React from 'react';
import { useNavigate } from 'react-router-dom';
import Carousel from '../components/Carousel';
import { popularCities } from '../constants/cities';
import { isLoggedIn } from '../services/auth';
import './home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = React.useState('');
  const [dest, setDest] = React.useState('');
  const [date, setDate] = React.useState('');
  const [onlyHighSpeed, setOnlyHighSpeed] = React.useState(false);
  const [isStudent, setIsStudent] = React.useState(false);
  // 新增：票种（单程/往返）与返程日期
  const [ticketType, setTicketType] = React.useState<'oneway'|'roundtrip'>('oneway');
  const [returnDate, setReturnDate] = React.useState('');
  const todayLocalISO = (() => { const d = new Date(); d.setHours(0,0,0,0); const off = d.getTimezoneOffset()*60000; return new Date(d.getTime()-off).toISOString().split('T')[0]; })();

  // 轮播图数据
  const carouselItems = [
    {
      image: '/media/real-site-pic/banner20201223.jpg',
      link: 'https://kyfw.12306.cn/otn/view/commutation_index.html'
    },
    {
      image: '/media/real-site-pic/banner20200707.jpg',
    },
    {
      image: '/media/real-site-pic/banner0619.jpg',
    },
    {
      image: '/media/real-site-pic/banner26.jpg',
      link: 'https://exservice.12306.cn/excater/index.html'
    },
    {
      image: '/media/real-site-pic/banner10.jpg',
      link: 'https://cx.12306.cn/tlcx/index.html'
    },
    {
      image: '/media/real-site-pic/banner12.jpg',
    },
  ];
  // 默认日期设为今天
  React.useEffect(() => { if (!date) setDate(todayLocalISO); }, [date, todayLocalISO]);
  // 登录后回填上次选择的出发地/到达地
  React.useEffect(() => {
    if (isLoggedIn()) {
      const lastOrigin = localStorage.getItem('lastOrigin') || '';
      const lastDest = localStorage.getItem('lastDest') || '';
      if (lastOrigin) setOrigin(lastOrigin);
      if (lastDest) setDest(lastDest);
    }
  }, []);

  // 城市选项按字母表（locale）排序
  const sortedCities = React.useMemo(() => {
    return [...popularCities].sort((a,b)=>a.localeCompare(b,'zh'));
  }, []);

  // 一键调换出发地与到达地（图标按钮）
  const handleSwap = () => { const o = origin; const d = dest; setOrigin(d); setDest(o); };
  // 清空选择按钮：重置出发地、到达地与日期
  const handleClear = () => { setOrigin(''); setDest(''); setDate(todayLocalISO); };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !dest) { alert('请选择出发地与到达地'); return; }
    // 输入必须存在于站点列表
    if (!sortedCities.includes(origin)) { alert('输入的出发地不存在，请选择有效站点'); return; }
    if (!sortedCities.includes(dest)) { alert('输入的到达地不存在，请选择有效站点'); return; }
    // 出发日期不得早于购票当日
    if (!date) { alert('请选择出发日期'); return; }
    if (date < todayLocalISO) { alert('出发日期不能早于今天'); return; }
    if (ticketType === 'roundtrip') {
      if (!returnDate) { alert('请选择返程日期'); return; }
      const depart = new Date(date);
      const back = new Date(returnDate);
      if (!(back.getTime() > depart.getTime())) { alert('返程日期必须晚于出发日期'); return; }
    }
    // 持久化上次选择
    localStorage.setItem('lastOrigin', origin);
    localStorage.setItem('lastDest', dest);

    const qs = new URLSearchParams({
      origin, dest, date,
      hs: onlyHighSpeed? '1':'0',
      stu: isStudent? '1':'0',
      ticketType,
      ...(ticketType === 'roundtrip' ? { returnDate } : {}),
    });
    navigate(`/results?${qs.toString()}`);
  }

  return (
    <div>
      <div className="home-page">
        <Carousel items={carouselItems} autoPlay={true} interval={4000} />
        <div className="content-wrapper">
          <div className="banner">
            <h2>中国铁路12306</h2>
            <p>官方购票·安全便捷</p>
          </div>
          <form className="search-card" onSubmit={handleSearch}>

        <div className="row" style={{alignItems:'flex-end', gap:8}}>
          <div className="col">
            <label>出发地</label>
            <div>
              <input
                list="origin-cities"
                value={origin}
                placeholder="搜索出发地"
                onChange={e => setOrigin(e.target.value)}
                onBlur={() => {
                  if (origin && !sortedCities.includes(origin)) {
                    alert('请选择有效的出发地城市');
                    setOrigin('');
                  }
                }}
              />
              <datalist id="origin-cities">
                {sortedCities.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>          </div>
          {/* 紧凑的图标按钮，位于同一行 */}
          <div className="col" style={{flex:'0 0 auto', display:'flex', alignItems:'flex-end', justifyContent:'center'}}>
            <button type="button" onClick={handleSwap} title="调换出发地与到达地" aria-label="调换出发地与到达地" style={{padding:'4px 8px', fontSize:16, lineHeight:1}}>⇄</button>
          </div>
          <div className="col">
            <label>到达地</label>
            <div>
              <input
                list="dest-cities"
                value={dest}
                placeholder="搜索到达地"
                onChange={e => setDest(e.target.value)}
                onBlur={() => {
                  if (dest && !sortedCities.includes(dest)) {
                    alert('请选择有效的到达地城市');
                    setDest('');
                  }
                }}
              />
              <datalist id="dest-cities">
                {sortedCities.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>          </div>
          <div className="col">
            <label>出发日期</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} min={todayLocalISO} />
            <div style={{marginTop:6}}>
              <button type="button" onClick={handleClear} title="清空选择" style={{padding:'4px 8px'}}>清空选择</button>
            </div>
          </div>
        </div>
        {/* 新增：票种（单程/往返）与返程日期输入 */}
        <div className="row options" style={{alignItems:'center'}}>
          <label style={{marginRight:12}}>
            <input type="radio" name="ticketType" value="oneway" checked={ticketType==='oneway'} onChange={()=>setTicketType('oneway')} /> 单程
          </label>
          <label style={{marginRight:12}}>
            <input type="radio" name="ticketType" value="roundtrip" checked={ticketType==='roundtrip'} onChange={()=>setTicketType('roundtrip')} /> 往返
          </label>
          {ticketType === 'roundtrip' && (
            <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <label>返程日期</label>
              <input type="date" value={returnDate} onChange={e=>setReturnDate(e.target.value)} min={date || undefined} />
            </span>
          )}
        </div>
        <div className="row options">
          <label><input type="checkbox" checked={isStudent} onChange={e=>setIsStudent(e.target.checked)} /> 学生</label>
          <label><input type="checkbox" checked={onlyHighSpeed} onChange={e=>setOnlyHighSpeed(e.target.checked)} /> 高铁动车</label>
        </div>
        <button className="primary" type="submit">查 询</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Home;