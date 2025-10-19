import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/auth';
import { generateCaptcha } from '../utils/captcha';
import './login.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
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
    if (!username) { setError('请输入用户名'); return; }
    if (password.length < 6) { setError('密码长度至少6位'); return; }
    if (password !== confirmPwd) { setError('两次输入的密码不一致'); return; }
    const res = await registerUser({ username, password, email: email || undefined, mobile: mobile || undefined });
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
          <div className="form-item"><input type="text" placeholder="用户名（3-30位字母数字或下划线）" value={username} onChange={e=>setUsername(e.target.value)} /></div>
          <div className="form-item"><input type="email" placeholder="邮箱（可选）" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div className="form-item"><input type="tel" placeholder="手机号（可选）" value={mobile} onChange={e=>setMobile(e.target.value)} /></div>
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