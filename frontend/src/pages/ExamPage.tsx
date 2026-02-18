import React, { useState, useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL;

const SYMBOL_GROUPS = {
  '기본/연산': [
    { label: '분수', value: '\\frac{}{}' }, { label: '√', value: '\\sqrt{}' }, { label: 'x^n', value: '^{}' }, { label: 'x_n', value: '_{}' },
    { label: '×', value: '\\times' }, { label: '÷', value: '\\div' }, { label: '±', value: '\\pm' }, { label: '≠', value: '\\neq' },
    { label: '≤', value: '\\le' }, { label: '≥', value: '\\ge' }, { label: '≈', value: '\\approx' }, { label: '∞', value: '\\infty' },
    { label: '→', value: '\\to' },
  ],
  '함수/미적분': [
    { label: 'log', value: '\\log' }, { label: 'ln', value: '\\ln' }, { label: 'lim', value: '\\lim_{n \\to \\infty}' },
    { label: '∑', value: '\\sum_{k=1}^{n}' }, { label: '∫', value: '\\int' },
    { label: 'sin', value: '\\sin' }, { label: 'cos', value: '\\cos' }, { label: 'tan', value: '\\tan' }, { label: 'θ', value: '\\theta' }, { label: 'π', value: '\\pi' }
  ],
  '집합/기하': [
    { label: '∈', value: '\\in' }, { label: '⊂', value: '\\subset' }, { label: '∪', value: '\\cup' }, { label: 'cap', value: '\\cap' },
    { label: '∠', value: '\\angle' }, { label: '△', value: '\\triangle' }, { label: '⊥', value: '\\perp' }, { label: '∥', value: '\\parallel' },
    { label: '∴', value: '\\therefore' }, { label: '∵', value: '\\because' }, { label: '°', value: '^{\\circ}' },
  ]
};

function ExamPage(){
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const examIdFromState = location.state?.examId;
    
    const [examStatus, setExamStatus] = useState<string>("대기중");  // 대기중, 준비중, 시험중, 종료
    const [roomCode, setRoomCode] = useState<string>(''); 
    const [inputCode, setInputCode] = useState<string>(''); 
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

    // 시험 데이터 및 정답 관련
    const [problems, setProblems] = useState<any[]>([]);
    const [currentIdx, setCurrentIdx] = useState<number>(0);
    const [countdown, setCountdown] = useState<number>(5); 
    const [problemTime, setProblemTime] = useState<number>(0); 
    const [examId, setExamId] = useState<number | null>(examIdFromState || null);
    const [studentAnswer, setStudentAnswer] = useState<string>('');

    // 웹소켓 Stomp 설정
    const stompClient = useRef<Stomp.Client | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const answerRef = useRef<HTMLTextAreaElement>(null);

    // 직접 접근 차단 (관리자용)
    useEffect(() => {
        if (user && (user.role === 'ADMIN' || user.role === 'admin') && !examIdFromState) {
            alert("선택된 시험이 없습니다. 관리자 페이지에서 시험을 먼저 선택해주세요.");
            navigate('/admin');
        }
    }, [user, examIdFromState, navigate]);

    // 시험 데이터 불러오기
    useEffect(() => {
        if (examId) {
            axios.get(`${BASE_URL}/api/admin/exams/${examId}`, { withCredentials: true })
                .then(res => {
                    if (res.data.success) {
                        setProblems(res.data.data.problems || []);
                    }
                })
                .catch(err => console.error("시험 데이터 로드 실패:", err));
        }
    }, [examId]);

    // 타이머 관리
    useEffect(() => {
        if (examStatus === "준비중") {
            if (countdown > 0) {
                timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
            } else {
                setExamStatus("시험중");
                const currentProblem = problems[currentIdx];
                setProblemTime(currentProblem?.timeLimit || 10);
                setStudentAnswer(''); // 문제 시작 시 정답 초기화
            }
        } else if (examStatus === "시험중") {
            if (problemTime > 0) {
                timerRef.current = setTimeout(() => setProblemTime(problemTime - 1), 1000);
            } else {
                if (currentIdx < problems.length - 1) {
                    setCurrentIdx(currentIdx + 1);
                    setExamStatus("준비중");
                    setCountdown(5);
                } else {
                    setExamStatus("종료");
                }
            }
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [examStatus, countdown, problemTime, currentIdx, problems]);

    // 수식 기호 추가 함수
    const addSymbol = (symbolValue: string) => {
        if (!answerRef.current) return;
        const start = answerRef.current.selectionStart;
        const end = answerRef.current.selectionEnd;
        const newText = studentAnswer.substring(0, start) + symbolValue + studentAnswer.substring(end);
        setStudentAnswer(newText);

        setTimeout(() => {
            answerRef.current?.focus();
            let cursorOffset = symbolValue.length;
            if (symbolValue.includes('{}')) cursorOffset = symbolValue.indexOf('{') + 1;
            answerRef.current?.setSelectionRange(start + cursorOffset, start + cursorOffset);
        }, 0);
    };

    // 실시간 수식 렌더링 함수
    const renderContent = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, index) => {
            const processedLine = line.replace(/ /g, '\\ ');
            const mathRegex = /(\\frac{[^{}]*(?:{[^{}]*}[^{}]*)*}{[^{}]*(?:{[^{}]*}[^{}]*)*}+|\\sqrt{[^{}]*(?:{[^{}]*}[^{}]*)*}+|\\sum_{.*}^{.*}|\\lim_{.*}|\\log|\\ln|\\sin|\\cos|\\tan|\\theta|\\pi|\\times|\\div|\\pm|\\neq|\\le|\\ge|\\approx|\\infty|\\to|\\in|\\subset|\\cup|\\cap|\\angle|\\triangle|\\perp|\\parallel|\\therefore|\\because|\^{.*}|_{.*})/g;
            const parts = processedLine.split(mathRegex);
            const finalLatex = parts.map(part => {
                if (!part) return '';
                if (mathRegex.test(part) || part.startsWith('\\') || part.startsWith('^') || part.startsWith('_')) return part;
                return `\\text{${part}}`;
            }).join('');

            return (
                <React.Fragment key={index}>
                    <span style={{ whiteSpace: 'pre-wrap' }}>
                        {finalLatex.trim() ? <InlineMath math={finalLatex} /> : null}
                    </span>
                    <br />
                </React.Fragment>
            );
        });
    };

    // 문제 내용 렌더링 (문제용)
    const renderProblemContent = (content: string) => {
        if (!content) return null;
        return content.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <br key={idx} />;
            const parts = trimmed.split(/(\$.*?\$)/g);
            return (
                <div key={idx} style={{ marginBottom: '6px' }}>
                    {parts.map((part, pIdx) => {
                        if (part.startsWith('$') && part.endsWith('$')) {
                            return <InlineMath key={pIdx} math={part.slice(1, -1)} />;
                        }
                        return <span key={pIdx}>{part}</span>;
                    })}
                </div>
            );
        });
    };

    // 랜덤 코드 및 웹소켓 연결 로직 (기존과 동일)
    useEffect(() => {
        const generateAndCreateRoom = async () => {
            if (user && (user.role === 'ADMIN' || user.role === 'admin') && !roomCode) {
                const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                setRoomCode(code);
                try {
                    await axios.post(`${BASE_URL}/api/admin/exams/room/create`, { code, examId: examIdFromState }, { withCredentials: true });
                    connectWebSocket();
                } catch (error) { console.error(error); }
            }
        };
        generateAndCreateRoom();
    }, [user, examIdFromState]);

    const connectWebSocket = () => {
        if (stompClient.current?.connected) return;
        const socket = new SockJS(`${BASE_URL}/ws-stomp`);
        stompClient.current = Stomp.over(socket);
        stompClient.current.connect({}, (frame) => {
            setIsConnected(true);
            stompClient.current?.subscribe('/topic/exam/status', (response) => {
                const data = JSON.parse(response.body);
                if (data.type === 'START') { setExamStatus("준비중"); setCountdown(5); setCurrentIdx(0); }
            });
            stompClient.current?.subscribe('/topic/users', (response) => { setConnectedUsers(JSON.parse(response.body)); });
            if (user?.name) stompClient.current?.send("/app/enter", {}, JSON.stringify({ name: user.name }));
        });
    };

    const handleStartExam = () => {
        if (stompClient.current?.connected) stompClient.current.send("/app/exam/start", {}, JSON.stringify({ type: 'START' }));
    };

    const handleJoinRoom = async () => {
        if (user?.role === 'ADMIN' || user?.role === 'admin') { connectWebSocket(); return; }
        if (!inputCode) return alert("코드를 입력해주세요.");
        try {
            const res = await axios.post(`${BASE_URL}/api/admin/exams/room/check`, { code: inputCode }, { withCredentials: true });
            if (res.data.success) { setExamId(res.data.data); connectWebSocket(); }
        } catch (error) { alert("입장 코드가 올바르지 않습니다."); }
    };

    useEffect(() => { return () => { if (stompClient.current) stompClient.current.disconnect(() => {}); }; }, []);

    const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

    return (
        <div className="bg-dark min-vh-100 text-white p-4 overflow-hidden">
            <div className="container h-100">
                { examStatus === "대기중" && (
                    <div className="row g-4 justify-content-center mt-5">
                        <div className="col-md-7">
                            <div className="card bg-secondary border-0 shadow-lg p-5 h-100">
                                <h1 className="fw-bold mb-4 text-center">시험 대기방</h1>
                                {!isConnected ? (
                                    <div className="text-center">
                                        {user?.role === 'ADMIN' || user?.role === 'admin' ? (
                                            <div className="admin-view">
                                                <p className="fs-5 text-warning mb-2">학생들에게 아래 코드를 공유하세요</p>
                                                <div className="display-1 fw-bold text-info mb-4" style={{ letterSpacing: '8px' }}>{roomCode}</div>
                                                <div className="spinner-border text-info mb-3"></div>
                                                <p>서버 연결 중...</p>
                                            </div>
                                        ) : (
                                            <div className="student-view mx-auto" style={{ maxWidth: '400px' }}>
                                                <p className="fs-5 mb-3">입장 코드를 입력하세요</p>
                                                <input type="text" className="form-control form-control-lg text-center fw-bold mb-4" maxLength={6} value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} />
                                                <button className="btn btn-info btn-lg w-100 fw-bold" onClick={handleJoinRoom}>대기방 입장</button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="alert alert-success fw-bold fs-4 mb-4">{user?.role === 'ADMIN' || user?.role === 'admin' ? '입장 코드가 생성되었습니다' : '성공적으로 입장했습니다!'}</div>
                                        {(user?.role === 'ADMIN' || user?.role === 'admin') && <div className="display-4 fw-bold text-info mb-5" style={{ letterSpacing: '8px' }}>{roomCode}</div>}
                                        <p className="fs-5 mb-4">관리자가 시험을 시작할 때까지 잠시 기다려 주세요.</p>
                                        {(user?.role === 'ADMIN' || user?.role === 'admin') && <button className="btn btn-primary btn-lg px-5 py-3 fw-bold fs-4" onClick={handleStartExam}>시험 시작하기</button>}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card bg-secondary border-0 shadow-lg h-100">
                                <div className="card-header bg-dark border-0 py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-bold">접속자 목록</h5>
                                    <span className="badge bg-primary px-3">{connectedUsers.length}명</span>
                                </div>
                                <div className="card-body p-0 overflow-auto" style={{ maxHeight: '500px' }}>
                                    <ul className="list-group list-group-flush">
                                        {connectedUsers.length === 0 ? (<li className="list-group-item bg-transparent text-white-50 text-center py-4">접속 중인 사용자가 없습니다.</li>) : (
                                            connectedUsers.map((name, idx) => (
                                                <li key={idx} className="list-group-item bg-transparent text-white border-bottom border-dark py-3 d-flex align-items-center">
                                                    <div className="rounded-circle bg-info me-3" style={{ width: '10px', height: '10px' }}></div>
                                                    <span className="fw-bold">{name}</span>
                                                    {name === user?.name && <span className="ms-2 badge bg-outline-info border text-info small">나</span>}
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                { examStatus === "준비중" && (
                    <div className='vh-100 d-flex flex-column justify-content-center align-items-center'>
                        <div className="display-1 fw-bold mb-4 text-warning">잠시 후 시험이 시작됩니다!</div>
                        <div className="text-info" style={{ fontSize: '10rem', fontWeight: '900' }}>{countdown}</div>
                        <div className="fs-3 mt-4 text-white-50">문제 {currentIdx + 1} / {problems.length}</div>
                    </div>
                )}
                
                { examStatus === "시험중" && problems[currentIdx] && (
                    <div className='vh-100 p-5'>
                        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                            <h2 className="fw-bold text-info mb-0">문제 {currentIdx + 1}</h2>
                            <div className="d-flex align-items-center gap-3">
                                <span className="fs-4 text-white-50">{currentIdx + 1} / {problems.length}</span>
                                <div className={`badge ${problemTime <= 5 ? 'bg-danger animate-pulse' : 'bg-primary'} fs-3 p-3`} style={{ minWidth: '100px' }}>
                                    {problemTime}초
                                </div>
                            </div>
                        </div>

                        <div className="row g-5">
                            <div className="col-md-7">
                                <div className="problem-content mb-4 bg-secondary bg-opacity-25 p-4 rounded shadow-sm overflow-auto" style={{ height: '400px' }}>
                                    <div className="fs-3 lh-base">{renderProblemContent(problems[currentIdx].content)}</div>
                                    {problems[currentIdx].imageUrl && (
                                        <div className="mt-4 text-center">
                                            <img src={problems[currentIdx].imageUrl} alt="문제 이미지" className="img-fluid rounded border border-secondary shadow" style={{ maxHeight: '300px' }} />
                                        </div>
                                    )}
                                </div>

                                {problems[currentIdx].type === '객관식' && problems[currentIdx].options && (
                                    <div className="row g-3">
                                        {problems[currentIdx].options.map((opt: any, idx: number) => (
                                            <div key={idx} className="col-md-6">
                                                <div className="card bg-secondary border-0 h-100 hover-overlay shadow-sm" style={{ cursor: 'pointer' }} onClick={() => setStudentAnswer(String(opt.optionNumber))}>
                                                    <div className="card-body d-flex align-items-start gap-3 p-3">
                                                        <span className="fs-4 fw-bold text-info">{circleNumbers[opt.optionNumber-1] || opt.optionNumber}</span>
                                                        <div className="fs-5">{renderProblemContent(opt.content)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="col-md-5">
                                <div className="card bg-secondary border-0 p-4 shadow-lg h-100">
                                    <h4 className="fw-bold mb-3 border-bottom pb-2">답안 입력</h4>
                                    
                                    {/* 수식 도구 모음 */}
                                    <div className="mb-3 bg-dark bg-opacity-50 p-2 rounded">
                                        <div className="d-flex flex-wrap gap-1">
                                            {Object.entries(SYMBOL_GROUPS).map(([group, symbols]) => (
                                                <div key={group} className="d-flex flex-wrap gap-1">
                                                    {symbols.map(s => (
                                                        <button key={s.value} className="btn btn-sm btn-outline-info" style={{fontSize: '0.7rem'}} onClick={() => addSymbol(s.value)}>{s.label}</button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <textarea 
                                        ref={answerRef}
                                        className="form-control form-control-lg bg-dark text-white border-info text-center mb-3" 
                                        rows={2}
                                        value={studentAnswer}
                                        onChange={(e) => setStudentAnswer(e.target.value)}
                                        placeholder="정답 입력" 
                                        style={{fontSize: '1.5rem'}}
                                    />

                                    <div className="p-3 border border-info rounded bg-dark bg-opacity-25 min-height-100 mb-3">
                                        <div className="text-info small mb-1">실시간 미리보기:</div>
                                        <div className="fs-4 text-center">{renderContent(studentAnswer)}</div>
                                    </div>

                                    <button className="btn btn-info btn-lg w-100 fw-bold py-3 fs-4">정답 제출</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                { examStatus === "종료" && (
                    <div className='vh-100 d-flex flex-column justify-content-center align-items-center'>
                        <div className="display-1 fw-bold text-success mb-4">시험 종료</div>
                        <p className="fs-3 mb-5">수고하셨습니다! 결과는 나중에 확인 가능합니다.</p>
                        <button className="btn btn-outline-light btn-lg px-5" onClick={() => navigate('/')}>메인으로 이동</button>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
                .animate-pulse { animation: pulse 0.5s infinite; }
                .hover-overlay:hover { background-color: rgba(255, 255, 255, 0.1) !important; transition: 0.3s; }
                .min-height-100 { min-height: 80px; }
            `}</style>
        </div>
    );
}

export default ExamPage;
