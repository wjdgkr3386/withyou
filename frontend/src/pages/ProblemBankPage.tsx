import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    GRADE_OPTIONS, 
    CATEGORY_OPTIONS, 
    DIFFICULTY_OPTIONS, 
    TYPE_OPTIONS } from '../constants/options';
import { InlineMath, BlockMath } from 'react-katex';

const BASE_URL = import.meta.env.VITE_API_URL;

function ProblemBankPage(){

    const navigate = useNavigate();

    const [grade, setGrade] = useState<string>("");
    const [category, setCategory] = useState<string>("");
    const [difficulty, setDifficulty] = useState<string>("");
    const [type, setType] = useState<string>("");

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
    }

    const [problem, setProblem] = useState<ProblemData | null>(null);
    
    const search = async () => {
        try{
            const response = await axios.get(`${BASE_URL}/api/problem/search`, {
                params: {
                    grade: grade || null,
                    category: category || null,
                    difficulty: difficulty || null,
                    type: type || null,
                }
            });
            const data = response.data.data;
            setProblem(data);
            console.log(data);
        }catch(error){
            alert("오류가 발생했습니다.\n콘솔을 확인해주세요");
            console.log(error);
        }
    }

    return (
        <>
            <div className="container mt-5">
                <div className="d-flex justify-content-end mb-3">
                    <button type="button" className="btn btn-primary" onClick={(e) => {navigate('/problem');}}>만들기</button>
                </div>
                <div id="filter-box" className="rounded p-4 mb-4" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                    <div className="row mb-3">
                        <div className="col-3">
                            <div>학년</div>
                            <select className="w-100 p-1 mt-1" onChange={(e) => setGrade(e.target.value)}>
                                {GRADE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="col-3">
                            <div>카테고리</div>
                            <select className="w-100 p-1 mt-1" onChange={(e) => setCategory(e.target.value)}>
                                {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="col-3">
                            <div>난이도</div>
                            <select className="w-100 p-1 mt-1" onChange={(e) => setDifficulty(e.target.value)}>
                                {DIFFICULTY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="col-3">
                            <div>유형</div>
                            <select className="w-100 p-1 mt-1" onChange={(e) => setType(e.target.value)}>
                                {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-lg w-100" onClick={search}>
                        검색
                    </button>
                </div>

                {problem ? (
                    <div id="problem-box" className="rounded p-4" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                        <span className="bg-primary-subtle text-primary fw-medium px-3 py-1 rounded-pill me-2" style={{ backgroundColor: '#e7f0ff', color: '#3b71ca' }}>
                            {problem.grade}
                        </span>

                        <span className="bg-success-subtle text-success fw-medium px-3 py-1 rounded-pill me-2" style={{ backgroundColor: '#e2f7ed', color: '#198754' }}>
                            {problem.category}
                        </span>

                        <span className="bg-warning-subtle text-warning fw-medium px-3 py-1 rounded-pill me-2" style={{ backgroundColor: '#fff4e5', color: '#ca8a04' }}>
                            난이도: {problem.difficulty}
                        </span>

                        <span className="fw-medium px-3 py-1 rounded-pill" style={{ backgroundColor: '#f3eaff', color: '#8b5cf6' }}>
                            {problem.type}
                        </span>

                        <hr/>

                        <div className="fw-bold fs-5 mb-3">문제</div>
                        <div id="problem-content" className="mb-4">
                            <InlineMath math={problem.content} />
                        </div>
                        <div className="rounded bg-light p-3">
                            <div className="fw-bold fs-5 mb-3">정답</div>
                            <div className="answer">
                                <InlineMath math={problem.answer} />
                            </div>
                        </div>
                        <hr className="border"></hr>
                        <div className="d-flex justify-content-between align-items-center">
                            <button className="btn bg-secondary text-white">← 이전</button>
                            <span>1 / 8</span>
                            <button className="btn bg-secondary text-white">다음 →</button>
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