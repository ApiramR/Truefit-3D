package com.backend.truefit3d.Model.Clothes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Sweater")
public class Sweater extends Cloth {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String sleeveType; // short, long, sleeveless

    @Column(nullable = false)
    private String necklineType;

    @Column(nullable = false)
    private String material;

    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getSleeveType() {
        return sleeveType;
    }
    
    public void setSleeveType(String sleeveType) {
        this.sleeveType = sleeveType;
    }
    
    public String getNecklineType() {
        return necklineType;
    }
    
    public void setNecklineType(String necklineType) {
        this.necklineType = necklineType;
    }
    
    public String getMaterial() {
        return material;
    }
    
    public void setMaterial(String material) {
        this.material = material;
    }
} 