import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSession } from '../../../hooks/useSession'
import { getBeneficiaries, updateBeneficiary } from '../../../services/beneficiaries'

const EditBeneficiary: React.FC = () => {
  const { username } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const sp = new URLSearchParams(location.search)
  const id = sp.get('id') || ''
  const data = useMemo(()=> username ? getBeneficiaries(username).find(x=>x.id===id) : undefined, [username, id])
  const [phoneCode, setPhoneCode] = useState<'+86'|'+852'|'+853'|'+886'>(data?.phoneCode || '+86')
  const [phoneNumber, setPhoneNumber] = useState<string>(data?.phoneNumber || '')
  const [email, setEmail] = useState<string>(data?.email || '')
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  const goBack = () => navigate({ pathname:'/member', search:'sub=beneficiary' })

  const save = () => {
    setError('')
    if (!username || !id) { setError('请先登录'); return }
    const res = updateBeneficiary(username, id, { phoneCode, phoneNumber, email })
    if (!res.ok) { setError(res.message||'修改失败'); return }
    setOkMsg('受让人修改成功')
  }

  if (!data) return <div>未找到受让人</div>

  return (
    <div>
      <div className="mc-breadcrumb"><span className="home link" onClick={()=>navigate('/member')}>🏠</span><span className="sep">&gt;</span><span className="link" onClick={()=>navigate({ pathname:'/member', search:'sub=beneficiary' })}>受让人管理</span><span className="sep">&gt;</span><span className="active">修改受让人</span></div>

      <div style={{display:'grid', gridTemplateColumns:'160px 360px', gap:'12px 12px', margin:'16px 0'}}>
        <div>姓名：</div>
        <div>{data.name}</div>
        <div>证件类型：</div>
        <div>{data.idType}</div>
        <div>性别：</div>
        <div>{data.gender || '--'}</div>
        <div>证件号码：</div>
        <div>{data.idNo}</div>
        <div>出生日期：</div>
        <div>{data.birthDate || '--'}</div>
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

export default EditBeneficiary
