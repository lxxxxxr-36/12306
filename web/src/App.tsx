import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Results from './pages/Results'
import Orders from './pages/Orders'
import ProtectedRoute from './components/ProtectedRoute'
import NotFound from './pages/NotFound'
import Standby from './pages/Standby'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import { useSession } from './hooks/useSession'
import { logout } from './services/auth'
import ConfirmOrder from './pages/ConfirmOrder'

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
            <NavLink to="/results">查询结果</NavLink>
            <NavLink to="/orders">订单中心</NavLink>
            <NavLink to="/standby">候补购票</NavLink>
            {username ? (
              <span style={{marginLeft:12}}>
                欢迎，{username} <button className="link" onClick={handleLogout}>退出</button>
              </span>
            ) : (
              <NavLink to="/login">登录</NavLink>
            )}
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">© 中国铁路12306 - 演示复刻项目</footer>
    </div>
  )
}

export default App
