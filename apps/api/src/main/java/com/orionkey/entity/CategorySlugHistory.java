package com.orionkey.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "category_slug_history")
public class CategorySlugHistory extends BaseEntity {

    @Column(nullable = false)
    private UUID categoryId;

    @Column(nullable = false)
    private String slug;
}

