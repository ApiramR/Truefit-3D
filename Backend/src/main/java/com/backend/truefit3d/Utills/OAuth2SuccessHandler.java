package com.backend.truefit3d.Utills;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.backend.truefit3d.Model.User;
import com.backend.truefit3d.Service.UserService;
import com.backend.truefit3d.Utills.JwtConfig;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtConfig jwtConfig;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oauth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        // Register or get the user
        User user = userService.registerOrGetOAuth2User(email, name);

        // Generate JWT token
        String token = jwtConfig.generateToken(user.getUsername());

        // Determine redirect URL based on whether user needs to complete profile
        String redirectUrl;
        if (user.getGender().equals("unknown")) {
            // New user needs to complete profile
            redirectUrl = String.format("http://localhost:5173/complete-profile?token=%s&email=%s",
                token, email);
        } else {
            // Existing user, redirect to home with token
            redirectUrl = String.format("http://localhost:5173/?token=%s&username=%s",
                token, user.getUsername());
        }

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
} 