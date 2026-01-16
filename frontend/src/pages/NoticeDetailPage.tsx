import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

interface NoticeDetail {
    id: number;
    title: string;
    content: string;
    isImportant: boolean;
    files: { originalName: string; fileUrl: string }[];
}

const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("다운로드 중 오류 발생:", error);
        window.open(fileUrl, '_blank');
    }
};

function NoticeDetailPage() {
    const { id } = useParams(); // URL의 :id 값을 가져옴
    const navigate = useNavigate();
    const [notice, setNotice] = useState<NoticeDetail | null>(null);

    useEffect(() => {
        axios.get(`${BASE_URL}/api/notice/detail/${id}`)
            .then(res => {
                if (res.data.success) {
                    setNotice(res.data.data);
                }
            })
            .catch(err => {
                console.error("상세 조회 실패", err);
                alert("게시글을 불러올 수 없습니다.");
                navigate('/notice');
            });
    }, [id]);

    if (!notice) return <div className="text-center py-5">로딩 중...</div>;

    return (
        <div className="container py-5">
            <div className="card shadow-sm border-0 p-4">

                {/* 첨부파일 영역 */}
                {notice.files && notice.files.length > 0 && (
                    <div className="border-bottom pt-4 mb-5">
                        <h6 className="fw-bold mb-3 text-secondary" style={{ fontSize: '0.9rem' }}>
                            <i className="bi bi-paperclip me-2"></i>첨부파일 ({notice.files.length})
                        </h6>
                        
                        {/* 첨부파일 */}
                        <div className="d-flex flex-column gap-2"> 
                            {notice.files.map((file, index) => (
                                <a 
                                    key={index}
                                    onClick={() => handleDownload(file.fileUrl, file.originalName)}
                                    className="text-decoration-none w-100"
                                    style={{ cursor: 'pointer', minHeight: '50px' }}
                                >
                                    <div className="d-flex align-items-center px-3 py-2 border rounded bg-white shadow-sm-hover transition-all" 
                                        style={{ cursor: 'pointer', minHeight: '50px' }}>
                                        
                                        {/* 아이콘 섹션 */}
                                        <div className="me-3 text-primary">
                                            <i className="bi bi-file-earmark-arrow-down fs-5"></i>
                                        </div>

                                        {/* 파일명 섹션 */}
                                        <div className="flex-grow-1 overflow-hidden">
                                            <div className="text-dark fw-medium text-truncate" style={{ fontSize: '0.85rem' }}>
                                                {file.originalName}
                                            </div>
                                        </div>

                                        {/* 다운로드 안내 (우측) */}
                                        <div className="text-muted ms-3 d-none d-sm-block" style={{ fontSize: '0.75rem' }}>
                                            Download <i className="bi bi-download ms-1"></i>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <h2 className="fw-bold mb-3">{notice.title}</h2>
                <hr />
                {/* HTML 본문 렌더링 (에디터 사용 시 필수) */}
                <div 
                    className="notice-content mb-5" 
                    dangerouslySetInnerHTML={{ __html: notice.content }} 
                />
                
                <div className="text-end mt-4">
                    <button className="btn btn-secondary px-4" onClick={() => navigate('/notice')}>목록으로</button>
                </div>
            </div>
        </div>
    );
}

export default NoticeDetailPage;