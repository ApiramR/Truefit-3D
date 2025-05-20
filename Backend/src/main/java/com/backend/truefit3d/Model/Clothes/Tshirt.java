package com.backend.truefit3d.Model.Clothes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Tshirt")
public class Tshirt extends Cloth {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String sleeveType; // short, long, sleeveless

    @Column(nullable = false)
    private String neckType;

    @Column(nullable = false)
    private String material;
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getSleeveType() {
        return sleeveType;
    }
    
    public void setSleeveType(String sleeveType) {
        this.sleeveType = sleeveType;
    }
    
    public String getNeckType() {
        return neckType;
    }
    
    public void setNeckType(String neckType) {
        this.neckType = neckType;
    }
    
    public String getMaterial() {
        return material;
    }
    
    public void setMaterial(String material) {
        this.material = material;
    }
}
