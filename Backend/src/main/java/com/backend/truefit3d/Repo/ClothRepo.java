package com.backend.truefit3d.Repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.truefit3d.Model.Clothes.Cloth;

@Repository
public interface ClothRepo<T extends Cloth> extends JpaRepository<T, Long> {
}
