import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset, resetPassword } from '../services/auth';
import './login.css';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1|2>(1);
  const [account, setAccount] = useState('');
  const [code, setCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  // 页面不展示验证码，不再使用 serverCodeHint
  // 不在页面展示验证码；开发模式下输出到终端
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sendCode = async () => {
    setError(''); setSuccess('');
    if (!account) { setError('请输入用户名/邮箱/手机号'); return; }
    const res = await requestPasswordReset({ account });
    if (!res.ok) { setError(res.message || '发送验证码失败'); return; }
    if (import.meta.env.DEV && res.code) {
      try {
        await fetch('/__dev/log-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account, code: res.code }),
        });
      } catch (e) { void e; }
      console.info('演示验证码已发送到终端');
    }
    setStep(2);
  };

  const submitReset = async () => {
    setError(''); setSuccess('');
    if (!code) { setError('请输入验证码'); return; }
    if (!newPwd || newPwd.length < 6) { setError('新密码至少6位'); return; }
    if (newPwd !== confirmPwd) { setError('两次输入的密码不一致'); return; }
    const res = await resetPassword({ account, code, newPassword: newPwd });
    if (!res.ok) { setError(res.message || '重置失败'); return; }
    setSuccess('密码重置成功，即将跳转登录页');
    setTimeout(() => navigate('/login'), 800);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 style={{margin:'0 0 12px'}}>忘记密码</h2>
        {step === 1 ? (
          <div className="form">
            <div className="form-item"><input type="text" placeholder="请输入用户名/邮箱/手机号" value={account} onChange={e=>setAccount(e.target.value)} /></div>
            {error && <div className="error">{error}</div>}
            <button className="primary" onClick={sendCode}>发送验证码</button>
            <div className="form-meta">
              <div className="links">
                <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/login')}}>返回登录</a>
                <span className="divider">|</span>
                <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/register')}}>注册账号</a>
              </div>
            </div>
          </div>
        ) : (
          <div className="form">
            <div className="form-item"><input type="text" placeholder="验证码" value={code} onChange={e=>setCode(e.target.value)} /></div>
            {/* 验证码不在页面显示，已在开发模式输出到终端 */}
            <div className="form-item password"><input type="password" placeholder="新密码" value={newPwd} onChange={e=>setNewPwd(e.target.value)} /></div>
            <div className="form-item password"><input type="password" placeholder="确认新密码" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} /></div>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            <button className="primary" onClick={submitReset}>提交重置</button>
            <div className="form-meta">
              <div className="links">
                <a href="#" onClick={(e)=>{e.preventDefault(); setStep(1)}}>返回上一步</a>
                <span className="divider">|</span>
                <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/login')}}>返回登录</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;