import React from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import '../personal-center.css';
import CenterHome from './sections/CenterHome';
import TrainOrders from './sections/TrainOrders';
import WaitlistOrders from './sections/WaitlistOrders';
import TimesCardOrders from './sections/TimesCardOrders';
import AppointmentOrders from './sections/AppointmentOrders';
import SkiExpressOrders from './sections/SkiExpressOrders';
import FoodOrders from './sections/FoodOrders';
import InsuranceOrders from './sections/InsuranceOrders';
import InvoicePage from './sections/InvoicePage';
import MyTicket from './sections/MyTicket';
import ProfileView from './sections/ProfileView';
import ProfileSecurity from './sections/ProfileSecurity';
import MobileVerify from './sections/MobileVerify';
import AccountDelete from './sections/AccountDelete';
import Passengers from './sections/Passengers';
import Addresses from './sections/Addresses';
import PriorityService from './sections/PriorityService';
import LostFound from './sections/LostFound';
import ServiceQuery from './sections/ServiceQuery';
import AddPassenger from './sections/AddPassenger';
import EditPassenger from './sections/EditPassenger';

const PersonalCenter: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="pc-wrap">
      <aside className="pc-side">
        <div className="group">
          <NavLink className={({ isActive }) => 'group-title link' + (isActive ? ' active' : '')} to="/my">个人中心</NavLink>
        </div>
        <div className="group">
          <div className="group-title">订单中心</div>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/orders/train">火车票订单</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/orders/waitlist">候补订单</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/orders/timescard">计次·定期票订单</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/orders/appointment">约号订单</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/orders/ski">雪具快运订单</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/orders/food">餐饮·特产</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/orders/insurance">保险订单</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/orders/invoice">电子发票</NavLink>
        </div>
        <div className="group">
          <NavLink className={({ isActive }) => 'group-title link' + (isActive ? ' active' : '')} to="/my/ticket">本人车票</NavLink>
        </div>
        <div className="group">
          <button className="group-title link" onClick={() => navigate('/member')}>会员中心</button>
        </div>
        <div className="group">
          <div className="group-title">个人信息</div>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/profile/view">查看个人信息</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/profile/security">账号安全</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/profile/mobile">手机核验</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/profile/delete">账号注销</NavLink>
        </div>
        <div className="group">
          <div className="group-title">常用信息管理</div>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/common/passengers">乘车人</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/common/addresses">地址管理</NavLink>
        </div>
        <div className="group">
          <div className="group-title">温馨服务</div>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/service/priority">重点旅客预约</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/service/lost">遗失物品查找</NavLink>
          <NavLink className={({ isActive }) => 'link' + (isActive ? ' active' : '')} to="/my/service/query">服务查询</NavLink>
        </div>
      </aside>
      <section className="pc-content">
        <Routes>
          <Route index element={<CenterHome />} />
          <Route path="orders/train" element={<TrainOrders />} />
          <Route path="orders/waitlist" element={<WaitlistOrders />} />
          <Route path="orders/timescard" element={<TimesCardOrders />} />
          <Route path="orders/appointment" element={<AppointmentOrders />} />
          <Route path="orders/ski" element={<SkiExpressOrders />} />
          <Route path="orders/food" element={<FoodOrders />} />
          <Route path="orders/insurance" element={<InsuranceOrders />} />
          <Route path="orders/invoice" element={<InvoicePage />} />
          <Route path="ticket" element={<MyTicket />} />
          <Route path="profile/view" element={<ProfileView />} />
          <Route path="profile/security" element={<ProfileSecurity />} />
          <Route path="profile/mobile" element={<MobileVerify />} />
          <Route path="profile/delete" element={<AccountDelete />} />
          <Route path="common/passengers" element={<Passengers />} />
          <Route path="common/passengers/add" element={<AddPassenger />} />
          <Route path="common/passengers/edit/:id" element={<EditPassenger />} />
          <Route path="common/addresses" element={<Addresses />} />
          <Route path="service/priority" element={<PriorityService />} />
          <Route path="service/lost" element={<LostFound />} />
          <Route path="service/query" element={<ServiceQuery />} />
        </Routes>
      </section>
    </div>
  );
};

export default PersonalCenter;