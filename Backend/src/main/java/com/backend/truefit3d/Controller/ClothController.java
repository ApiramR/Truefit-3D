package com.backend.truefit3d.Controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.backend.truefit3d.Service.ClothServices;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.backend.truefit3d.Model.User;

@RestController
public class ClothController {

    @Value("${upload.directory}") // Defined in application.properties
    private String uploadDirectory;

    @Autowired
    private ClothServices clothServices;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> AddCloth(
        @RequestParam("file") MultipartFile file,
        @RequestParam("data") String dataJson
    ) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is missing");
            }

            // Parse the JSON data
            ObjectMapper mapper = new ObjectMapper();
            Map<String, String> data = mapper.readValue(dataJson, Map.class);

            // Validate required fields
            if (!data.containsKey("typ") || !data.containsKey("size") || !data.containsKey("size_metrics")) {
                return ResponseEntity.badRequest().body("Missing required fields");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                return ResponseEntity.badRequest().body("Invalid filename");
            }

            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            String uniqueFilename = UUID.randomUUID() + fileExtension;
            
            Path uploadPath = Paths.get(uploadDirectory);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath);
            
            String imgUrl = "http://localhost:8000/uploads/" + uniqueFilename;

            // Use equals() for string comparison
            String type = data.get("typ").toLowerCase();
            switch (type) {
                case "tshirt":
                    clothServices.addTshirt(data, imgUrl);
                    break;
                case "jeans":
                    clothServices.addJeans(data, imgUrl);
                    break;
                case "skirt":
                    clothServices.addSkirt(data, imgUrl);
                    break;
                default:
                    return ResponseEntity.badRequest().body("Invalid clothing type");
            }

            return ResponseEntity.ok().body("Clothing item uploaded successfully");
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to process file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred: " + e.getMessage());
        }
    }

    @GetMapping("/outfits")
    public ResponseEntity<?> getClothes() {
        return ResponseEntity.ok().body(clothServices.getAllClothesByType());
    }

    @PostMapping("/share-wardrobe")
    public ResponseEntity<?> shareWardrobe(@RequestBody Map<String, String> data) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            String sharedWithUsername = data.get("username");
            if (sharedWithUsername == null) {
                return ResponseEntity.badRequest().body("Username is required");
            }
            String result = clothServices.shareWardrobe(user.getUsername(), sharedWithUsername);
            return ResponseEntity.ok().body(result);
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @PostMapping("/unshare-wardrobe")
    public ResponseEntity<?> unshareWardrobe(@RequestBody Map<String, String> data) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            String sharedWithUsername = data.get("username");
            if (sharedWithUsername == null) {
                return ResponseEntity.badRequest().body("Username is required");
            }
            String result = clothServices.unshareWardrobe(user.getUsername(), sharedWithUsername);
            return ResponseEntity.ok().body(result);
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @GetMapping("/shared-wardrobes")
    public ResponseEntity<?> getSharedWardrobes() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            return ResponseEntity.ok().body(clothServices.getSharedWardrobes(user.getUsername()));
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @GetMapping("/wardrobes-shared-by-me")
    public ResponseEntity<?> getWardrobesSharedByMe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            return ResponseEntity.ok().body(clothServices.getWardrobesSharedByMe(user.getUsername()));
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }

    @GetMapping("/shared-wardrobe-items")
    public ResponseEntity<?> getSharedWardrobeItems(@RequestParam String ownerUsername) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            try {
                return ResponseEntity.ok().body(clothServices.getSharedWardrobeItems(ownerUsername, user.getUsername()));
            } catch (RuntimeException e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }
        return ResponseEntity.badRequest().body("User not authenticated");
    }
}
