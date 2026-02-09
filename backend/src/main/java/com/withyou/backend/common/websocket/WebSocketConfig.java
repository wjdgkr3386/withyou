package com.withyou.backend.common.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 접속 경로: /ws-stomp (SockJS 사용)
        registry.addEndpoint("/ws-stomp").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 메시지 받을 때(구독): /topic으로 시작하는 주소
        registry.enableSimpleBroker("/topic");
        // 메시지 보낼 때: /app으로 시작하는 주소
        registry.setApplicationDestinationPrefixes("/app");
        // /user 접두사로 들어오는 메시지를 사용자별로 구분해서 전달
        registry.setUserDestinationPrefix("/user");
    }
}