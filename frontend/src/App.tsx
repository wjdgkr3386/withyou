import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Context 추가
import Navbar from './components/Navbar';
import Footer from './components/Footer'; // Footer가 있다고 가정
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MainPage from './pages/MainPage';
import AboutPage from './pages/AboutPage';
import ClassPage from './pages/ClassPage';
import ExamPage from './pages/ExamPage';
import NoticePage from './pages/NoticePage';

// 공통 레이아웃 컴포넌트 (Navbar와 Footer를 포함)
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '80vh' }}>{children}</main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 네비바/푸터가 없는 페이지 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* 네비바/푸터가 필요한 페이지들 */}
        <Route path="/" element={<Layout><MainPage /></Layout>} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/class" element={<Layout><ClassPage /></Layout>} />
        <Route path="/exam" element={<Layout><ExamPage /></Layout>} />
        <Route path="/notice" element={<Layout><NoticePage /></Layout>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;