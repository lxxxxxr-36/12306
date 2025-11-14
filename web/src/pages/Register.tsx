import React, { useEffect, useRef, useState } from 'react';
import type { IdType, BenefitType } from '../services/passengers';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/auth';
import { generateCaptcha } from '../utils/captcha';
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

  const [captchaText, setCaptchaText] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => { refreshCaptcha(); }, []);
  const refreshCaptcha = () => {
    const { text, draw } = generateCaptcha(120, 38);
    setCaptchaText(text);
    setTimeout(() => { if (canvasRef.current) draw(canvasRef.current); }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!agree) { setError('请阅读并同意《用户注册协议》'); return; }
    if (captchaCode.trim().toLowerCase() !== captchaText.toLowerCase()) { setError('验证码错误'); refreshCaptcha(); return; }
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
    <div className="login-page">
      <div className="login-card">
        <h2 style={{margin:'0 0 12px'}}>注册铁路12306账号</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-item"><input type="text" placeholder="用户名（以字母开头，6-30位字母数字或下划线）" value={username} onChange={e=>setUsername(e.target.value)} /></div>
          <div className="form-item">
            <select value={idType} onChange={e=>setIdType(e.target.value as IdType)}>
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
          <div className="form-item"><input type="text" placeholder="姓名" value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
          <div className="form-item"><input type="text" placeholder="证件号码" value={idNo} onChange={e=>setIdNo(e.target.value)} /></div>
          <div className="form-item">
            <select value={benefit} onChange={e=>setBenefit(e.target.value as BenefitType)}>
              <option>成人</option>
              <option>儿童</option>
              <option>学生</option>
              <option>残疾军人</option>
            </select>
          </div>
          <div className="form-item"><input type="email" placeholder="邮箱（可选）" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div className="form-item" style={{display:'flex',gap:8}}>
            <select value={phoneCode} onChange={e=>setPhoneCode(e.target.value as ('+86'|'+852'|'+853'|'+886'))}>
              <option value='+86'>+86 中国</option>
              <option value='+852'>+852 中国香港</option>
              <option value='+853'>+853 中国澳门</option>
              <option value='+886'>+886 中国台湾</option>
            </select>
            <input type="tel" placeholder="电话号码" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} />
          </div>
          <div className="form-item password"><input type="password" placeholder="设置密码" value={password} onChange={e=>setPassword(e.target.value)} /></div>
          <div className="form-item password"><input type="password" placeholder="确认密码" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} /></div>

          <div className="form-item captcha">
            <input type="text" placeholder="请输入验证码" value={captchaCode} onChange={e=>setCaptchaCode(e.target.value)} />
            <canvas ref={canvasRef} width={120} height={38} className="captcha-canvas" aria-label="验证码" />
            <button type="button" className="link" onClick={refreshCaptcha}>刷新</button>
          </div>

          <div className="form-meta">
            <label><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} /> 我已阅读并同意《用户注册协议》</label>
            <div className="links">
              <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/login')}}>返回登录</a>
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit" className="primary">提交注册</button>
        </form>
      </div>
    </div>
  );
};

export default Register;