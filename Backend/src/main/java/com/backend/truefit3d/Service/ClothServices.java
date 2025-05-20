package com.backend.truefit3d.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.backend.truefit3d.Model.ClothCombination;
import com.backend.truefit3d.Model.FavoriteCloth;
import com.backend.truefit3d.Model.Clothes.Cloth;
import com.backend.truefit3d.Model.Clothes.Jeans;
import com.backend.truefit3d.Model.Clothes.Skirt;
import com.backend.truefit3d.Model.Clothes.Tshirt;
import com.backend.truefit3d.Model.SharedWardrobe;
import com.backend.truefit3d.Repo.ClothCombinationRepo;
import com.backend.truefit3d.Repo.FavoriteClothRepo;
import com.backend.truefit3d.Repo.JeansRepo;
import com.backend.truefit3d.Repo.SkirtRepo;
import com.backend.truefit3d.Repo.TshirtRepo;
import com.backend.truefit3d.Repo.SharedWardrobeRepo;

@Service
public class ClothServices {
    @Autowired
    private TshirtRepo tshirtRepo;

    @Autowired
    private JeansRepo jeansRepo;

    @Autowired
    private SkirtRepo skirtRepo;

    @Autowired
    private ClothCombinationRepo clothCombinationRepo;

    @Autowired
    private FavoriteClothRepo favoriteClothRepo;

    @Autowired
    private SharedWardrobeRepo sharedWardrobeRepo;

    public void addTshirt(Map<String, String> data, String imgUrl) {
        Tshirt tshirt = new Tshirt();
        tshirt.setMaterial(data.getOrDefault("material", "Unknown"));
        tshirt.setNeckType(data.get("neckType"));
        tshirt.setSleeveType(data.get("sleeveType"));
        tshirt.setImgUrl(imgUrl);
        tshirt.setBrand(data.get("brand"));
        tshirt.setSize(Double.parseDouble(data.get("size")));
        tshirt.setSize_metrics(data.get("size_metrics"));
        tshirt.setColor(data.get("color"));
        tshirtRepo.save(tshirt);
    }

    public void addJeans(Map<String, String> data, String imgUrl) {
        Jeans jeans = new Jeans();
        jeans.setMaterial(data.getOrDefault("material", "Unknown"));
        jeans.setFitType(data.get("fitType"));
        jeans.setImgUrl(imgUrl);
        jeans.setBrand(data.get("brand"));
        jeans.setSize(Double.parseDouble(data.get("size")));
        jeans.setSize_metrics(data.get("size_metrics"));
        jeans.setColor(data.get("color"));
        jeansRepo.save(jeans);
    }

    public void addSkirt(Map<String, String> data, String imgUrl) {
        Skirt skirt = new Skirt();
        skirt.setMaterial(data.getOrDefault("material", "Unknown"));
        skirt.setSkirtType(data.get("skirtType"));
        skirt.setImgUrl(imgUrl);
        skirt.setBrand(data.get("brand"));
        skirt.setSize(Double.parseDouble(data.get("size")));
        skirt.setSize_metrics(data.get("size_metrics"));
        skirt.setColor(data.get("color"));
        skirtRepo.save(skirt);
    }

    public String LikeCloth(String code, String username) {
        // This is for liking cloth combinations
        ClothCombination ExistsclothCombination = clothCombinationRepo.findByClothidAndUsername(code, username);
        if (ExistsclothCombination != null) {
            if (ExistsclothCombination.getAccepted().equals(true)) {
                return "Already liked";
            } else {
                ExistsclothCombination.setAccepted(true);
                clothCombinationRepo.save(ExistsclothCombination);
                return "Added to favorites";
            }
        }
        ClothCombination clothCombination = new ClothCombination();
        clothCombination.setClothid(code);
        clothCombination.setAccepted(true);
        clothCombination.setUsername(username);
        clothCombinationRepo.save(clothCombination);
        return "Added to favorites";
    }

    public String dislikeCloth(String code, String username) {
        // This is for disliking cloth combinations
        ClothCombination ExistsclothCombination = clothCombinationRepo.findByClothidAndUsername(code, username);
        if (ExistsclothCombination != null) {
            if (ExistsclothCombination.getAccepted().equals(false)) {
                return "Already disliked";
            } else {
                ExistsclothCombination.setAccepted(false);
                clothCombinationRepo.save(ExistsclothCombination);
                return "Removed from favorites";
            }
        }
        ClothCombination clothCombination = new ClothCombination();
        clothCombination.setClothid(code);
        clothCombination.setAccepted(false);
        clothCombination.setUsername(username);
        clothCombinationRepo.save(clothCombination);
        return "Removed from favorites";
    }

    public Map<String, List<? extends Cloth>> getAllClothesByType() {
        Map<String, List<? extends Cloth>> clothes = new LinkedHashMap<>();
        clothes.put("tshirts", tshirtRepo.findAll());
        clothes.put("skirts", skirtRepo.findAll());
        clothes.put("jeans", jeansRepo.findAll());
        return clothes;
    }

