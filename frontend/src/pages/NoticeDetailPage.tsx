import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
    const { user } = useAuth();
    const { id } = useParams();
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

    const handleDelete = async () => {
        if (!notice) return;

        if (!window.confirm("정말 삭제하시겠습니까?")) return;

        try {
            const res = await axios.delete(`${BASE_URL}/api/notice/${notice.id}`);
            if (res.data.success) {
                alert("게시글이 삭제되었습니다.");
                navigate('/notice');
            } else {
                alert("삭제에 실패했습니다.");
                console.log(res.data.data.message);
            }
        } catch (err) {
            console.error("삭제 실패", err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    if (!notice) return <div className="text-center py-5">로딩 중...</div>;

    return (
        <div className="container py-5" style={{ maxWidth: '900px' }}>
            <style>{`
                .notice-content p:empty{ margin-bottom: 8px; height: 24px; }
            `}</style>

            <div className="card shadow-sm border-0 p-4" style={{ borderRadius: '15px' }}>

                <h2 className="fw-bold mb-4" style={{ paddingLeft: '5px' }}>{notice.title}</h2>
                <hr className="mb-4" />

                <div 
                    className="notice-content mb-5" 
                    style={{
                        minHeight: '500px',
                        padding: '20px',
                        outline: 'none',
                    }}
                    dangerouslySetInnerHTML={{ __html: notice.content }} 
                />

                {/* 첨부파일 영역 */}
                {notice.files && notice.files.length > 0 && (
                    <div className="border-top pt-4 mt-5 mb-4">
                        <h6 className="fw-bold mb-3 text-secondary" style={{ fontSize: '0.9rem', paddingLeft: '5px' }}>
                            <i className="bi bi-paperclip me-2"></i>첨부파일 ({notice.files.length})
                        </h6>
                        
                        <div className="d-flex flex-column gap-2"> 
                            {notice.files.map((file, index) => (
                                <a 
                                    key={index}
                                    onClick={() => handleDownload(file.fileUrl, file.originalName)}
                                    className="text-decoration-none w-100"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center px-3 py-2 border rounded bg-light shadow-sm-hover transition-all" 
                                        style={{ minHeight: '50px' }}>
                                        
                                        <div className="me-3 text-primary">
                                            <i className="bi bi-file-earmark-arrow-down fs-5"></i>
                                        </div>

                                        <div className="flex-grow-1 overflow-hidden">
                                            <div className="text-dark fw-medium text-truncate" style={{ fontSize: '0.85rem' }}>
                                                {file.originalName}
                                            </div>
                                        </div>

                                        <div className="text-muted ms-3 d-none d-sm-block" style={{ fontSize: '0.75rem' }}>
                                            Download <i className="bi bi-download ms-1"></i>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="text-end mt-2">
                    {user && user.role === 'ADMIN' && (
                        <>
                            <button className="btn btn-warning px-4 py-2 me-2" onClick={() => navigate(`/notice/edit/${notice.id}`)} >
                                수정
                            </button>

                            <button className="btn btn-danger px-4 py-2 me-2" onClick={handleDelete}>
                                삭제
                            </button>
                        </>
                    )}



                    <button
                        className="btn btn-secondary px-4 py-2"
                        onClick={() => navigate('/notice')}
                    >
                        목록으로
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NoticeDetailPage;