package com.orionkey.repository;

import com.orionkey.entity.ProductSlugHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductSlugHistoryRepository extends JpaRepository<ProductSlugHistory, UUID> {

    boolean existsBySlug(String slug);

    boolean existsByProductIdAndSlug(UUID productId, String slug);

    Optional<ProductSlugHistory> findFirstBySlugOrderByCreatedAtDesc(String slug);
}

