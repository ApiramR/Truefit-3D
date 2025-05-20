package com.backend.truefit3d.Repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.truefit3d.Model.Clothes.Tshirt;

@Repository
public interface TshirtRepo extends JpaRepository<Tshirt, Long> {
    
}