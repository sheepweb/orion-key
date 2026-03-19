package com.orionkey.repository;

import com.orionkey.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
