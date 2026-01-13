//import { useState } from 'react'
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MainPage from './pages/MainPage';
import AboutPage from './pages/AboutPage';
import ClassPage from './pages/ClassPage';
import ExamPage from './pages/ExamPage';
import NoticePage from './pages/NoticePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/class" element={<ClassPage />} />
      <Route path="/exam" element={<ExamPage />} />
      <Route path="/notice" element={<NoticePage />} />
    </Routes>
  );
}

export default App
