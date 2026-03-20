package com.orionkey.repository;

import com.orionkey.entity.CategorySlugHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CategorySlugHistoryRepository extends JpaRepository<CategorySlugHistory, UUID> {

    boolean existsBySlug(String slug);

    boolean existsByCategoryIdAndSlug(UUID categoryId, String slug);

    Optional<CategorySlugHistory> findFirstBySlugOrderByCreatedAtDesc(String slug);
}

