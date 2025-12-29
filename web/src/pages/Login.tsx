import React, { useEffect, useState } from 'react';
import './login.css';
import { validateLogin, setSession, createQrSession, getQrStatus, markQrScanned, markQrConfirmed, requestPasswordReset, verifyResetCode, getUserByAccount } from '../services/auth';
import { useNavigate, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginTab, setLoginTab] = useState<'account' | 'qr'>('account');
  const [username, setUsername] = useState<string>(() => localStorage.getItem('rememberedUsername') || '');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  // 取消“记住用户名”功能
  const [error, setError] = useState<string>('');
  const [showVerify, setShowVerify] = useState(false);
  const [idLast4, setIdLast4] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await validateLogin({ username, password });
    if (!result.ok) {
      setError(result.message || '登录失败');
      return;
    }
    setShowVerify(true);
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
    <div className="login-wrapper">
      {/* 登录页不再展示内部头部 */}

      {/* 主登录区域 */}
      <div className="login-container">
        <div className="login-page">
          <div className="hero">
            <div className="qr-area">
              <div className="qr-box">
                <div>
                  <div>扫描左侧二维码</div>
                  <div>安装 铁路12306</div>
                </div>
              </div>
            </div>
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

                {/* 链接移动到按钮下方 */}

                {error && <div className="error">{error}</div>}

                <button type="submit" className="primary">立即登录</button>
                <div className="links below">
                  <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/register')}}>注册12306账号</a>
                  <span className="divider">|</span>
                  <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/forgot')}}>忘记密码</a>
                </div>
                <div className="note">铁路12306每日5:00至次日1:00（周二为5:00至24:00）提供购票、改签、变更到站业务办理， 全天均可办理退票等其他服务。</div>
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
      </div>
      {showVerify && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{width:420, background:'#fff', borderRadius:8, boxShadow:'0 10px 20px rgba(0,0,0,0.2)'}}>
            <div style={{padding:'12px 16px', borderBottom:'1px solid #eee', fontWeight:700, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span>选择验证方式</span>
              <button className="secondary" onClick={()=>setShowVerify(false)}>×</button>
            </div>
            <div style={{padding:'16px'}}>
              <div style={{color:'#2b66e7', fontWeight:700, marginBottom:12}}>短信验证</div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                <input
                  type="text"
                  placeholder="请输入登录账号绑定的证件号后4位"
                  value={idLast4}
                  onChange={(e)=>setIdLast4(e.target.value.replace(/\\D/g,''))}
                  maxLength={4}
                  style={{border:'1px solid #dfe3eb', borderRadius:4, padding:'10px 12px'}}
                />
                <div style={{display:'flex', gap:8}}>
                  <input
                    type="text"
                    placeholder="输入验证码"
                    value={smsCode}
                    onChange={(e)=>setSmsCode(e.target.value.replace(/\\D/g,''))}
                    style={{flex:1, border:'1px solid #dfe3eb', borderRadius:4, padding:'10px 12px'}}
                  />
                  <button
                    type="button"
                    className="secondary"
                    disabled={idLast4.length!==4}
                    onClick={async ()=>{
                      const user = getUserByAccount(username);
                      const last4 = (user?.idNo || '').slice(-4).replace(/\\s/g,'');
                      if (!user) { alert('账号不存在'); return; }
                      if (idLast4 !== (last4 || '')) { alert('证件号后4位不匹配'); return; }
                      const r = await requestPasswordReset({ account: username });
                      if (!r.ok) { alert(r.message || '发送失败'); return; }
                      setSmsSent(true);
                    }}
                    style={{minWidth:120}}
                  >{smsSent ? '重新发送' : '获取验证码'}</button>
                </div>
                <button
                  className="primary"
                  onClick={async ()=>{
                    const v = await verifyResetCode({ account: username, code: smsCode });
                    if (!v.ok) { alert(v.message || '验证码校验失败'); return; }
                    setSession(username);
                    const s = location.state as unknown; let from = '/';
                    if (s && typeof s === 'object') { const f = (s as Record<string, unknown>).from; if (typeof f === 'string') from = f; }
                    navigate(from, { replace: true });
                  }}
                >确定</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
