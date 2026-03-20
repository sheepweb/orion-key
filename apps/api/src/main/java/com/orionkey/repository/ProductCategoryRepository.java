package com.orionkey.repository;

import com.orionkey.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    List<ProductCategory> findByIsDeletedOrderBySortOrderAsc(int isDeleted);

    boolean existsByNameAndIsDeleted(String name, int isDeleted);

    boolean existsByNameAndIdNotAndIsDeleted(String name, UUID id, int isDeleted);

    boolean existsBySlugAndIsDeleted(String slug, int isDeleted);

    boolean existsBySlugAndIdNotAndIsDeleted(String slug, UUID id, int isDeleted);

    Optional<ProductCategory> findBySlugAndIsDeleted(String slug, int isDeleted);

    @Query("SELECT c FROM ProductCategory c WHERE c.isDeleted = 0 AND (c.slug IS NULL OR c.slug = '') ORDER BY c.createdAt ASC")
    List<ProductCategory> findAllWithoutSlug();
}
