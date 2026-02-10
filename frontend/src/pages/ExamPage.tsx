import React, { useState, useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const BASE_URL = import.meta.env.VITE_API_URL;

function ExamPage(){

    const [examStatus, setExamStatus] = useState<string>("대기중");  // 대기중, 준비중, 시험중
    const [examReadyTime, setExamReadyTime] = useState<number>(0);  // 준비 남은 시간
    const [examTime, setExamTime] = useState<number>(0);            // 시험 남은 시간


    // 웹소켓 Stomp 설정
    const stompClient = useRef<Stomp.Client | null>(null);
    useEffect(() => {
        // 웹소켓 연결
        const socket = new SockJS(`${BASE_URL}/ws-stomp`);
        stompClient.current = Stomp.over(socket);

        stompClient.current.connect({}, (frame) => {
            console.log('연결됨: ' + frame);

            // 전체 메시지 구독
            stompClient.current?.subscribe('/topic/receive-msg', (response) => {
                console.log('전체 메시지:', response.body);
            });

            // 1:1 메시지 구독 (내 ID가 abc123인 경우)
            stompClient.current?.subscribe('/user/abc123/topic/private', (response) => {
                console.log("나에게만 온 메시지: ", response.body);
            });
        });

        return () => {
            if (stompClient.current) stompClient.current.disconnect(() => {});
        };
    }, []);

    // 메시지 보내기
    const sendData = () => {
        if (stompClient.current?.connected) {
            // 서버의 @MessageMapping 주소로 데이터 전송
            stompClient.current.send("/app/send-msg", {}, "안녕 서버!");
        }
    };

    return (
        <>
            { examStatus === "대기중" && (
                <div className='container border d-flex justify-content-center align-items-center vh-100 fs-1'>
                    대기중입니다.
                </div>
            )}

            { examStatus === "준비중" && (
                <div className='container border d-flex justify-content-center align-items-center vh-100 fs-1'>
                    준비중
                </div>
            )}
            
            { examStatus === "시험중" && (
                <div className='container border d-flex justify-content-center align-items-center vh-100 fs-1'>
                    시험중
                </div>
            )}
        </>
    );
}

export default ExamPage;