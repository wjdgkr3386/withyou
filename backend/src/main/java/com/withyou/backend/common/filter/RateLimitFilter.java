package com.withyou.backend.common.filter;

import org.springframework.stereotype.Component;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

//====================================
// API 여러번 호출하는 IP를 제한하는 클래스
//====================================
@Component
public class RateLimitFilter implements Filter {

    // IP별 API 호출 횟수 및 시간을 저장하는 저장소
    private final Map<String, UserRequestInfo> requestCounts = new ConcurrentHashMap<>();

    // API별 개별 제한 설정 (경로 -> {제한시간, 최대횟수})
    private static final Map<String, RateLimitConfig> API_CONFIGS = Map.of(
            "/api/send-verification", new RateLimitConfig(600, 2),
            "/api/find/password", new RateLimitConfig(600, 2),
            "/api/sms/verify", new RateLimitConfig(600, 2)
    );

    // 필터의 핵심 로직: 요청을 가로채서 제한 여부 확인
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String path = httpRequest.getRequestURI();

        // 요청 경로가 제한 대상인지 확인 및 설정값 호출
        RateLimitConfig config = findConfig(path);

        if (config != null) {
            String clientIP = getClientIp(httpRequest);
            String cacheKey = clientIP + ":" + path; // IP와 경로를 조합해 키 생성
            long currentTime = Instant.now().getEpochSecond();

            // 해당 키에 대한 기존 기록이 없으면 새로 생성
            UserRequestInfo userInfo = requestCounts.computeIfAbsent(
                    cacheKey,
                    k -> new UserRequestInfo(0, currentTime)
            );

            synchronized (userInfo) {
                // 제한 시간이 지났으면 카운트 초기화, 아니면 카운트 증가
                if (currentTime - userInfo.timestamp > config.windowSize) {
                    userInfo.count = 1;
                    userInfo.timestamp = currentTime;
                } else {
                    userInfo.count++;
                }

                // 허용 횟수 초과 시 429 에러 반환 및 중단
                if (userInfo.count > config.maxRequests) {
                    sendLimitExceededResponse(httpResponse, userInfo, config, currentTime);
                    return;
                }

                // 통과 시 남은 횟수 등을 헤더에 기록
                setRateLimitHeaders(httpResponse, userInfo, config);
            }
        }

        chain.doFilter(request, response);
    }

    // 요청된 경로가 API_CONFIGS에 정의된 경로로 시작하는지 찾아 설정 반환
    private RateLimitConfig findConfig(String path) {
        return API_CONFIGS.entrySet().stream()
                .filter(entry -> path.startsWith(entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
    }

    // 프록시 서버를 고려하여 사용자의 실제 IP 주소를 추출
    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        return (xf != null && !xf.isEmpty()) ? xf.split(",")[0].trim() : request.getRemoteAddr();
    }

    // 제한 초과 시 사용자에게 429 상태 코드와 JSON 에러 메시지 전송
    private void sendLimitExceededResponse(HttpServletResponse response, UserRequestInfo userInfo, RateLimitConfig config, long currentTime) throws IOException {
        long remainingTime = config.windowSize - (currentTime - userInfo.timestamp);
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");

        setRateLimitHeaders(response, userInfo, config);
        response.setHeader("Retry-After", String.valueOf(remainingTime));

        String errorMessage = String.format(
                "Too Many Requests: 너무 많이 요청되었습니다. 잠시 후 다시 시도해주세요.",
                config.windowSize, config.maxRequests, remainingTime
        );
        response.getWriter().write(errorMessage);
    }

    // 응답 헤더에 제한 정보(전체 횟수, 남은 횟수, 초기화 시간)를 설정
    private void setRateLimitHeaders(HttpServletResponse response, UserRequestInfo userInfo, RateLimitConfig config) {
        response.setHeader("X-RateLimit-Limit", String.valueOf(config.maxRequests));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, config.maxRequests - userInfo.count)));
        response.setHeader("X-RateLimit-Reset", String.valueOf(userInfo.timestamp + config.windowSize));
    }

    // API별 제한 설정(시간, 횟수)을 담는 내부 클래스
    private static class RateLimitConfig {
        final long windowSize;
        final int maxRequests;

        RateLimitConfig(long windowSize, int maxRequests) {
            this.windowSize = windowSize;
            this.maxRequests = maxRequests;
        }
    }

    // 사용자별 호출 기록(횟수, 첫 호출 시간)을 담는 내부 클래스
    private static class UserRequestInfo {
        int count;
        long timestamp;
        UserRequestInfo(int count, long timestamp) { this.count = count; this.timestamp = timestamp; }
    }

    // 서블릿 컨테이너가 필터를 생성할 때 호출되는 초기화 메서드
    @Override public void init(FilterConfig filterConfig) {}

    // 서버 종료 시 메모리에 저장된 카운트 정보 삭제
    @Override public void destroy() { requestCounts.clear(); }
}