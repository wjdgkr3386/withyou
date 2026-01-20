package com.withyou.backend.common.solapi;

import jakarta.annotation.PostConstruct;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.response.SingleMessageSentResponse;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SolapiService {

    @Value("${coolsms.api.key}")
    private String apiKey;

    @Value("${coolsms.api.secret}")
    private String apiSecret;

    @Value("${coolsms.sender.number}")
    private String senderNumber;

    private DefaultMessageService messageService;

    // 빈 생성 시 CoolSMS API 초기화
    @PostConstruct
    public void init() {
        // API 키, 시크릿 키, API 도메인 설정
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.coolsms.co.kr");
    }

    // 인증번호 발송 메서드
    public boolean sendVerificationSms(String to, String sendMessage) {
        try {
            Message message = new Message();

            // 발신번호, 수신번호, 내용 설정
            message.setFrom(senderNumber);
            message.setTo(to);
            message.setText(sendMessage);

            // 발송
            SingleMessageSentResponse response = this.messageService.sendOne(new SingleMessageSendingRequest(message));
            return true;

        }catch(Exception e){
            System.err.println("SMS 발송 오류: " + e.getMessage());
            return false;
        }
    }
}