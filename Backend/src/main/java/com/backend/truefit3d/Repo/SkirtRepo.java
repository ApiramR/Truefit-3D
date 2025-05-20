package com.backend.truefit3d.Repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.truefit3d.Model.Clothes.Skirt;

@Repository
public interface SkirtRepo extends JpaRepository<Skirt, Long> {
    
}
