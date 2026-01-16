package com.keydrop.server.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // 1. 웹소켓 기능 활성화
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 2. 연결 문(Door) 열기
        // 클라이언트(React)가 처음 접속할 주소입니다. (예: ws://localhost:8080/ws)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // 모든 출처 허용 (CORS 문제 방지)
                .withSockJS(); // 브라우저가 웹소켓을 지원 안 하면 대체 기술 사용
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 3. 메시지 라우팅 설정
        // 클라이언트가 듣는 곳 (구독, Subscribe) -> "/topic/게임방이름"
        registry.enableSimpleBroker("/topic");
        
        // 클라이언트가 말하는 곳 (발행, Publish) -> "/app/메시지"
        registry.setApplicationDestinationPrefixes("/app");
    }
}