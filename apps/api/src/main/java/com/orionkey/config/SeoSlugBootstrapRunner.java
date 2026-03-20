package com.orionkey.config;

import com.orionkey.entity.Product;
import com.orionkey.entity.ProductCategory;
import com.orionkey.repository.CategorySlugHistoryRepository;
import com.orionkey.repository.ProductCategoryRepository;
import com.orionkey.repository.ProductRepository;
import com.orionkey.repository.ProductSlugHistoryRepository;
import com.orionkey.utils.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SeoSlugBootstrapRunner implements ApplicationRunner {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductSlugHistoryRepository productSlugHistoryRepository;
    private final CategorySlugHistoryRepository categorySlugHistoryRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int categoryCount = backfillCategorySlugs();
        int productCount = backfillProductSlugs();
        ensureUniqueIndexes();
        log.info("SEO slug bootstrap complete: categories={}, products={}", categoryCount, productCount);
    }

    private int backfillCategorySlugs() {
        int count = 0;
        for (ProductCategory category : categoryRepository.findAllWithoutSlug()) {
            category.setSlug(generateUniqueCategorySlug(category.getName()));
            categoryRepository.save(category);
            count++;
        }
        return count;
    }

    private int backfillProductSlugs() {
        int count = 0;
        for (Product product : productRepository.findAllWithoutSlug()) {
            product.setSlug(generateUniqueProductSlug(product.getTitle()));
            productRepository.save(product);
            count++;
        }
        return count;
    }

    private void ensureUniqueIndexes() {
        jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_products_slug ON products (slug) WHERE slug IS NOT NULL AND slug <> ''");
        jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_product_categories_slug ON product_categories (slug) WHERE slug IS NOT NULL AND slug <> ''");
    }

    private String generateUniqueCategorySlug(String name) {
        String base = SlugUtils.slugify(name);
        if (base.isEmpty()) {
            base = "category-" + UUID.randomUUID().toString().substring(0, 8);
        }
        String candidate = base;
        int index = 2;
        while (categoryRepository.existsBySlugAndIsDeleted(candidate, 0)
                || categorySlugHistoryRepository.existsBySlug(candidate)) {
            candidate = base + "-" + index++;
        }
        return candidate;
    }

    private String generateUniqueProductSlug(String title) {
        String base = SlugUtils.slugify(title);
        if (base.isEmpty()) {
            base = "product-" + UUID.randomUUID().toString().substring(0, 8);
        }
        String candidate = base;
        int index = 2;
        while (productRepository.existsBySlugAndIsDeleted(candidate, 0)
                || productSlugHistoryRepository.existsBySlug(candidate)) {
            candidate = base + "-" + index++;
        }
        return candidate;
    }
}

