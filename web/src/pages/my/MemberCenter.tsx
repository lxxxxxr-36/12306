import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../member-center.css'
import BasicInfo from './sections/BasicInfo'
import Welcome from './sections/Welcome'
import BeneficiariesList from './sections/BeneficiariesList'
import AddBeneficiary from './sections/AddBeneficiary'
import EditBeneficiary from './sections/EditBeneficiary'
import PickPassengers from './sections/PickPassengers'
import Notice from './sections/Notice'
import AboutMember from './sections/AboutMember'
import AboutPoints from './sections/AboutPoints'

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
  const mode = sp.get('mode') || ''
  const active = useMemo(() => flatItems.find(i => i.key === sub), [sub])
  const [exclusiveOpen, setExclusiveOpen] = useState(false)

  const setSub = (key: string) => {
    const next = new URLSearchParams(location.search)
    if (key) next.set('sub', key); else next.delete('sub')
    next.delete('mode');
    next.delete('id');
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
          {active ? (
            active.key === 'profile' ? (
              <BasicInfo />
            ) : active.key === 'beneficiary' ? (
              mode === 'add' ? <AddBeneficiary /> : mode === 'edit' ? <EditBeneficiary /> : mode === 'pick' ? <PickPassengers /> : <BeneficiariesList />
            ) : active.key === 'notice' ? (
              <Notice />
            ) : active.key === 'about_member' ? (
              <AboutMember />
            ) : active.key === 'about_points' ? (
              <AboutPoints />
            ) : (
              <div className="mc-placeholder">{`${active.label} 页面占位`}</div>
            )
          ) : (
            <Welcome />
          )}
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
