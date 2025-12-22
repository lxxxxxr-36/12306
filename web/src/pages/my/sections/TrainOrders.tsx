import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../../../services/orders';
import type { Order } from '../../../types/order';
import './train-orders.css';

const TrainOrders: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'unfinished' | 'upcoming' | 'historical'>('unfinished');
  const [orders, setOrders] = useState<Order[]>([]);

  // Filter states
  const [upcomingFilterType, setUpcomingFilterType] = useState<'book' | 'ride'>('book');
  const [upcomingStartDate, setUpcomingStartDate] = useState('');
  const [upcomingEndDate, setUpcomingEndDate] = useState('');
  const [upcomingKeyword, setUpcomingKeyword] = useState('');

  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyKeyword, setHistoryKeyword] = useState('');

  useEffect(() => {
    setOrders(getOrders());
    const handleOrdersChange = () => setOrders(getOrders());
    window.addEventListener('orderschange', handleOrdersChange);
    return () => window.removeEventListener('orderschange', handleOrdersChange);
  }, []);

  const todayLocalISO = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().split('T')[0];
  }, []);

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setDate(today.getDate() - 30);
    
    const fmt = (d: Date) => {
       const off = d.getTimezoneOffset() * 60000;
       return new Date(d.getTime() - off).toISOString().split('T')[0];
    };

    setUpcomingStartDate(fmt(oneMonthAgo));
    setUpcomingEndDate(todayLocalISO);
    
    setHistoryStartDate(fmt(oneMonthAgo));
    setHistoryEndDate(todayLocalISO);
  }, [todayLocalISO]);


  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (activeTab === 'unfinished') {
        return o.status === 'pending';
      } else if (activeTab === 'upcoming') {
        // paid and not departed yet
        // For simplicity, treat 'paid' as upcoming if date >= today
        // But logic might be more complex with actual time checks. 
        // Here we simplify: status 'paid' is upcoming.
        if (o.status !== 'paid') return false;
        
        // Filter logic
        let dateToCompare = o.date; // ride date
        if (upcomingFilterType === 'book') {
             // We don't track booking date in Order type strictly separate from createdAt
             // But we have createdAt timestamp
             const bookDate = new Date(o.createdAt).toISOString().split('T')[0];
             dateToCompare = bookDate;
        }
        
        if (upcomingStartDate && dateToCompare < upcomingStartDate) return false;
        if (upcomingEndDate && dateToCompare > upcomingEndDate) return false;
        
        if (upcomingKeyword) {
            const kw = upcomingKeyword.toLowerCase();
            return o.id.toLowerCase().includes(kw) || 
                   o.item.trainCode.toLowerCase().includes(kw) ||
                   o.passengers.some(p => p.name.toLowerCase().includes(kw));
        }
        return true;
      } else {
        // historical: cancelled, refunded, or (paid and past date)
        // For simplicity: cancelled, refunded, completed
        // And maybe paid orders in the past?
        // Let's assume 'historical' includes cancelled/refunded for now as per usual logic
        const isHistoricalStatus = o.status === 'cancelled' || o.status === 'refunding' || o.status === 'completed';
        // Also include paid orders that are in the past? 
        // For now let's stick to status.
        if (!isHistoricalStatus && !(o.status === 'paid' && o.date < todayLocalISO)) return false;

        // Filter logic
        const rideDate = o.date;
        if (historyStartDate && rideDate < historyStartDate) return false;
        if (historyEndDate && rideDate > historyEndDate) return false;

        if (historyKeyword) {
            const kw = historyKeyword.toLowerCase();
            return o.id.toLowerCase().includes(kw) || 
                   o.item.trainCode.toLowerCase().includes(kw) ||
                   o.passengers.some(p => p.name.toLowerCase().includes(kw));
        }
        return true;
      }
    });
  }, [orders, activeTab, upcomingFilterType, upcomingStartDate, upcomingEndDate, upcomingKeyword, historyStartDate, historyEndDate, historyKeyword, todayLocalISO]);

  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon" />
      <div className="empty-text">
        <div>您没有{activeTab === 'unfinished' ? '未完成' : '对应的'}订单哦 ~</div>
        <div>您可以通过<a className="book-link" onClick={() => navigate('/results')}>车票预订</a>功能，来制定出行计划。</div>
      </div>
    </div>
  );

  return (
    <div className="train-orders-page">
      <div className="order-tabs">
        <button className={activeTab === 'unfinished' ? 'active' : ''} onClick={() => setActiveTab('unfinished')}>未完成订单</button>
        <button className={activeTab === 'upcoming' ? 'active' : ''} onClick={() => setActiveTab('upcoming')}>未出行订单</button>
        <button className={activeTab === 'historical' ? 'active' : ''} onClick={() => setActiveTab('historical')}>历史订单</button>
      </div>

      <div className="order-content">
        {activeTab === 'upcoming' && (
          <div className="filter-bar">
            <select value={upcomingFilterType} onChange={e => setUpcomingFilterType(e.target.value as any)}>
              <option value="book">按订票日期查询</option>
              <option value="ride">按乘车日期查询</option>
            </select>
            <div className="date-range">
                <input type="date" value={upcomingStartDate} onChange={e => setUpcomingStartDate(e.target.value)} />
                <span className="sep">-</span>
                <input type="date" value={upcomingEndDate} onChange={e => setUpcomingEndDate(e.target.value)} />
            </div>
            <div className="keyword-input">
                <input type="text" placeholder="订单号/车次/姓名" value={upcomingKeyword} onChange={e => setUpcomingKeyword(e.target.value)} />
                {upcomingKeyword && <button className="clear-btn" onClick={() => setUpcomingKeyword('')}>×</button>}
            </div>
            <button className="search-btn">查询</button>
          </div>
        )}

        {activeTab === 'historical' && (
          <div className="filter-bar">
             <div className="label">乘车日期</div>
             <div className="date-range">
                <input type="date" value={historyStartDate} onChange={e => setHistoryStartDate(e.target.value)} />
                <span className="sep">-</span>
                <input type="date" value={historyEndDate} onChange={e => setHistoryEndDate(e.target.value)} />
            </div>
            <div className="keyword-input">
                <input type="text" placeholder="订单号/车次/姓名" value={historyKeyword} onChange={e => setHistoryKeyword(e.target.value)} />
                {historyKeyword && <button className="clear-btn" onClick={() => setHistoryKeyword('')}>×</button>}
            </div>
            <button className="search-btn">查询</button>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="orders-table">
             <thead>
                <tr>
                    <th>订单号</th>
                    <th>车次信息</th>
                    <th>乘车日期</th>
                    <th>旅客</th>
                    <th>席位</th>
                    <th>票价</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
             </thead>
             <tbody>
                {filteredOrders.map(o => (
                    <tr key={o.id}>
                        <td>{o.id}</td>
                        <td>{o.item.trainCode} {o.origin}-{o.dest}</td>
                        <td>{o.date}</td>
                        <td>{o.passengers.map(p => p.name).join(',')}</td>
                        <td>{o.item.seatType} {o.item.seatNo}</td>
                        <td>¥{o.item.price}</td>
                        <td>{o.status}</td>
                        <td><button onClick={() => navigate(`/checkout/${o.id}`)}>查看详情</button></td>
                    </tr>
                ))}
             </tbody>
          </table>
        )}
      </div>

      <div className="tips-section">
        <div className="tips-title">温馨提示</div>
        <div className="tips-content">
          <p>1.订单信息在本网站保存期限为30日。</p>
          <p>2.在12306.cn网站改签和退票，改签应不晚于票面日期当日24:00，变更到站不晚于开车前48小时，退票应不晚于开车前。</p>
          <p>3.在本网站办理退票，只能逐次单张办理。</p>
          <p>4. 车票改签、变更到站均只能办理一次。已经改签或变更到站的车票不再办理改签；对已改签车票、团体票暂不提供“变更到站”服务。</p>
          <p>5.退票、改签、变更到站后，如有应退票款，按购票时所使用的在线支付工具相关规定，将在规定时间内退还至原在线支付工具账户，请及时查询。如有疑问，请致电12306人工客服查询。</p>
          <p>7.投保、退保或查看电子保单状态，请点击“我的保险”或“购/赠/退保险”。</p>
          <p>8.“除有效期有其他规定的车票外，车票当日当次有效。旅客自行中途上车、下车的，未乘区间的票款不予退还。”</p>
          <p>9.如因运力原因或其他不可控因素导致列车调度调整时，当前车型可能会发生变动。</p>
          <p>10.未尽事宜详见《国铁集团铁路旅客运输规程》《广深港高速铁路跨境旅客运输组织规则》《中老铁路跨境旅客联运组织规则》等有关规定和车站公告。</p>
        </div>
      </div>
    </div>
  );
};

export default TrainOrders;
