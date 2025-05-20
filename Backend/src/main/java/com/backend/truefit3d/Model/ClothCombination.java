package com.backend.truefit3d.Model;

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
@Table(name = "FavCloth")
public class ClothCombination {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    String clothid;
    @Column(nullable = true)
    Boolean accepted;
    @Column(nullable = false)
    String username;

    public Long getId() {
        return id;
    }
    public Boolean getAccepted(){
        return accepted;
    }
    public void setAccepted(Boolean accepted){
        this.accepted = accepted;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getClothid() {
        return clothid;
    }
    
    public void setClothid(String clothid) {
        this.clothid = clothid;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
}
