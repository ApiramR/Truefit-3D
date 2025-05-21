package com.backend.truefit3d.Controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.backend.truefit3d.Model.User;
import com.backend.truefit3d.Service.UserService;
import com.backend.truefit3d.Service.AdminService;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private AdminService adminService;

    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdmin(@RequestBody Map<String, String> formData) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            if (userService.createAdmin(formData, currentUser.getUsername())) {
                return ResponseEntity.ok().body("Admin created successfully");
            }
            return ResponseEntity.badRequest().body("Only existing admins can create new admins");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            if (currentUser.getRole().equals("ADMIN")) {
                return ResponseEntity.ok().body(userService.getAllUsers());
            }
            return ResponseEntity.badRequest().body("Only admins can view all users");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    // Brand management endpoints
    @GetMapping("/brands")
    public ResponseEntity<?> getAllBrands() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            if (currentUser.getRole().equals("ADMIN")) {
                return ResponseEntity.ok().body(adminService.getAllBrands());
            }
            return ResponseEntity.badRequest().body("Only admins can view brands");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PostMapping("/brands")
    public ResponseEntity<?> createBrand(@RequestBody Map<String, String> data) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            if (currentUser.getRole().equals("ADMIN")) {
                try {
                    return ResponseEntity.ok().body(adminService.createBrand(data));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            }
            return ResponseEntity.badRequest().body("Only admins can create brands");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PutMapping("/brands/{id}")
    public ResponseEntity<?> updateBrand(@PathVariable Long id, @RequestBody Map<String, String> data) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            if (currentUser.getRole().equals("ADMIN")) {
                try {
                    return ResponseEntity.ok().body(adminService.updateBrand(id, data));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            }
            return ResponseEntity.badRequest().body("Only admins can update brands");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @DeleteMapping("/brands/{id}")
    public ResponseEntity<?> deleteBrand(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            if (currentUser.getRole().equals("ADMIN")) {
                try {
                    adminService.deleteBrand(id);
                    return ResponseEntity.ok().body("Brand deleted successfully");
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            }
            return ResponseEntity.badRequest().body("Only admins can delete brands");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    // Company management endpoints
    @GetMapping("/companies")
    public ResponseEntity<?> getAllCompanies() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            if (currentUser.getRole().equals("ADMIN")) {
                return ResponseEntity.ok().body(adminService.getAllCompanies());
            }
            return ResponseEntity.badRequest().body("Only admins can view companies");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PostMapping("/companies")
    public ResponseEntity<?> createCompany(@RequestBody Map<String, String> data) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            if (currentUser.getRole().equals("ADMIN")) {
                try {
                    return ResponseEntity.ok().body(adminService.createCompany(data));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            }
            return ResponseEntity.badRequest().body("Only admins can create companies");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PutMapping("/companies/{id}")
    public ResponseEntity<?> updateCompany(@PathVariable Long id, @RequestBody Map<String, String> data) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            if (currentUser.getRole().equals("ADMIN")) {
                try {
                    return ResponseEntity.ok().body(adminService.updateCompany(id, data));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            }
            return ResponseEntity.badRequest().body("Only admins can update companies");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            if (currentUser.getRole().equals("ADMIN")) {
                try {
                    adminService.deleteCompany(id);
                    return ResponseEntity.ok().body("Company deleted successfully");
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            }
            return ResponseEntity.badRequest().body("Only admins can delete companies");
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }
} 