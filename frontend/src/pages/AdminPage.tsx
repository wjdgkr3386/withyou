import { useState } from 'react';

interface SubjectData {
    [key: string]: string[];
}

function Admin() {
    const [active, setActive] = useState<string>('교과목 관리');
    const [selectedGrade, setSelectedGrade] = useState<string>('중2');
    const [selectedTerm, setSelectedTerm] = useState<string>('1학기');
    const [inputValue, setInputValue] = useState<string>('');
    
    // 수정 관련 상태
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const [data, setData] = useState<SubjectData>({
        '중2-1학기': ['1. 유리수와 순환소수', '2. 식의 계산']
    });

    const menus = ['대시보드', '학생 관리', '문제은행', '시험 관리', '성적 관리', '교과목 관리'];
    const grades = ['초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];

    const currentKey = `${selectedGrade}-${selectedTerm}`;
    const currentContents = data[currentKey] || [];

    const handleAdd = () => {
        const trimmed = inputValue.trim(); // 공백 제거
        if (!trimmed) return; // 빈 값 방지
        
        const newContent = `${currentContents.length + 1}. ${trimmed}`;
        setData({
            ...data,
            [currentKey]: [...currentContents, newContent]
        });
        setInputValue('');
    };

    const handleDelete = (index: number) => {
        const filtered = currentContents.filter((_, i) => i !== index);
        // 번호 재정렬
        const updated = filtered.map((content, i) => `${i + 1}. ${content.split('. ')[1] || content}`);
        setData({ ...data, [currentKey]: updated });
    };

    // 수정 시작
    const startEdit = (index: number, content: string) => {
        setEditingIndex(index);
        // "1. 가나다"에서 "가나다"만 추출
        setEditValue(content.split('. ')[1] || content);
    };

    // 수정 저장
    const handleUpdate = () => {
        const trimmed = editValue.trim(); // 공백 제거
        if (editingIndex === null || !trimmed) return; 
        
        const updatedContents = [...currentContents];
        // 번호 형식을 유지하며 내용만 수정
        updatedContents[editingIndex] = `${editingIndex + 1}. ${trimmed}`;
        
        setData({ ...data, [currentKey]: updatedContents });
        setEditingIndex(null);
        setEditValue('');
    };

    return (
        <div className="container-fluid d-flex vh-100 p-0">
            {/* 사이드바 (생략) */}
            <div className="bg-dark h-100" style={{ width: '20%', minWidth: '230px' }}>
                <div className="text-info fs-3 ms-3 mt-3">위드유 수학학원</div>
                <div className="fs-6 ms-3 mb-4" style={{ color: '#5F9EA0' }}>관리자 시스템</div>
                {menus.map((menu) => (
                    <div key={menu} onClick={() => setActive(menu)} className={`text-white rounded p-3 mx-3 mb-1 ${active === menu ? 'bg-primary' : ''}`} style={{ cursor: 'pointer' }}>{menu}</div>
                ))}
            </div>

            <div className="flex-grow-1 p-4 bg-light">
                <h1 className='fw-bold mb-4'>{active}</h1>

                {active === '교과목 관리' && (
                    <div className="row">
                        <h5 className="fw-bold mb-3">학년 선택</h5>
                        <div className="col-md-3">
                            <div className="list-group shadow-sm">
                                {grades.map(grade => (
                                    <div key={grade} className="border-bottom">
                                        <button className={`list-group-item list-group-item-action border-0 py-3 fw-bold ${selectedGrade === grade ? 'bg-primary text-white' : ''}`} onClick={() => { setSelectedGrade(grade); setSelectedTerm('1학기'); }}>{grade}</button>
                                        {selectedGrade === grade && (
                                            <div className="bg-light">
                                                {['1학기', '2학기'].map((term) => (
                                                    <div key={term} onClick={() => setSelectedTerm(term)} className={`p-3 ps-5 border-bottom ${selectedTerm === term ? 'text-primary fw-bold' : 'bg-white text-secondary'}`} style={{ cursor: 'pointer' }}>{term}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-md-9">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white fw-bold">{selectedGrade} {selectedTerm} 수학 내용</div>
                                <div className="card-body">
                                    <div className="input-group mb-4">
                                        <input type="text" className="form-control" placeholder="새로운 학습 내용 입력" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                                        <button className="btn btn-primary px-4" onClick={handleAdd}>+ 추가</button>
                                    </div>

                                    <ul className="list-group">
                                        {currentContents.map((content, idx) => (
                                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center py-3">
                                                {editingIndex === idx ? (
                                                    <div className="input-group">
                                                        <input type="text" className="form-control form-control-sm" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                                                        <button className="btn btn-sm btn-success" onClick={handleUpdate}>저장</button>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => setEditingIndex(null)}>취소</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span>{content}</span>
                                                        <div>
                                                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => startEdit(idx, content)}>✎</button>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(idx)}>🗑</button>
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Admin;