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
    private final org.springframework.mail.javamail.JavaMailSender mailSender;
    private final RedisTemplate<String, String> redisTemplate;
    private final Util util;

    // Redis 키 접두사 상수화
    private static final String SIGNUP_PHONE_PREFIX = "auth:signup:phone:";
    private static final String VERIFIED_PHONE_PREFIX = "verified:signup:phone:";
    private static final String SIGNUP_EMAIL_PREFIX = "auth:signup:email:";
    private static final String VERIFIED_EMAIL_PREFIX = "verified:signup:email:";
    private static final String FIND_PW_PREFIX = "auth:findPw:";

    public AccountService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider jwtTokenProvider,
                          SolapiService solapiService,
                          org.springframework.mail.javamail.JavaMailSender mailSender,
                          RedisTemplate<String, String> redisTemplate,
                          Util util) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.solapiService = solapiService;
        this.mailSender = mailSender;
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
        String verifiedPhoneKey = VERIFIED_PHONE_PREFIX + signupDTO.getPhone();
        String verifiedEmailKey = VERIFIED_EMAIL_PREFIX + signupDTO.getEmail();

        String isPhoneVerified = redisTemplate.opsForValue().get(verifiedPhoneKey);
        String isEmailVerified = redisTemplate.opsForValue().get(verifiedEmailKey);

        if (isPhoneVerified == null) {
            throw new CustomException("전화번호 인증이 완료되지 않았거나 만료되었습니다.");
        }

        if (isEmailVerified == null) {
            throw new CustomException("이메일 인증이 완료되지 않았거나 만료되었습니다.");
        }

        if (userRepository.existsByUsername(signupDTO.getUsername())) {
            throw new CustomException("이미 사용 중인 아이디입니다.");
        }

        if (userRepository.existsByPhone(signupDTO.getPhone())) {
            throw new CustomException("이미 등록된 전화번호입니다.");
        }

        if (userRepository.existsByEmail(signupDTO.getEmail())) {
            throw new CustomException("이미 등록된 이메일입니다.");
        }

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
        try {
            userRepository.save(user);
        }catch(Exception e){
            System.out.println(e);
            throw new CustomException("회원가입 처리 중 오류가 발생했습니다.");
        }
        redisTemplate.delete(verifiedPhoneKey);
        redisTemplate.delete(verifiedEmailKey);
    }

    // ===================
    // 회원가입 시 전화번호 인증번호 발송
    // ===================
    public void sendSignupCode(String phone) {
        String code = util.randomDigitCode(6);
        redisTemplate.opsForValue().set(SIGNUP_PHONE_PREFIX + phone, code, 5, TimeUnit.MINUTES);

        boolean result = solapiService.sendVerificationSms(phone, "[위드유] 회원가입 인증번호: [" + code + "]");
        if (!result) throw new CustomException("인증번호 발송 실패");
    }

    // ===================
    // 회원가입 시 전화번호 인증번호 검증
    // ===================
    public void verifySignupCode(String phone, String code) {
        String key = SIGNUP_PHONE_PREFIX + phone;
        String savedCode = redisTemplate.opsForValue().get(key);

        if (savedCode == null) throw new CustomException("인증 시간이 만료되었습니다.");
        if (!savedCode.equals(code)) throw new CustomException("인증번호가 일치하지 않습니다.");

        redisTemplate.opsForValue().set(VERIFIED_PHONE_PREFIX + phone, "true", 10, TimeUnit.MINUTES);
        redisTemplate.delete(key);
    }

    // ===================
    // 회원가입 시 이메일 인증번호 발송
    // ===================
    public void sendEmailCode(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new CustomException("이미 사용 중인 이메일입니다.");
        }

        String code = util.randomDigitCode(6);
        redisTemplate.opsForValue().set(SIGNUP_EMAIL_PREFIX + email, code, 5, TimeUnit.MINUTES);

        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setTo(email);
            message.setSubject("[위드유] 회원가입 이메일 인증번호");
            message.setText("안녕하세요. 위드유입니다.\n\n회원가입 인증번호는 [" + code + "] 입니다.\n5분 이내에 입력해 주세요.");
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("이메일 발송 오류: " + e.getMessage());
            throw new CustomException("이메일 발송에 실패했습니다.");
        }
    }

    // ===================
    // 회원가입 시 이메일 인증번호 검증
    // ===================
    public void verifyEmailCode(String email, String code) {
        String key = SIGNUP_EMAIL_PREFIX + email;
        String savedCode = redisTemplate.opsForValue().get(key);

        if (savedCode == null) throw new CustomException("인증 시간이 만료되었습니다.");
        if (!savedCode.equals(code)) throw new CustomException("인증번호가 일치하지 않습니다.");

        redisTemplate.opsForValue().set(VERIFIED_EMAIL_PREFIX + email, "true", 10, TimeUnit.MINUTES);
        redisTemplate.delete(key);
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

    // ===================
    // 비밀번호 변경
    // ===================
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

    // ===================
    // 로그아웃
    // ===================
    public void logout(String username) {
        try {
            redisTemplate.delete("RT:" + username);
        }catch(Exception e){
            throw new CustomException("로그아웃 도중 오류가 발생했습니다. : "+e.getMessage());
        }
    }

    public User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));
    }

    // ===================
    // 학생 목록 조회 (관리자용 - 페이징 및 필터)
    // ===================
    public org.springframework.data.domain.Page<User> findStudentsPaged(
            String name, 
            com.withyou.backend.account.entity.Grade grade, 
            String gender,
            org.springframework.data.domain.Pageable pageable) {
        
        // 검색 필터 전처리
        String searchName = (name != null && !name.trim().isEmpty()) ? name.trim() : null;
        String searchGender = (gender != null && !gender.trim().isEmpty()) ? gender : null;
        
        return userRepository.findStudentsPaged(Role.USER, searchName, grade, searchGender, pageable);
    }
}