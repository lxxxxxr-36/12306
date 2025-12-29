import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSession } from '../../../hooks/useSession'
import { addBeneficiary } from '../../../services/beneficiaries'
import type { IdType } from '../../../services/beneficiaries'

const idOptions: IdType[] = ['居民身份证','港澳居民居住证','台湾居民居住证','外国人永久居留身份证','外国护照','中国护照','港澳居民来往内地通行证','台湾居民来往大陆通行证']

const AddBeneficiary: React.FC = () => {
  const { username } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [idType, setIdType] = useState<IdType>('居民身份证')
  const [gender, setGender] = useState<'男'|'女'>('男')
  const [idNo, setIdNo] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phoneCode, setPhoneCode] = useState<'+86'|'+852'|'+853'|'+886'>('+86')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  const goBack = () => navigate({ pathname:'/member', search:'sub=beneficiary' })

  const digitCount = useMemo(()=> (idNo.match(/\d/g)||[]).length, [idNo])

  const save = () => {
    setError('')
    if (!username) { setError('请先登录'); return }
    if (!name || name.length < 2) { setError('请填写姓名'); return }
    if (!idNo) { setError('请填写证件号码'); return }
    const validDigits = idType==='居民身份证'? (digitCount>=17 && digitCount<=18) : (digitCount>=5 && digitCount<=18)
    if (!validDigits) { setError('证件号码数字位数不符合要求'); return }
    if (!birthDate) { setError('请选择出生日期'); return }
    const res = addBeneficiary(username, { name, idType, idNo, gender, birthDate, phoneCode, phoneNumber, email })
    if (!res.ok) { setError(res.message||'添加失败'); return }
    setOkMsg('受让人添加成功')
  }

  return (
    <div>
      <div className="mc-breadcrumb"><span className="home link" onClick={()=>navigate('/member')}>🏠</span><span className="sep">&gt;</span><span className="link" onClick={()=>navigate({ pathname:'/member', search:'sub=beneficiary' })}>受让人管理</span><span className="sep">&gt;</span><span className="active">新增受让人</span></div>

      <div style={{display:'grid', gridTemplateColumns:'160px 360px', gap:'12px 12px', margin:'16px 0'}}>
        <div>姓名：</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="请输入姓名 (必填)" />
        <div>证件类型：</div>
        <select value={idType} onChange={e=>setIdType(e.target.value as IdType)}>{idOptions.map(o=> <option key={o}>{o}</option>)}</select>
        <div>性别：</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <label><input type="radio" checked={gender==='男'} onChange={()=>setGender('男')} /> 男</label>
          <label><input type="radio" checked={gender==='女'} onChange={()=>setGender('女')} /> 女</label>
        </div>
        <div>证件号码：</div>
        <input value={idNo} onChange={e=>setIdNo(e.target.value)} placeholder="请输入证件号码 (必填)" />
        <div>出生日期：</div>
        <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} placeholder="请选择出生日期 (必填)" />
        <div>手机号：</div>
        <div style={{display:'flex',gap:8}}>
          <select value={phoneCode} onChange={e=>setPhoneCode(e.target.value as ('+86'|'+852'|'+853'|'+886'))}>
            <option value="+86">(+86) 中国</option>
            <option value="+852">(+852) 中国香港</option>
            <option value="+853">(+853) 中国澳门</option>
            <option value="+886">(+886) 中国台湾</option>
          </select>
          <input value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} placeholder="请输入手机号" />
        </div>
        <div>电子邮件：</div>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="请输入电子邮件" />
      </div>

      {error && <div style={{color:'#d93025', marginBottom:12}}>{error}</div>}
      <div style={{display:'flex', gap:12}}>
        <button className="secondary" onClick={goBack}>取消</button>
        <button className="primary" onClick={save}>确认</button>
      </div>

      {okMsg && (
        <div className="mc-modal-mask" onClick={()=>{ setOkMsg(''); goBack() }}>
          <div className="mc-modal" onClick={e=>e.stopPropagation()}>
            <div className="mc-modal-title">温馨提示</div>
            <div className="mc-modal-body">{okMsg}</div>
            <button className="primary" onClick={()=>{ setOkMsg(''); goBack() }}>确认</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddBeneficiary
