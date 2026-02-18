package com.withyou.backend.common.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Controller
public class StompController {

    private final SimpMessagingTemplate messagingTemplate;
    // 접속 중인 사용자 목록
    private static final List<String> connectedUsers = new CopyOnWriteArrayList<>();

    public StompController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/send-msg")
    @SendTo("/topic/receive-msg")
    public String receiveMsg(String message) {
        System.out.println("수신된 메시지: " + message);
        return message;
    }

    @MessageMapping("/enter")
    public void enterUser(Map<String, String> payload, SimpMessageHeaderAccessor headerAccessor) {
        String name = payload.get("name");
        if (name != null) {
            if (!connectedUsers.contains(name)) {
                connectedUsers.add(name);
            }
            // 세션 속성에 이름 저장 (나중에 Disconnect 이벤트에서 사용)
            if (headerAccessor.getSessionAttributes() != null) {
                headerAccessor.getSessionAttributes().put("name", name);
            }
        }
        // 전체 사용자에게 현재 접속자 목록 브로드캐스팅
        messagingTemplate.convertAndSend("/topic/users", connectedUsers);
    }

    // 시험 시작 신호 전송
    @MessageMapping("/exam/start")
    public void startExam(Map<String, Object> payload) {
        // 모든 클라이언트에게 시험 시작 알림 (5초 카운트다운 시작 신호)
        messagingTemplate.convertAndSend("/topic/exam/status", (Object) payload);
    }

    // 다음 문제 신호 전송 (카운트다운 포함)
    @MessageMapping("/exam/next")
    public void nextProblem(Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/exam/status", (Object) payload);
    }

    // 접속 해제 처리는 WebSocketEventListener에서 수행 가능 (필요 시 세션 기반으로 고도화)
    public static void removeUser(String name) {
        connectedUsers.remove(name);
    }
    
    public static List<String> getConnectedUsers() {
        return connectedUsers;
    }
}
