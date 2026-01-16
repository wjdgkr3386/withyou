import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily } from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import axios, { AxiosError } from 'axios';

// 이미지 에셋 임포트
import CancleLine from '../assets/images/editor/cancleLine.png';
import UnderLine from '../assets/images/editor/underLine.png';
import BackgoundColor from '../assets/images/editor/backgoundColor.png';
import TextColor from '../assets/images/editor/textColor.png';

function NoticeWritePage() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [files, setFiles] = useState<File[]>([]); 
    const BASE_URL = import.meta.env.VITE_API_URL;
    const MAX_FILE_COUNT = 10; // 최대 파일 개수 설정

    const FontSize = Extension.create({
        name: 'fontSize',
        addOptions() { return { types: ['textStyle'] }; },
        addGlobalAttributes() {
            return [{
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize,
                        renderHTML: attributes => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            }];
        },
        addCommands() {
            return {
                setFontSize: (fontSize: string) => ({ chain }) => {
                    return chain().setMark('textStyle', { fontSize }).run();
                },
                unsetFontSize: () => ({ chain }) => {
                    return chain().setMark('textStyle', { fontSize: null }).run();
                },
            };
        },
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            FontSize,
            Color,
            FontFamily,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
            Image.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        textAlign: {
                            default: 'left',
                            parseHTML: element => element.style.textAlign || 'left',
                            renderHTML: attributes => {
                                if (attributes.textAlign === 'center') return { style: 'margin-left: auto; margin-right: auto; display: block; text-align: center;' };
                                if (attributes.textAlign === 'right') return { style: 'margin-left: auto; margin-right: 0; display: block; text-align: right;' };
                                return { style: 'margin-left: 0; margin-right: auto; display: block; text-align: left;' };
                            },
                        },
                    };
                },
            }).configure({
                allowBase64: true,
                HTMLAttributes: { class: 'img-fluid rounded shadow-sm' },
            }),
            Link.configure({ openOnClick: false }),
        ],
        content: '',
        editorProps: { attributes: { class: 'write-editor-content' } },
    });

    const addImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement; 
            if (!target || !target.files?.[0] || !editor) return;
            const file = target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result === 'string') {
                    editor.chain().focus().setImage({ src: result }).createParagraphNear().insertContent('<p></p>').run();
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    // 파일 핸들러 (최대 10개 제한 로직 추가)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            
            if (files.length + selectedFiles.length > MAX_FILE_COUNT) {
                alert(`파일은 최대 ${MAX_FILE_COUNT}개까지만 첨부할 수 있습니다.`);
                e.target.value = ''; // input 초기화
                return;
            }
            
            setFiles((prev) => [...prev, ...selectedFiles]);
            e.target.value = ''; // 동일 파일 재선택 가능하도록 초기화
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editor) return;

        const content = editor.getHTML();
        const plainText = editor.getText().replace(/\u00A0/g, " ").trim();
        const hasImage = content.includes('<img');

        if (!plainText && !hasImage) {
            alert("내용을 입력해주세요.");
            editor.commands.focus();
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('isImportant', String(isImportant));
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const response = await axios.post(
                `${BASE_URL}/api/notice/write`,
                formData,
                { 
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            if (response.data.success) {
                alert(response.data.message);
                navigate('/notice');
            }
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert(err.response?.data?.message || "공지 등록 중 오류 발생");
        }
    };

    const setFontSize = (size: string) => {
        if (!editor) return;
        if (size === "") {
            // @ts-ignore
            editor.chain().focus().unsetFontSize().run();
        } else {
            // @ts-ignore
            editor.chain().focus().setFontSize(size).run();
        }
    };

    const MenuBar = () => {
        if (!editor) return null;
        return (
            <div className="border-bottom p-2 d-flex flex-wrap gap-2 bg-light rounded-top align-items-center">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`btn btn-sm ${editor.isActive('bold') ? 'btn-secondary' : 'btn-outline-secondary'}`}><i className="bi bi-type-bold"></i></button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`btn btn-sm ${editor.isActive('italic') ? 'btn-secondary' : 'btn-outline-secondary'}`}><i className="bi bi-type-italic"></i></button>
                <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`btn btn-sm ${editor.isActive('underline') ? 'btn-secondary' : 'btn-outline-secondary'}`}><img src={UnderLine} alt="밑줄" style={{ width: '1.2rem', height: '1.2rem' }} /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`btn btn-sm ${editor.isActive('strike') ? 'btn-secondary' : 'btn-outline-secondary'}`}><img src={CancleLine} alt="취소선" style={{ width: '1.2rem', height: '1.2rem' }} /></button>
                <div className="vr mx-1"></div>
                <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="btn btn-sm btn-outline-secondary"><i className="bi bi-hr"></i></button>
                <div className="vr mx-1"></div>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`btn btn-sm ${editor.isActive({ textAlign: 'left' }) ? 'btn-secondary' : 'btn-outline-secondary'}`}><i className="bi bi-text-left"></i></button>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`btn btn-sm ${editor.isActive({ textAlign: 'center' }) ? 'btn-secondary' : 'btn-outline-secondary'}`}><i className="bi bi-text-center"></i></button>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`btn btn-sm ${editor.isActive({ textAlign: 'right' }) ? 'btn-secondary' : 'btn-outline-secondary'}`}><i className="bi bi-text-right"></i></button>
                <div className="vr mx-1"></div>
                <select className="form-select form-select-sm w-auto" onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}>
                    <option value="">기본 폰트</option>
                    <option value="NanumGothic">나눔고딕</option>
                    <option value="Apple SD Gothic Neo">Apple 고딕</option>
                    <option value="Nanum Myeongjo, serif">나눔명조</option>
                    <option value="Gungsuh, 궁서">궁서체</option>
                    <option value="Gmarket Sans, sans-serif">Gmarket Sans</option>
                </select>
                <select className="form-select form-select-sm w-auto" onChange={(e) => setFontSize(e.target.value)} defaultValue="16px">
                    <option value="12px">12</option>
                    <option value="14px">14</option>
                    <option value="16px">16</option>
                    <option value="20px">20</option>
                    <option value="24px">24</option>
                    <option value="32px">32</option>
                </select>
                <div className="d-flex align-items-center ms-1">
                    <label htmlFor="textColor" className="d-flex align-items-center justify-content-center" style={{ cursor: 'pointer', border: '1px solid #dee2e6', padding: '2px 6px', borderRadius: '4px', height: '31px', backgroundColor: '#fff' }}>
                        <img src={TextColor} alt="글자색" style={{ width: '1.4rem', height: '1.4rem' }} />
                    </label>
                    <input id="textColor" type="color" className="visually-hidden" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
                </div>
                <div className="d-flex align-items-center ms-1">
                    <label htmlFor="bgColor" className="d-flex align-items-center justify-content-center" style={{ cursor: 'pointer', border: '1px solid #dee2e6', padding: '2px 6px', borderRadius: '4px', height: '31px', backgroundColor: '#fff' }}>
                        <img src={BackgoundColor} alt="배경색" style={{ width: '1.4rem', height: '1.4rem' }} />
                    </label>
                    <input id="bgColor" type="color" className="visually-hidden" onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()} />
                </div>
                <button type="button" onClick={addImage} className="btn btn-sm btn-outline-secondary ms-1"><i className="bi bi-image"></i> 이미지</button>
            </div>
        );
    };

    return (
        <div className="bg-light min-vh-100 py-5">
            <style>{`
                .editor-frame { border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; background: #fff; }
                .write-editor-content { min-height: 500px; padding: 20px; outline: none; }
                .write-editor-content img { display: block; max-width: 100%; height: auto; }
                .write-editor-content img[style*="margin-left: auto"][style*="margin-right: auto"] { margin-left: auto !important; margin-right: auto !important; }
                .write-editor-content img[style*="text-align: right"] { margin-left: auto !important; margin-right: 0 !important; }
                .write-editor-content img[style*="text-align: left"] { margin-left: 0 !important; margin-right: auto !important; }
                .write-editor-content hr { border: none; border-top: 2px solid #dee2e6; margin: 1.5rem 0; }
                .write-editor-content img.ProseMirror-selectednode { outline: 3px solid #0d6efd; box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25); border-radius: 0.375rem; }
            `}</style>

            <div className="container" style={{ maxWidth: '900px' }}>
                <h2 className="fw-bold text-primary mb-4">공지사항 작성</h2>
                <form onSubmit={handleSubmit}>
                    <div className="card p-4 shadow-sm border-0">
                        <div className="mb-3">
                            <label className="form-label fw-bold d-block">중요도</label>
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" type="radio" name="importance" id="normal" checked={!isImportant} onChange={() => setIsImportant(false)} />
                                <label className="form-check-label" htmlFor="normal">일반</label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" type="radio" name="importance" id="important" checked={isImportant} onChange={() => setIsImportant(true)} />
                                <label className="form-check-label fw-bold text-danger" htmlFor="important">필수</label>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold">제목</label>
                            <input type="text" className="form-control form-control-lg" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">내용</label>
                            <div className="editor-frame">
                                <MenuBar />
                                <EditorContent editor={editor} />
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label fw-bold mb-0">첨부파일 ({files.length}/{MAX_FILE_COUNT})</label>
                                {files.length >= MAX_FILE_COUNT && <span className="text-danger small">최대 개수 도달</span>}
                            </div>
                            <input type="file" className="form-control" multiple onChange={handleFileChange} disabled={files.length >= MAX_FILE_COUNT} />
                            <div className="mt-2">
                                {files.map((file, index) => (
                                    <div key={index} className="d-flex align-items-center justify-content-between bg-light border rounded p-2 mb-1">
                                        <span className="small text-truncate" style={{ maxWidth: '80%' }}>{file.name}</span>
                                        <button type="button" className="btn-close" style={{ fontSize: '0.6rem' }} onClick={() => removeFile(index)}></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-center">
                            <button type="submit" className="btn btn-primary btn-lg px-5">작성 완료</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NoticeWritePage;