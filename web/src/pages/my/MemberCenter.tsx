import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../member-center.css'

type Item = { group: string; key: string; label: string }

const groups = [
  { group: '会员管理', items: [
    { key: 'profile', label: '个人信息' },
    { key: 'level', label: '会员等级' },
    { key: 'security', label: '账户安全' },
  ]},
  { group: '积分账户', items: [
    { key: 'points_query', label: '积分查询' },
    { key: 'points_recover', label: '积分补登' },
  ]},
  { group: '积分兑换', items: [
    { key: 'beneficiary', label: '受让人管理' },
    { key: 'redeem_ticket', label: '兑换车票' },
  ]},
  { group: '会员专享', items: [] },
  { group: '帮助中心', items: [
    { key: 'notice', label: '会员须知' },
    { key: 'about_member', label: '关于会员' },
    { key: 'about_points', label: '关于积分' },
  ]},
]

const flatItems: Item[] = groups.flatMap(g => g.items.map(i => ({ group: g.group, key: i.key, label: i.label })))

const MemberCenter: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const sp = new URLSearchParams(location.search)
  const sub = sp.get('sub') || ''
  const active = useMemo(() => flatItems.find(i => i.key === sub), [sub])
  const [exclusiveOpen, setExclusiveOpen] = useState(false)

  const setSub = (key: string) => {
    const next = new URLSearchParams(location.search)
    if (key) next.set('sub', key); else next.delete('sub')
    navigate({ pathname: '/member', search: next.toString() })
  }

  return (
    <div className="mc-wrap">
      <div className="mc-breadcrumb">
        <span className="home link" onClick={()=>navigate('/')}>🏠</span>
        <span className="sep">&gt;</span>
        <span className="link" onClick={()=>navigate('/membership')}>会员服务</span>
        <span className="sep">&gt;</span>
        <span className={active ? '' : 'active'} onClick={() => setSub('')}>会员中心</span>
        {active && (<>
          <span className="sep">&gt;</span>
          <span className="active">{active.label}</span>
        </>)}
      </div>

      <div className="mc-main">
        <aside className="mc-side">
          <button className="mc-tab" onClick={()=>setSub('')}>会员中心</button>
          {groups.map(g => (
            <div key={g.group} className="mc-group">
              <div className={"mc-group-title" + (g.group==='会员专享' ? ' clickable' : '')} onClick={g.group==='会员专享' ? ()=>setExclusiveOpen(true) : undefined}>{g.group}</div>
              {g.group === '会员专享' ? null : (
                g.items.map(i => (
                  <button key={i.key} className={'mc-link' + (active?.key===i.key?' active':'')} onClick={() => setSub(i.key)}>{i.label}</button>
                ))
              )}
            </div>
          ))}
        </aside>

        <section className="mc-content">
          <div className="mc-placeholder">{active ? `${active.label} 页面占位` : '会员中心页面'}</div>
        </section>
      </div>

      {exclusiveOpen && (
        <div className="mc-modal-mask" onClick={() => setExclusiveOpen(false)}>
          <div className="mc-modal" onClick={e=>e.stopPropagation()}>
            <div className="mc-modal-title">温馨提示</div>
            <div className="mc-modal-body">敬请期待！</div>
            <button className="primary" onClick={() => setExclusiveOpen(false)}>确认</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberCenter
