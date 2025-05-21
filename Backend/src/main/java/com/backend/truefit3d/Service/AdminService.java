package com.backend.truefit3d.Service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.backend.truefit3d.Model.Brand;
import com.backend.truefit3d.Model.Company;
import com.backend.truefit3d.Repo.BrandRepo;
import com.backend.truefit3d.Repo.CompanyRepo;

@Service
public class AdminService {
    @Autowired
    private BrandRepo brandRepo;

    @Autowired
    private CompanyRepo companyRepo;

    // Brand management
    public List<Brand> getAllBrands() {
        return brandRepo.findAll();
    }

    public Brand createBrand(Map<String, String> data) {
        Brand brand = new Brand();
        brand.setName(data.get("name"));
        brand.setDescription(data.get("description"));
        return brandRepo.save(brand);
    }

    public Brand updateBrand(Long id, Map<String, String> data) {
        Brand brand = brandRepo.findById(id).orElseThrow(() -> new RuntimeException("Brand not found"));
        if (data.containsKey("name")) {
            brand.setName(data.get("name"));
        }
        if (data.containsKey("description")) {
            brand.setDescription(data.get("description"));
        }
        return brandRepo.save(brand);
    }

    public void deleteBrand(Long id) {
        brandRepo.deleteById(id);
    }

    // Company management
    public List<Company> getAllCompanies() {
        return companyRepo.findAll();
    }

    public Company createCompany(Map<String, String> data) {
        Company company = new Company();
        company.setName(data.get("name"));
        company.setDescription(data.get("description"));
        company.setWebsite(data.get("website"));
        return companyRepo.save(company);
    }

    public Company updateCompany(Long id, Map<String, String> data) {
        Company company = companyRepo.findById(id).orElseThrow(() -> new RuntimeException("Company not found"));
        if (data.containsKey("name")) {
            company.setName(data.get("name"));
        }
        if (data.containsKey("description")) {
            company.setDescription(data.get("description"));
        }
        if (data.containsKey("website")) {
            company.setWebsite(data.get("website"));
        }
        return companyRepo.save(company);
    }

    public void deleteCompany(Long id) {
        companyRepo.deleteById(id);
    }
} 