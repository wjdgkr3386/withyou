import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import 'katex/dist/contrib/auto-render.min.js';
import {
  GRADE_OPTIONS,
  DIFFICULTY_OPTIONS,
  TYPE_OPTIONS
} from '../constants/options';

// KaTeX window 타입 선언
declare global {
    interface Window {
        katex: any;
    }
}

interface CategoryData {
    [key: string]: string[];
}

type QuestionType = '객관식' | '주관식';
type Difficulty = '하' | '중' | '상';

// 시험 관련 인터페이스 추가
interface ExamProblem {
    problemOrder: number;
    grade: string;
    category: string;
    content: string;
    type: string;
    difficulty: string;
    answer: string;
    imageUrl?: string;
    options?: {
        optionNumber: number;
        content: string;
    }[];
}

interface Exam {
    id: number;
    title: string;
    content: string;
    questionCount: number;
    createdAt: string;
}

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

    const menus = ['대시보드', '카테고리 관리', '문제은행', '시험 관리', '학생 관리', '성적 관리',];
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
    const [isEditing, setIsEditing] = useState<boolean>(false);

    // 문제 생성 상태
    const [problemData, setProblemData] = useState({
        grade: '', category: '', content: '', type: '객관식' as QuestionType, difficulty: '하' as Difficulty,
        options: ['', '', '', ''], answer: ''
    });
    
    // 시험 문제 ID 배열
    const [examProblemIds, setExamProblemIds] = useState<number[]>([]);
    
    // 시험 문제 상세 정보 저장
    interface ExamProblemDetail {
        id: number;
        grade: string;
        category: string;
        content: string;
        type: string;
        difficulty: string;
        imageUrl?: string;
        answer?: string;
        options?: {
            optionNumber: number;
            content: string;
        }[];
    }
    const [examProblemsDetail, setExamProblemsDetail] = useState<Map<number, ExamProblemDetail>>(new Map());
    
    // 시험 관리 상태 추가
    const [examName, setExamName] = useState<string>('');
    const [examList, setExamList] = useState<Exam[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
    const [isEditingExam, setIsEditingExam] = useState<boolean>(false);
    const [loadedExamHtmlContent, setLoadedExamHtmlContent] = useState<string>('');
    const [loadedExamQuestionCount, setLoadedExamQuestionCount] = useState<number>(0);
    const [examManagementSubTab, setExamManagementSubTab] = useState<'create_edit' | 'setup_test'>('create_edit');

    // 시험 설정 상태 추가
    const [selectedExamForSetup, setSelectedExamForSetup] = useState<number | null>(null);
    const [selectedExamForSetupContent, setSelectedExamForSetupContent] = useState<string>('');
    const [problemTimeLimits, setProblemTimeLimits] = useState<Map<number, number>>(new Map());
    const [inputValues, setInputValues] = useState<Map<number, string>>(new Map());

    const [activeTab, setActiveTab] = useState<keyof typeof SYMBOL_GROUPS>('기본/연산');
    const [answerActiveTab, setAnswerActiveTab] = useState<keyof typeof SYMBOL_GROUPS>('기본/연산');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [examJoinCnt, setExamJoinCnt] = useState<number>(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const answerRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadedContentRef = useRef<HTMLDivElement>(null);


    // HTML 파싱해서 문제 번호 추출하는 함수
    const parseProblemsFromHtml = (htmlContent: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const problemNumbers: number[] = [];
        
        const h2Elements = doc.querySelectorAll('h2');
        h2Elements.forEach(h2 => {
            const problemMatch = h2.textContent?.match(/문제 (\d+)/);
            if (problemMatch && problemMatch[1]) {
                problemNumbers.push(parseInt(problemMatch[1]));
            }
        });
        
        return problemNumbers;
    };

    // 시험 설정을 위해 선택된 시험 로드
    const loadExamForSetup = async (examId: number) => {
        try {
            setSelectedExamForSetup(examId);
            
            // API 호출로 시험 상세 정보 가져오기
            const response = await axios.get(`${BASE_URL}/api/admin/exams/${examId}`, { withCredentials: true });
            const exam = response.data.data;
            
            // 시험 내용 저장
            setSelectedExamForSetupContent(exam.content);
            
            // HTML에서 문제 번호들 추출
            const problemNumbers = parseProblemsFromHtml(exam.content);
            
            // 각 문제에 대해 기본 시간 설정 (0초)
            const newTimeLimits = new Map<number, number>();
            problemNumbers.forEach(num => {
                newTimeLimits.set(num, problemTimeLimits.get(num) || 0);
            });
            setProblemTimeLimits(newTimeLimits);
        } catch (error) {
            console.error('시험 로드 실패:', error);
            alert('시험을 불러오는 중 오류가 발생했습니다.');
        }
    };



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

    // 시험 목록 불러오기
    useEffect(() => {
        if (active === '시험 관리') {
            fetchExamList();
        }
    }, [active]);

    const fetchExamList = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/admin/exams`, { withCredentials: true });
            setExamList(response.data.data);
        } catch (error) {
            console.log('Error fetching exam list:', error);
            setExamList([]);
        }
    };

    // 시험 저장
    const saveExam = async () => {
        if (!examName.trim()) {
            alert("시험 이름을 입력해주세요.");
            return;
        }
        if (examProblemIds.length === 0 && !loadedExamHtmlContent) {
            alert("시험 문제를 선택해주세요.");
            return;
        }

        try {
            let examData;

            if (examProblemIds.length > 0) {
                examData = {
                    title: examName.trim(),
                    problemIds: examProblemIds,
                    questionCount: examProblemIds.length,
                    content: '',
                };
            } else {
                const currentExam = examList.find(e => e.id === selectedExamId);
                examData = {
                    title: examName.trim(),
                    content: loadedExamHtmlContent,
                    questionCount: currentExam?.questionCount || 0,
                    problemIds: [],
                };
            }

            if (isEditingExam && selectedExamId) {
                await axios.put(`${BASE_URL}/api/admin/exams/${selectedExamId}`, examData, { withCredentials: true });
                alert("시험이 수정되었습니다.");
            } else {
                await axios.post(`${BASE_URL}/api/admin/exams`, examData, { withCredentials: true });
                alert("시험이 저장되었습니다.");
            }

            setExamName('');
            setExamProblemIds([]);
            setExamProblemsDetail(new Map());
            setSelectedExamId(null);
            setIsEditingExam(false);
            setLoadedExamHtmlContent('');
            setLoadedExamQuestionCount(0);

            fetchExamList();
        } catch (error) {
            console.error("시험 저장 실패:", error);
            alert("시험 저장 중 오류가 발생했습니다.");
        }
    };

    // 시험 불러오기
    const loadExam = async (examId: number) => {
        try {
            const response = await axios.get(`${BASE_URL}/api/admin/exams/${examId}`, { withCredentials: true });
            const exam = response.data.data;
            
            setExamName(exam.title);
            setSelectedExamId(exam.id);
            setIsEditingExam(true);
            setLoadedExamHtmlContent(exam.content);
            setExamProblemIds([]);
            setExamProblemsDetail(new Map());
            
        } catch (error) {
            console.log('Error loading exam:', error);
            alert("시험을 불러오는 중 오류가 발생했습니다.");
            setLoadedExamHtmlContent('');
        }
    };

    // HTML 내용을 렌더링하는 함수
    const renderLoadedExamContent = (htmlContent: string) => {
        if (!htmlContent) return null;

        const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        let liCounter = 0;
        
        const processNode = (node: Node, resetCounter: boolean = false): React.ReactNode[] => {
            const result: React.ReactNode[] = [];
            
            if (resetCounter) {
                liCounter = 0;
            }
            
            node.childNodes.forEach((child, index) => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const text = child.textContent || '';
                    const parts = text.split(/(\$[^$]+\$)/g);
                    parts.forEach((part, partIndex) => {
                        if (part.startsWith('$') && part.endsWith('$')) {
                            const math = part.slice(1, -1);
                            result.push(<InlineMath key={`${index}-${partIndex}`} math={math} />);
                        } else if (part) {
                            result.push(<span key={`${index}-${partIndex}`}>{part}</span>);
                        }
                    });
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const element = child as Element;
                    const tagName = element.tagName.toLowerCase();
                    const children = processNode(child);
                    
                    switch (tagName) {
                        case 'h2':
                            result.push(<h2 key={index} className="mt-4 mb-3 fw-bold">{children}</h2>);
                            break;
                        case 'h3':
                            result.push(<h3 key={index} className="mt-3 mb-2 fw-bold">{children}</h3>);
                            liCounter = 0;
                            break;
                        case 'p':
                            result.push(<p key={index} className="mb-2">{children}</p>);
                            break;
                        case 'ul':
                            liCounter = 0;
                            result.push(<ul key={index} className="list-unstyled mb-3">{processNode(child, true)}</ul>);
                            break;
                        case 'li':
                            const circleNum = circleNumbers[liCounter] || `${liCounter + 1}.`;
                            liCounter++;
                            result.push(
                                <li key={index} className="mb-2">
                                    <span className="fw-bold me-2">{circleNum}</span>
                                    {children}
                                </li>
                            );
                            break;
                        case 'strong':
                            result.push(<strong key={index}>{children}</strong>);
                            break;
                        case 'hr':
                            result.push(<hr key={index} className="my-4" />);
                            break;
                        case 'img':
                            result.push(
                                <div key={index} className="d-block my-3">
                                    <img 
                                        src={element.getAttribute('src') || ''}
                                        alt={element.getAttribute('alt') || ''}
                                        className="img-fluid"
                                        style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                            );
                            break;
                        default:
                            result.push(<div key={index}>{children}</div>);
                    }
                }
            });
            
            return result;
        };
        
        return processNode(doc.body);
    };

    // 시험 삭제
    const deleteExam = async (examId: number) => {
        if (!window.confirm("정말로 이 시험을 삭제하시겠습니까?")) return;

        try {
            await axios.delete(`${BASE_URL}/api/admin/exams/${examId}`, { 
                withCredentials: true
            });
            alert("시험이 삭제되었습니다.");
            
            if (selectedExamId === examId) {
                setExamName('');
                setExamProblemIds([]);
                setExamProblemsDetail(new Map());
                setSelectedExamId(null);
                setIsEditingExam(false);
                setLoadedExamHtmlContent('');
            }
            
            fetchExamList();
        } catch (error) {
            console.error("시험 삭제 실패:", error);
            alert("시험 삭제 중 오류가 발생했습니다.");
        }
    };

    // 새 시험 만들기
    const createNewExam = () => {
        setExamName('');
        setExamProblemIds([]);
        setExamProblemsDetail(new Map());
        setSelectedExamId(null);
        setIsEditingExam(false);
        setLoadedExamHtmlContent('');
        setLoadedExamQuestionCount(0);
    };

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
            setIsEditing(false);
        } catch(error) {
            alert("오류가 발생했습니다.\n콘솔을 확인해주세요");
            console.log(error);
        }
    }

    const handleSearchClick = () => {
        search(0);
    }

    // 문제 수정 모드로 전환
    const handleEditProblem = () => {
        if (!problem) return;
        
        const removeDollarSigns = (text: string) => {
            return text.replace(/\$/g, '');
        };

        setProblemData({
            grade: problem.grade,
            category: problem.category,
            content: removeDollarSigns(problem.content),
            type: problem.type as QuestionType,
            difficulty: problem.difficulty as Difficulty,
            options: problem.type === '객관식' 
                ? problem.options.map(opt => removeDollarSigns(opt.content))
                : ['', '', '', ''],
            answer: problem.type === '객관식' 
                ? problem.answer 
                : removeDollarSigns(problem.answer)
        });

        setAvailableCategories(getCategoriesForGrade(problem.grade));
        
        if (problem.imageUrl) {
            setImagePreview(problem.imageUrl);
        }

        setIsEditing(true);
    };

    // 문제 수정 취소
    const handleCancelEdit = () => {
        setIsEditing(false);
        setProblemData({
            grade: '', category: '', content: '', type: '객관식', difficulty: '하',
            options: ['', '', '', ''], answer: ''
        });
        setImage(null);
        setImagePreview('');
    };

    // 문제 업데이트
    const updateProblem = async () => {
        if (!problem) return;
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
            const response = await axios.put(`${BASE_URL}/api/admin/problem/${problem.id}`, formData, { withCredentials: true });
            if (response) {
                alert("문제가 수정되었습니다.");
                search(page);
                setIsEditing(false);
                setProblemData({
                    grade: '', category: '', content: '', type: '객관식', difficulty: '하',
                    options: ['', '', '', ''], answer: ''
                });
                setImage(null);
                setImagePreview('');
            }
        } catch (error) {
            console.error('수정 실패', error);
            alert("서버 전송 중 오류가 발생했습니다.");
        }
    };

    // 문제 삭제
    const deleteProblem = async () => {
        if (!problem) return;
        if (!window.confirm("정말로 이 문제를 삭제하시겠습니까?")) return;
        if (!window.confirm("진짜진짜 삭제하시겠습니까?")) return;

        try {
            await axios.delete(`${BASE_URL}/api/admin/problem/${problem.id}`, { withCredentials: true });
            alert("문제가 삭제되었습니다.");
            search(Math.max(0, page - 1));
        } catch (error) {
            console.error('삭제 실패', error);
            alert("문제 삭제 중 오류가 발생했습니다.");
        }
    };

    // 시험 문제 추가
    const addToExam = (problemId: number) => {
        if (!examProblemIds.includes(problemId) && problem) {
            setExamProblemIds([...examProblemIds, problemId]);
            
            const newDetail: ExamProblemDetail = {
                id: problem.id,
                grade: problem.grade,
                category: problem.category,
                content: problem.content,
                type: problem.type,
                difficulty: problem.difficulty,
                imageUrl: problem.imageUrl,
                answer: problem.answer,
                options: problem.options?.map(opt => ({
                    optionNumber: opt.optionNumber,
                    content: opt.content
                }))
            };
            
            setExamProblemsDetail(new Map(examProblemsDetail.set(problemId, newDetail)));
        }
    };

    // 시험 문제 제거
    const removeFromExam = (problemId: number) => {
        setExamProblemIds(examProblemIds.filter(id => id !== problemId));
        
        const newDetail = new Map(examProblemsDetail);
        newDetail.delete(problemId);
        setExamProblemsDetail(newDetail);
    };

    // 시험 문제 순서 변경
    const moveExamProblem = (fromIndex: number, toIndex: number) => {
        const newIds = [...examProblemIds];
        const [removed] = newIds.splice(fromIndex, 1);
        newIds.splice(toIndex, 0, removed);
        setExamProblemIds(newIds);
    };

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
                <div className="mt-3 ms-3"><span className="text-info fs-3 fw-bold" style={{ cursor: 'pointer'}} onClick={(e) => {navigate('/');}}>위드유 수학학원</span></div>
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
                                    <>
                                        {!isEditing ? (
                                            <div id="problem-box" className="rounded p-4" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>

                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <div>
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
                                                    <div>
                                                        {examProblemIds.includes(problem.id) ? (
                                                            <button 
                                                                className="btn btn-outline-danger"
                                                                onClick={() => removeFromExam(problem.id)}
                                                            >
                                                                시험 문제에서 빼기
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                className="btn btn-outline-primary"
                                                                onClick={() => addToExam(problem.id)}
                                                            >
                                                                시험 문제로 선택
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <hr/>

                                                <div className="fw-bold fs-5 mb-3">문제</div>
                                                <div id="problem-content" className="mb-4">
                                                    {renderProblemContent(problem.content)}
                                                </div>
                                                
                                                {problem.imageUrl && (
                                                    <div className="mb-4">
                                                        <img 
                                                            src={problem.imageUrl} 
                                                            alt="문제 이미지" 
                                                            style={{ 
                                                                maxWidth: '100%', 
                                                                height: 'auto',
                                                                borderRadius: '8px',
                                                                border: '1px solid #ddd'
                                                            }} 
                                                        />
                                                    </div>
                                                )}

                                                {problem.type === '객관식' && problem.options && problem.options.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="fw-bold fs-6 mb-3">보기</div>
                                                        <div className="row g-3">
                                                            {problem.options
                                                                .sort((a, b) => a.optionNumber - b.optionNumber)
                                                                .map((option) => {
                                                                    const circleNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
                                                                    return (
                                                                        <div key={option.id} className="col-6">
                                                                            <div className="border rounded p-3 h-100 d-flex align-items-center bg-white">
                                                                                <span className="fw-bold me-2 fs-5 d-flex align-items-center" style={{ minWidth: '30px', height: '100%' }}>
                                                                                    {circleNumbers[option.optionNumber - 1] || option.optionNumber}
                                                                                </span>
                                                                                <div className="flex-grow-1" style={{ marginTop: '6px' }}> 
                                                                                    {renderProblemContent(option.content)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            }
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="rounded bg-light p-3">
                                                    <div className="fw-bold fs-5 mb-3">정답</div>
                                                    <div className="answer">
                                                        {problem.type === '객관식' ? (
                                                            <span className="fs-4 fw-bold text-primary">{problem.answer}번</span>
                                                        ) : (
                                                            <span className="fs-4 fw-bold text-primary">{renderProblemContent(problem.answer)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <hr className="border"></hr>
                                                
                                                <div className="d-flex justify-content-between align-items-center mb-3">
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

                                                <div className="d-flex gap-2">
                                                    <button 
                                                        className="btn btn-warning flex-fill" 
                                                        onClick={handleEditProblem}
                                                    >
                                                        수정
                                                    </button>
                                                    <button 
                                                        className="btn btn-danger flex-fill" 
                                                        onClick={deleteProblem}
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>문제 수정 폼</div>
                                        )}
                                    </>
                                    
                                ) : (
                                    <div className="text-center py-5 border rounded">
                                        조회된 문제가 없습니다.
                                    </div>
                                )}
                            </div>
                        )}

                        {problemBankTab === 'create' && (
                            <div>문제 생성 폼</div>
                        )}
                    </>
                )}

                {active === '시험 관리' && (
                    <>
                        <div className="d-flex mb-4 border-bottom">
                            <button
                                className={`px-4 py-2 border-0 bg-transparent ${examManagementSubTab === 'create_edit' ? 'border-bottom border-primary border-3 fw-bold text-primary' : 'text-secondary'}`}
                                onClick={() => setExamManagementSubTab('create_edit')}
                            >
                                시험 작성 / 수정
                            </button>
                            <button
                                className={`px-4 py-2 border-0 bg-transparent ${examManagementSubTab === 'setup_test' ? 'border-bottom border-primary border-3 fw-bold text-primary' : 'text-secondary'}`}
                                onClick={() => setExamManagementSubTab('setup_test')}
                            >
                                시험 설정
                            </button>
                        </div>

                        {examManagementSubTab === 'create_edit' && (
                            <div className="row">
                                {/* 왼쪽: 시험 작성 영역 */}
                                <div className="col-md-8">
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white">
                                            <h4 className="mb-0">{isEditingExam ? '시험 수정' : '새 시험 만들기'}</h4>
                                        </div>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">시험 이름</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-lg" 
                                                    placeholder="예: 2024년 1학기 중간고사"
                                                    value={examName}
                                                    onChange={(e) => setExamName(e.target.value)}
                                                />
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button 
                                                    className="btn btn-primary flex-fill"
                                                    onClick={saveExam}
                                                    disabled={!examName.trim() || (examProblemIds.length === 0 && !loadedExamHtmlContent)}
                                                >
                                                    {isEditingExam ? '수정 완료' : '시험 저장'}
                                                </button>
                                                {isEditingExam && (
                                                    <button 
                                                        className="btn btn-outline-secondary"
                                                        onClick={createNewExam}
                                                    >
                                                        새 시험 만들기
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card shadow-sm">
                                        <div className="card-header bg-primary text-white">
                                            <h4 className="mb-0">
                                                시험 문제 목록 ({loadedExamHtmlContent ? 
                                                    (examList.find(e => e.id === selectedExamId)?.questionCount || 0) : 
                                                    examProblemIds.length}개)
                                            </h4>
                                        </div>
                                        <div className="card-body">
                                            {loadedExamHtmlContent ? (
                                                <div className="bg-light p-4 rounded">
                                                    {renderLoadedExamContent(loadedExamHtmlContent)}
                                                </div>
                                            ) : examProblemIds.length === 0 ? (
                                                <div className="text-center py-5 text-muted">
                                                    선택된 시험 문제가 없습니다.<br />
                                                    문제은행에서 문제를 선택해주세요.
                                                </div>
                                            ) : (
                                                <div className="text-muted">문제 목록 표시 영역</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 오른쪽: 저장된 시험 목록 */}
                                <div className="col-md-4">
                                    <div className="card shadow-sm" style={{ position: 'sticky', top: '20px' }}>
                                        <div className="card-header bg-success text-white">
                                            <h5 className="mb-0">저장된 시험 목록</h5>
                                        </div>
                                        <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                            {examList.length === 0 ? (
                                                <div className="text-center py-4 text-muted">
                                                    저장된 시험이 없습니다.
                                                </div>
                                            ) : (
                                                <div className="list-group list-group-flush">
                                                    {examList.map((exam) => (
                                                        <div 
                                                            key={exam.id} 
                                                            className={`list-group-item list-group-item-action ${selectedExamId === exam.id ? 'active' : ''}`}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div className="flex-grow-1" onClick={() => loadExam(exam.id)}>
                                                                    <h6 className="mb-1">{exam.title}</h6>
                                                                    <small className={selectedExamId === exam.id ? 'text-white-50' : 'text-muted'}>
                                                                        문제 수: {exam.questionCount}개<br />
                                                                        생성일: {new Date(exam.createdAt).toLocaleDateString()}
                                                                    </small>
                                                                </div>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteExam(exam.id);
                                                                    }}
                                                                >
                                                                    삭제
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {examManagementSubTab === 'setup_test' && (
                            <div className="row">
                                {/* 왼쪽: 시험 선택 */}
                                <div className="col-md-4">
                                    <div className="card shadow-sm">
                                        <div className="card-header bg-warning text-dark">
                                            <h5 className="mb-0">시험 선택</h5>
                                        </div>
                                        <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                            {examList.length === 0 ? (
                                                <div className="text-center py-4 text-muted">
                                                    저장된 시험이 없습니다.
                                                </div>
                                            ) : (
                                                <div className="list-group">
                                                    {examList.map((exam) => (
                                                        <div 
                                                            key={exam.id}
                                                            className={`list-group-item list-group-item-action ${selectedExamForSetup === exam.id ? 'active' : ''}`}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => loadExamForSetup(exam.id)}
                                                        >
                                                            <h6 className="mb-1">{exam.title}</h6>
                                                            <small className={selectedExamForSetup === exam.id ? 'text-white-50' : 'text-muted'}>
                                                                문제 수: {exam.questionCount}개
                                                            </small>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 오른쪽: 문제별 시간 설정 */}
                                <div className="col-md-8">
                                    {selectedExamForSetup ? (
                                        <div className="card shadow-sm">
                                            <div className="card-header bg-primary text-white">
                                                <h5 className="mb-0">문제별 시간 설정</h5>
                                            </div>
                                            <div className="card-body" style={{ maxHeight: '700px', overflowY: 'auto' }}>
                                                <button className="btn btn-success w-100 mb-3 fw-bold fs-4" style={{height:'50px'}}>
                                                    시간 설정 저장
                                                </button>
                                                {Array.from(problemTimeLimits.entries()).map(([problemNum, seconds]) => {
                                                    return (
                                                        <div key={problemNum} className="mb-4 p-4 border rounded bg-white">
                                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                                <h5 className="mb-0 text-primary">문제 {problemNum}</h5>
                                                                <div className="d-flex gap-2 align-items-center">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        className="form-control"
                                                                        style={{ width: '100px' }}
                                                                        value={inputValues.get(problemNum) ?? problemTimeLimits.get(problemNum)?.toString() ?? ""}
                                                                        onWheel={(e) => e.currentTarget.blur()}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                                            e.preventDefault();
                                                                            }
                                                                        }}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;

                                                                            setInputValues(prev => {
                                                                            const newMap = new Map(prev);
                                                                            newMap.set(problemNum, value);
                                                                            return newMap;
                                                                            });
                                                                        }}
                                                                        onBlur={() => {
                                                                            const currentValue = inputValues.get(problemNum);

                                                                            if (!currentValue) {
                                                                                setProblemTimeLimits(prev => {
                                                                                    const newMap = new Map(prev);
                                                                                    newMap.set(problemNum, 0);
                                                                                    return newMap;
                                                                                });

                                                                                setInputValues(prev => {
                                                                                    const newMap = new Map(prev);
                                                                                    newMap.set(problemNum, "0");
                                                                                    return newMap;
                                                                                });

                                                                                } else {
                                                                                    const num = Number(currentValue);
                                                                                    setProblemTimeLimits(prev => {
                                                                                        const newMap = new Map(prev);
                                                                                        newMap.set(problemNum, num);
                                                                                        return newMap;
                                                                                    }
                                                                                );
                                                                            }
                                                                        }}
                                                                        placeholder="초"
                                                                    />
                                                                    <span className="fw-bold">초</span>
                                                                </div>
                                                            </div>
                                                            
                                                            {(() => {
                                                                if (!selectedExamForSetupContent) return null;
                                                                
                                                                const parser = new DOMParser();
                                                                const doc = parser.parseFromString(selectedExamForSetupContent, 'text/html');
                                                                const h2Elements = doc.querySelectorAll('h2');
                                                                
                                                                let problemTextContent = '';
                                                                let problemHtmlElements: string[] = [];
                                                                let answerContent = null;
                                                                
                                                                h2Elements.forEach(h2 => {
                                                                    const problemMatch = h2.textContent?.match(/문제 (\d+)/);
                                                                    if (problemMatch && parseInt(problemMatch[1]) === problemNum) {
                                                                        let currentNode: Node | null = h2.nextSibling;
                                                                        
                                                                        while (currentNode) {
                                                                            // Element 노드인 경우
                                                                            if (currentNode.nodeType === Node.ELEMENT_NODE) {
                                                                                const element = currentNode as Element;
                                                                                const tagName = element.tagName.toLowerCase();
                                                                                
                                                                                // 다음 문제나 구분선을 만나면 중단
                                                                                if (tagName === 'h2' || tagName === 'hr') {
                                                                                    break;
                                                                                }
                                                                                
                                                                                // <p><strong>정답:</strong> ... </p> 형식 찾기
                                                                                if (tagName === 'p') {
                                                                                    const strongTag = element.querySelector('strong');
                                                                                    if (strongTag && strongTag.textContent?.includes('정답')) {
                                                                                        const fullText = element.textContent || '';
                                                                                        const answerMatch = fullText.match(/정답:\s*(.+)/);
                                                                                        if (answerMatch) {
                                                                                            answerContent = answerMatch[1].trim();
                                                                                        }
                                                                                        break;
                                                                                    }
                                                                                }
                                                                                
                                                                                // Element를 배열에 추가
                                                                                problemHtmlElements.push(element.outerHTML);
                                                                            } 
                                                                            // Text 노드인 경우
                                                                            else if (currentNode.nodeType === Node.TEXT_NODE) {
                                                                                const textContent = currentNode.textContent || '';
                                                                                if (textContent.trim()) {
                                                                                    problemTextContent += textContent;
                                                                                }
                                                                            }
                                                                            
                                                                            currentNode = currentNode.nextSibling;
                                                                        }
                                                                    }
                                                                });
                                                                
                                                                const renderMathContent = (text: string) => {
                                                                    if (!text) return null;
                                                                    
                                                                    const parts = text.split(/(\$[^$]+\$)/g);
                                                                    return parts.map((part, idx) => {
                                                                        if (part.startsWith('$') && part.endsWith('$')) {
                                                                            const math = part.slice(1, -1);
                                                                            return <InlineMath key={idx} math={math} />;
                                                                        }
                                                                        return <span key={idx}>{part}</span>;
                                                                    });
                                                                };
                                                                
                                                                return (
                                                                    <>
                                                                        <div className="mb-3">
                                                                            <div className="p-3 bg-light rounded problem-content-wrapper" style={{ overflow: 'hidden' }}>
                                                                                {(problemTextContent || problemHtmlElements.length > 0) ? (
                                                                                    <>
                                                                                        {/* 텍스트 노드 렌더링 (수학 기호 포함) */}
                                                                                        {problemTextContent && (
                                                                                            <div>{renderProblemContent(problemTextContent)}</div>
                                                                                        )}
                                                                                        {/* HTML 요소 렌더링 */}
                                                                                        {problemHtmlElements.map((html, idx) => (
                                                                                            <div key={idx} dangerouslySetInnerHTML={{ __html: html }} />
                                                                                        ))}
                                                                                    </>
                                                                                ) : (
                                                                                    <div className="text-muted">문제 내용을 불러올 수 없습니다.</div>
                                                                                )}
                                                                                <style>{`
                                                                                    .problem-content-wrapper img {
                                                                                        max-width: 80% !important;
                                                                                        height: auto !important;
                                                                                    }
                                                                                `}</style>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {answerContent && (
                                                                            <div className="mb-3">
                                                                                <div className="fw-bold text-success mb-2">정답:</div>
                                                                                <div className="p-3 bg-success-subtle rounded">
                                                                                    <span className="fw-bold text-success fs-5">
                                                                                        {renderMathContent(answerContent)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="card shadow-sm">
                                            <div className="card-body text-center py-5 text-muted">
                                                왼쪽에서 시험을 선택하세요
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Admin;