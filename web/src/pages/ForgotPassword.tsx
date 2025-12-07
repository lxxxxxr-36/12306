import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestPasswordReset, resetPassword, verifyResetCode, validateAccountIdentity } from '../services/auth'
import type { IdType } from '../services/auth'
import './login.css'

const steps = ['填写账户信息','获取验证码','设置新密码','完成']

const Stepper: React.FC<{idx:number}> = ({ idx }) => {
  return (
    <div style={{padding:'16px 0 24px'}}> 
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16}}>
        {steps.map((s,i)=> (
          <React.Fragment key={s}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:16,height:16,borderRadius:9999,background:i<=idx?'#2ea5ff':'#d9d9d9'}} />
              <span style={{color:'#333',fontSize:14}}>{s}</span>
            </div>
            {i<steps.length-1 && (
              <div style={{flex:1,height:4,background:i<idx?'#2ea5ff':'#e6e6e6',borderRadius:2}} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<0|1|2|3>(0)
  const [phoneCode, setPhoneCode] = useState<'+86'|'+852'|'+853'|'+886'>('+86')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [idType, setIdType] = useState<IdType>('居民身份证')
  const [idNo, setIdNo] = useState('')
  const [code, setCode] = useState('')
  const [serverCode, setServerCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<number|undefined>(undefined)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(()=>{ return () => { if (timerRef.current) window.clearInterval(timerRef.current) } },[])

  const phoneOk = useMemo(() => phoneCode === '+86' ? /^\d{11}$/.test(phoneNumber) : /^\d{5,20}$/.test(phoneNumber), [phoneCode, phoneNumber])
  const validIdDigits = useMemo(() => {
    const c = (idNo.match(/\d/g)||[]).length
    if (idType==='居民身份证') return c>=17 && c<=18
    if (idType==='外国护照' || idType==='中国护照') return c>=5 && c<=18
    return c>=8 && c<=18
  }, [idType, idNo])
  const pwdOk = useMemo(() => {
    const a = /[A-Za-z]/.test(newPassword)
    const b = /\d/.test(newPassword)
    const c = /_/.test(newPassword)
    const kinds = [a,b,c].filter(Boolean).length
    return newPassword.length>=6 && kinds>=2
  }, [newPassword])

  const toStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!phoneOk || !validIdDigits) { setError('请填写有效的手机号与证件号码'); return }
    const idRes = await validateAccountIdentity({ phoneNumber, idType, idNo })
    if (!idRes.ok) { setError(idRes.message || '手机号与证件信息不匹配'); return }
    if (timerRef.current) window.clearInterval(timerRef.current)
    setCountdown(0)
    setServerCode('')
    setStep(1)
  }

  const sendCode = async () => {
    if (countdown>0) return
    setError('')
    const res = await requestPasswordReset({ account: phoneNumber })
    if (!res.ok) { setError(res.message||'发送验证码失败'); return }
    setServerCode(res.code||'')
    setCountdown(120)
    timerRef.current = window.setInterval(() => {
      setCountdown(v => {
        if (v<=1) { if (timerRef.current) window.clearInterval(timerRef.current); return 0 }
        return v-1
      })
    }, 1000)
  }

  const toStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!code || code.length<4) { setError('请输入验证码'); return }
    const v = await verifyResetCode({ account: phoneNumber, code })
    if (!v.ok) { setError(v.message || '验证码校验失败'); return }
    setStep(2)
  }

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!pwdOk) { setError('需包含字母、数字、下划线中至少两种且长度≥6'); return }
    if (newPassword !== confirmPassword) { setError('两次输入的密码不一致'); return }
    const res = await resetPassword({ account: phoneNumber, code, newPassword })
    if (!res.ok) { setError(res.message||'重置失败'); return }
    setStep(3)
  }

  return (
    <div className="login-page register-page">
      <div className="login-card">
        <Stepper idx={step} />
        {step===0 && (
          <form className="form" onSubmit={toStep2}>
            <div className="form-item reg-row">
              <span className="reg-label"><span className="req">*</span> 手机号码：</span>
              <div className="reg-controls">
                <select className="reg-select" value={phoneCode} onChange={e=>setPhoneCode(e.target.value as any)}>
                  <option value="+86">+86</option>
                  <option value="+852">+852</option>
                  <option value="+853">+853</option>
                  <option value="+886">+886</option>
                </select>
                <input className="reg-input" placeholder="请输入手机号" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} />
              </div>
              <span className="hint">已通过核验的手机号码</span>
            </div>
            <div className="form-item reg-row">
              <span className="reg-label"><span className="req">*</span> 证件类型：</span>
              <div className="reg-controls single">
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
              <span className="hint">请选择证件类型</span>
            </div>
            <div className="form-item reg-row">
              <span className="reg-label"><span className="req">*</span> 证件号码：</span>
              <div className="reg-controls single">
                <input className="reg-input" placeholder="请输入证件号码" value={idNo} onChange={e=>setIdNo(e.target.value)} />
              </div>
              <span className="hint">请输入证件号码</span>
            </div>
            {error && <div className="error" style={{marginTop:8}}>{error}</div>}
            <div style={{display:'flex',justifyContent:'center'}}>
              <button type="submit" className="primary narrow">提交</button>
            </div>
          </form>
        )}

        {step===1 && (
          <form className="form" onSubmit={toStep3}>
            <div className="form-item reg-row">
              <span className="reg-label"><span className="req">*</span> 手机号：</span>
              <span style={{color:'#ff7a00'}}>({phoneCode}) {phoneNumber}</span>
            </div>
            <div className="form-item reg-row">
              <span className="reg-label"><span className="req">*</span> 请填写手机验证码：</span>
              <input className="reg-input" placeholder="请输入验证码" value={code} onChange={e=>setCode(e.target.value)} />
              <button type="button" className="toggle" onClick={sendCode} disabled={countdown>0}>
                {countdown>0 ? `${countdown}s` : (serverCode ? '重新发送验证码' : '发送手机验证码')}
              </button>
            </div>
            {error && <div className="error" style={{marginTop:8}}>{error}</div>}
            <button type="submit" className="primary">提交</button>
          </form>
        )}

        {step===2 && (
          <form className="form" onSubmit={doReset}>
            <div className="form-item password">
              <input type="password" placeholder="新密码" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
            </div>
            <div className="form-item password">
              <input type="password" placeholder="确认新密码" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
            </div>
            <div style={{color:'#ff7a00',fontSize:12,marginTop:-6,marginBottom:8}}>需包含字母、数字、下划线中不少于两种且长度不少于6</div>
            {error && <div className="error" style={{marginTop:8}}>{error}</div>}
            <button type="submit" className="primary">提交</button>
          </form>
        )}

        {step===3 && (
          <div className="form">
            <div style={{textAlign:'center',margin:'16px 0'}}>
              <span style={{color:'#ff7a00'}}>新密码设置成功，您可以使用新密码</span>
              <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/login')}} style={{color:'#2ea5ff',marginLeft:4}}>登录系统</a>
              <span style={{color:'#ff7a00'}}>!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
