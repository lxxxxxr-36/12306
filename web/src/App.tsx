import { NavLink, Route, Routes, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Results from './pages/Results'
import Orders from './pages/Orders'
import ProtectedRoute from './components/ProtectedRoute'
import My12306Menu from './components/My12306Menu'
import NotFound from './pages/NotFound'
import Standby from './pages/Standby'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import { useSession } from './hooks/useSession'
import { logout } from './services/auth'
import ConfirmOrder from './pages/ConfirmOrder'
import PersonalCenter from './pages/my/PersonalCenter'
import Membership from './pages/Membership'
import MemberCenter from './pages/my/MemberCenter'
import GroupService from './pages/GroupService'
import StationService from './pages/StationService'
import BusinessService from './pages/BusinessService'
import TravelGuide from './pages/TravelGuide'
import InfoQuery from './pages/InfoQuery'
import StubPage from './pages/StubPage'
import { getUserByUsername } from './services/auth'

const CaretDown = () => (
  <svg className="caret" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function App() {
  const { username } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const handleLogout = () => { logout(); navigate('/', { replace: true }); };
  useEffect(() => { setOpenMenu(null); }, [location]);
  const isLoginPage = location.pathname.startsWith('/login');
  const isMemberPage = location.pathname.startsWith('/membership');
  return (
    <div>
      <header className={"site-header" + (isLoginPage ? " login" : "")}>
        <div className="wrap">
          <div className="logo">
            <img src="/media/图标.png" alt="中国铁路12306" className="logo-img" />
          </div>
          {isLoginPage && (
            <div className="login-welcome-text">欢迎登录12306</div>
          )}
          {!isLoginPage && (
            <nav>
              <My12306Menu />
              <span className="divider">|</span>
              {username ? (
                <span className="welcome">
                  <span className="label">您好，</span>
                  <button className="username-link" onClick={() => navigate('/my')}>{getUserByUsername(username)?.fullName || username}</button>
                </span>
              ) : (
                <span className="auth-group">
                  <NavLink className="auth-link" to="/login">登录</NavLink>
                  <span className="divider">|</span>
                  <NavLink className="auth-link" to="/register">注册</NavLink>
                </span>
              )}
              <span className="divider">|</span>
              {username ? (
                <button className="logout-link" onClick={handleLogout}>退出</button>
              ) : null}
            </nav>
          )}
        </div>
        {!isLoginPage && (
          <div className="main-nav">
            <div className="wrap">
              <div className="nav-items">
                <NavLink to="/" end className="nav-item">首页</NavLink>
                <div className="nav-item has-dropdown" onMouseEnter={() => setOpenMenu('ticket')} onMouseLeave={() => setOpenMenu(null)}>
                  <span>车票<CaretDown /></span>
                  <div className={"dropdown" + (openMenu === 'ticket' ? " open" : "")}> 
                    <div className="dd-grid dd-3">
                      <div className="dd-col">
                        <div className="dd-title">购买</div>
                        <div className="dd-nested">
                          <div>
                            <NavLink to="/results?ticketType=oneway" className="dd-item" onClick={() => setOpenMenu(null)}>单程</NavLink>
                            <NavLink to="/results?ticketType=roundtrip" className="dd-item" onClick={() => setOpenMenu(null)}>往返</NavLink>
                            <NavLink to="/stub/transfer" className="dd-item" onClick={() => setOpenMenu(null)}>中转换乘</NavLink>
                          </div>
                        </div>
                      </div>
                      <div className="dd-col">
                        <div className="dd-title">变更</div>
                        <div className="dd-nested">
                          <div>
                            <NavLink to="/stub/refund" className="dd-item" onClick={() => setOpenMenu(null)}>退票</NavLink>
                            <NavLink to="/stub/reschedule" className="dd-item" onClick={() => setOpenMenu(null)}>改签</NavLink>
                            <NavLink to="/stub/change_station" className="dd-item" onClick={() => setOpenMenu(null)}>变更到站</NavLink>
                          </div>
                        </div>
                      </div>
                      <div className="dd-col">
                        <div className="dd-title">更多</div>
                        <div className="dd-nested">
                          <div>
                            <NavLink to="/stub/crh_card" className="dd-item" onClick={() => setOpenMenu(null)}>中铁银通卡</NavLink>
                            <NavLink to="/stub/international" className="dd-item" onClick={() => setOpenMenu(null)}>国际列车</NavLink>
                          </div>
                        </div>
                        <div className="dd-nested" style={{marginTop:8}}>
                          <div>
                            <NavLink to="/orders" className="dd-item" onClick={() => setOpenMenu(null)}>订单中心</NavLink>
                            <NavLink to="/standby" className="dd-item" onClick={() => setOpenMenu(null)}>候补购票</NavLink>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              
              <div className="nav-item has-dropdown" onMouseEnter={() => setOpenMenu('group')} onMouseLeave={() => setOpenMenu(null)}>
                <span>团购服务<CaretDown /></span>
                <div className={"dropdown" + (openMenu === 'group' ? " open" : "")}>
                  <div className="dd-grid dd-2">
                    <div className="dd-col"><NavLink to="/group?tab=worker" className="dd-item" onClick={() => setOpenMenu(null)}>务工人员</NavLink></div>
                    <div className="dd-col"><NavLink to="/group?tab=student" className="dd-item" onClick={() => setOpenMenu(null)}>学生团体</NavLink></div>
                  </div>
                </div>
              </div>

              <div className="nav-item has-dropdown" onMouseEnter={() => setOpenMenu('member')} onMouseLeave={() => setOpenMenu(null)}>
                <span>会员服务<CaretDown /></span>
                <div className={"dropdown" + (openMenu === 'member' ? " open" : "")}>
                    <div className="dd-grid dd-5">
                    <div className="dd-col"><NavLink to="/membership" className="dd-item" onClick={() => setOpenMenu(null)}>会员管理</NavLink></div>
                    <div className="dd-col"><NavLink to="/membership" className="dd-item" onClick={() => setOpenMenu(null)}>积分账户</NavLink></div>
                    <div className="dd-col"><NavLink to="/membership" className="dd-item" onClick={() => setOpenMenu(null)}>积分兑换</NavLink></div>
                    <div className="dd-col"><NavLink to="/membership" className="dd-item" onClick={() => setOpenMenu(null)}>会员专享</NavLink></div>
                    <div className="dd-col"><NavLink to="/membership" className="dd-item" onClick={() => setOpenMenu(null)}>帮助中心</NavLink></div>
                  </div>
                </div>
              </div>

              <div className="nav-item has-dropdown" onMouseEnter={() => setOpenMenu('station')} onMouseLeave={() => setOpenMenu(null)}>
                <span>站车服务<CaretDown /></span>
                <div className={"dropdown" + (openMenu === 'station' ? " open" : "")}>
                  <div className="dd-grid dd-4">
                    <div className="dd-col">
                      <NavLink to="/stub/priority_passenger" className="dd-item" onClick={() => setOpenMenu(null)}>特殊重点旅客</NavLink>
                      <NavLink to="/stub/hand" className="dd-item" onClick={() => setOpenMenu(null)}>便民托运</NavLink>
                    </div>
                    <div className="dd-col">
                      <NavLink to="/stub/ride_service" className="dd-item" onClick={() => setOpenMenu(null)}>约车服务</NavLink>
                      <NavLink to="/stub/station_guide" className="dd-item" onClick={() => setOpenMenu(null)}>车站引导</NavLink>
                    </div>
                    <div className="dd-col">
                      <NavLink to="/stub/lost" className="dd-item" onClick={() => setOpenMenu(null)}>遗失物品查找</NavLink>
                      <NavLink to="/stub/train_intro" className="dd-item" onClick={() => setOpenMenu(null)}>动车组介绍</NavLink>
                    </div>
                    <div className="dd-col">
                      <NavLink to="/stub/custom_pickup" className="dd-item" onClick={() => setOpenMenu(null)}>定制接送</NavLink>
                      <NavLink to="/stub/station_style" className="dd-item" onClick={() => setOpenMenu(null)}>站车风采</NavLink>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nav-item has-dropdown" onMouseEnter={() => setOpenMenu('business')} onMouseLeave={() => setOpenMenu(null)}>
                <span>商旅服务<CaretDown /></span>
                <div className={"dropdown" + (openMenu === 'business' ? " open" : "")}>
                  <div className="dd-grid dd-3">
                    <div className="dd-col">
                      <NavLink to="/stub/food" className="dd-item" onClick={() => setOpenMenu(null)}>餐饮•特产</NavLink>
                    </div>
                    <div className="dd-col">
                      <NavLink to="/stub/insurance" className="dd-item" onClick={() => setOpenMenu(null)}>保险</NavLink>
                    </div>
                    <div className="dd-col">
                      <NavLink to="/stub/ski" className="dd-item" onClick={() => setOpenMenu(null)}>雪具快运</NavLink>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nav-item has-dropdown" onMouseEnter={() => setOpenMenu('guide')} onMouseLeave={() => setOpenMenu(null)}>
                <span>出行指南<CaretDown /></span>
                <div className={"dropdown" + (openMenu === 'guide' ? " open" : "")}>
                  <div className="dd-grid dd-3">
                    <div className="dd-col">
                      <div className="dd-title">常见问题</div>
                      <div className="dd-nested">
                        <div>
                          <NavLink to="/stub/faq_ticket" className="dd-item" onClick={() => setOpenMenu(null)}>车票</NavLink>
                          <NavLink to="/stub/faq_reschedule_change" className="dd-item" onClick={() => setOpenMenu(null)}>改签、变更到站</NavLink>
                          <NavLink to="/stub/faq_more" className="dd-item" onClick={() => setOpenMenu(null)}>更多&gt;&gt;</NavLink>
                        </div>
                        <div>
                          <NavLink to="/stub/faq_buy" className="dd-item" onClick={() => setOpenMenu(null)}>购票</NavLink>
                          <NavLink to="/stub/faq_refund" className="dd-item" onClick={() => setOpenMenu(null)}>退票</NavLink>
                        </div>
                      </div>
                    </div>
                    <div className="dd-col">
                      <div className="dd-title">旅客须知</div>
                      <div className="dd-nested">
                        <div>
                          <NavLink to="/stub/verify" className="dd-item" onClick={() => setOpenMenu(null)}>身份核验</NavLink>
                          <NavLink to="/stub/notice_more" className="dd-item" onClick={() => setOpenMenu(null)}>更多&gt;&gt;</NavLink>
                        </div>
                        <div>
                          <NavLink to="/stub/e_ticket" className="dd-item" onClick={() => setOpenMenu(null)}>铁路电子客票</NavLink>
                        </div>
                      </div>
                    </div>
                    <div className="dd-col">
                      <div className="dd-title">相关章程</div>
                      <div className="dd-nested">
                        <div>
                          <NavLink to="/stub/regulation_transport" className="dd-item" onClick={() => setOpenMenu(null)}>铁路旅客运输规程</NavLink>
                          <NavLink to="/stub/regulation_hsr" className="dd-item" onClick={() => setOpenMenu(null)}>广深港高速铁路跨境旅客运输组织规则</NavLink>
                          <NavLink to="/stub/regulation_more" className="dd-item" onClick={() => setOpenMenu(null)}>更多&gt;&gt;</NavLink>
                        </div>
                        <div>
                          <NavLink to="/stub/regulation_items" className="dd-item" onClick={() => setOpenMenu(null)}>铁路旅客禁止、限制携带和托运物品目录</NavLink>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nav-item has-dropdown" onMouseEnter={() => setOpenMenu('info')} onMouseLeave={() => setOpenMenu(null)}>
                <span>信息查询<CaretDown /></span>
                <div className={"dropdown" + (openMenu === 'info' ? " open" : "")}>
                  <div className="dd-grid dd-6">
                    <div className="dd-fullrow">常用查询</div>
                    <div className="dd-col">
                      <NavLink to="/stub/ontime" className="dd-item" onClick={() => setOpenMenu(null)}>正晚点</NavLink>
                      <NavLink to="/stub/weather" className="dd-item" onClick={() => setOpenMenu(null)}>天气</NavLink>
                    </div>
                    <div className="dd-col">
                      <NavLink to="/stub/timetable" className="dd-item" onClick={() => setOpenMenu(null)}>时刻表</NavLink>
                      <NavLink to="/stub/traffic" className="dd-item" onClick={() => setOpenMenu(null)}>交通查询</NavLink>
                    </div>
                    <div className="dd-col">
                      <NavLink to="/stub/public_price" className="dd-item" onClick={() => setOpenMenu(null)}>公布票价</NavLink>
                      <NavLink to="/stub/agency" className="dd-item" onClick={() => setOpenMenu(null)}>代售点</NavLink>
                    </div>
                    <div className="dd-col">
                      <NavLink to="/stub/check" className="dd-item" onClick={() => setOpenMenu(null)}>检票口</NavLink>
                      <NavLink to="/stub/service_number" className="dd-item" onClick={() => setOpenMenu(null)}>客服电话</NavLink>
                    </div>
                    <div className="dd-col">
                      <NavLink to="/stub/sale_time" className="dd-item" onClick={() => setOpenMenu(null)}>起售时间</NavLink>
                      <NavLink to="/stub/train_status" className="dd-item" onClick={() => setOpenMenu(null)}>列车状态</NavLink>
                    </div>
                    <div className="dd-col">
                      <NavLink to="/stub/latest" className="dd-item" onClick={() => setOpenMenu(null)}>最新发布</NavLink>
                      <NavLink to="/stub/credit" className="dd-item" onClick={() => setOpenMenu(null)}>信用信息</NavLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </header>
      <main className={(isLoginPage || isMemberPage) ? 'main-fullwidth' : undefined}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/results" element={<Results />} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/checkout/:id" element={<ProtectedRoute><ConfirmOrder /></ProtectedRoute>} />
          <Route path="/standby" element={<Standby />} />
          <Route path="/my/*" element={<ProtectedRoute><PersonalCenter /></ProtectedRoute>} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/member" element={<ProtectedRoute><MemberCenter /></ProtectedRoute>} />
          <Route path="/group" element={<GroupService />} />
          <Route path="/station" element={<ProtectedRoute><StationService /></ProtectedRoute>} />
          <Route path="/business" element={<ProtectedRoute><BusinessService /></ProtectedRoute>} />
          <Route path="/guide" element={<TravelGuide />} />
          <Route path="/info" element={<InfoQuery />} />
          <Route path="/stub/group_worker" element={<Navigate to="/group?tab=worker" replace />} />
          <Route path="/stub/group_student" element={<Navigate to="/group?tab=student" replace />} />
          <Route path="/stub/:slug" element={<StubPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">© 中国铁路12306 - 演示复刻项目</footer>
    </div>
  )
}

export default App
