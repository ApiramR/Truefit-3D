package com.backend.truefit3d.Repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.truefit3d.Model.Clothes.Jeans;

@Repository
public interface JeansRepo extends JpaRepository<Jeans, Long> {
}
