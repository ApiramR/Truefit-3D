package com.backend.truefit3d.Repo;

import org.springframework.data.jpa.repository.JpaRepository;
import com.backend.truefit3d.Model.FavoriteCloth;
import java.util.List;

public interface FavoriteClothRepo extends JpaRepository<FavoriteCloth, Long> {
    FavoriteCloth findByClothIdAndUsername(String clothId, String username);
    List<FavoriteCloth> findByUsernameAndIsFavorite(String username, boolean isFavorite);
} 