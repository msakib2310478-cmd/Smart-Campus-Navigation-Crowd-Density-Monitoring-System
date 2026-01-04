package com.uiu.campus.util;

import java.util.regex.Pattern;

public class PasswordValidator {
    
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1 special character
    private static final String PASSWORD_PATTERN = 
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$";
    
    private static final Pattern pattern = Pattern.compile(PASSWORD_PATTERN);
    
    public static boolean isValid(String password) {
        if (password == null || password.isEmpty()) {
            return false;
        }
        return pattern.matcher(password).matches();
    }
    
    public static String getRequirements() {
        return "Password must be at least 8 characters long and contain: " +
               "1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character (@#$%^&+=!)";
    }
}
