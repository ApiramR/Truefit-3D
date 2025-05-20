package com.backend.truefit3d.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.backend.truefit3d.Service.ClothServices;

import java.util.Map;

@RestController
public class RecommendationController {

    @Autowired
    private ClothServices clothServices;

    @PostMapping("/favorite-cloth")
    public ResponseEntity<?> favoriteCloth(@RequestBody Map<String, String> request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String clothId = request.get("clothId");
        if (clothId == null) {
            return ResponseEntity.badRequest().body("Cloth ID is required");
        }
        
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            String res = clothServices.favoriteCloth(clothId, user.getUsername());
            return ResponseEntity.ok().body(res);
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PostMapping("/unfavorite-cloth")
    public ResponseEntity<?> unfavoriteCloth(@RequestBody Map<String, String> request) {
        String clothId = request.get("clothId");
        if (clothId == null) {
            return ResponseEntity.badRequest().body("Cloth ID is required");
        }
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            String res = clothServices.unfavoriteCloth(clothId, user.getUsername());
            return ResponseEntity.ok().body(res);
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PostMapping("/like-combination")
    public ResponseEntity<?> likeCombination(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().body("Combination ID is required");
        }
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            String res = clothServices.LikeCloth(code, user.getUsername());
            return ResponseEntity.ok().body(res);
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PostMapping("/dislike-combination")
    public ResponseEntity<?> dislikeCombination(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().body("Combination ID is required");
        }
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            String res = clothServices.dislikeCloth(code, user.getUsername());
            return ResponseEntity.ok().body(res);
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }
}
