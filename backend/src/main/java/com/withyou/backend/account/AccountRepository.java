package com.withyou.backend.account;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<AccountEntity, Long> {

    boolean existsByUsername(String username);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
}
