import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import axios from 'axios';

type QuestionType = '객관식' | '주관식' | '빈칸채우기';
type Difficulty = '하' | '중' | '상';

const GRADES = [
  { label: "초1", value: "E1" },
  { label: "초2", value: "E2" },
  { label: "초3", value: "E3" },
  { label: "초4", value: "E4" },
  { label: "초5", value: "E5" },
  { label: "초6", value: "E6" },

  { label: "중1", value: "M1" },
  { label: "중2", value: "M2" },
  { label: "중3", value: "M3" },

  { label: "고1", value: "H1" },
  { label: "고2", value: "H2" },
  { label: "고3", value: "H3" },
] as const;

const CATEGORIES = [
  "수와 연산", "문자와 식", "함수", "기하", "확률과 통계", 
  "수학 I", "수학 II", "미적분", "기하(고등)", "기타"
];

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

const BASE_URL = import.meta.env.VITE_API_URL;

const ProblemPage: React.FC = () => {
  const [data, setData] = useState({
    grade: '', category: '', content: '', type: '객관식' as QuestionType, difficulty: '중' as Difficulty,
    options: ['', '', '', ''], answer: ''
  });
  
  const [activeTab, setActiveTab] = useState<keyof typeof SYMBOL_GROUPS>('기본/연산');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  // 이미지 핸들러
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

  // 문제 내용 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [data.content]);

  // 정답 입력 자동 높이 조절
  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.style.height = 'auto';
      answerRef.current.style.height = `${answerRef.current.scrollHeight}px`;
    }
  }, [data.answer]);

  const addSymbol = (symbolValue: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = data.content.substring(0, start) + symbolValue + data.content.substring(end);
    setData({ ...data, content: newContent });

    setTimeout(() => {
      textarea.focus();
      let cursorOffset = symbolValue.length;
      if (symbolValue.includes('{}')) cursorOffset = symbolValue.indexOf('{') + 1;
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  const addSymbolToAnswer = (symbolValue: string) => {
    const textarea = answerRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newAnswer = data.answer.substring(0, start) + symbolValue + data.answer.substring(end);
    setData({ ...data, answer: newAnswer });

    setTimeout(() => {
      textarea.focus();
      let cursorOffset = symbolValue.length;
      if (symbolValue.includes('{}')) cursorOffset = symbolValue.indexOf('{') + 1;
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      const processedLine = line.replace(/ /g, '\\ ');
      const mathRegex = /(\\frac{[^{}]*(?:{[^{}]*}[^{}]*)*}{[^{}]*(?:{[^{}]*}[^{}]*)*}+|\\sqrt{[^{}]*(?:{[^{}]*}[^{}]*)*}+|\\sum_{.*}^{.*}|\\lim_{.*}|\\log|\\frac{dy}{dx}|\\[a-z]+|\^{.*}|_{.*})/g;
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
    if (!data.grade) return alert("학년을 선택해주세요.");
    if (!data.category) return alert("과목/단원을 선택해주세요.");
    if (!data.content.trim()) return alert("문제 내용을 입력해주세요.");

    if (data.type === '객관식') {
        const isOptionsFill = data.options.every(opt => opt.trim() !== '');
        if (!isOptionsFill) return alert("객관식 보기를 모두 입력해주세요.");
        if (!data.answer) return alert("정답 번호를 선택해주세요.");
    } else {
        if (!data.answer.trim()) return alert("정답을 입력해주세요.");
    }
    const formData = new FormData();

    formData.append(
      'problem',
      new Blob(
        [JSON.stringify({
          grade: data.grade,        // E1, M1, H2 ...
          category: data.category,
          content: data.content,
          type: data.type,
          difficulty: data.difficulty,
          options: data.options,
          answer: data.answer
        })],
        { type: 'application/json' }
      )
    );

    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await axios.post(`${BASE_URL}/api/problem`, formData, {
        withCredentials: true
      });
      
      if(response){
        navigate('/');
      }
    } catch (error) {
      console.error('문제 등록 실패', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto', fontFamily: 'sans-serif', color: '#333' }}>
      <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>수학 문제 출제</h2>

      {/* 학년 및 카테고리 선택 */}
      <section style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>학년 선택</label>
          <select style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} value={data.grade} onChange={e => setData({ ...data, grade: e.target.value })}>
            <option value="">학년 선택</option>
            {GRADES.map(g => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>과목/단원</label>
          <select style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }} value={data.category} onChange={e => setData({ ...data, category: e.target.value })}>
            <option value="">과목 선택</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </section>

      {/* 내용 입력 기호 버튼 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '10px' }}>
        {Object.keys(SYMBOL_GROUPS).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', background: activeTab === tab ? '#fff' : '#f0f0f0', borderBottom: activeTab === tab ? '2px solid #007bff' : 'none', fontWeight: activeTab === tab ? 'bold' : 'normal' }}>{tab}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px', background: '#fff', padding: '10px', border: '1px solid #eee' }}>
        {SYMBOL_GROUPS[activeTab].map(s => (
          <button 
            key={s.label} 
            onClick={() => addSymbol(s.value)} // 또는 addSymbolToAnswer(s.value)
            style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}
          >
            <InlineMath math={
              s.value === '^{}' ? 'x^{n}' : 
              s.value === '_{}' ? 'x_{n}' : 
              s.label === '분수' ? '\\frac{1}{1}' : 
              s.value
            } />
          </button>
        ))}
      </div>

      {/* 문제 입력 */}
      <textarea ref={textareaRef} style={{ width: '100%', minHeight: '120px', padding: '15px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', overflow: 'hidden', resize: 'none' }} value={data.content} onChange={e => setData({ ...data, content: e.target.value })} placeholder="문제를 입력하세요" />

      {/* 문제 미리보기 */}
      <div style={{ marginBottom: '10px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        {data.content ? renderContent(data.content) : <span style={{ color: '#888' }}>미리보기</span>}
      </div>

      {/* 이미지 첨부 */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '10px' }} />
      {imagePreview && <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}><img src={imagePreview} alt="preview" style={{ maxWidth: '100px', borderRadius: '4px', border: '1px solid #ddd' }} /><button onClick={removeImage} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>×</button></div>}

      {/* 유형/난이도 선택 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select style={{ flex: 1, padding: '10px' }} value={data.type} onChange={e => setData({ ...data, type: e.target.value as QuestionType, options: e.target.value === '객관식' ? ['', '', '', ''] : [''], answer: '' })}>
          <option value="객관식">객관식</option>
          <option value="주관식">주관식</option>
          <option value="빈칸채우기">빈칸 채우기</option>
        </select>
        <select style={{ flex: 1, padding: '10px' }} value={data.difficulty} onChange={e => setData({ ...data, difficulty: e.target.value as Difficulty })}>
          <option value="하">난이도: 하</option>
          <option value="중">난이도: 중</option>
          <option value="상">난이도: 상</option>
        </select>
      </div>

      {/* 보기 입력 */}
      <div style={{ marginBottom: '30px' }}>
        <h4>보기 사항 {data.type === '객관식' ? <span className="text-danger fs-5">(필수)</span> : <span className="text-primary fs-5">(선택)</span>}</h4>
        {data.options.map((opt, idx) => (
          <div key={idx} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span>{idx + 1}.</span>
              <input style={{ flex: 1, padding: '8px' }} value={opt} onChange={e => { const newOpts = [...data.options]; newOpts[idx] = e.target.value; setData({ ...data, options: newOpts }); }} />
            </div>
            {opt && <div style={{ marginLeft: '25px', marginTop: '5px' }}>{renderContent(opt)}</div>}
          </div>
        ))}
      </div>

      {/* 정답 입력 */}
      <div style={{ padding: '20px', background: '#f1f3f5', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '30px' }}>
        <strong style={{ display: 'block', marginBottom: '10px' }}>정답 설정</strong>

        {data.type === '객관식' ? (
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {data.options.map((_, i) => (
              <label key={i} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="radio" name="answer" value={String(i + 1)} checked={data.answer === String(i + 1)} onChange={e => setData({ ...data, answer: e.target.value })} /> {i + 1}번
              </label>
            ))}
          </div>
        ) : (
          <>
            {/* 정답 기호 버튼 */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '10px' }}>
              {Object.keys(SYMBOL_GROUPS).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} style={{ padding: '8px 16px', cursor: 'pointer', border: 'none', background: activeTab === tab ? '#fff' : '#f0f0f0', borderBottom: activeTab === tab ? '2px solid #007bff' : 'none', fontWeight: activeTab === tab ? 'bold' : 'normal' }}>{tab}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px', background: '#fff', padding: '10px', border: '1px solid #eee' }}>
              {SYMBOL_GROUPS[activeTab].map(s => (
                <button 
                  key={s.label} 
                  onClick={() => addSymbolToAnswer(s.value)}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}
                >
                  <InlineMath math={
                    s.value === '^{}' ? 'x^{n}' : 
                    s.value === '_{}' ? 'x_{n}' : 
                    s.label === '분수' ? '\\frac{1}{1}' : 
                    s.value
                  } />
                </button>
              ))}
            </div>

            {/* 정답 입력 */}
            <textarea
              ref={answerRef}
              style={{ width: '100%', minHeight: '50px', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px', overflow: 'hidden', resize: 'none' }}
              value={data.answer}
              onChange={e => setData({ ...data, answer: e.target.value })}
              placeholder="정답을 입력하세요"
            />

            {/* 정답 미리보기 */}
            <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
              {data.answer ? renderContent(data.answer) : <span style={{ color: '#888' }}>미리보기</span>}
            </div>
          </>
        )}
      </div>

      <button
        onClick={submitProblem}
        disabled={!data.grade || !data.category || !data.content.trim() || !data.answer}
        style={{
          width: '100%',
          padding: '15px',
          background: (!data.grade || !data.category || !data.content.trim() || !data.answer) ? '#ccc' : '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: (!data.grade || !data.category || !data.content.trim() || !data.answer) ? 'not-allowed' : 'pointer',
        }}
      >
        문제 등록하기
      </button>
    </div>
  );
};

export default ProblemPage;
