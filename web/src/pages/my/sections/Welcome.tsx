import React, { useMemo } from 'react'
import { useSession } from '../../../hooks/useSession'
import { getUserByUsername } from '../../../services/auth'

const Smile: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" stroke="#2ea5ff" strokeWidth="2" />
    <circle cx="18" cy="20" r="2.5" fill="#2ea5ff" />
    <circle cx="30" cy="20" r="2.5" fill="#2ea5ff" />
    <path d="M16 28c2.5 3.5 6 5.5 8 5.5s5.5-2 8-5.5" stroke="#2ea5ff" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
)

const Welcome: React.FC = () => {
  const { username } = useSession()
  const user = useMemo(() => username ? getUserByUsername(username) : undefined, [username])
  const name = user?.fullName || username || ''
  return (
    <div className="mc-welcome">
      <div className="icon"><Smile /></div>
      <div>
        <div className="title">{name} 先生/女士，您好!</div>
        <div className="sub">欢迎您，铁路旅客积分网站</div>
      </div>
    </div>
  )
}

export default Welcome

