import React from 'react'

const Notice: React.FC = () => {
  return (
    <div className="mn-article">
      <div className="mn-title">“铁路畅行”常旅客会员服务须知</div>
      <div className="mn-sub">为了保障您的权益，请在申请“铁路畅行”常旅客会员之前，详细阅读以下各项条款：</div>

      <ol className="mn-list">
        <li>
          <div className="mn-section">
            申请人阅读并确认本条款后，即表示本人完全理解和同意遵守“铁路畅行”常旅客会员服务相关规定及要求，以及今后可能发生的变动和补充。
          </div>
        </li>
        <li>
          <div className="mn-section">
            年满12周岁的自然人可申请成为“铁路畅行”常旅客会员，参与积分累积和奖励活动，满足相应条件的会员可获赠更多积分。申请时可使用的有效身份证件为：
            <div className="mn-bullets">
              <div>（1）居民身份证；</div>
              <div>（2）港澳居民来往内地通行证；</div>
              <div>（3）台湾居民来往大陆通行证；</div>
              <div>（4）外国人永久居留身份证；</div>
              <div>（5）港澳台居民居住证；</div>
              <div>（6）外国居民按规范可使用的护照（仅赠普通标准的会员积分）。</div>
            </div>
          </div>
        </li>
        <li>
          <div className="mn-section">
            申请人信息必须由本人提出，信息真实、准确。若存在个人信息不真实等情况，铁路有权拒绝申请人的入会申请。因会员提供的信息有误而导致的会员权益受损等情形，铁路不承担任何责任。
          </div>
        </li>
        <li>
          <div className="mn-section">
            每名会员仅可拥有一个会员账户，以申请时所使用的有效身份证件为依据，不接受同一人重复申请，也不接受法人或其他非法人组织的申请。
          </div>
        </li>
        <li>
          <div className="mn-section">
            会员如有任何违反“铁路畅行”常旅客会员服务条款、铁路有关规则规定的违规行为，铁路有权采取核减积分、清零积分、冻结会员账户、注销会员账户等措施，并可拒绝其再次申请成为会员。会员违规行为包括但不限于：
            <div className="mn-bullets">
              <div>（1）冒用他人身份信息办理，或违反不当言语等行为；</div>
              <div>（2）利用系统漏洞、故障或其他漏洞，造成铁路损失或使会员权益受损；</div>
              <div>（3）将“铁路畅行”积分、权益或兑换车票等用于买卖或交易。</div>
            </div>
          </div>
        </li>
        <li>
          <div className="mn-section">
            积分累积规则，以兑换的产品和服务，以及会员权益等均以 www.12306.cn 网站公布的最新版会员手册为准，请您随时关注该网站公布的最新内容。
          </div>
        </li>
        <li>
          <div className="mn-section">
            本条款受中华人民共和国法律管辖，若本条款与国家法律相抵触，则以国家法律为准。
          </div>
        </li>
        <li>
          <div className="mn-section">
            权利方发生任何争议，双方应尽力友好协商解决；协商不成时，应向有管辖权的人民法院提起诉讼。
          </div>
        </li>
      </ol>

      <div className="mn-date">2017年12月20日</div>
    </div>
  )
}

export default Notice

