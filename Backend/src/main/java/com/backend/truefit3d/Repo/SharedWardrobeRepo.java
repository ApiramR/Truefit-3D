package com.backend.truefit3d.Repo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.backend.truefit3d.Model.SharedWardrobe;

@Repository
public interface SharedWardrobeRepo extends JpaRepository<SharedWardrobe, Long> {
    List<SharedWardrobe> findByOwnerUsername(String ownerUsername);
    List<SharedWardrobe> findBySharedWithUsername(String sharedWithUsername);
    SharedWardrobe findByOwnerUsernameAndSharedWithUsername(String ownerUsername, String sharedWithUsername);
} 