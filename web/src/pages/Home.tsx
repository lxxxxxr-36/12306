import React from 'react';
import './home.css';
import { useNavigate } from 'react-router-dom';
import { popularCities } from '../constants/cities';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = React.useState('');
  const [dest, setDest] = React.useState('');
  const [date, setDate] = React.useState('');
  const [onlyHighSpeed, setOnlyHighSpeed] = React.useState(false);
  const [isStudent, setIsStudent] = React.useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !dest) { alert('请选择出发地与到达地'); return; }
    navigate(`/results?origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}&hs=${onlyHighSpeed?1:0}&stu=${isStudent?1:0}`);
  }

  return (
    <div className="home-page">
      <div className="banner">
        <h2>中国铁路12306</h2>
        <p>官方购票·安全便捷</p>
      </div>
      <form className="search-card" onSubmit={handleSearch}>
        <div className="row">
          <div className="col">
            <label>出发地</label>
            <select value={origin} onChange={e=>setOrigin(e.target.value)}>
              <option value="">请选择出发地</option>
              {popularCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col">
            <label>到达地</label>
            <select value={dest} onChange={e=>setDest(e.target.value)}>
              <option value="">请选择到达地</option>
              {popularCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col">
            <label>出发日期</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
        </div>
        <div className="row options">
          <label><input type="checkbox" checked={isStudent} onChange={e=>setIsStudent(e.target.checked)} /> 学生</label>
          <label><input type="checkbox" checked={onlyHighSpeed} onChange={e=>setOnlyHighSpeed(e.target.checked)} /> 高铁动车</label>
        </div>
        <button className="primary" type="submit">查 询</button>
      </form>
    </div>
  );
}

export default Home;