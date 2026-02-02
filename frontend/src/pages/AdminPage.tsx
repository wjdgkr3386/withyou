import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import {
  GRADE_OPTIONS,
  DIFFICULTY_OPTIONS,
  TYPE_OPTIONS
} from '../constants/options';

interface CategoryData {
    [key: string]: string[];
}

type QuestionType = '객관식' | '주관식' | '빈칸채우기';
type Difficulty = '하' | '중' | '상';


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

const GRADE_MAP: { [key: string]: string } = {
    "E1": "초1", "E2": "초2", "E3": "초3", "E4": "초4", "E5": "초5", "E6": "초6",
    "M1": "중1", "M2": "중2", "M3": "중3",
    "H1": "고1", "H2": "고2", "H3": "고3"
};

const BASE_URL = import.meta.env.VITE_API_URL;

function Admin() {
    const navigate = useNavigate();
    const [active, setActive] = useState<string>('대시보드');
    const [problemBankTab, setProblemBankTab] = useState<'list' | 'create'>('list');
    const [selectedGrade, setSelectedGrade] = useState<string>('초5');
    const [selectedTerm, setSelectedTerm] = useState<string>('1학기');
    const [inputValue, setInputValue] = useState<string>('');
    
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const [data, setData] = useState<CategoryData>({});

    const menus = ['대시보드', '학생 관리', '문제은행', '시험 관리', '성적 관리', '카테고리 관리'];
    const grades = GRADE_OPTIONS.map(g => g.label);

    const currentKey = `${selectedGrade}-${selectedTerm}`;
    const currentContents = data[currentKey] || [];

    // 문제은행 상태
    const [grade, setGrade] = useState<string>("");
    const [category, setCategory] = useState<string>("");
    const [difficulty, setDifficulty] = useState<string>("");
    const [type, setType] = useState<string>("");
    const [page, setPage] = useState<number>(0);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);

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
        totalCount: number;
        currentIndex: number;
    }

    const [problem, setProblem] = useState<ProblemData | null>(null);

    // 문제 생성 상태
    const [problemData, setProblemData] = useState({
        grade: '', category: '', content: '', type: '객관식' as QuestionType, difficulty: '하' as Difficulty,
        options: ['', '', '', ''], answer: ''
    });
    
    const [activeTab, setActiveTab] = useState<keyof typeof SYMBOL_GROUPS>('기본/연산');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const answerRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 카테고리 관리 - 데이터 불러오기
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/api/admin/subjects`);
                setData(response.data);
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
            }
        };
        fetchCategories();
    }, []);

    const updateServer = async (updatedData: CategoryData) => {
        try {
            await axios.post(`${BASE_URL}/api/admin/subjects/update`, updatedData);
            setData(updatedData);
        } catch (error) {
            alert("서버 저장에 실패했습니다.");
        }
    };

    const handleAdd = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        
        const updatedData = {
            ...data,
            [currentKey]: [...currentContents, trimmed]
        };
        updateServer(updatedData);
        setInputValue('');
    };

    const handleDelete = (index: number) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;

        const filtered = currentContents.filter((_, i) => i !== index);
        const updatedData = { ...data, [currentKey]: filtered };
        updateServer(updatedData);
    };

    const handleUpdate = () => {
        const trimmed = editValue.trim();
        if (editingIndex === null || !trimmed) return; 
        
        const updatedContents = [...currentContents];
        updatedContents[editingIndex] = trimmed;
        
        const updatedData = { ...data, [currentKey]: updatedContents };
        updateServer(updatedData);
        setEditingIndex(null);
        setEditValue('');
    };

    const startEdit = (index: number, content: string) => {
        setEditingIndex(index);
        setEditValue(content);
    };

    // 문제은행 - 검색
    const search = async (pageNum: number = 0) => {
        try {
            const response = await axios.get(`${BASE_URL}/api/admin/problem/search`, {
                params: {
                    ...(grade && { grade }),
                    ...(category && { category }),
                    ...(difficulty && { difficulty }),
                    ...(type && { type }),
                    page: pageNum,
                    size: 1
                }
            });
            const data = response.data.data;
            setProblem(data);
            setPage(pageNum);
        } catch(error) {
            alert("오류가 발생했습니다.\n콘솔을 확인해주세요");
            console.log(error);
        }
    }

    const handleSearchClick = () => {
        search(0);
    }

    // 학년에 따른 카테고리 목록 가져오기
    const getCategoriesForGrade = (gradeValue: string): string[] => {
        if (!gradeValue || !data) return [];
        
        const gradeLabel = GRADE_MAP[gradeValue];
        if (!gradeLabel) return [];
        
        const term1Key = `${gradeLabel}-1학기`;
        const term2Key = `${gradeLabel}-2학기`;
        
        const categories = [
            ...(data[term1Key] || []),
            ...(data[term2Key] || [])
        ];
        
        // 중복 제거
        return Array.from(new Set(categories));
    };

    const renderProblemContent = (content: string) => {
        return content.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <br key={idx} />;

            const parts = trimmed.split(/(\$.*?\$)/g);

            return (
                <div key={idx} style={{ marginBottom: '6px' }}>
                    {parts.map((part, pIdx) => {
                        if (part.startsWith('$') && part.endsWith('$')) {
                            const math = part.slice(1, -1);
                            return <InlineMath key={pIdx} math={math} />;
                        }
                        return <span key={pIdx}>{part}</span>;
                    })}
                </div>
            );
        });
    };

    // 문제 생성 함수들
    const wrapWithDollarSigns = (text: string) => {
        if (!text) return "";
        const mathRegex = /(\\frac{[^{}]*(?:{[^{}]*}[^{}]*)*}{[^{}]*(?:{[^{}]*}[^{}]*)*}+|\\sqrt{[^{}]*(?:{[^{}]*}[^{}]*)*}+|\\sum_{.*?}^{.*?}|\\lim_{.*?}|\\int|\\log|\\ln|\\sin|\\cos|\\tan|\\theta|\\pi|\\times|\\div|\\pm|\\neq|\\le|\\ge|\\approx|\\infty|\\to|\\in|\\subset|\\cup|\\cap|\\angle|\\triangle|\\perp|\\parallel|\\therefore|\\because|\^{.*?}|_{.*?})/g;
        return text.replace(mathRegex, (match) => `$${match}$`);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [problemData.content]);

    useEffect(() => {
        if (answerRef.current) {
            answerRef.current.style.height = 'auto';
            answerRef.current.style.height = `${answerRef.current.scrollHeight}px`;
        }
    }, [problemData.answer]);

    const addSymbol = (target: 'content' | 'answer', symbolValue: string) => {
        const ref = target === 'content' ? textareaRef : answerRef;
        const currentText = target === 'content' ? problemData.content : problemData.answer;
        
        if (!ref.current) return;
        const start = ref.current.selectionStart;
        const end = ref.current.selectionEnd;
        const newText = currentText.substring(0, start) + symbolValue + currentText.substring(end);
        
        setProblemData({ ...problemData, [target]: newText });

        setTimeout(() => {
            ref.current?.focus();
            let cursorOffset = symbolValue.length;
            if (symbolValue.includes('{}')) cursorOffset = symbolValue.indexOf('{') + 1;
            ref.current?.setSelectionRange(start + cursorOffset, start + cursorOffset);
        }, 0);
    };

    const renderContent = (text: string) => {
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
                    <span style={{ whiteSpace: 'pre-wrap', fontSize: '1.1em' }}>
                        {finalLatex.trim() ? <InlineMath math={finalLatex} /> : null}
                    </span>
                    <br />
                </React.Fragment>
            );
        });
    };

    const submitProblem = async () => {
        if (!problemData.grade || !problemData.category || !problemData.content.trim()) return alert("필수 항목을 입력해주세요.");
        if (problemData.type === '객관식' && (!problemData.options.every(opt => opt.trim()) || !problemData.answer)) return alert("객관식 정보를 완성해주세요.");
        if (problemData.type !== '객관식' && !problemData.answer.trim()) return alert("정답을 입력해주세요.");

        const processedData = {
            ...problemData,
            content: wrapWithDollarSigns(problemData.content),
            options: problemData.options.map(opt => wrapWithDollarSigns(opt)),
            answer: problemData.type === '객관식' ? problemData.answer : wrapWithDollarSigns(problemData.answer)
        };

        const formData = new FormData();
        formData.append('problem', new Blob([JSON.stringify(processedData)], { type: 'application/json' }));
        if (image) formData.append('image', image);

        try {
            const response = await axios.post(`${BASE_URL}/api/admin/problem`, formData, { withCredentials: true });
            if (response) {
                alert("문제가 등록되었습니다.");
                setProblemBankTab('list');
                setProblemData({
                    grade: '', category: '', content: '', type: '객관식', difficulty: '하',
                    options: ['', '', '', ''], answer: ''
                });
                setImage(null);
                setImagePreview('');
            }
        } catch (error) {
            console.error('등록 실패', error);
            alert("서버 전송 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="container-fluid d-flex vh-100 p-0">
            {/* 사이드바 */}
            <div className="bg-dark h-100" style={{ width: '20%', minWidth: '230px' }}>
                <div className="text-info fs-3 ms-3 mt-3 fw-bold">위드유 수학학원</div>
                <div className="fs-6 ms-3 mb-4" style={{ color: '#5F9EA0' }}>관리자 시스템</div>
                {menus.map((menu) => (
                    <div key={menu} onClick={() => setActive(menu)} className={`text-white rounded p-3 mx-3 mb-1 ${active === menu ? 'bg-primary' : ''}`} style={{ cursor: 'pointer', transition: '0.2s' }}>{menu}</div>
                ))}
            </div>

            {/* 메인 콘텐츠 */}
            <div className="flex-grow-1 p-4 bg-light overflow-auto">
                <h1 className='fw-bold mb-4'>{active}</h1>

                {active === '카테고리 관리' && (
                    <div className="row">
                        <div className="col-md-3">
                            <h5 className="fw-bold mb-3">학년 선택</h5>
                            <div className="list-group shadow-sm">
                                {grades.map(grade => (
                                    <div key={grade} className="border-bottom">
                                        <button className={`list-group-item list-group-item-action border-0 py-3 fw-bold ${selectedGrade === grade ? 'bg-primary text-white' : ''}`} onClick={() => { setSelectedGrade(grade); setSelectedTerm('1학기'); }}>{grade}</button>
                                        {selectedGrade === grade && (
                                            <div className="bg-white">
                                                {['1학기', '2학기'].map((term) => (
                                                    <div key={term} onClick={() => setSelectedTerm(term)} className={`p-3 ps-5 border-bottom ${selectedTerm === term ? 'text-primary fw-bold' : 'text-secondary'}`} style={{ cursor: 'pointer' }}>{term}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-md-9">
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white fw-bold py-3">{selectedGrade} {selectedTerm} 카테고리 설정</div>
                                <div className="card-body p-4">
                                    <div className="input-group mb-4 shadow-sm">
                                        <input type="text" className="form-control border-primary-subtle" placeholder="(예: 유리수와 순환소수)" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}/>
                                        <button className="btn btn-primary px-4" onClick={handleAdd}>+ 추가</button>
                                    </div>

                                    <ul className="list-group list-group-flush">
                                        {currentContents.length > 0 ? currentContents.map((content, idx) => (
                                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center py-3 px-0">
                                                {editingIndex === idx ? (
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-white">{idx + 1}.</span>
                                                        <input type="text" className="form-control" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}/>
                                                        <button className="btn btn-success" onClick={handleUpdate}>저장</button>
                                                        <button className="btn btn-outline-secondary" onClick={() => setEditingIndex(null)}>취소</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="fs-5">{idx + 1}. {content}</span>
                                                        <div>
                                                            <button className="btn btn-outline-warning btn-sm me-2" onClick={() => startEdit(idx, content)}>수정</button>
                                                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(idx)}>삭제</button>
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        )) : (
                                            <div className="text-center py-5 text-muted">등록된 카테고리가 없습니다.</div>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {active === '문제은행' && (
                    <>
                        <div className="d-flex mb-4 border-bottom">
                            <button 
                                className={`px-4 py-2 border-0 bg-transparent ${problemBankTab === 'list' ? 'border-bottom border-primary border-3 fw-bold text-primary' : 'text-secondary'}`}
                                onClick={() => setProblemBankTab('list')}
                            >
                                목록 보기
                            </button>
                            <button 
                                className={`px-4 py-2 border-0 bg-transparent ${problemBankTab === 'create' ? 'border-bottom border-primary border-3 fw-bold text-primary' : 'text-secondary'}`}
                                onClick={() => setProblemBankTab('create')}
                            >
                                문제 만들기
                            </button>
                        </div>
                    
                        {problemBankTab === 'list' && (
                            <div className="container mt-5">
                                
                                <div id="filter-box" className="rounded p-4 mb-4" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                                    <div className="row mb-3">
                                        <div className="col-3">
                                            <div>학년</div>
                                            <select className="w-100 p-1 mt-1" value={grade} onChange={(e) => {
                                                setGrade(e.target.value);
                                                setCategory("");
                                                setAvailableCategories(getCategoriesForGrade(e.target.value));
                                            }}>
                                                <option value="">전체</option>
                                                {GRADE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-3">
                                            <div>카테고리</div>
                                            <select
                                                className="w-100 p-1 mt-1"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                disabled={!grade}
                                                >
                                                <option value="">전체</option>
                                                {availableCategories.length > 0 ? (
                                                    availableCategories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                    ))
                                                ) : (
                                                    <option disabled>등록된 카테고리가 없습니다</option>
                                                )}
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
                                        
                                        <div className="d-flex justify-content-between align-items-center">
                                            <button 
                                                className="btn bg-secondary text-white" 
                                                onClick={() => search(page - 1)}
                                                disabled={page === 0}
                                            >
                                                ← 이전
                                            </button>
                                            
                                            <span className="fw-bold">
                                                {problem.currentIndex} / {problem.totalCount}
                                            </span>
                                            
                                            <button 
                                                className="btn bg-secondary text-white" 
                                                onClick={() => search(page + 1)}
                                                disabled={problem.currentIndex >= problem.totalCount}
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
                        )}

                        {problemBankTab === 'create' && (
                            <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto', fontFamily: 'sans-serif', color: '#333' }}>
                                <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>수학 문제 출제</h2>

                                <section style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>학년 선택</label>
                                        <select 
                                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} 
                                            value={problemData.grade} 
                                            onChange={e => {
                                                setProblemData({ ...problemData, grade: e.target.value, category: '' });
                                                setAvailableCategories(getCategoriesForGrade(e.target.value));
                                            }}
                                        >
                                            <option value="">학년 선택</option>
                                            {GRADE_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>과목/단원</label>
                                        <select 
                                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} 
                                            value={problemData.category} 
                                            onChange={e => setProblemData({ ...problemData, category: e.target.value })}
                                            disabled={!problemData.grade}
                                        >
                                            <option value="">과목 선택</option>
                                            {availableCategories.length > 0 ? (
                                                availableCategories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))
                                            ) : (
                                                <option disabled>등록된 카테고리가 없습니다</option>
                                            )}
                                        </select>
                                    </div>
                                </section>

                                <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '10px' }}>
                                    {Object.keys(SYMBOL_GROUPS).map(tab => (
                                        <button key={tab} onClick={() => setActiveTab(tab as any)} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', background: activeTab === tab ? '#fff' : '#f0f0f0', borderBottom: activeTab === tab ? '2px solid #007bff' : 'none', fontWeight: activeTab === tab ? 'bold' : 'normal' }}>{tab}</button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px', background: '#fff', padding: '10px', border: '1px solid #eee' }}>
                                    {SYMBOL_GROUPS[activeTab].map(s => (
                                        <button key={s.label} onClick={() => addSymbol('content', s.value)} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}>
                                            <InlineMath math={s.value === '^{}' ? 'x^{n}' : s.value === '_{}' ? 'x_{n}' : s.label === '분수' ? '\\frac{1}{1}' : s.value} />
                                        </button>
                                    ))}
                                </div>

                                <textarea ref={textareaRef} style={{ width: '100%', minHeight: '120px', padding: '15px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', overflow: 'hidden', resize: 'none' }} value={problemData.content} onChange={e => setProblemData({ ...problemData, content: e.target.value })} placeholder="문제를 입력하세요" />
                                <div style={{ marginBottom: '10px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                    {problemData.content ? renderContent(problemData.content) : <span style={{ color: '#888' }}>미리보기</span>}
                                </div>

                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '10px' }} />
                                {imagePreview && <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}><img src={imagePreview} alt="preview" style={{ maxWidth: '100px', borderRadius: '4px', border: '1px solid #ddd' }} /><button onClick={removeImage} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>×</button></div>}

                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                    <select style={{ flex: 1, padding: '10px' }} value={problemData.type} onChange={e => setProblemData({ ...problemData, type: e.target.value as QuestionType, options: e.target.value === '객관식' ? ['', '', '', ''] : [''], answer: '' })}>
                                        <option value="객관식">객관식</option>
                                        <option value="주관식">주관식</option>
                                        <option value="빈칸채우기">빈칸 채우기</option>
                                    </select>
                                    <select style={{ flex: 1, padding: '10px' }} value={problemData.difficulty} onChange={e => setProblemData({ ...problemData, difficulty: e.target.value as Difficulty })}>
                                        <option value="하">난이도: 하</option>
                                        <option value="중">난이도: 중</option>
                                        <option value="상">난이도: 상</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '30px' }}>
                                    <h4>보기 사항</h4>
                                    {problemData.options.map((opt, idx) => (
                                        <div key={idx} style={{ marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <span>{idx + 1}.</span>
                                                <input style={{ flex: 1, padding: '8px' }} value={opt} onChange={e => { const newOpts = [...problemData.options]; newOpts[idx] = e.target.value; setProblemData({ ...problemData, options: newOpts }); }} />
                                            </div>
                                            {opt && <div style={{ marginLeft: '25px', marginTop: '5px' }}>{renderContent(opt)}</div>}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ padding: '20px', background: '#f1f3f5', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '30px' }}>
                                    <strong style={{ display: 'block', marginBottom: '10px' }}>정답 설정</strong>
                                    {problemData.type === '객관식' ? (
                                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                            {problemData.options.map((_, i) => (
                                                <label key={i} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <input type="radio" name="answer" value={String(i + 1)} checked={problemData.answer === String(i + 1)} onChange={e => setProblemData({ ...problemData, answer: e.target.value })} /> {i + 1}번
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                {SYMBOL_GROUPS[activeTab].map(s => (
                                                    <button key={s.label} onClick={() => addSymbol('answer', s.value)} style={{ padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}>
                                                    <InlineMath math={s.value === '^{}' ? 'x^{n}' : s.value === '_{}' ? 'x_{n}' : s.label === '분수' ? '\\frac{1}{1}' : s.value} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea ref={answerRef} style={{ width: '100%', minHeight: '50px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px', resize: 'none' }} value={problemData.answer} onChange={e => setProblemData({ ...problemData, answer: e.target.value })} placeholder="정답을 입력하세요" />
                                            <div style={{ marginTop: '10px' }}>{problemData.answer && renderContent(problemData.answer)}</div>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={submitProblem}
                                    disabled={!problemData.grade || !problemData.category || !problemData.content.trim() || !problemData.answer}
                                    style={{ width: '100%', padding: '15px', background: (!problemData.grade || !problemData.category || !problemData.content.trim() || !problemData.answer) ? '#ccc' : '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    문제 등록하기
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Admin;