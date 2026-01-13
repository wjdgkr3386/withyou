package com.withyou.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

// ================
// 토큰 발급 클래스
// ================
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.access-token-expire-time}")
    private long expireTime;

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(
                secretKey.getBytes(StandardCharsets.UTF_8)
        );
    }

    // 토큰 발급
    public String createToken(Long userId, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expireTime);

        return Jwts.builder()
                .setSubject(String.valueOf(userId)) // 사용자 식별자
                .claim("role", role)                 // 권한
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // 토큰 검증
    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 토큰 유효성 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            // 토큰이 만료되었거나, 변조되었거나, 형식이 잘못된 경우 false 반환
            System.out.println("토큰 검증 실패: " + e.getMessage());
            return false;
        }
    }
}