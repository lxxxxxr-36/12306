import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSession } from '../../../hooks/useSession'
import { ensureSelfBeneficiary, getBeneficiaries, deleteBeneficiary } from '../../../services/beneficiaries'

function maskId(id: string){ if (id.length <= 7) return id; return id.slice(0,4)+'************'+id.slice(-3) }
function maskPhone(code?: string, num?: string){ if (!num) return ''; const n = num; if (n.length < 7) return `(${code})`+n; return `(${code})`+n.slice(0,3)+'****'+n.slice(-4) }

const BeneficiariesList: React.FC = () => {
  const { username } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [ver, setVer] = useState(0)
  useEffect(()=>{ if (username) ensureSelfBeneficiary(username); setVer(x=>x+1) },[username])
  const list = useMemo(()=> username ? getBeneficiaries(username) : [], [username, ver])
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState<{id:string;name:string}|null>(null)
  const [okMsg, setOkMsg] = useState<string>('')

  const goHome = () => navigate('/member')
  const refresh = () => navigate({ pathname:'/member', search:'sub=beneficiary' })
  const openAddNew = () => navigate({ pathname:'/member', search:'sub=beneficiary&mode=add' })
  const openPick = () => navigate({ pathname:'/member', search:'sub=beneficiary&mode=pick' })

  return (
    <div>
      <div className="mc-breadcrumb"><span className="home link" onClick={goHome}>🏠</span><span className="sep">&gt;</span><span className="link" onClick={refresh} style={{color:'#2ea5ff'}}>受让人管理</span></div>

      <div style={{display:'flex', alignItems:'center', gap:12, margin:'12px 0'}}>
        <div style={{position:'relative'}}>
          <button className="mc-add" onClick={()=>setMenuOpen(s=>!s)}>添加</button>
          {menuOpen && (
            <div className="mc-add-menu">
              <button onClick={openAddNew}>新增受让人</button>
              <button onClick={openPick}>获取乘车人</button>
            </div>
          )}
        </div>
        <span style={{color:'#999'}}>(本人默认为受让人，受让人添加上限为8人)</span>
      </div>

      <table className="mc-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>姓名</th>
            <th>证件类型</th>
            <th>证件号码</th>
            <th>手机</th>
            <th>生效日期</th>
            <th>审核状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {list.map((b, idx) => (
            <tr key={b.id}>
              <td>{idx+1}</td>
              <td>{b.name}</td>
              <td>{b.idType}</td>
              <td>{maskId(b.idNo)}</td>
              <td>{maskPhone(b.phoneCode, b.phoneNumber)}</td>
              <td>{b.effectiveDate || b.createdAt}</td>
              <td>已通过</td>
              <td>
                {idx === 0 ? null : (
                  <>
                    <button className="mc-icon" onClick={()=>navigate({ pathname:'/member', search:`sub=beneficiary&mode=edit&id=${b.id}` })}>🖊</button>
                    <button className="mc-icon" onClick={()=>setConfirmDel({id:b.id, name:b.name})}>🗑</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDel && (
        <div className="mc-modal-mask" onClick={()=>setConfirmDel(null)}>
          <div className="mc-modal" onClick={e=>e.stopPropagation()}>
            <div className="mc-modal-title">删除确认</div>
            <div className="mc-modal-body">确认删除 {confirmDel.name} 用户吗？</div>
            <div style={{display:'flex', justifyContent:'center', gap:12}}>
              <button className="secondary" onClick={()=>setConfirmDel(null)}>取消</button>
              <button className="primary" onClick={()=>{ if (username) deleteBeneficiary(username, confirmDel.id); setConfirmDel(null); setOkMsg('删除成功'); setTimeout(()=>setOkMsg(''), 1200); setVer(x=>x+1); }}>确认</button>
            </div>
          </div>
        </div>
      )}

      {okMsg && (
        <div className="mc-modal-mask" onClick={()=>setOkMsg('')}>
          <div className="mc-modal" onClick={e=>e.stopPropagation()}>
            <div className="mc-modal-title">温馨提示</div>
            <div className="mc-modal-body">{okMsg}</div>
            <button className="primary" onClick={()=>setOkMsg('')}>确认</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BeneficiariesList

