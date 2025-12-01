import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../services/auth'
import './login.css'

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [account, setAccount] = useState('')
  const [code, setCode] = useState('')
  const [serverCode, setServerCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const res = await requestPasswordReset({ account })
    if (!res.ok) { setError(res.message || '发送验证码失败'); return }
    setServerCode(res.code || '')
    setStep('reset')
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!account || !code || !newPassword || !confirmPassword) { setError('请填写账号、验证码与两次密码'); return }
    if (newPassword.length < 6) { setError('新密码至少6位'); return }
    if (newPassword !== confirmPassword) { setError('两次输入的密码不一致'); return }
    const res = await resetPassword({ account, code, newPassword })
    if (!res.ok) { setError(res.message || '重置失败'); return }
    setSuccess('重置成功，正在跳转登录页')
    setTimeout(() => { navigate('/login') }, 800)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {step === 'request' ? (
          <>
            <h2 style={{ margin: '0 0 12px' }}>找回密码</h2>
            <form className="form" onSubmit={handleRequest}>
              <div className="form-item">
                <input type="text" placeholder="用户名/邮箱/手机号" value={account} onChange={e => setAccount(e.target.value)} />
              </div>
              <div className="form-meta">
                <div className="links">
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login') }}>返回登录</a>
                </div>
              </div>
              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}
              <button type="submit" className="primary">发送验证码</button>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ margin: '0 0 12px' }}>输入验证码并重置密码</h2>
            <form className="form" onSubmit={handleReset}>
              {serverCode && <div className="success">验证码：{serverCode}</div>}
              <div className="form-item">
                <input type="text" placeholder="验证码" value={code} onChange={e => setCode(e.target.value)} />
              </div>
              <div className="form-item password">
                <input type={showPwd ? 'text' : 'password'} placeholder="新密码" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <button type="button" className="toggle" onClick={() => setShowPwd(s => !s)}>{showPwd ? '隐藏' : '显示'}</button>
              </div>
              <div className="form-item password">
                <input type={showConfirm ? 'text' : 'password'} placeholder="确认新密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <button type="button" className="toggle" onClick={() => setShowConfirm(s => !s)}>{showConfirm ? '隐藏' : '显示'}</button>
              </div>
              <div className="form-meta">
                <div className="links">
                  <a href="#" onClick={(e) => { e.preventDefault(); setStep('request'); setError(''); setSuccess('') }}>重新发送</a>
                  <span className="divider">|</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login') }}>返回登录</a>
                </div>
              </div>
              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}
              <button type="submit" className="primary">确认重置</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
