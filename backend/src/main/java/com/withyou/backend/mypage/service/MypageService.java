package com.withyou.backend.mypage.service;

import com.withyou.backend.account.entity.User;
import com.withyou.backend.account.repository.UserRepository;
import com.withyou.backend.mypage.dto.MypageDTO;
import com.withyou.backend.mypage.dto.UpdateDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@Service
public class MypageService {

    @Autowired
    UserRepository userRepository;

    // 마이페이지 정보 조회
    public MypageDTO getMypage(String username){

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        MypageDTO mypage = new MypageDTO(
                user.getId(),
                user.getName(),
                user.getUsername(),
                user.getPhone(),
                user.getEmail(),
                user.getBirth(),
                user.getGender(),
                user.getGrade(),
                user.getRole()
        );

        return mypage;
    }

    // 프로필 수정
    public void updateMyProfile(String username, UpdateDTO updateDTO) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (updateDTO.getPhone() != null) {
            user.setPhone(updateDTO.getPhone());
        }

        if (updateDTO.getEmail() != null) {
            user.setEmail(updateDTO.getEmail());
        }

        if (updateDTO.getGrade() != null) {
            user.setGrade(updateDTO.getGrade());
        }
    }
}
