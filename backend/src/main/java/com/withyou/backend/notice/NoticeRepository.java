package com.withyou.backend.notice;

import com.withyou.backend.account.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<User, Long> {
}
