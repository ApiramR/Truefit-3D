package com.backend.truefit3d.Repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.truefit3d.Model.ClothCombination;
import java.util.List;


@Repository
public interface ClothCombinationRepo extends JpaRepository<ClothCombination,Long> {
    public ClothCombination findByClothid(String clothid); 
    List<ClothCombination> findByAccepted(Boolean accepted);
    ClothCombination findByClothidAndUsername(String clothid, String username);
    List<ClothCombination> findByUsernameAndAccepted(String username, Boolean accepted);
}
