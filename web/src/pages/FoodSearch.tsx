import React from 'react';
import './food.css';
import { useNavigate } from 'react-router-dom';
import { popularCities } from '../constants/cities';
import { isLoggedIn } from '../services/auth';

function todayLocalISO(){ const d = new Date(); d.setHours(0,0,0,0); const off = d.getTimezoneOffset()*60000; return new Date(d.getTime()-off).toISOString().split('T')[0]; }

const FoodSearch: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = React.useState(todayLocalISO());
  const [train, setTrain] = React.useState('');
  const [origin, setOrigin] = React.useState('');
  const [dest, setDest] = React.useState('');

  const sortedCities = React.useMemo(() => { return [...popularCities].sort((a,b)=>a.localeCompare(b,'zh')); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !train || !origin || !dest) { alert('请完整填写日期、车次、乘车站、到达站'); return; }
    const qs = new URLSearchParams({ date, train, origin, dest }).toString();
    if (!isLoggedIn()) {
      navigate('/login', { state: { from: `/food/browse?${qs}` } });
      return;
    }
    navigate(`/food/browse?${qs}`);
  };

  return (
    <div className="food-hero">
      <div className="food-hero-title">带有温度的旅途配餐，享受星级的体验，家乡的味道</div>
      <form className="food-search-bar" onSubmit={handleSearch}>
        <input type="date" value={date} min={todayLocalISO()} onChange={e=>setDate(e.target.value)} />
        <input type="text" value={train} placeholder="车次" onChange={e=>setTrain(e.target.value)} />
        <input list="food-origin" value={origin} placeholder="乘车站" onChange={e=>setOrigin(e.target.value)} />
        <datalist id="food-origin">
          {sortedCities.map(c => (<option key={c} value={c} />))}
        </datalist>
        <input list="food-dest" value={dest} placeholder="到达站" onChange={e=>setDest(e.target.value)} />
        <datalist id="food-dest">
          {sortedCities.map(c => (<option key={c} value={c} />))}
        </datalist>
        <button className="primary" type="submit">搜索</button>
      </form>
    </div>
  );
};

export default FoodSearch;

