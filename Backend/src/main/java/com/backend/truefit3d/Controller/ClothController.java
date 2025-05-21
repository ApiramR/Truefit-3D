package com.backend.truefit3d.Controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;
import java.util.Base64;
import java.util.HashMap;

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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.cloudinary.Cloudinary;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.backend.truefit3d.Model.Clothes.Cloth;
import com.backend.truefit3d.Model.Clothes.Tshirt;
import com.backend.truefit3d.Model.Clothes.Jeans;
import com.backend.truefit3d.Model.Clothes.Skirt;
import com.backend.truefit3d.Model.User;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;

import com.backend.truefit3d.Service.ClothServices;
import com.fasterxml.jackson.databind.ObjectMapper;

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

    @PostMapping("/try-on")
    public ResponseEntity<?> Tryon(@RequestBody Map<String, String> request) {
        try {
            String clothId = request.get("clothId");
            if (clothId == null) {
                return ResponseEntity.badRequest().body("Cloth ID is required");
            }

            // Get current user for profile image
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
                return ResponseEntity.badRequest().body("User not authenticated");
            }
            User user = (User) authentication.getPrincipal();
            String humanImageUrl = user.getProfileImageUrl();
            if (humanImageUrl == null) {
                return ResponseEntity.badRequest().body("User profile image is required");
            }

            // Get cloth details
            Cloth cloth = clothServices.getClothById(clothId);
            if (cloth == null) {
                return ResponseEntity.badRequest().body("Cloth not found");
            }
            String garmentImageUrl = cloth.getImgUrl();
            if (garmentImageUrl == null) {
                return ResponseEntity.badRequest().body("Cloth image is required");
            }

            // Determine category based on cloth type
            String category;
            if (cloth instanceof Tshirt) {
                category = "upper_body";
            } else if (cloth instanceof Jeans || cloth instanceof Skirt) {
                category = "lower_body";
            } else {
                return ResponseEntity.badRequest().body("Unsupported cloth type");
            }

            // Create description from cloth details
            StringBuilder description = new StringBuilder();
            description.append(cloth.getColor()).append(" ");
            description.append(cloth.getMaterial()).append(" ");
            description.append(cloth.getSize()).append(" ");
            description.append(cloth.getSize_metrics()).append(" ");

            if (cloth instanceof Tshirt) {
                Tshirt tshirt = (Tshirt) cloth;
                description.append(tshirt.getNeckType()).append(" neck ");
                description.append(tshirt.getSleeveType()).append(" sleeve ");
            } else if (cloth instanceof Jeans) {
                Jeans jeans = (Jeans) cloth;
                description.append(jeans.getFitType()).append(" fit ");
            } else if (cloth instanceof Skirt) {
                Skirt skirt = (Skirt) cloth;
                description.append(skirt.getSkirtType()).append(" style ");
            }

            // Prepare the request to Hugging Face API
            String apiUrl = "https://if-oo-try-on-1.hf.space/tryon/";
            
            try {
                // Download images
                byte[] humanImage = downloadImage(humanImageUrl);
                byte[] garmentImage = downloadImage(garmentImageUrl);

                // Create multipart request
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("human_image", new ByteArrayResource(humanImage) {
                    @Override
                    public String getFilename() {
                        return "human.jpg";
                    }
                });
                body.add("garment_image", new ByteArrayResource(garmentImage) {
                    @Override
                    public String getFilename() {
                        return "garment.jpg";
                    }
                });
                body.add("garment_description", description.toString());
                body.add("category", category);
                body.add("use_auto_mask", "true");
                body.add("use_auto_crop", "false");

                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

                // Make the API call
                RestTemplate restTemplate = new RestTemplate();
                ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
                );

                // Get the result image URL from the response
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null && responseBody.containsKey("result_image")) {
                    String resultImageBase64 = (String) responseBody.get("result_image");
                    // Convert base64 to image and upload to Cloudinary
                    String cloudinaryUrl = uploadToCloudinary(resultImageBase64);
                    return ResponseEntity.ok(Map.of(
                        "message", "Try-on completed successfully",
                        "resultImageUrl", cloudinaryUrl
                    ));
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to get result image from API");

            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to process images: " + e.getMessage());
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error during try-on process: " + e.getMessage());
        }
    }

    private byte[] downloadImage(String imageUrl) throws IOException {
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<byte[]> response = restTemplate.getForEntity(imageUrl, byte[].class);
        return response.getBody();
    }

    private String uploadToCloudinary(String base64Image) throws IOException {
        // Remove data URL prefix if present
        if (base64Image.contains(",")) {
            base64Image = base64Image.split(",")[1];
        }

        // Decode base64 to image
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);
        
        // Upload to Cloudinary
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", "dfxhwpopk");
        config.put("api_key", "866187317793619");
        config.put("api_secret", "9M0nZb3HpGzHLVaY10_u437GMck");
        
        Cloudinary cloudinary = new Cloudinary(config);
        Map<String, Object> uploadResult = cloudinary.uploader().upload(imageBytes, new HashMap<>());
        
        return (String) uploadResult.get("secure_url");
    }

    @PostMapping("/clothes")
    public ResponseEntity<?> addCloth(@RequestBody Map<String, String> data) {
        try {
            // Validate required fields
            if (!data.containsKey("typ") || !data.containsKey("size") || !data.containsKey("size_metrics") || !data.containsKey("imageUrl")) {
                return ResponseEntity.badRequest().body("Missing required fields");
            }

            String type = data.get("typ").toLowerCase();
            String imageUrl = data.get("imageUrl");

            switch (type) {
                case "tshirt":
                    clothServices.addTshirt(data, imageUrl);
                    break;
                case "jeans":
                    clothServices.addJeans(data, imageUrl);
                    break;
                case "skirt":
                    clothServices.addSkirt(data, imageUrl);
                    break;
                default:
                    return ResponseEntity.badRequest().body("Invalid clothing type");
            }

            return ResponseEntity.ok().body("Clothing item added successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred: " + e.getMessage());
        }
    }
}
