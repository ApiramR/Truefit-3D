package com.backend.truefit3d.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.backend.truefit3d.Model.User;
import com.backend.truefit3d.Service.OtpService;
import com.backend.truefit3d.Service.UserService;
import com.backend.truefit3d.Utills.JwtConfig;

@RestController
public class AuthenticationController {

    @Autowired
    private UserService userService;
    @Autowired
    private OtpService otpService;
    @Autowired
    private JwtConfig jwtConfig;

    @PostMapping(value = "/register")
    public ResponseEntity<?> Register(@RequestBody Map<String, String> formData) {
        System.out.println(formData.get("username"));
        if (userService.addUser(formData)){
            return ResponseEntity.ok().body("Successfully registered");
        }
        return ResponseEntity.badRequest().body("Value missing");
    }

    @PostMapping(value = "/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> formData) {
        User user = userService.loadUserByEmail(formData.get("email"));
        if (user != null) {
            if (otpService.FPsendMail(user.getEmail())) {
                return ResponseEntity.ok().body("Successful");
            }
            // send authentication code to email
        }
        return ResponseEntity.badRequest().body("User not found");
    }

    @PostMapping(value = "/forgot-password-verify")
    public ResponseEntity<?> forgotPasswordVerify(@RequestBody Map<String, String> formData) {
        String otp = formData.get("OTP");
        String email = formData.get("email");
        if (otpService.OTPVALIDATE(otp, email)) {
            return ResponseEntity.ok().body("Validated Successfully");
        }
        return ResponseEntity.badRequest().body("Invalid or Expired OTP");
    }

    @PostMapping(value = "/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> formData) {
        userService.resetPassword(formData.get("email"), formData.get("password"));
        return ResponseEntity.ok().body("Successful");
    }

    @PostMapping(value = "/register-oauth2")
    public ResponseEntity<?> RegisterOauth(@RequestParam Map<String, String> formData) {
        formData.put("password", "oauth2-dummy");
        if (userService.addUser(formData)){
            return ResponseEntity.ok().body("Successfully registered");
        }
        return ResponseEntity.badRequest().body("Value missing");
    }

    @PostMapping(value = "/login")
    public ResponseEntity<?> Login(@RequestBody Map<String, String> formData) {
        if (userService.loginUser(formData)) {
            System.out.println("Login Successfully");
            return ResponseEntity.ok().body(jwtConfig.generateToken(formData.get("username")));
        }
        return ResponseEntity.badRequest().body("Invalid Credentials");
    }   

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            // Create a map with user details, excluding sensitive information
            Map<String, Object> userDetails = Map.of(
                "username", user.getUsername(),
                "email", user.getEmail(),
                "gender", user.getGender(),
                "role", user.getRole(),
                "createdAt", user.getCreatedAt()
            );
            return ResponseEntity.ok(userDetails);
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PostMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> formData) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            if (userService.updateProfile(user.getUsername(), formData)) {
                // If username was updated, generate new token
                if (formData.containsKey("name")) {
                    String newToken = jwtConfig.generateToken(formData.get("name"));
                    return ResponseEntity.ok().body(Map.of(
                        "message", "Profile updated successfully",
                        "token", newToken
                    ));
                }
                return ResponseEntity.ok().body(Map.of(
                    "message", "Profile updated successfully"
                ));
            }
            return ResponseEntity.badRequest().body("Failed to update profile");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> formData) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            if (userService.changePassword(user.getUsername(), formData.get("currentPassword"), formData.get("newPassword"))) {
                return ResponseEntity.ok().body("Password changed successfully");
            }
            return ResponseEntity.badRequest().body("Failed to change password");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PostMapping("/complete-oauth2-profile")
    public ResponseEntity<?> completeOAuth2Profile(@RequestBody Map<String, String> formData) {
        System.out.println("Received profile completion request: " + formData);
        
        String email = formData.get("email");
        String username = formData.get("username");
        String gender = formData.get("gender");

        if (email == null || username == null || gender == null) {
            System.out.println("Missing required fields - Email: " + email + ", Username: " + username + ", Gender: " + gender);
            return ResponseEntity.badRequest().body("Missing required fields");
        }

        User user = userService.updateOAuth2UserProfile(email, username, gender);
        if (user != null) {
            // Generate new token with updated username
            String token = jwtConfig.generateToken(username);
            System.out.println("Profile completed successfully for user: " + username);
            return ResponseEntity.ok().body(Map.of(
                "message", "Profile completed successfully",
                "token", token
            ));
        }
        System.out.println("Failed to update profile for email: " + email);
        return ResponseEntity.badRequest().body("Failed to update profile");
    }
}
