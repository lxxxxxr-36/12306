import React from 'react';
import { useNavigate } from 'react-router-dom';
import Carousel from '../components/Carousel';
import { popularCities } from '../constants/cities';
import { isLoggedIn } from '../services/auth';
import './home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [section, setSection] = React.useState<'ticket' | 'common' | 'meal'>('ticket');
  const [origin, setOrigin] = React.useState('');
  const [dest, setDest] = React.useState('');
  const [date, setDate] = React.useState('');
  const [onlyHighSpeed, setOnlyHighSpeed] = React.useState(true);
  const [isStudent, setIsStudent] = React.useState(false);
  const [originFocus, setOriginFocus] = React.useState(false);
  const [destFocus, setDestFocus] = React.useState(false);
  // 新增：票种（单程/往返）与返程日期
  const [ticketType, setTicketType] = React.useState<'oneway' | 'roundtrip'>('oneway');
  const [returnDate, setReturnDate] = React.useState('');
  const todayLocalISO = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); const off = d.getTimezoneOffset() * 60000; return new Date(d.getTime() - off).toISOString().split('T')[0]; })();

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
    // 默认值：首次进入时设为北京→成都
    if (!origin) setOrigin('北京');
    if (!dest) setDest('成都');
  }, []);

  // 城市选项按字母表（locale）排序
  const sortedCities = React.useMemo(() => {
    return [...popularCities].sort((a, b) => a.localeCompare(b, 'zh'));
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
    let effectiveReturnDate = returnDate;
    if (ticketType === 'roundtrip') {
      effectiveReturnDate = returnDate || date || todayLocalISO;
      const depart = new Date(date);
      const back = new Date(effectiveReturnDate);
      if (back.getTime() < depart.getTime()) { alert('返程日期不能早于出发日期'); return; }
    }
    // 持久化上次选择
    localStorage.setItem('lastOrigin', origin);
    localStorage.setItem('lastDest', dest);

    const qs = new URLSearchParams({
      origin, dest, date,
      hs: onlyHighSpeed ? '1' : '0',
      stu: isStudent ? '1' : '0',
      ticketType,
      ...(ticketType === 'roundtrip' ? { returnDate: effectiveReturnDate as string } : {}),
      search: '1',
    });
    navigate(`/results?${qs.toString()}`);
  }

  return (
    <div className="home-page">
      <Carousel items={carouselItems} autoPlay={true} interval={4000} />
      <div className="content-wrapper">

        <div className="home-shell">
          <div className="side-nav">
            <div className={'nav-item' + (section === 'ticket' ? ' active' : '')} onClick={() => setSection('ticket')}><span className="nav-ico">🚌</span><span className="nav-text">车票</span></div>
            <div className={'nav-item' + (section === 'common' ? ' active' : '')} onClick={() => setSection('common')}><span className="nav-ico">📓</span><span className="nav-text">常用查询</span></div>
            <div className={'nav-item' + (section === 'meal' ? ' active' : '')} onClick={() => setSection('meal')}><span className="nav-ico">🍽️</span><span className="nav-text">订餐</span></div>
          </div>
          {section === 'meal' ? (
            <div className="search-card">
              <div style={{ color: '#888' }}>订餐占位页面，后续接入。</div>
            </div>
          ) : section === 'common' ? (
            <div className="search-card">
              <div style={{ color: '#888' }}>常用查询占位</div>
            </div>
          ) : (
            <form className="search-card" onSubmit={handleSearch}>

              <div className="search-tabs">
                <button type="button" className={'tab' + (ticketType === 'oneway' ? ' active' : '')} onClick={() => setTicketType('oneway')}>
                  <span className="tab-dot">→</span> 单程
                </button>
                <button type="button" className={'tab' + (ticketType === 'roundtrip' ? ' active' : '')} onClick={() => setTicketType('roundtrip')}>
                  <span className="tab-dot">≡</span> 往返
                </button>
                <button type="button" className={'tab disabled'} disabled>
                  <span className="tab-dot">↺</span> 中转换乘
                </button>
                <button type="button" className={'tab disabled'} disabled>
                  <span className="tab-dot">票</span> 退改签
                </button>
              </div>

              <div className="form-row">
                <span className="label">出发地：</span>
                <div className="field-wrap">
                  <input
                    list="origin-cities"
                    value={origin}
                    placeholder="搜索出发地"
                    onChange={e => setOrigin(e.target.value)}
                    onFocus={e => { e.currentTarget.select(); setOriginFocus(true); }}
                    onBlur={() => {
                      setTimeout(() => setOriginFocus(false), 120);
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
                  {originFocus && (
                    <div className="suggestions">
                      {sortedCities.map(c => (
                        <button
                          key={c}
                          className="suggestion"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { setOrigin(c); setOriginFocus(false); }}
                        >{c}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <span className="label">到达地：</span>
                <div className="field-wrap">
                  <input
                    list="dest-cities"
                    value={dest}
                    placeholder="搜索到达地"
                    onChange={e => setDest(e.target.value)}
                    onFocus={e => { e.currentTarget.select(); setDestFocus(true); }}
                    onBlur={() => {
                      setTimeout(() => setDestFocus(false), 120);
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
                  {destFocus && (
                    <div className="suggestions">
                      {sortedCities.map(c => (
                        <button
                          key={c}
                          className="suggestion"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { setDest(c); setDestFocus(false); }}
                        >{c}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="line-origin" aria-hidden></span>
              <span className="line-dest" aria-hidden></span>
              <button type="button" className="swap-float" onClick={handleSwap} title="调换出发地与到达地" aria-label="调换出发地与到达地"></button>
              <div className="form-row">
                <span className="label">出发日期：</span>
                <div className="field-wrap">
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={todayLocalISO}
                    onFocus={e => { try { (e.currentTarget as any).showPicker?.(); } catch { } }}
                    onClick={e => { try { (e.currentTarget as any).showPicker?.(); } catch { } }}
                  />
                </div>
              </div>

              {/* 返程日期（往返） */}
              {ticketType === 'roundtrip' && (
                <div className="form-row">
                  <span className="label">返程日期：</span>
                  <div className="field-wrap">
                    <input
                      type="date"
                      value={returnDate || todayLocalISO}
                      onChange={e => setReturnDate(e.target.value)}
                      min={date || undefined}
                      onFocus={e => { try { (e.currentTarget as any).showPicker?.(); } catch { } }}
                      onClick={e => { try { (e.currentTarget as any).showPicker?.(); } catch { } }}
                    />
                  </div>
                </div>
              )}
              <div className="center-row" style={{ gap: 28 }}>
                <label>学生 <input type="checkbox" checked={isStudent} onChange={e => setIsStudent(e.target.checked)} /></label>
                <label>高铁/动车 <input type="checkbox" checked={onlyHighSpeed} onChange={e => setOnlyHighSpeed(e.target.checked)} /></label>
              </div>
              <div className="center-row">
                <button className="primary wide" type="submit">查 询</button>
              </div>
              <div className="row options">
                <label><input type="checkbox" checked={isStudent} onChange={e => setIsStudent(e.target.checked)} /> 学生</label>
                <label><input type="checkbox" checked={onlyHighSpeed} onChange={e => setOnlyHighSpeed(e.target.checked)} /> 高铁动车</label>
              </div>
              <button className="primary" type="submit">查 询</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
