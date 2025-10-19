import React from 'react';
import { NavLink } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div style={{padding:'40px 16px', textAlign:'center'}}>
      <h2 style={{color:'var(--brand)'}}>页面未找到 (404)</h2>
      <p>抱歉，您访问的页面不存在或已搬家。</p>
      <div style={{marginTop:16}}>
        <NavLink to="/" style={{marginRight:12}}>返回首页</NavLink>
        <NavLink to="/orders">我的订单</NavLink>
      </div>
    </div>
  );
};

export default NotFound;