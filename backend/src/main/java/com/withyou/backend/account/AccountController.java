package com.withyou.backend.account;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class AccountController {

    @Autowired
    AccountService accountService;

    @PostMapping("/user")
    public ResponseEntity<?> signup(@RequestBody AccountDTO dto) {
        System.out.println("AccountController - signup");
        try {
            accountService.insertUser(dto);
        }catch(Exception e){
            System.out.println(e);
        }

        return ResponseEntity.ok(Map.of(
                "message", "회원가입 성공",
                "username", dto.getUsername()
        ));

    }
}
