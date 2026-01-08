package com.withyou.backend.account;

import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AccountServiceImpl implements AccountService {

    public final AccountRepository accountRepository;
    private final PasswordEncoder encoder;

    public AccountServiceImpl(
        AccountRepository accountRepository
    ){
        this.accountRepository = accountRepository;
        this.encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }


    @Override
    public void insertUser(AccountDTO dto) {

        // 중복 체크
        if (accountRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalStateException("이미 사용 중인 아이디입니다.");
        }

        if (accountRepository.existsByPhone(dto.getPhone())) {
            throw new IllegalStateException("이미 등록된 전화번호입니다.");
        }

        if (dto.getEmail() != null && accountRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalStateException("이미 등록된 이메일입니다.");
        }

        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setName(dto.getName());
        accountEntity.setUsername(dto.getUsername());
        accountEntity.setPassword(encoder.encode(dto.getPassword()));
        accountEntity.setPhone(dto.getPhone());
        accountEntity.setEmail(dto.getEmail());

        accountRepository.save(accountEntity);
    }
}
