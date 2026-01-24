package com.withyou.backend.common.security;

import com.withyou.backend.account.entity.User;
import com.withyou.backend.account.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("존재하지 않는 사용자")
                );

        // 탈퇴한 유저 차단
        if (!user.isActive()) {
            throw new DisabledException("탈퇴한 사용자");
        }

        return new CustomUserDetails(user);
    }
}
