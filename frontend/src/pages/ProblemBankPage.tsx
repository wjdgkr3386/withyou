import { useState, useEffect } from 'react'; // useEffect 추가
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    GRADE_OPTIONS, 
    CATEGORY_OPTIONS, 
    DIFFICULTY_OPTIONS, 
    TYPE_OPTIONS } from '../constants/options';
import { InlineMath } from 'react-katex';

const BASE_URL = import.meta.env.VITE_API_URL;

const GRADE_MAP: { [key: string]: string } = {
    "E1": "초1", "E2": "초2", "E3": "초3", "E4": "초4", "E5": "초5", "E6": "초6",
    "M1": "중1", "M2": "중2", "M3": "중3",
    "H1": "고1", "H2": "고2", "H3": "고3"
};

function ProblemBankPage(){

    const navigate = useNavigate();

    const [grade, setGrade] = useState<string>("");
    const [category, setCategory] = useState<string>("");
    const [difficulty, setDifficulty] = useState<string>("");
    const [type, setType] = useState<string>("");
    
    // 현재 페이지(순서) 상태 추가 (0부터 시작하는 Pageable 기준)
    const [page, setPage] = useState<number>(0);

    interface ProblemOption {
        id: number;
        optionNumber: number;
        content: string;
    }

    interface ProblemData {
        id: number;
        grade: string;
        category: string;
        content: string;
        type: string;
        difficulty: string;
        answer: string;
        imageUrl: string;
        options: ProblemOption[];
        // 백엔드에서 추가한 필드
        totalCount: number;
        currentIndex: number;
    }

    const [problem, setProblem] = useState<ProblemData | null>(null);
    
    // 검색 함수 (page 번호를 인자로 받음)
    const search = async (pageNum: number = 0) => {
        try {
            const response = await axios.get(`${BASE_URL}/api/admin/problem/search`, {
                params: {
                    ...(grade && { grade }),
                    ...(category && { category }),
                    ...(difficulty && { difficulty }),
                    ...(type && { type }),
                    page: pageNum, // 페이지 번호 추가
                    size: 1        // 한 번에 한 문제씩
                }
            });
            const data = response.data.data;
            setProblem(data);
            setPage(pageNum); // 현재 페이지 상태 동기화
        } catch(error) {
            alert("오류가 발생했습니다.\n콘솔을 확인해주세요");
            console.log(error);
        }
    }

    // "검색" 버튼 클릭 시 (첫 페이지부터 다시 검색)
    const handleSearchClick = () => {
        search(0);
    }

    const renderProblemContent = (content: string) => {
        return content.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <br key={idx} />;

            // $...$ 패턴을 찾아 분리하는 정규식
            const parts = trimmed.split(/(\$.*?\$)/g);

            return (
                <div key={idx} style={{ marginBottom: '6px' }}>
                    {parts.map((part, pIdx) => {
                        // $로 시작하고 끝나면 수식으로 렌더링
                        if (part.startsWith('$') && part.endsWith('$')) {
                            const math = part.slice(1, -1); // 앞뒤 $ 제거
                            return <InlineMath key={pIdx} math={math} />;
                        }
                        // 일반 텍스트 렌더링
                        return <span key={pIdx}>{part}</span>;
                    })}
                </div>
            );
        });
    };

    return (
        <>
            <div className="container mt-5">
                <div className="d-flex justify-content-end mb-3">
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/problem')}>만들기</button>
                </div>
                
                {/* 필터 박스 */}
                <div id="filter-box" className="rounded p-4 mb-4" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                    <div className="row mb-3">
                        <div className="col-3">
                            <div>학년</div>
                            <select className="w-100 p-1 mt-1" onChange={(e) => setGrade(e.target.value)}>
                                <option value="">전체</option>
                                {GRADE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        {/* ... 카테고리, 난이도, 유형 select 동일하게 유지 ... */}
                        <div className="col-3">
                            <div>카테고리</div>
                            <select className="w-100 p-1 mt-1" onChange={(e) => setCategory(e.target.value)}>
                                <option value="">전체</option>
                                {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="col-3">
                            <div>난이도</div>
                            <select className="w-100 p-1 mt-1" onChange={(e) => setDifficulty(e.target.value)}>
                                <option value="">전체</option>
                                {DIFFICULTY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="col-3">
                            <div>유형</div>
                            <select className="w-100 p-1 mt-1" onChange={(e) => setType(e.target.value)}>
                                <option value="">전체</option>
                                {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-lg w-100" onClick={handleSearchClick}>
                        검색
                    </button>
                </div>

                {problem ? (
                    <div id="problem-box" className="rounded p-4" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                        <div className="mb-3">
                            <span className="bg-primary-subtle text-primary fw-medium px-3 py-1 rounded-pill me-2">
                                {GRADE_MAP[problem.grade] || problem.grade}
                            </span>
                            <span className="bg-success-subtle text-success fw-medium px-3 py-1 rounded-pill me-2">
                                {problem.category}
                            </span>
                            <span className="bg-info-subtle text-info fw-medium px-3 py-1 rounded-pill me-2">
                                {problem.type}
                            </span>
                            <span className={`fw-medium px-3 py-1 rounded-pill ${
                                problem.difficulty === '상' ? 'bg-danger-subtle text-danger' : 
                                problem.difficulty === '중' ? 'bg-warning-subtle text-warning' : 'bg-secondary-subtle text-secondary'
                            }`}>
                                난이도: {problem.difficulty}
                            </span>
                        </div>
                        <hr/>

                        <div className="fw-bold fs-5 mb-3">문제</div>
                        <div id="problem-content" className="mb-4">
                            {renderProblemContent(problem.content)}
                        </div>
                        
                        <div className="rounded bg-light p-3">
                            <div className="fw-bold fs-5 mb-3">정답</div>
                            <div className="answer">
                                {renderProblemContent(problem.answer)} 
                            </div>
                        </div>
                        
                        <hr className="border"></hr>
                        
                        {/* 페이지네이션 컨트롤 */}
                        <div className="d-flex justify-content-between align-items-center">
                            <button 
                                className="btn bg-secondary text-white" 
                                onClick={() => search(page - 1)} // 이전 페이지 호출
                                disabled={page === 0}            // 첫 페이지면 비활성화
                            >
                                ← 이전
                            </button>
                            
                            <span className="fw-bold">
                                {problem.currentIndex} / {problem.totalCount}
                            </span>
                            
                            <button 
                                className="btn bg-secondary text-white" 
                                onClick={() => search(page + 1)} // 다음 페이지 호출
                                disabled={problem.currentIndex >= problem.totalCount} // 마지막 페이지면 비활성화
                            >
                                다음 →
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-5 border rounded">
                        조회된 문제가 없습니다.
                    </div>
                )}
            </div>
        </>
    );
}

export default ProblemBankPage;