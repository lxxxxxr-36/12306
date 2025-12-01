import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './group.css';

const WorkerContent = () => (
  <div className="section">
    <div className="banner disabled"><span>暂时无法办理该业务</span></div>
    <h2>务工人员团体票办理（目前仅办理春运团体票预订）</h2>
    <div className="timeline" />
    <div className="item">
      <div className="dot" /><div className="item-body">
        <div className="item-title">一、办理车票范围</div>
        <div className="item-text">2021年1月28日至3月8日期间增开旅客列车车票。</div>
      </div>
    </div>
    <div className="item">
      <div className="dot" /><div className="item-body">
        <div className="item-title">二、办理流程和时间安排</div>
        <div className="item-sub">1. 企业用户注册。2020年12月23日起，网站开始受理用工企业注册申请；车站（具体详见网站公告）开始办理企业资质审核和协议签订手续。</div>
        <div className="item-text">用工企业在网站注册时，需设置用户名和密码，录入企业名称、企业地址、统一社会信用代码、以及经办人的姓名、身份证号码、手机号码（需核验）和电子邮箱地址，并选择办理资质审核手续的车站。</div>
        <div className="item-text">注册成功后，用工企业经办人到选定的办理站窗口办理资质审核手续时，应提供以下材料（一式两份）：</div>
        <ul className="list">
          <li>（1）有效的企业营业执照副本原件；</li>
          <li>（2）加盖企业及法定代表人印章的《订购务工团体车票协议》；</li>
          <li>（3）经办人二代身份证件原件。</li>
        </ul>
        <div className="item-sub">2. 提交购票需求。2020年12月26日起，网站和车站窗口开始受理距开车前32天（含当天）及以上的购票需求。通过资质审核的用工企业在网站提交，零散务工团体可持乘车人身份证原件到车站办理窗口提交（提交时需预留用于接收配票成功信息的手机号码）。</div>
        <div className="item-sub">3. 组织配票。铁路部门将在开车前31天组织配票。配票完成后，系统向配票成功的用工企业经办人和零散务工团体预留手机号发送含有订单信息和支付链接的通知短信；用工企业也可登录网站查询配票结果。</div>
        <div className="item-sub">4. 支付票款。配票成功的用工企业和零散务工团体需在开车前31天23:30前支付票款。用工企业和零散务工团体均可通过短信支付链接进行支付，或持乘车人二代身份证原件到车站售票窗口和代售点支付；用工企业也可在网站支付。</div>
      </div>
    </div>
  </div>
);

