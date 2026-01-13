package com.withyou.backend.common;

import lombok.Getter;

@Getter
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data; // 성공 시 보낼 데이터 (없으면 null)

    public ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        System.out.println("message : " + message + " data : " + data);
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        System.out.println("message : " + message);
        return new ApiResponse<>(false, message, null);
    }
}