package com.backend.truefit3d.Service;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.backend.truefit3d.Model.User;
import com.backend.truefit3d.Repo.UserRepo;

import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.Attribute;
import jakarta.persistence.metamodel.EntityType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.backend.truefit3d.Utills.utilfunctions;

import jakarta.annotation.PostConstruct;

@Service
public class UserService implements UserDetailsService {
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private UserRepo userRepo;
    @Autowired
    private utilfunctions Utilfunctions;


    public Boolean addUser(Map<String, String> data) {
        User user = new User();
        for (String field : Utilfunctions.getFields()) {
            if (field.equals("role")){
                data.put("role","USER");
            }
            if (data.get(field) == null) {
                System.out.println(field);
                return false;
            }
            if (field.equals("password")) {
                String res = passwordEncoder.encode(data.get("password"));
                data.put("password", res);
            }
            try {
                String methodName = "set" + field.substring(0, 1).toUpperCase() + field.substring(1);
                Method setter = User.class.getMethod(methodName, String.class);
                setter.invoke(user, data.get(field));
            } catch (NoSuchMethodException | NoSuchFieldError | IllegalAccessException | InvocationTargetException e) {
                e.printStackTrace();
                return false;
            }
        }
        System.out.println("user saved succesfully");
        userRepo.save(user);
        return true;
    }

    @Override
    public User loadUserByUsername(String username) {
        return userRepo.findByUsername(username);
    }

    public User loadUserByEmail(String email) {
        return userRepo.findByEmail(email);
    }

    

    public void resetPassword(String email, String password) {
        User user = userRepo.findByEmail(email);
        user.setPassword(passwordEncoder.encode(password));
    }

    public Boolean loginUser(Map<String, String> data) {
        String username = data.get("username");
        String password = data.get("password");
        if (username == null || password == null) {
            return false;
        }
        System.out.println(username + " " + password);
        User user = userRepo.findByUsername(username);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            return false;
        }
        return true;
    }

    public User registerOrGetOAuth2User(String email, String name) {
        User user = userRepo.findByEmail(email);
        if (user == null) {
            // Create new user with temporary data
            user = new User();
            user.setUsername(email); // Temporary username until profile completion
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode("oauth2-dummy-" + System.currentTimeMillis()));
            user.setGender("unknown");
            user.setRole("USER"); // Set role as USER
            userRepo.save(user);
            System.out.println("New Google user created: " + email);
        }
        return user;
    }

    public User updateOAuth2UserProfile(String email, String username, String gender) {
        User user = userRepo.findByEmail(email);
        if (user != null) {
            // Check if username is already taken by another user
            User existingUser = userRepo.findByUsername(username);
            if (existingUser != null && !existingUser.getEmail().equals(email)) {
                System.out.println("Username already taken: " + username);
                return null; // Username already taken
            }
            
            // Update user profile
            user.setUsername(username);
            user.setGender(gender);
            userRepo.save(user);
            System.out.println("Updated Google user profile - Email: " + email + ", Username: " + username + ", Gender: " + gender);
            return user;
        }
        System.out.println("User not found with email: " + email);
        return null;
    }

    public boolean updateProfile(String username, Map<String, String> formData) {
        User user = userRepo.findByUsername(username);
        if (user != null) {
            if (formData.containsKey("name")) {
                user.setUsername(formData.get("name"));
            }
            if (formData.containsKey("gender")) {
                user.setGender(formData.get("gender"));
            }
            userRepo.save(user);
            return true;
        }
        return false;
    }

    public boolean changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepo.findByUsername(username);
        if (user != null && passwordEncoder.matches(currentPassword, user.getPassword())) {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepo.save(user);
            return true;
        }
        return false;
    }

    public User saveUser(User user) {
        return userRepo.save(user);
    }

    @PostConstruct
    public void createInitialAdmin() {
        try {
            // Check if admin already exists
            if (userRepo.findByUsername("admin") == null) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@truefit3d.com");
                admin.setPassword(passwordEncoder.encode("admin123")); // Change this in production!
                admin.setGender("male");
                admin.setRole("ADMIN");
                userRepo.save(admin);
                System.out.println("Initial admin account created");
            }
        } catch (Exception e) {
            System.err.println("Failed to create initial admin account: " + e.getMessage());
        }
    }

    // Add method to create new admin (only callable by existing admin)
    public boolean createAdmin(Map<String, String> formData, String currentUsername) {
        try {
            // Check if current user is admin
            User currentUser = userRepo.findByUsername(currentUsername);
            if (currentUser == null || !currentUser.getRole().equals("ADMIN")) {
                return false;
            }

            // Create new admin
            User newAdmin = new User();
            newAdmin.setUsername(formData.get("username"));
            newAdmin.setEmail(formData.get("email"));
            newAdmin.setPassword(passwordEncoder.encode(formData.get("password")));
            newAdmin.setGender(formData.get("gender"));
            newAdmin.setRole("ADMIN");
            userRepo.save(newAdmin);
            return true;
        } catch (Exception e) {
            System.err.println("Failed to create admin account: " + e.getMessage());
            return false;
        }
    }

    public List<User> getAllUsers() {
        return userRepo.findAll();
    }
}
