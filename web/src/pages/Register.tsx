import React, { useState } from 'react';
import type { IdType, BenefitType } from '../services/passengers';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/auth';
 
import './login.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [idType, setIdType] = useState<IdType>('居民身份证');
  const [fullName, setFullName] = useState('');
  const [idNo, setIdNo] = useState('');
  const [benefit, setBenefit] = useState<BenefitType>('成人');
  const [phoneCode, setPhoneCode] = useState<'+86'|'+852'|'+853'|'+886'>('+86');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!agree) { setError('请阅读并同意《用户注册协议》'); return; }
    
    const res = await registerUser({
      username,
      password,
      confirmPassword: confirmPwd,
      idType,
      fullName,
      idNo,
      benefit,
      email: email || undefined,
      phoneCode,
      phoneNumber,
    });
    if (!res.ok) { setError(res.message || '注册失败'); return; }
    setSuccess('注册成功，即将跳转到登录页');
    localStorage.setItem('rememberedUsername', username);
    setTimeout(() => { navigate('/login'); }, 800);
  };

  return (
    <div className="login-page register-page">
      <div className="login-card">
        <h2 style={{margin:'0 0 12px'}}>注册铁路12306账号</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-item reg-row">
            <span className="reg-label"><span className="req">*</span> 用户名：</span>
            <input className="reg-input" type="text" placeholder="请输入用户名" value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
          <div className="form-item reg-row">
            <span className="reg-label"><span className="req">*</span> 登录密码：</span>
            <input className="reg-input" type="password" placeholder="请输入登录密码" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div className="form-item reg-row">
            <span className="reg-label"><span className="req">*</span> 确认密码：</span>
            <input className="reg-input" type="password" placeholder="请再次输入密码" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} />
          </div>
          <div className="form-item reg-row">
            <span className="reg-label"><span className="req">*</span> 证件类型：</span>
            <select className="reg-select" value={idType} onChange={e=>setIdType(e.target.value as IdType)}>
              <option>居民身份证</option>
              <option>港澳居民居住证</option>
              <option>台湾居民居住证</option>
              <option>外国人永久居留身份证</option>
              <option>外国护照</option>
              <option>中国护照</option>
              <option>港澳居民来往内地通行证</option>
              <option>台湾居民来往大陆通行证</option>
            </select>
          </div>
          <div className="form-item reg-row">
            <span className="reg-label"><span className="req">*</span> 姓名：</span>
            <input className="reg-input" type="text" placeholder="请输入姓名" value={fullName} onChange={e=>setFullName(e.target.value)} />
          </div>
          <div className="form-item reg-row">
            <span className="reg-label"><span className="req">*</span> 证件号码：</span>
            <input className="reg-input" type="text" placeholder="请输入证件号码" value={idNo} onChange={e=>setIdNo(e.target.value)} />
          </div>
          <div className="form-item reg-row">
            <span className="reg-label"><span className="req">*</span> 优惠（待）类型：</span>
            <select className="reg-select" value={benefit} onChange={e=>setBenefit(e.target.value as BenefitType)}>
              <option>成人</option>
              <option>儿童</option>
              <option>学生</option>
              <option>残疾军人</option>
            </select>
          </div>
          <div className="form-item reg-row">
            <span className="reg-label">邮箱：</span>
            <input className="reg-input" type="email" placeholder="请正确填写邮箱地址" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="form-item reg-row" style={{gap:8}}>
            <span className="reg-label"><span className="req">*</span> 手机号码：</span>
            <select className="reg-phone-select" value={phoneCode} onChange={e=>setPhoneCode(e.target.value as ('+86'|'+852'|'+853'|'+886'))}>
              <option value='+86'>+86 中国</option>
              <option value='+852'>+852 中国香港</option>
              <option value='+853'>+853 中国澳门</option>
              <option value='+886'>+886 中国台湾</option>
            </select>
            <input className="reg-phone-input" type="tel" placeholder="手机号码" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} />
          </div>

          

          <div className="form-meta">
            <label><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} /> 我已阅读并同意《用户注册协议》</label>
            <div className="links">
              <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/login')}}>返回登录</a>
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit" className="primary">下一步</button>
        </form>
      </div>
    </div>
  );
};

export default Register;