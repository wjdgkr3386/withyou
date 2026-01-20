package com.withyou.backend.account.service;

import com.withyou.backend.account.dto.FindDTO;
import com.withyou.backend.account.entity.Role;
import com.withyou.backend.account.entity.User;
import com.withyou.backend.account.dto.LoginDTO;
import com.withyou.backend.account.dto.SignupDTO;
import com.withyou.backend.account.repository.UserRepository;
import com.withyou.backend.common.Util;
import com.withyou.backend.common.security.JwtTokenProvider;

import com.withyou.backend.common.solapi.SolapiService;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

@Service
@Transactional
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final SolapiService solapiService;
    private final RedisTemplate<String, String> redisTemplate;
    private final Util util;

    public AccountService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider jwtTokenProvider,
                          SolapiService solapiService,
                          RedisTemplate<String, String> redisTemplate,
                          Util util) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.solapiService = solapiService;
        this.redisTemplate = redisTemplate;
        this.util = util;
    }

    // ===================
    // 로그인 로직
    // ===================
    public String login(LoginDTO loginDTO) {

        User user = userRepository.findByUsername(loginDTO.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            throw new RuntimeException("비밀번호 불일치");
        }

        // 로그인 성공시 JWT 발급
        return jwtTokenProvider.createToken(
                user.getUsername(),
                user.getRole().name()
        );
    }

    // ===================
    // 회원가입 로직
    // ===================
    public void signup(SignupDTO signupDTO) {

        // 중복 체크
        if (userRepository.existsByUsername(signupDTO.getUsername())) {
            throw new RuntimeException("이미 사용 중인 아이디입니다.");
        }

        if (userRepository.existsByPhone(signupDTO.getPhone())) {
            throw new RuntimeException("이미 등록된 전화번호입니다.");
        }

        if (signupDTO.getEmail() != null &&
                userRepository.existsByEmail(signupDTO.getEmail())) {
            throw new RuntimeException("이미 등록된 이메일입니다.");
        }

        // User 엔티티 생성
        User user = new User(
                signupDTO.getName(),
                signupDTO.getUsername(),
                passwordEncoder.encode(signupDTO.getPassword()),
                signupDTO.getPhone(),
                signupDTO.getEmail(),
                Role.USER
        );

        userRepository.save(user);
    }

    // ===================
    // 이름과 휴대폰 번호로 사용자 조회
    // ===================
    public String findUsername(FindDTO findDTO) {
        User user = userRepository.findByNameAndPhone(findDTO.getName(), findDTO.getPhone())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원 정보를 찾을 수 없습니다."));

        return user.getUsername();
    }

    // ===================
    // 인증번호 발송
    // ===================
    public void sendVerificationCode(String phone) {
        // 인증번호 생성 (6자리 랜덤 숫자)
        String code = util.randomDigitCode(6);

        // Redis 또는 메모리에 인증번호 저장 (5분 유효)
        redisTemplate.opsForValue().set(
                "verification:" + phone,
                code,
                5,
                TimeUnit.MINUTES
        );

        // 전화번호로 인증메시지 발송
        boolean result = solapiService.sendVerificationSms(phone,
                "[위드유 수학학원] 인증번호는 ["+code+"]입니다.");

        if(!result){
            throw new RuntimeException("인증번호 발송 실패");
        }
    }

    // ===================
    // 비밀번호 조회 및 재설정
    // ===================
    public void findPassword(FindDTO request) {
        User user = userRepository.findByNameAndUsernameAndPhone(
                        request.getName(),
                        request.getUsername(),
                        request.getPhone()
                ).orElseThrow(() ->
                        new IllegalArgumentException("일치하는 회원 정보를 찾을 수 없습니다.")
                );

        // Redis에서 인증번호 조회
        String key = "verification:" + request.getPhone();
        String savedCode = redisTemplate.opsForValue().get(key);

        if (savedCode == null) {
            throw new IllegalArgumentException("인증번호가 만료되었습니다.");
        }

        // 인증번호 비교
        if (!savedCode.equals(request.getVerificationCode())) {
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다.");
        }

        // 인증 성공 → Redis 삭제
        redisTemplate.delete(key);

        // 임시 비밀번호 전송
        boolean result = solapiService.sendVerificationSms(request.getPhone(),
                "임시 비밀번호\n" +
                        "abc1234567890");
        if(!result){
            throw new RuntimeException("비밀번호 재설정 실패했습니다. 관리자에게 연락해주세요.");
        }

        // 임시 비밀번호로 재설정
        String newPassword = passwordEncoder.encode("abc1234567890");
        user.setPassword(newPassword);
    }


}