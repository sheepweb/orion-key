package com.orionkey.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_categories")
public class ProductCategory extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String slug;

    private String seoTitle;

    @Column(columnDefinition = "TEXT")
    private String seoDescription;

    @Column(columnDefinition = "TEXT")
    private String seoKeywords;

    private int sortOrder = 0;

    private int isDeleted = 0;
}
