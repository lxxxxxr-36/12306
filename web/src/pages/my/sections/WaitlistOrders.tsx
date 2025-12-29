import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './train-orders.css';
import { listStandbys, cancelStandby, payStandby } from '../../../services/standby';
import type { StandbyStatus } from '../../../services/standby';

const seatLabels: Record<'sw'|'ydz'|'edz'|'wz', string> = { sw:'商务座', ydz:'一等座', edz:'二等座', wz:'无座' };

const labelStatus = (s: StandbyStatus) => {
  switch(s){
    case 'submitted': return '待支付';
    case 'matching': return '待兑现';
    case 'success': return '已兑现';
    case 'expired': return '已终止';
    case 'cancelled': return '已取消';
    default: return s;
  }
}

const WaitlistOrders: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'to_pay' | 'to_match' | 'processed'>('to_pay');
  const [standbys, setStandbys] = useState<ReturnType<typeof listStandbys>>([]);

  useEffect(() => {
    setStandbys(listStandbys());
    const t = window.setInterval(() => setStandbys(listStandbys()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    return standbys.filter(s => {
      if (activeTab === 'to_pay') return s.status === 'submitted';
      if (activeTab === 'to_match') return s.status === 'matching';
      return s.status === 'success' || s.status === 'expired' || s.status === 'cancelled';
    });
  }, [standbys, activeTab]);

  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon" />
      <div className="empty-text">
        <div>您没有{activeTab === 'to_pay' ? '待支付' : activeTab === 'to_match' ? '待兑现' : '已处理'}的候补订单哦 ~</div>
        <div>您可以通过<a className="book-link" onClick={() => navigate('/standby')}>车票预订</a>功能，来发起候补申请。</div>
      </div>
    </div>
  );

  return (
    <div className="train-orders-page">
      <div className="order-tabs">
        <button className={activeTab === 'to_pay' ? 'active' : ''} onClick={() => setActiveTab('to_pay')}>待支付订单</button>
        <button className={activeTab === 'to_match' ? 'active' : ''} onClick={() => setActiveTab('to_match')}>待兑现订单</button>
        <button className={activeTab === 'processed' ? 'active' : ''} onClick={() => setActiveTab('processed')}>已处理订单</button>
      </div>

      <div className="order-content">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>行程</th>
                <th>乘车日期</th>
                <th>乘客</th>
                <th>席别偏好</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.trainCode} {s.origin}-{s.dest}</td>
                  <td>{s.date}</td>
                  <td>{s.passengers.map(p => p.name || '乘客').join('、')}</td>
                  <td>{s.seatPrefs.map(x => seatLabels[x]).join('、')}</td>
                  <td>{labelStatus(s.status)}</td>
                  <td>
                    {s.status === 'matching' ? (
                      <button onClick={() => { cancelStandby(s.id); setStandbys(listStandbys()); }}>取消</button>
                    ) : s.status === 'submitted' ? (
                      <button className="primary" onClick={() => { payStandby(s.id); setStandbys(listStandbys()); }}>去支付</button>
                    ) : (
                      <button onClick={() => navigate('/standby')}>查看详情</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="tips-section">
        <div className="tips-title">温馨提示</div>
        <div className="tips-content">
          <p>1.系统将持续尝试为您兑现候补需求，若无满足您需求的席位，将在截止兑现时间自动终止兑现。</p>
          <p>2.兑现成功或自动终止时，将通过您选择的通知方式进行告知，请注意查收消息并关注“候补订单”兑现状态。</p>
          <p>3.兑现时，将根据您所候补列车的席位实际情况予以分配（座席分配包含卧代座），多人出行时，可能分配到不同车厢。系统优先为60岁以上老年人分配下铺，下铺售完时自动分配其他铺别。</p>
          <p>4.同一候补购票订单中需求不进行部分兑现。</p>
          <p>5.兑现时实名制和行程冲突规则按既有规则办理。</p>
          <p>6.兑现成功车票的退改签规则按既有规则办理，退票费按如下规则核收：票面乘车站开车时间前8天（含）以上不收取退票费，48小时以上的按票价5%计，24小时以上、不足48小时的按票价10%计，不足24小时的按票价20%计。上述计算的尾数以5角为单位，尾数小于2.5角的舍去、2.5角（含）以上且小于7.5角的计为5角、7.5角（含）以上的进为1元。退票费最低按2元计收。</p>
          <p>7.铁路新增相同乘车日期、发到站（含同城站）列车时，将通过消息通知提醒您，请您提前开启12306App通知，或在通知设置中选择微信/支付宝通知。</p>
        </div>
      </div>
    </div>
  );
};

export default WaitlistOrders;
