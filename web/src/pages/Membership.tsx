import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './membership.css'

const tabs = [
  { key: 'manage', label: '会员管理', subs: [
    { key: 'profile', label: '个人信息' },
    { key: 'level', label: '会员等级' },
    { key: 'security', label: '账户安全' },
  ]},
  { key: 'points', label: '积分账户', subs: [
    { key: 'points_query', label: '积分查询' },
    { key: 'points_recover', label: '积分补登' },
  ]},
  { key: 'exchange', label: '积分兑换', subs: [
    { key: 'beneficiary', label: '受让人管理' },
    { key: 'redeem_ticket', label: '兑换车票' },
  ]},
  { key: 'exclusive', label: '会员专享', subs: [] },
  { key: 'help', label: '帮助中心', subs: [
    { key: 'notice', label: '会员须知' },
    { key: 'about_member', label: '关于会员' },
    { key: 'about_points', label: '关于积分' },
  ]},
] as const

const Membership: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const qs = new URLSearchParams(location.search)
  const active = tabs.some(t => t.key === qs.get('tab')) ? (qs.get('tab') as string) : ''
  const [hoverKey, setHoverKey] = useState<string>('')
  const hoverIndex = useMemo(() => tabs.findIndex(t => t.key === hoverKey), [hoverKey])

  return (
    <div className="member-page">
      <section className="member-hero">
        <div className="member-overlay">
          <nav className="member-sidebar" onMouseLeave={()=>setHoverKey('')}>
            {tabs.map((t, idx) => (
              <div key={t.key} className="member-item-row">
                <button
                  className={'member-link' + (active === t.key ? ' active' : '')}
                  onClick={(e)=>{ e.preventDefault(); }}
                  onMouseEnter={()=>setHoverKey(t.key)}
                >{t.label}</button>
                {hoverKey===t.key && (
                  <div className="hover-panel">
                    {t.key==='exclusive' ? (
                      <div className="hover-item disabled">敬请期待</div>
                    ) : (
                      t.subs.map(s => (
                        <button key={s.key} className="hover-item" onClick={()=>navigate(`/member?sub=${s.key}`)}>{s.label}</button>
                      ))
                    )}
                    <span className="hover-notch" />
                  </div>
                )}
              </div>
            ))}
          </nav>
          
        </div>
      </section>

      <section className="member-tiles">
        <div className="tile" onClick={() => navigate('/results')}>
          <div className="icon ticket" />
          <div className="label">车票预订</div>
        </div>
        <div className="tile" onClick={() => navigate('/stub/transfer')}>
          <div className="icon transfer" />
          <div className="label">中转换乘</div>
        </div>
        <div className="tile" onClick={() => navigate('/stub/food_special')}>
          <div className="icon food" />
          <div className="label">餐饮特产</div>
        </div>
        <div className="tile" onClick={() => navigate('/stub/warm_service')}>
          <div className="icon warm" />
          <div className="label">温馨服务</div>
        </div>
      </section>

    </div>
  )
}

export default Membership
