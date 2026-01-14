package com.withyou.backend.account;

import com.withyou.backend.security.JwtTokenProvider;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AccountService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
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
}