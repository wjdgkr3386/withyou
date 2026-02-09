package com.withyou.backend.common.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class StompController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 모든 사용자에게 메시지 전송
    @MessageMapping("/send-all")
    public void sendToAll(String message) {
        messagingTemplate.convertAndSend("/topic/receive-msg", message);
    }

    // 특정 사용자에게만 메시지 전송
    @MessageMapping("/send-private")
    public void sendToUser(Map<String, String> data) {
        String targetId = data.get("targetId"); //받는 사람 ID
        String message = data.get("message");

        // /user/{targetId}/topic/private 경로로 메시지를 보냄
        messagingTemplate.convertAndSendToUser(targetId, "/topic/private", message);
    }

    // 클라이언트에서 /app/send-msg로 보내면 여기로 옴
    @MessageMapping("/send-msg")
    // 처리가 끝나면 /topic/receive-msg를 구독 중인 사람들에게 전송
    @SendTo("/topic/receive-msg")
    public String handleStomp(String message) {
        System.out.println("받은 메시지: " + message);
        return "서버가 보낸 응답: " + message;
    }
}