package com.backend.truefit3d.Repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.truefit3d.Model.Brand;

@Repository
public interface BrandRepo extends JpaRepository<Brand, Long> {
    Brand findByName(String name);
} 