const StudentContent = () => (
  <div className="section">
    <h2>互联网预订学生团体票须知</h2>
    <div className="timeline" />
    <div className="item"><div className="dot" /><div className="item-body">
      <div className="item-title">一.铁路局集团公司授权</div>
      <ul className="list">
        <li>1.1 符合国家有关规定享受学生优惠资质的学校允许在互联网上集中预订学生团体票。</li>
        <li>1.2 学校在互联网上预订学生团体票之前，必须与学校所在地铁路局集团公司签订互联网订票合同户协议。</li>
        <li>1.3 铁路局集团公司向学校出具互联网预订学生团体票“授权证书”。</li>
      </ul>
    </div></div>
    <div className="item"><div className="dot" /><div className="item-body">
      <div className="item-title">二.网站服务时间</div>
      <div className="item-text">网站每日06:00~23:30提供服务。</div>
    </div></div>
    <div className="item"><div className="dot" /><div className="item-body">
      <div className="item-title">三.学校登录</div>
      <ul className="list">
        <li>3.1 学校集中办票登录的网站地址为授权证书中公布的地址。</li>
        <li>3.2 首次登录时，须使用授权证书中的管理员用户名和密码。</li>
        <li>3.3 为方便学校进行订单管理，管理员可创建不超过62个一级部门，在每个一级部门下创建不超过62个二级部门。</li>
        <li>3.4 为方便学校并行录入订单，管理员可在一级部门下定义操作员。</li>
      </ul>
    </div></div>
    <div className="item"><div className="dot" /><div className="item-body">
      <div className="item-title">四.学校组织录入订单</div>
      <ul className="list">
        <li>4.1 只有操作员才可录入订单。</li>
        <li>4.2 不同操作员可并行录入订单，重复录入的订单的以先录的为准。</li>
        <li>4.3 可录入单程或往返车票订单，不允许录入通票和联程车票的订单。</li>
        <li>4.4 每位学生限定一张往程车票和一张返程车票。重复录入的以先录入的为准。</li>
        <li>4.5 乘车站限定为学校所在地城市行政管辖范围内的所有车站，订票乘车区间必须与学生证载明的优惠区间一致。</li>
        <li>4.6 暂只能办理动车组二等座和普通车硬座的预订业务。</li>
        <li>4.7 订票时必须录入学生本人二代居民身份证号码和真实姓名。</li>
        <li>4.8 为提高订票的成功率，建议订票时不限定发车日期和车次。</li>
        <li>4.9 操作员可通过订单查询查看本人录入的订单。</li>
      </ul>
    </div></div>
    <div className="item"><div className="dot" /><div className="item-body">
      <div className="item-title">五.订单处理</div>
      <ul className="list">
        <li>5.1 只有管理员才可对订单进行处理操作。管理员可查看本校所有订单。</li>
        <li>5.2 当确认所有订单提交完整无误后，可执行“封单”操作。</li>
        <li>5.3 封单后，方可进行汇总单分配、汇总单查询以及核对提交。</li>
        <li>5.4 封单后，需添加或修改订单时，先执行“解封”操作。</li>
        <li>5.5 订单核对提交后，原则上不再允许修改订单。</li>
      </ul>
    </div></div>
    <div className="item"><div className="dot" /><div className="item-body">
      <div className="item-title">六.铁路配票</div>
      <ul className="list">
        <li>6.1 铁路部门根据学校提交的订单需求，按照最大限度满足的原则进行配票。</li>
        <li>6.2 铁路部门配票后，学校可在网站上查看订单兑现情况。</li>
        <li>6.3 学校应当在协议规定时间内到指定车站交款取票，车票票面载明有乘车学生的二代居民身份证号码和姓名。</li>
        <li>6.4 对于配票成功的订单，铁路部门将扣除乘车学生相应的减价优惠次数。当学生改变行程计划时，必须取票后到车站窗口办理退票，否则将影响后续正常购票。</li>
      </ul>
    </div></div>
    <div className="item"><div className="dot" /><div className="item-body">
      <div className="item-title">七.附则</div>
      <ul className="list">
        <li>7.1 本须知中所称“学校”指与铁路签订了合同户协议的学校。</li>
        <li>7.2 本须知中的未尽事宜，按《铁路旅客运输规程》等有关规定办理，请参阅有关规定。</li>
      </ul>
    </div></div>
  </div>
);

const GroupService: React.FC = () => {
  const location = useLocation();
  const init = (() => { const t = new URLSearchParams(location.search).get('tab'); return (t === 'student' ? 'student' : 'worker') as 'worker'|'student'; })();
  const [tab, setTab] = useState<'worker'|'student'>(init);
  useEffect(() => {
    const t = new URLSearchParams(location.search).get('tab');
    if (t === 'student' || t === 'worker') setTab(t as 'worker'|'student');
  }, [location.search]);
  return (
    <div className="group-page">
      <div className="tabs">
        <button className={tab==='worker'?'active':''} onClick={()=>setTab('worker')}>务工人员</button>
        <button className={tab==='student'?'active':''} onClick={()=>setTab('student')}>学生团体</button>
      </div>
      {tab==='worker' ? <WorkerContent /> : <StudentContent />}
    </div>
  );
};

export default GroupService;
