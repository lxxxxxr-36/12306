import React from 'react'

const AboutMember: React.FC = () => {
  return (
    <div className="mn-article">
      <div className="am-badge">会员账户</div>

      <div className="am-block">
        <div className="am-subtitle">信息管理</div>
        <ol className="am-list">
          <li><span className="em-red">信息查询：</span>可在网站、车站会员服务窗口、铁路客户服务中心查询账户信息。</li>
          <li><span className="em-red">信息修改：</span>网站、车站会员服务窗口可办理修改除姓名、有效身份证件类型及号码以外的账户信息。</li>
          <li><span className="em-red">密码重置：</span>车站会员服务窗口可办理账户消费密码重置。</li>
        </ol>
      </div>

      <div className="am-block">
        <div className="am-subtitle">账户注销</div>
        <div className="am-paragraph">
          会员申请注销时需本人持申请时所使用的<span className="em-red">身份证件原件</span>，到<span className="em-red">车站会员服务窗口办理</span>。会员账户注销后，账户内<span className="em-red">积分全部作废</span>。
        </div>
      </div>
    </div>
  )
}

export default AboutMember

