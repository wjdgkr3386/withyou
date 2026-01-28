import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AccountFindPage from './pages/AccountFindPage';
import MainPage from './pages/MainPage';
import AboutPage from './pages/AboutPage';
import ClassPage from './pages/ClassPage';
import ExamPage from './pages/ExamPage';
import ProblemPage from './pages/ProblemPage';
import NoticePage from './pages/NoticePage';
import NoticeWritePage from './pages/NoticeWritePage';
import NoticeDetailPage from './pages/NoticeDetailPage';
import MyPage from './pages/MyPage';
import PasswordChangePage from './pages/PasswordChangePage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 네비바/푸터가 없는 페이지 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/account/find" element={<AccountFindPage />} />
        <Route path="/notice/write" element={<NoticeWritePage />} />
        <Route path="/notice/edit/:id" element={<NoticeWritePage />} />
        <Route path="/change-password" element={<PasswordChangePage />} />
        
        {/* 네비바/푸터가 필요한 페이지들 */}
        <Route path="/" element={<><Navbar/><MainPage /><Footer/></>} />
        <Route path="/about" element={<><Navbar/><AboutPage /><Footer/></>} />
        <Route path="/class" element={<><Navbar/><ClassPage /><Footer/></>} />
        <Route path="/exam" element={<><Navbar/><ExamPage /><Footer/></>} />
        <Route path="/problem" element={<><Navbar/><ProblemPage /></>} />
        <Route path="/notice" element={<><Navbar/><NoticePage /><Footer/></>} />
        <Route path="/notice/detail/:id" element={<><Navbar/><NoticeDetailPage/><Footer/></>} />
        <Route path="/mypage" element={<><Navbar/><MyPage /><Footer/></>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;