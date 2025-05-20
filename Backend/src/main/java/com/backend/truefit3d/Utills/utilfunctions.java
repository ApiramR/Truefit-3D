package com.backend.truefit3d.Utills;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.backend.truefit3d.Model.User;

import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.Attribute;
import jakarta.persistence.metamodel.EntityType;

@Component
public class utilfunctions {
    @Autowired
    private EntityManager entityManager;
    
    public String[] getFields() {
        EntityType<User> entityType = entityManager.getMetamodel().entity(User.class);
        List<String> columnNames = new ArrayList<>();
        for (Attribute<? super User, ?> attribute : entityType.getAttributes()) {
            if (attribute.getName() == "Id" || attribute.getName() == "createdAt"  || attribute.getName() == "updatedAt" || attribute.getName() == "id")
                continue;
            columnNames.add(attribute.getName());
        }
        return columnNames.toArray(new String[0]);
    }
}
