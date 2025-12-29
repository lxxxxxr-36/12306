import React from 'react'

const AboutPoints: React.FC = () => {
  return (
    <div className="mn-article">
      <div className="am-badge">积分累积</div>
      <ol className="am-list">
        <li>国际列车、非控股企业的动车列车等轨道指定列车车票不参与乘车积分累积。</li>
        <li>积分兑换的优惠车票不参与积分累积；代用票、列车票、到站补票、非实名制车票等不参与积分累积。</li>
        <li>车票60天会员账户积分查询时间为<span className="em-red">15</span>天，积分在<span className="em-red">14</span>日内累积为会员账户；学生票乘车积分=普通车票积分×系数（示例×<span className="em-red">10</span>）。</li>
        <li>积分以“分”为单位，按四舍五入<span className="em-red">取整计算</span>。</li>
        <li>积分在会员本人账户达到<span className="em-red">5日</span>内自动进入<span className="em-red">会员本人账户</span>，不能转让。</li>
        <li>积分在会员账户自到达之日起<span className="em-red">12个月</span>有效，到有效期内可进行兑换，到期未兑换积分自动作废。</li>
      </ol>

      <div className="am-badge">积分补登</div>
      <ol className="am-list">
        <li>会员如因现网异常或特殊情形，需在乘车后<span className="em-red">90日</span>（含当日）通过网站、车站会员服务窗口、铁路客服中心提出积分补登申请。</li>
        <li>会员如因现网活动积分需登记，需在活动结束后<span className="em-red">30日</span>内通过铁路客户服务中心提交积分补登登记申请。</li>
        <li>会员可在铁路客服中心<span className="em-red">提交申请7日</span>后查看审核结果。</li>
      </ol>

      <div className="am-badge">受让人</div>
      <ol className="am-list">
        <li>每名会员最多可设置<span className="em-red">8名</span>受让人（不含会员本人）。</li>
        <li>受让人需通过<span className="em-red">身份信息核验</span>方可生效。</li>
        <li>受让人在添加成功<span className="em-red">60天</span>（含当天）后生效。</li>
      </ol>

      <div className="am-badge">积分兑换</div>
      <div className="am-subtitle">兑换车票</div>
      <ol className="am-list">
        <li>会员可通过网站、<span className="em-red">铁路12306</span>手机APP或车站会员服务窗口办理积分兑换车票业务。</li>
        <li>会员账户积分总数需达到<span className="em-red">10000</span>分时，方具备首次兑换资格。</li>
        <li>积分允许兑换的车次以12306网站实际查询结果为准，<span className="em-red">100积分</span>相当于<span className="em-red">1元人民币</span>。</li>
        <li>会员可为本人或指定的<span className="em-red">受让人</span>兑换车票。</li>
        <li>会员在车站会员服务窗口为本人兑换车票时，凭本人<span className="em-red">身份证件原件</span>、<span className="em-red">消费密码</span>办理；为<span className="em-red">受让人</span>兑换车票时，还需提供<span className="em-red">受让人有效身份证件</span>原件。</li>
      </ol>
      <div className="am-subtitle">其他规则</div>
      <ol className="am-list">
        <li>会员选择积分兑换时，按铁路会员积分兑换管理的原则顺序办理，积分兑换时只允许使用<span className="em-red">单一账户</span>，不可透支，不可与其他支付方式叠加。</li>
        <li>积分兑换的车票可一次变更乘车站、改签或变更为允许积分兑换的车票，并有相应退票/变更规则限制。</li>
        <li>会员在办理退票时，退票手续费不支持积分支付；已兑换的积分不予返还。</li>
      </ol>

      <div className="am-badge">会员等级</div>
      <ol className="am-list">
        <li>保级评定周期为连续<span className="em-red">12个月</span>，升降级分达到门槛后即时或周期性调整会员级别。</li>
        <li>申请会员成功，初始为<span className="em-red">二星级会员</span>。</li>
        <li>升级评定按会员等级升降规则在<span className="em-red">次评定之日起</span>生效，等级有效期<span className="em-red">12个月</span>，会员降级后到期时，将继续按照会员等级规则执行。</li>
      </ol>
    </div>
  )
}

export default AboutPoints

