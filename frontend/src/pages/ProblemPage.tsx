import React, { useState } from 'react';

type QuestionType = '객관식' | '주관식' | '빈칸 채우기';
type Difficulty = '하' | '중' | '상';

interface QuestionData {
  category: string;
  content: string;
  type: QuestionType;
  difficulty: Difficulty;
  options: string[];
  answer: string | number;
}

const ProblemPage: React.FC = () => {
  const [data, setData] = useState<QuestionData>({
    category: '',
    content: '',
    type: '객관식',
    difficulty: '중',
    options: ['', '', '', ''], // 객관식 기본 4개
    answer: '',
  });

  const mathSymbols = ['√', 'π', '²', '±', '÷', '×', 'θ', 'Σ'];

  // 문제 내용에 기호 추가
  const addSymbol = (symbol: string) => {
    setData({ ...data, content: data.content + symbol });
  };

  // 문제 유형 변경 핸들러
  const handleTypeChange = (type: QuestionType) => {
    let newOptions = [''];
    if (type === '객관식') newOptions = ['', '', '', ''];
    setData({ ...data, type, options: newOptions, answer: '' });
  };

  // 보기 추가/삭제
  const addOption = () => setData({ ...data, options: [...data.options, ''] });
  const removeOption = (index: number) => {
    if (data.options.length <= 4 && data.type === '객관식') return;
    const newOptions = data.options.filter((_, i) => i !== index);
    setData({ ...data, options: newOptions });
  };

  const handleSubmit = () => {
    console.log('저장된 데이터:', data);
    alert('문제가 저장되었습니다.');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h2>수학 문제 등록</h2>

      {/* 1. 카테고리 */}
      <section>
        <label>카테고리: </label>
        <input 
          value={data.category} 
          onChange={(e) => setData({ ...data, category: e.target.value })} 
          placeholder="예: 미적분, 확률"
        />
      </section>

      {/* 2. 문제 입력 & 기호 메뉴바 */}
      <section style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          {mathSymbols.map(s => (
            <button key={s} onClick={() => addSymbol(s)} style={{ marginRight: '5px' }}>{s}</button>
          ))}
        </div>
        <textarea
          style={{ width: '100%', height: '100px' }}
          value={data.content}
          onChange={(e) => setData({ ...data, content: e.target.value })}
          placeholder="문제를 입력하세요."
        />
      </section>

      {/* 3 & 4. 유형 및 난이도 */}
      <section style={{ marginTop: '20px' }}>
        <select value={data.type} onChange={(e) => handleTypeChange(e.target.value as QuestionType)}>
          <option value="객관식">객관식</option>
          <option value="주관식">주관식</option>
          <option value="빈칸 채우기">빈칸 채우기</option>
        </select>

        <select value={data.difficulty} onChange={(e) => setData({ ...data, difficulty: e.target.value as Difficulty })}>
          <option value="하">하</option>
          <option value="중">중</option>
          <option value="상">상</option>
        </select>
      </section>

      {/* 5, 6, 7. 보기 입력 영역 */}
      <section style={{ marginTop: '20px' }}>
        <h4>보기 입력</h4>
        {data.options.map((opt, idx) => (
          <div key={idx} style={{ marginBottom: '5px' }}>
            <span>{idx + 1}. </span>
            <input
              value={opt}
              onChange={(e) => {
                const newOpts = [...data.options];
                newOpts[idx] = e.target.value;
                setData({ ...data, options: newOpts });
              }}
            />
            {data.type === '객관식' && (
              <button onClick={() => removeOption(idx)} style={{ marginLeft: '5px' }}>삭제</button>
            )}
          </div>
        ))}
        {data.type === '객관식' && <button onClick={addOption}>보기 추가</button>}
      </section>

      {/* 8. 정답 입력 */}
      <section style={{ marginTop: '20px' }}>
        <label>정답: </label>
        {data.type === '객관식' ? (
          <select value={data.answer} onChange={(e) => setData({ ...data, answer: Number(e.target.value) })}>
            <option value="">선택</option>
            {data.options.map((_, idx) => (
              <option key={idx} value={idx + 1}>{idx + 1}번</option>
            ))}
          </select>
        ) : (
          <input 
            value={data.answer} 
            onChange={(e) => setData({ ...data, answer: e.target.value })} 
            placeholder="정답 입력"
          />
        )}
      </section>

      <hr />
      <button onClick={handleSubmit} style={{ width: '100%', padding: '10px' }}>확인</button>
    </div>
  );
};

export default ProblemPage;