    public String shareWardrobe(String ownerUsername, String sharedWithUsername) {
        // Check if sharing already exists
        SharedWardrobe existingShare = sharedWardrobeRepo.findByOwnerUsernameAndSharedWithUsername(ownerUsername, sharedWithUsername);
        if (existingShare != null) {
            if (existingShare.getIsActive()) {
                return "Already shared";
            }
            existingShare.setIsActive(true);
            sharedWardrobeRepo.save(existingShare);
            return "Sharing reactivated";
        }

        // Create new sharing
        SharedWardrobe share = new SharedWardrobe();
        share.setOwnerUsername(ownerUsername);
        share.setSharedWithUsername(sharedWithUsername);
        share.setIsActive(true);
        sharedWardrobeRepo.save(share);
        return "Shared successfully";
    }

    public String unshareWardrobe(String ownerUsername, String sharedWithUsername) {
        SharedWardrobe share = sharedWardrobeRepo.findByOwnerUsernameAndSharedWithUsername(ownerUsername, sharedWithUsername);
        if (share != null && share.getIsActive()) {
            share.setIsActive(false);
            sharedWardrobeRepo.save(share);
            return "Unshared successfully";
        }
        return "Not currently shared";
    }

    public List<SharedWardrobe> getSharedWardrobes(String username) {
        return sharedWardrobeRepo.findBySharedWithUsername(username);
    }

    public List<SharedWardrobe> getWardrobesSharedByMe(String username) {
        return sharedWardrobeRepo.findByOwnerUsername(username);
    }

    public Map<String, Object> getSharedWardrobeItems(String ownerUsername, String sharedWithUsername) {
        SharedWardrobe share = sharedWardrobeRepo.findByOwnerUsernameAndSharedWithUsername(ownerUsername, sharedWithUsername);
        if (share == null || !share.getIsActive()) {
            throw new RuntimeException("Wardrobe not shared");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, List<? extends Cloth>> clothes = getAllClothesByType();
        
        // Get favorite items for the shared user
        List<FavoriteCloth> favoriteItems = favoriteClothRepo.findByUsernameAndIsFavorite(sharedWithUsername, true);
        Set<String> favoriteItemIds = favoriteItems.stream()
            .map(FavoriteCloth::getClothId)
            .collect(Collectors.toSet());

        // Add clothes with favorite status
        result.put("tshirts", clothes.get("tshirts").stream()
            .map(item -> {
                Map<String, Object> itemMap = new LinkedHashMap<>();
                itemMap.put("item", item);
                itemMap.put("isFavorite", favoriteItemIds.contains(item.getId().toString()));
                return itemMap;
            })
            .collect(Collectors.toList()));
        
        result.put("jeans", clothes.get("jeans").stream()
            .map(item -> {
                Map<String, Object> itemMap = new LinkedHashMap<>();
                itemMap.put("item", item);
                itemMap.put("isFavorite", favoriteItemIds.contains(item.getId().toString()));
                return itemMap;
            })
            .collect(Collectors.toList()));
        
        result.put("skirts", clothes.get("skirts").stream()
            .map(item -> {
                Map<String, Object> itemMap = new LinkedHashMap<>();
                itemMap.put("item", item);
                itemMap.put("isFavorite", favoriteItemIds.contains(item.getId().toString()));
                return itemMap;
            })
            .collect(Collectors.toList()));

        return result;
    }

    public String favoriteCloth(String clothId, String username) {
        // This is for favoriting individual clothes
        System.out.println("Attempting to favorite cloth with ID: " + clothId + " for user: " + username);
        FavoriteCloth existingFavorite = favoriteClothRepo.findByClothIdAndUsername(clothId, username);
        if (existingFavorite != null) {
            if (existingFavorite.getIsFavorite()) {
                System.out.println("Cloth already favorited");
                return "Already favorited";
            }
            existingFavorite.setIsFavorite(true);
            favoriteClothRepo.save(existingFavorite);
            System.out.println("Updated existing favorite to true");
            return "Added to favorites";
        }

        FavoriteCloth newFavorite = new FavoriteCloth();
        newFavorite.setClothId(clothId);
        newFavorite.setUsername(username);
        newFavorite.setIsFavorite(true);
        favoriteClothRepo.save(newFavorite);
        System.out.println("Created new favorite entry");
        return "Added to favorites";
    }

    public String unfavoriteCloth(String code, String username) {
        // This is for unfavoriting individual clothes
        FavoriteCloth existingFavorite = favoriteClothRepo.findByClothIdAndUsername(code, username);
        if (existingFavorite != null) {
            if (!existingFavorite.getIsFavorite()) {
                return "Already unfavorited";
            }
            existingFavorite.setIsFavorite(false);
            favoriteClothRepo.save(existingFavorite);
            return "Removed from favorites";
        }
        return "Item not found";
    }
}
