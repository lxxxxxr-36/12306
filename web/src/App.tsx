import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
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
import MemberCenter from './pages/my/MemberCenter'

function App() {
  const { username } = useSession();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/', { replace: true }); };
  return (
    <div>
      <header className="site-header">
        <div className="wrap">
          <div className="logo">中国铁路12306</div>
          <nav>
            <NavLink to="/" end>首页</NavLink>
            <span className="divider">|</span>
            <NavLink to="/results">查询结果</NavLink>
            <span className="divider">|</span>
            <NavLink to="/orders">订单中心</NavLink>
            <span className="divider">|</span>
            <NavLink to="/standby">候补购票</NavLink>
            <span className="divider">|</span>
            <My12306Menu />
            <span className="divider">|</span>
            {username ? (
              <span className="welcome">
                <span className="label">您好，</span>
                <button className="username-link" onClick={() => navigate('/my')}>{username}</button>
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
        </div>
      </header>
      <main>
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
          <Route path="/member" element={<ProtectedRoute><MemberCenter /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">© 中国铁路12306 - 演示复刻项目</footer>
    </div>
  )
}

export default App
