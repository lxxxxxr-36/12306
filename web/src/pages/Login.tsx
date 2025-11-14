import React, { useEffect, useRef, useState } from 'react';
import './login.css';
import { generateCaptcha } from '../utils/captcha';
import { validateLogin, setSession, createQrSession, getQrStatus, markQrScanned, markQrConfirmed } from '../services/auth';
import { useNavigate, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginTab, setLoginTab] = useState<'account' | 'qr'>('account');
  const [username, setUsername] = useState<string>(() => localStorage.getItem('rememberedUsername') || '');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(!!localStorage.getItem('rememberedUsername'));
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [error, setError] = useState<string>('');

  // draw captcha when page loads
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    refreshCaptcha();
  }, []);

  const refreshCaptcha = () => {
    const { text, draw } = generateCaptcha(120, 38);
    setCaptchaText(text);
    setTimeout(() => {
      if (canvasRef.current) draw(canvasRef.current);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // captcha check first
    if (captchaCode.trim().toLowerCase() !== captchaText.toLowerCase()) {
      setError('验证码错误，请重新输入或点击刷新');
      refreshCaptcha();
      return;
    }
    const result = await validateLogin({ username, password });
    if (!result.ok) {
      setError(result.message || '登录失败');
      return;
    }
    if (remember) {
      localStorage.setItem('rememberedUsername', username);
    } else {
      localStorage.removeItem('rememberedUsername');
    }
    // 登录成功，设置会话并按来源跳转
    setSession(username);
    const s = location.state as unknown; let from = '/';
    if (s && typeof s === 'object') { const f = (s as Record<string, unknown>).from; if (typeof f === 'string') from = f; }
    navigate(from, { replace: true });
  };

  // ---- 扫码登录逻辑 ----
  const [qrId, setQrId] = useState<string | null>(null);
  const [qrContent, setQrContent] = useState<string>('');
  const [qrStatus, setQrStatus] = useState<'pending'|'scanned'|'confirmed'|'expired'>('pending');
  const [poller, setPoller] = useState<number | null>(null);

  const startQrSession = () => {
    const { id, content } = createQrSession();
    setQrId(id);
    setQrContent(content);
    setQrStatus('pending');
    if (poller) { window.clearInterval(poller); setPoller(null); }
    const timer = window.setInterval(() => {
      if (!id) return;
      const status = getQrStatus(id);
      setQrStatus(status);
      if (status === 'confirmed') {
        window.clearInterval(timer);
        setPoller(null);
        // 模拟手机确认后，直接登录并跳转
        setSession('扫码用户');
        const st = location.state as unknown; let from = '/';
        if (st && typeof st === 'object') { const f = (st as Record<string, unknown>).from; if (typeof f === 'string') from = f; }
        navigate(from, { replace: true });
      }
    }, 1000);
    setPoller(timer);
  };
  const stopQrPoll = () => { if (poller) { window.clearInterval(poller); setPoller(null); } };

  useEffect(() => {
    if (loginTab === 'qr') {
      startQrSession();
    } else {
      stopQrPoll();
    }
    return () => { stopQrPoll(); };
  }, [loginTab]);

  const simulateScan = () => { if (qrId) markQrScanned(qrId); };
  const simulateConfirm = () => { if (qrId) markQrConfirmed(qrId); };

  return (
    <div className="login-page">
      <div className="hero">
        <div className="slogan">
          <h1>铁路12306 - 中国铁路官方APP</h1>
          <p>尽享精彩出行服务</p>
          <ul>
            <li>个人行程提醒</li>
            <li>积分兑换</li>
            <li>餐饮·特产</li>
            <li>车站大屏</li>
          </ul>
          <div className="qr-area">
            <div className="qr-box">扫码安装铁路12306</div>
          </div>
        </div>
        <img className="phone-mock" alt="app" src="/vite.svg" />
      </div>

      <div className="login-card">
        <div className="tabs">
          <button className={loginTab === 'account' ? 'active' : ''} onClick={() => setLoginTab('account')}>账号登录</button>
          <button className={loginTab === 'qr' ? 'active' : ''} onClick={() => setLoginTab('qr')}>扫码登录</button>
        </div>

        {loginTab === 'account' ? (
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-item">
              <input
                type="text"
                placeholder="用户名/邮箱/手机号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="form-item password">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="toggle" onClick={() => setShowPwd((s) => !s)}>
                {showPwd ? '隐藏' : '显示'}
              </button>
            </div>

            <div className="form-item captcha">
              <input
                type="text"
                placeholder="请输入验证码"
                value={captchaCode}
                onChange={(e) => setCaptchaCode(e.target.value)}
              />
              <canvas ref={canvasRef} width={120} height={38} className="captcha-canvas" aria-label="验证码" />
              <button type="button" className="link" onClick={refreshCaptcha}>刷新</button>
            </div>

            <div className="form-meta">
              <label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> 记住用户名</label>
              <div className="links">
                <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/forgot')}}>忘记密码?</a>
                <span className="divider">|</span>
                <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/register')}}>注册12306账号</a>
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="primary">立即登录</button>
            <div className="note">铁路12306每日5:00至次日1:00（周一为5:00至24:00）提供服务</div>
          </form>
        ) : (
          <div className="qr-login">
            <div className="qr-placeholder" style={{fontSize:'14px'}}>
              {qrContent ? (
                <>
                  <div style={{marginBottom:8}}>模拟二维码内容：<strong>{qrContent}</strong></div>
                  <div>状态：{
                    qrStatus === 'pending' ? '待扫码' :
                    qrStatus === 'scanned' ? '已扫码，请在手机确认' :
                    qrStatus === 'confirmed' ? '已确认，正在登录...' :
                    '二维码已过期，请刷新'
                  }</div>
                </>
              ) : '二维码生成中...'}
            </div>
            <div className="form-meta" style={{justifyContent:'center'}}>
              <button className="link" onClick={simulateScan} disabled={!qrId || qrStatus!=='pending'}>模拟扫描</button>
              <span className="divider">|</span>
              <button className="link" onClick={simulateConfirm} disabled={!qrId || (qrStatus!=='scanned')}>确认登录</button>
              <span className="divider">|</span>
              <button className="link" onClick={startQrSession}>刷新二维码</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;