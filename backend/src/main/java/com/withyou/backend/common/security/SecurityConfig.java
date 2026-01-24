package com.withyou.backend.common.security;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          CustomUserDetailsService customUserDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customUserDetailsService = customUserDetailsService;
    }

    // PasswordEncoder 빈 등록
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 브라우저가 보안상의 이유로 차단하는 '교차 출처 요청'을 허용하기 위한 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 허용할 도메인(Origin) 설정
        config.setAllowedOrigins(List.of("http://localhost:5173"));

        // 데이터 조회(GET), 등록(POST), 수정(PUT), 삭제(DELETE) 및
        // 사전 검사 요청(OPTIONS)을 모두 허용
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 클라이언트가 보낼 수 있는 모든 HTTP 헤더(Authorization, Content-Type 등)를 허용
        config.setAllowedHeaders(List.of("*"));

        // 쿠키나 인증 헤더(JWT 등)를 포함한 요청을 브라우저가 주고받을 수 있도록 허용
        config.setAllowCredentials(true);

        // 경로별 설정 적용
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                // CORS 설정을 기본값으로 적용
                // 외부 도메인의 브라우저 접근 허용
                .cors(Customizer.withDefaults())

                // CSRF 보호 기능 비활성화
                // JWT 토큰 방식일 때 사용
                .csrf(csrf -> csrf.disable())

                // 세션 관리 정책을 STATELESS(무상태)로 설정
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // HTTP 요청에 대한 접근 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // 비로그인 허용
                        .requestMatchers(
                                "/api/sms/**",
                                "/api/signup",
                                "/api/login",
                                "/api/find/username",
                                "/api/find/password",
                                "/api/send-verification",
                                "/api/notice/list",
                                "/api/notice/detail/**"
                        ).permitAll()

                        // 로그인 사용자 전용
                        .requestMatchers(
                                "/api/users/me",
                                "/api/mypage/profile"
                        ).authenticated()

                        // 관리자 전용
                        .requestMatchers(
                                "/api/notice/write"
                        ).hasRole("ADMIN")

                        // 그 외
                        .anyRequest().authenticated()
                )
                .userDetailsService(customUserDetailsService)
                // JWT 토큰으로 사용자 인증
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )
                // Spring Security 기본 로그인 기능 비활성화
                .formLogin(form -> form.disable())
                // HTTP Basic 인증 방식 비활성화
                .httpBasic(basic -> basic.disable());

        /*
        // 요청 경로 확인 ( 개발 전용 )
        http.addFilterBefore((request, response, chain) -> {
            HttpServletRequest req = (HttpServletRequest) request; // 캐스팅
            System.out.println("요청 : " + req.getRequestURI());
            chain.doFilter(request, response);
        }, org.springframework.security.web.authentication.AnonymousAuthenticationFilter.class);
        */

        return http.build();
    }

}
