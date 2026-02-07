package com.uiu.campus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    private String email;
    private String studentId;
    private String password;
    private String fullName; // For signup
    private String adminCode; // Optional: secret code to signup as admin
}
