package com.backend.truefit3d.Repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.truefit3d.Model.Company;

@Repository
public interface CompanyRepo extends JpaRepository<Company, Long> {
    Company findByName(String name);
} 