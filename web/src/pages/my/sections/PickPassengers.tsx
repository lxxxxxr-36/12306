import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../../hooks/useSession'
import { getPassengers } from '../../../services/passengers'
import { addBeneficiariesFromPassengers } from '../../../services/beneficiaries'

function maskId(id: string){ if (id.length <= 7) return id; return id.slice(0,4)+'************'+id.slice(-3) }
function maskPhone(code: string, num: string){ if (!num) return ''; if (num.length < 7) return `(${code})`+num; return `(${code})`+num.slice(0,3)+'****'+num.slice(-4) }

const PickPassengers: React.FC = () => {
  const { username } = useSession()
  const navigate = useNavigate()
  const list = useMemo(()=> username ? getPassengers(username) : [], [username])
  const self = list.find(x=>x.isSelf)
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [errMsg, setErrMsg] = useState('')

  const toggle = (id: string) => {
    if (self && id === self.id) return
    setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id])
  }
  const toggleAll = () => {
    const ids = list.filter(x=>!x.isSelf).map(x=>x.id)
    const all = ids.every(id => selected.includes(id))
    setSelected(all ? [] : ids)
  }
  const goBack = () => navigate({ pathname:'/member', search:'sub=beneficiary' })
  const add = () => {
    setError('')
    if (!username) { setError('请先登录'); return }
    const res = addBeneficiariesFromPassengers(username, selected)
    if (!res.ok) { setErrMsg(res.message||'添加失败'); return }
    setOkMsg('受让人添加成功')
  }

  return (
    <div>
      <div className="mc-breadcrumb"><span className="home link" onClick={()=>navigate('/member')}>🏠</span><span className="sep">&gt;</span><span className="link" onClick={()=>navigate({ pathname:'/member', search:'sub=beneficiary' })}>受让人管理</span><span className="sep">&gt;</span><span className="active">获取乘车人</span></div>
      <div style={{color:'#999', margin:'6px 0 12px'}}>(从乘车人里添加受让人)</div>

      <table className="mc-table">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={toggleAll} checked={list.filter(x=>!x.isSelf).every(x=>selected.includes(x.id)) && list.filter(x=>!x.isSelf).length>0} /></th>
            <th>姓名</th>
            <th>证件类型</th>
            <th>证件号码</th>
            <th>手机</th>
            <th>旅客类型</th>
            <th>校验状态</th>
          </tr>
        </thead>
        <tbody>
          {list.map(p => (
            <tr key={p.id}>
              <td><input type="checkbox" disabled={p.isSelf} checked={selected.includes(p.id)} onChange={()=>toggle(p.id)} /></td>
              <td>{p.name}</td>
              <td>{p.idType}</td>
              <td>{maskId(p.idNo)}</td>
              <td>{maskPhone(p.phoneCode, p.phoneNumber)}</td>
              <td>{p.benefit}</td>
              <td>已通过</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{marginTop:12}}>共 {list.length} 条</div>
      <div style={{display:'flex', gap:12, marginTop:8}}>
        <button className="secondary" onClick={goBack}>取消</button>
        <button className="primary" onClick={add}>添加</button>
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
      {errMsg && (
        <div className="mc-modal-mask" onClick={()=> setErrMsg('') }>
          <div className="mc-modal" onClick={e=>e.stopPropagation()}>
            <div className="mc-modal-title">温馨提示</div>
            <div className="mc-modal-body">{errMsg}</div>
            <button className="primary" onClick={()=> setErrMsg('') }>确认</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PickPassengers
