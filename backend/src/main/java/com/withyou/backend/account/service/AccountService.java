package com.withyou.backend.account.service;

import com.withyou.backend.account.dto.FindDTO;
import com.withyou.backend.account.entity.Role;
import com.withyou.backend.account.entity.User;
import com.withyou.backend.account.dto.LoginDTO;
import com.withyou.backend.account.dto.SignupDTO;
import com.withyou.backend.account.repository.UserRepository;
import com.withyou.backend.common.Util;
import com.withyou.backend.common.exception.CustomException;
import com.withyou.backend.common.security.JwtTokenProvider;
import com.withyou.backend.common.solapi.SolapiService;
import com.withyou.backend.mypage.dto.PasswordChangeDTO;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
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

    // Redis 키 접두사 상수화
    private static final String SIGNUP_PREFIX = "auth:signup:";
    private static final String VERIFIED_PREFIX = "verified:signup:";
    private static final String FIND_PW_PREFIX = "auth:findPw:";

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
    // 로그인
    // ===================
    public String login(LoginDTO loginDTO) {
        User user = userRepository.findByUsername(loginDTO.getUsername())
                .orElseThrow(() -> new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!user.isActive()) {
            throw new CustomException("탈퇴한 계정입니다.");
        }

        if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            throw new CustomException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = jwtTokenProvider.createToken(user.getUsername(), user.getRole().name());

        // 로그인 유지 체크에 따라 28일 및 1일
        redisTemplate.opsForValue().set(
                "RT:" + user.getUsername(),
                token,
                loginDTO.isRememberMe()? 28 : 1 , TimeUnit.DAYS
        );

        return token;
    }

    // ===================
    // 회원가입
    // ===================
    public void signup(SignupDTO signupDTO) {
        System.out.println(111);
        String verifiedKey = VERIFIED_PREFIX + signupDTO.getPhone();
        String isVerified = redisTemplate.opsForValue().get(verifiedKey);

        System.out.println(222);
        if (isVerified == null) {
            throw new CustomException("전화번호 인증이 완료되지 않았거나 만료되었습니다.");
        }

        System.out.println(333);
        if (userRepository.existsByUsername(signupDTO.getUsername())) {
            throw new CustomException("이미 사용 중인 아이디입니다.");
        }
        System.out.println(444);
        if (userRepository.existsByPhone(signupDTO.getPhone())) {
            throw new CustomException("이미 등록된 전화번호입니다.");
        }

        System.out.println(555);
        User user = new User(
                signupDTO.getName(),
                signupDTO.getUsername(),
                passwordEncoder.encode(signupDTO.getPassword()),
                signupDTO.getPhone(),
                signupDTO.getEmail(),
                signupDTO.getBirth(),
                signupDTO.getGender(),
                signupDTO.getGrade(),
                Role.USER
        );
        System.out.println(666);
        try {
            userRepository.save(user);
        }catch(Exception e){
            System.out.println(e);
        }
        System.out.println(777);
        redisTemplate.delete(verifiedKey);
        System.out.println(888);
    }

    // ===================
    // 회원가입 시 인증번호 발송
    // ===================
    public void sendSignupCode(String phone) {
        String code = util.randomDigitCode(6);
        // 회원가입 전용 키 사용
        redisTemplate.opsForValue().set(SIGNUP_PREFIX + phone, code, 5, TimeUnit.MINUTES);

        boolean result = solapiService.sendVerificationSms(phone, "[위드유] 회원가입 인증번호: [" + code + "]");
        if (!result) throw new CustomException("인증번호 발송 실패");
    }

    // ===================
    // 회원가입 시 인증번호 검증
    // ===================
    public void verifySignupCode(String phone, String code) {
        String key = SIGNUP_PREFIX + phone;
        String savedCode = redisTemplate.opsForValue().get(key);

        if (savedCode == null) throw new CustomException("인증 시간이 만료되었습니다.");
        if (!savedCode.equals(code)) throw new CustomException("인증번호가 일치하지 않습니다.");

        redisTemplate.opsForValue().set(VERIFIED_PREFIX + phone, "true", 10, TimeUnit.MINUTES);

        redisTemplate.delete(key); // 검증 성공 시 삭제
    }

    // ===================
    // 아이디 찾기 (인증 없이 조회만)
    // ===================
    public String findUsername(FindDTO findDTO) {
        User user = userRepository.findByNameAndPhone(findDTO.getName(), findDTO.getPhone())
                .orElseThrow(() -> new CustomException("일치하는 회원 정보를 찾을 수 없습니다."));
        return user.getUsername();
    }

    // ===================
    // 비밀번호 찾기용 인증번호 발송
    // ===================
    public void sendFindPwCode(String phone) {
        String code = util.randomDigitCode(6);
        // 비밀번호 찾기 전용 키 사용
        redisTemplate.opsForValue().set(FIND_PW_PREFIX + phone, code, 5, TimeUnit.MINUTES);

        boolean result = solapiService.sendVerificationSms(phone, "[위드유] 비밀번호 찾기 인증번호: [" + code + "]");
        if (!result) throw new CustomException("인증번호 발송 실패");
    }

    // ===================
    // 비밀번호 재설정 (검증 포함)
    // ===================
    public void findPassword(FindDTO request) {
        User user = userRepository.findByNameAndUsernameAndPhone(
                request.getName(), request.getUsername(), request.getPhone()
        ).orElseThrow(() -> new CustomException("일치하는 회원 정보를 찾을 수 없습니다."));

        String key = FIND_PW_PREFIX + request.getPhone();
        String savedCode = redisTemplate.opsForValue().get(key);

        if (savedCode == null) throw new CustomException("인증번호가 만료되었습니다.");
        if (!savedCode.equals(request.getVerificationCode())) throw new CustomException("인증번호가 일치하지 않습니다.");

        redisTemplate.delete(key);

        String tempPassword = util.randomDigitCode(10); // 임시 비밀번호 무작위 생성 추천
        boolean result = solapiService.sendVerificationSms(request.getPhone(), "[위드유] 임시 비밀번호: " + tempPassword);

        if (!result) throw new CustomException("메시지 발송 실패");

        user.setPassword(passwordEncoder.encode(tempPassword));
    }

    // ===================
    // 회원 탈퇴
    // ===================
    public void withdraw() {
        String username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        if (username == null || username.equals("anonymousUser")) {
            throw new CustomException("로그인이 필요합니다.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));

        // 소프트 삭제
        user.withdraw(
            user.getPhone() + "_WITHDRAW_" + user.getId(),
            user.getEmail() + "_WITHDRAW_" + user.getId()
        );
    }

    // 비밀번호 변경
    public void updatePassword(String username, PasswordChangeDTO request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));

        // 현재 비밀번호 체크
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException("현재 비밀번호가 일치하지 않습니다.");
        }

        // 새 비밀번호 암호화 및 저장
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPassword(encodedPassword);
        userRepository.save(user);
    }

    public void logout(String username) {
        redisTemplate.delete("RT:" + username);
    }
}