import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './membership.css'

const tabs = [
  { key: 'manage', label: '会员管理' },
  { key: 'points', label: '积分账户' },
  { key: 'exchange', label: '积分兑换' },
  { key: 'exclusive', label: '会员专享' },
  { key: 'help', label: '帮助中心' },
]

const Membership: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const qs = new URLSearchParams(location.search)
  const active = tabs.some(t => t.key === qs.get('tab')) ? (qs.get('tab') as string) : 'manage'

  return (
    <div className="member-page">
      <section className="member-hero">
        <div className="member-overlay">
          <nav className="member-sidebar">
            {tabs.map(t => (
              <button
                key={t.key}
                className={'member-link' + (active === t.key ? ' active' : '')}
                onClick={() => navigate(`/membership?tab=${t.key}`)}
              >{t.label}</button>
            ))}
          </nav>
          <div className="member-title">
            <h1>铁路畅行</h1>
            <p>会员计划</p>
          </div>
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

      <section className="member-content">
        <div className="placeholder">{tabs.find(t => t.key === active)?.label} 页面占位</div>
      </section>
    </div>
  )
}

export default Membership

