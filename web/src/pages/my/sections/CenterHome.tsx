import React from 'react';
import { useSession } from '../../../hooks/useSession';
import { getUserByUsername } from '../../../services/auth';

const CenterHome: React.FC = () => {
  const { username } = useSession();
  const fullName = username ? (getUserByUsername(username)?.fullName || username) : '';
  return (
    <div style={{padding:'8px 4px'}}>
      <div style={{fontSize:26,fontWeight:700,marginBottom:12}}>{fullName}，您好！</div>
      <div style={{lineHeight:'28px',fontSize:16,color:'#333'}}>
        <div>欢迎您登录中国铁路客户服务中心网站。</div>
        <div style={{color:'#cc0000'}}>如果您的密码在其他网站也使用，建议您修改本网站密码。</div>
        <div>
          如果您需要预订车票，请您点击
          <a href="http://localhost:5174/results" style={{color:'var(--brand)',textDecoration:'underline',marginLeft:4}}>
            车票预定
          </a>
          。
        </div>
      </div>
    </div>
  );
};

export default CenterHome;