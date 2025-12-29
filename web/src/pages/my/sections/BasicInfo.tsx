import React, { useMemo } from 'react'
import { useSession } from '../../../hooks/useSession'
import { getUserByUsername } from '../../../services/auth'

function maskId(id: string){ if (id.length <= 7) return id; return id.slice(0,4)+'************'+id.slice(-3); }
function maskPhone(code: string, num: string){ if (!num) return ''; if (num.length < 7) return `(${code})`+num; return `(${code})`+num.slice(0,3)+'****'+num.slice(-4); }

const BasicInfo: React.FC = () => {
  const { username } = useSession()
  const user = useMemo(() => username ? getUserByUsername(username) : undefined, [username])
  if (!user) return <div className="mc-placeholder">请先登录</div>

  return (
    <div className="mc-profile">
      <div className="bi-title"><span className="bar" /><span>基本信息</span></div>
      <div className="bi-grid">
        <div className="bi-row"><div className="bi-label">姓名：</div><div className="bi-value">{user.fullName}</div></div>
        <div className="bi-row"><div className="bi-label">性别：</div><div className="bi-value">未设置</div></div>
        <div className="bi-row"><div className="bi-label">证件类型：</div><div className="bi-value">{user.idType}</div></div>
        <div className="bi-row"><div className="bi-label">证件号码：</div><div className="bi-value">{maskId(user.idNo)}</div></div>
        <div className="bi-row"><div className="bi-label">电子邮件：</div><div className="bi-value">{user.email || ''}</div></div>
        <div className="bi-row"><div className="bi-label">手机号：</div><div className="bi-value">{maskPhone(user.phoneCode, user.phoneNumber)}</div></div>
        <div className="bi-row"><div className="bi-label">会员状态：</div><div className="bi-value"><a className="bi-link">正常</a></div></div>
      </div>
    </div>
  )
}

export default BasicInfo
