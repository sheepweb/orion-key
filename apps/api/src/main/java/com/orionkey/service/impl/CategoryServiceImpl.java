package com.orionkey.service.impl;

import com.orionkey.constant.ErrorCode;
import com.orionkey.entity.ProductCategory;
import com.orionkey.exception.BusinessException;
import com.orionkey.repository.ProductCategoryRepository;
import com.orionkey.repository.ProductRepository;
import com.orionkey.service.CategoryService;
import com.orionkey.utils.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private static final String CACHE_CATEGORY_LIST = "categoryList";

    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    @Cacheable(cacheNames = CACHE_CATEGORY_LIST, condition = "@cacheSwitchState.enabled")
    public List<?> listCategories() {
        return categoryRepository.findByIsDeletedOrderBySortOrderAsc(0).stream()
                .map(this::toCategoryMap)
                .toList();
    }

    @Override
    public Map<String, Object> getCategoryDetail(String idOrSlug) {
        return toCategoryMap(findCategoryByIdOrSlug(idOrSlug));
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_CATEGORY_LIST, allEntries = true)
    public void createCategory(Map<String, Object> req) {
        String name = (String) req.get("name");
        if (categoryRepository.existsByNameAndIsDeleted(name, 0)) {
            throw new BusinessException(ErrorCode.CATEGORY_NAME_EXISTS, "分类名称已存在");
        }
        String slug = req.containsKey("slug") && req.get("slug") != null
                ? ((String) req.get("slug")).trim()
                : null;
        if (slug == null || slug.isEmpty()) {
            slug = generateUniqueCategorySlug(name);
        } else if (categoryRepository.existsBySlugAndIsDeleted(slug, 0)) {
            throw new BusinessException(ErrorCode.CATEGORY_SLUG_EXISTS, "分类 slug 已存在");
        }
        ProductCategory category = new ProductCategory();
        category.setName(name);
        category.setSlug(slug);
        if (req.containsKey("seo_title")) category.setSeoTitle((String) req.get("seo_title"));
        if (req.containsKey("seo_description")) category.setSeoDescription((String) req.get("seo_description"));
        if (req.containsKey("seo_keywords")) category.setSeoKeywords((String) req.get("seo_keywords"));
        if (req.containsKey("sort_order")) category.setSortOrder(((Number) req.get("sort_order")).intValue());
        categoryRepository.save(category);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_CATEGORY_LIST, allEntries = true)
    public void updateCategory(UUID id, Map<String, Object> req) {
        ProductCategory category = categoryRepository.findById(id)
                .filter(c -> c.getIsDeleted() == 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "分类不存在"));
        if (req.containsKey("name")) {
            String name = (String) req.get("name");
            if (categoryRepository.existsByNameAndIdNotAndIsDeleted(name, id, 0)) {
                throw new BusinessException(ErrorCode.CATEGORY_NAME_EXISTS, "分类名称已存在");
            }
            category.setName(name);
        }
        if (req.containsKey("slug")) {
            String slug = req.get("slug") == null ? null : ((String) req.get("slug")).trim();
            if (slug != null && !slug.isEmpty()) {
                if (categoryRepository.existsBySlugAndIdNotAndIsDeleted(slug, id, 0)) {
                    throw new BusinessException(ErrorCode.CATEGORY_SLUG_EXISTS, "分类 slug 已存在");
                }
                category.setSlug(slug);
            } else if (category.getSlug() == null || category.getSlug().isBlank()) {
                category.setSlug(generateUniqueCategorySlug(category.getName()));
            }
        }
        if (req.containsKey("seo_title")) category.setSeoTitle((String) req.get("seo_title"));
        if (req.containsKey("seo_description")) category.setSeoDescription((String) req.get("seo_description"));
        if (req.containsKey("seo_keywords")) category.setSeoKeywords((String) req.get("seo_keywords"));
        if (req.containsKey("sort_order")) category.setSortOrder(((Number) req.get("sort_order")).intValue());
        categoryRepository.save(category);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CACHE_CATEGORY_LIST, allEntries = true)
    public void deleteCategory(UUID id) {
        ProductCategory category = categoryRepository.findById(id)
                .filter(c -> c.getIsDeleted() == 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "分类不存在"));
        if (productRepository.countByCategoryIdAndIsDeleted(id, 0) > 0) {
            throw new BusinessException(ErrorCode.CATEGORY_HAS_PRODUCTS, "该分类下存在商品，无法删除");
        }
        category.setIsDeleted(1);
        categoryRepository.save(category);
    }

    private ProductCategory findCategoryByIdOrSlug(String idOrSlug) {
        return categoryRepository.findBySlugAndIsDeleted(idOrSlug, 0)
                .or(() -> parseUuid(idOrSlug)
                        .flatMap(categoryRepository::findById)
                        .filter(category -> category.getIsDeleted() == 0))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "分类不存在"));
    }

    private Map<String, Object> toCategoryMap(ProductCategory category) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", category.getId());
        map.put("name", category.getName());
        map.put("slug", category.getSlug());
        map.put("seo_title", category.getSeoTitle());
        map.put("seo_description", category.getSeoDescription());
        map.put("seo_keywords", category.getSeoKeywords());
        map.put("sort_order", category.getSortOrder());
        return map;
    }

    private Optional<UUID> parseUuid(String value) {
        try {
            return Optional.of(UUID.fromString(value));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private String generateUniqueCategorySlug(String name) {
        String base = SlugUtils.slugify(name);
        if (base.isEmpty()) {
            base = "category-" + UUID.randomUUID().toString().substring(0, 8);
        }
        String candidate = base;
        int index = 2;
        while (categoryRepository.existsBySlugAndIsDeleted(candidate, 0)) {
            candidate = base + "-" + index++;
        }
        return candidate;
    }
}
