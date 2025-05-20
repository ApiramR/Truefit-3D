package com.backend.truefit3d.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class OtpService {

    // private static final int OTP_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    @Autowired
    private JavaMailSender javaMailSender;
    @Value("${spring.mail.username}")
    private String sender;

    // Generate a random OTP
    public String generateOtp(String userId) {
        String otp = String.format("%06d", random.nextInt(999999)); // 6-digit OTP
        storeOtp(userId, otp); // Store in cache
        return otp;
    }

    // Store OTP in cache
    @CachePut(value = "otpCache", key = "#userId")
    public String storeOtp(String userId, String otp) {
        return otp; // Return value is stored in cache
    }

    // Retrieve OTP from cache
    @Cacheable(value = "otpCache", key = "#userId")
    public String getOtp(String userId) {
        return null; // Returning null ensures it only fetches from cache
    }

    // Validate OTP
    public boolean validateOtp(String userId, String otp) {
        String cachedOtp = getOtp(userId);
        return cachedOtp != null && cachedOtp.equals(otp);
    }

    // Remove OTP from cache after use
    @CacheEvict(value = "otpCache", key = "#userId")
    public void removeOtp(String userId) {
        // CacheEvict removes the entry
    }
    public Boolean FPsendMail(String email) {
        try {
            // Creating a simple mail message
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            // Setting up necessary details
            mailMessage.setFrom(sender);
            mailMessage.setTo(email);
            mailMessage.setText(generateOtp(email));
            // Sending the mail
            javaMailSender.send(mailMessage);
            return true;
        }

        // Catch block to handle the exceptions
        catch (Exception e) {
            return false;
        }
    }

    public Boolean OTPVALIDATE(String otp, String email) {
        if (validateOtp(email, otp)) {
            removeOtp(email);
            return true;
        }
        return false;
    }
}