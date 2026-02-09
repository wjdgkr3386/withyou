package com.withyou.backend.common.websocket;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Component
public class WebSocketEventListener {

    // 웹소켓 연결 시 실행
    @EventListener
    public void handleConnectListener(SessionConnectEvent event) {
        // 이벤트 메시지에서 STOMP 헤더 정보를 읽기 쉽게 변환
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        // 현재 연결된 클라이언트의 고유 세션 ID
        String sessionId = headerAccessor.getSessionId();

        System.out.println("=========================================");
        System.out.println("STOMP 연결 성공! 세션 ID: " + sessionId);
        System.out.println("=========================================");
    }

    // 웹소켓 연결 종료 시 실행
    @EventListener
    public void handleDisconnectListener(SessionDisconnectEvent event) {
        // 이벤트 메시지에서 STOMP 헤더 정보를 읽기 쉽게 변환
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        // 현재 연결된 클라이언트의 고유 세션 ID
        String sessionId = headerAccessor.getSessionId();

        System.out.println("=========================================");
        System.out.println("STOMP 연결 종료.. 세션 ID: " + sessionId);
        System.out.println("=========================================");
    }

    // 클라이언트가 어떠한 특정 주소를 구독할 때마다 실행
    @EventListener
    public void handleSubscribeListener(SessionSubscribeEvent event) {
        // 이벤트 메시지에서 STOMP 헤더 정보를 읽기 쉽게 변환
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        // 클라이언트가 구독하려고 시도한 주소 (예: /user/abc/topic/private)
        String destination = headerAccessor.getDestination();

        // 현재 연결된 클라이언트의 고유 세션 ID
        String sessionId = headerAccessor.getSessionId();

        // 서버 콘솔에 구독 정보를 출력하여 어떤 사용자가 어디로 입장했는지 확인
        System.out.println("=========================================");
        System.out.println("사용자가 채널을 구독함!");
        System.out.println("세션 ID: " + sessionId);
        System.out.println("구독 주소: " + destination);
        System.out.println("=========================================");
    }
}