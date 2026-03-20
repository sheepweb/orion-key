package com.orionkey.service.impl;

import com.orionkey.common.PageResult;
import com.orionkey.constant.CardKeyStatus;
import com.orionkey.constant.ErrorCode;
import com.orionkey.entity.Product;
import com.orionkey.entity.ProductCategory;
import com.orionkey.entity.ProductSlugHistory;
import com.orionkey.entity.ProductSpec;
import com.orionkey.entity.WholesaleRule;
import com.orionkey.exception.BusinessException;
import com.orionkey.repository.CardKeyRepository;
import com.orionkey.repository.OrderItemRepository;
import com.orionkey.repository.ProductCategoryRepository;
import com.orionkey.repository.ProductRepository;
import com.orionkey.repository.ProductSlugHistoryRepository;
import com.orionkey.repository.ProductSpecRepository;
import com.orionkey.repository.WholesaleRuleRepository;
import com.orionkey.service.ProductService;
import com.orionkey.utils.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private static final String CACHE_PRODUCT_LIST = "productPublicList";
    private static final String CACHE_PRODUCT_DETAIL = "productDetail";

    private final ProductRepository productRepository;
    private final ProductSpecRepository productSpecRepository;
    private final WholesaleRuleRepository wholesaleRuleRepository;
    private final CardKeyRepository cardKeyRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductSlugHistoryRepository productSlugHistoryRepository;

    @Override
    @Cacheable(cacheNames = CACHE_PRODUCT_LIST, key = "#categoryId + '|' + #keyword + '|' + #page + '|' + #pageSize", condition = "@cacheSwitchState.enabled")
    public PageResult<?> listPublicProducts(UUID categoryId, String keyword, int page, int pageSize) {
        var pageable = PageRequest.of(page - 1, pageSize,
                Sort.by("sortOrder").ascending().and(Sort.by("createdAt").descending()));
        Page<Product> productPage;
        if (keyword != null && !keyword.isBlank()) {
            productPage = productRepository.findPublicProductsByKeyword(categoryId, "%" + keyword.toLowerCase() + "%", pageable);
        } else {
            productPage = productRepository.findPublicProducts(categoryId, pageable);
        }
        var list = productPage.getContent().stream().map(this::toProductCard).toList();
        return PageResult.of(productPage, list);
    }

    @Override
    @Cacheable(cacheNames = CACHE_PRODUCT_DETAIL, key = "#idOrSlug", condition = "@cacheSwitchState.enabled")
    public Map<String, Object> getProductDetail(String idOrSlug) {
        Product product = findPublicProductByIdOrSlug(idOrSlug);
        Map<String, Object> detail = toProductDetail(product);
        // 前台公开接口：多规格未启用时隐藏规格信息，防止泄露未启用的规格数据
        if (!product.isSpecEnabled()) {
            detail.put("specs", List.of());
        }
        return detail;
    }

    @Override
    public Map<String, Object> getAdminProductDetail(UUID id) {
        Product product = productRepository.findById(id)
                .filter(p -> p.getIsDeleted() == 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "商品不存在"));
        Map<String, Object> detail = toProductDetail(product);
        detail.put("is_enabled", product.isEnabled());
        detail.put("sort_order", product.getSortOrder());
        detail.put("low_stock_threshold", product.getLowStockThreshold());
        detail.put("created_at", product.getCreatedAt());
        detail.put("updated_at", product.getUpdatedAt());
        return detail;
    }

    @Override
    public PageResult<?> listAdminProducts(UUID categoryId, String keyword, Boolean isEnabled, int page, int pageSize) {
        var pageable = PageRequest.of(page - 1, pageSize, Sort.by("sortOrder").ascending());
        Page<Product> productPage;
        if (keyword != null && !keyword.isBlank()) {
            productPage = productRepository.findAdminProductsByKeyword(categoryId, "%" + keyword.toLowerCase() + "%", isEnabled, pageable);
        } else {
            productPage = productRepository.findAdminProducts(categoryId, isEnabled, pageable);
        }
        var list = productPage.getContent().stream().map(p -> {
            Map<String, Object> detail = toProductDetail(p);
            detail.put("is_enabled", p.isEnabled());
            detail.put("sort_order", p.getSortOrder());
            detail.put("low_stock_threshold", p.getLowStockThreshold());
            detail.put("sales_count", orderItemRepository.sumQuantityByProductId(p.getId()));
            detail.put("created_at", p.getCreatedAt());
            detail.put("updated_at", p.getUpdatedAt());
            return detail;
        }).toList();
        return PageResult.of(productPage, list);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {CACHE_PRODUCT_LIST, CACHE_PRODUCT_DETAIL}, allEntries = true)
    public Map<String, Object> createProduct(Map<String, Object> req) {
        String title = (String) req.get("title");
        String slug = req.containsKey("slug") && req.get("slug") != null
                ? ((String) req.get("slug")).trim()
                : null;
        if (slug == null || slug.isEmpty()) {
            slug = generateUniqueProductSlug(title);
        } else if (isProductSlugOccupied(slug)) {
            throw new BusinessException(ErrorCode.PRODUCT_SLUG_EXISTS, "商品 slug 已存在或已被历史记录占用");
        }
        Product product = new Product();
        product.setTitle(title);
        product.setDescription((String) req.get("description"));
        product.setDetailMd((String) req.get("detail_md"));
        product.setSlug(slug);
        product.setSeoTitle((String) req.get("seo_title"));
        product.setSeoDescription((String) req.get("seo_description"));
        product.setSeoKeywords((String) req.get("seo_keywords"));
        if (req.containsKey("tags")) product.setTags(normalizeTags(req.get("tags")));
        product.setCoverUrl((String) req.get("cover_url"));
        product.setBasePrice(new BigDecimal(req.get("base_price").toString()));
        if (req.containsKey("currency")) product.setCurrency((String) req.get("currency"));
        if (req.containsKey("delivery_type")) product.setDeliveryType((String) req.get("delivery_type"));
        product.setCategoryId(UUID.fromString((String) req.get("category_id")));
        if (req.containsKey("low_stock_threshold")) product.setLowStockThreshold(((Number) req.get("low_stock_threshold")).intValue());
        if (req.containsKey("wholesale_enabled")) product.setWholesaleEnabled((boolean) req.get("wholesale_enabled"));
        if (req.containsKey("spec_enabled")) product.setSpecEnabled((boolean) req.get("spec_enabled"));
        if (req.containsKey("is_enabled")) product.setEnabled((boolean) req.get("is_enabled"));
        if (req.containsKey("initial_sales")) product.setInitialSales(((Number) req.get("initial_sales")).intValue());
        if (req.containsKey("sort_order")) product.setSortOrder(((Number) req.get("sort_order")).intValue());
        productRepository.save(product);
        return toProductDetail(product);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {CACHE_PRODUCT_LIST, CACHE_PRODUCT_DETAIL}, allEntries = true)
    public void updateProduct(UUID id, Map<String, Object> req) {
        Product product = productRepository.findById(id)
                .filter(p -> p.getIsDeleted() == 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "商品不存在"));
        String oldSlug = product.getSlug();
        if (req.containsKey("title")) product.setTitle((String) req.get("title"));
        if (req.containsKey("description")) product.setDescription((String) req.get("description"));
        if (req.containsKey("detail_md")) product.setDetailMd((String) req.get("detail_md"));
        if (req.containsKey("slug")) {
            String slug = req.get("slug") == null ? null : ((String) req.get("slug")).trim();
            if (slug != null && !slug.isEmpty()) {
                if (isProductSlugOccupiedForUpdate(id, slug)) {
                    throw new BusinessException(ErrorCode.PRODUCT_SLUG_EXISTS, "商品 slug 已存在或已被历史记录占用");
                }
                product.setSlug(slug);
            } else if (product.getSlug() == null || product.getSlug().isBlank()) {
                product.setSlug(generateUniqueProductSlug(product.getTitle()));
            }
        }
        if (req.containsKey("seo_title")) product.setSeoTitle((String) req.get("seo_title"));
        if (req.containsKey("seo_description")) product.setSeoDescription((String) req.get("seo_description"));
        if (req.containsKey("seo_keywords")) product.setSeoKeywords((String) req.get("seo_keywords"));
        if (req.containsKey("tags")) product.setTags(normalizeTags(req.get("tags")));
        if (req.containsKey("cover_url")) product.setCoverUrl((String) req.get("cover_url"));
        if (req.containsKey("base_price")) product.setBasePrice(new BigDecimal(req.get("base_price").toString()));
        if (req.containsKey("currency")) product.setCurrency((String) req.get("currency"));
        if (req.containsKey("delivery_type")) product.setDeliveryType((String) req.get("delivery_type"));
        if (req.containsKey("category_id")) product.setCategoryId(UUID.fromString((String) req.get("category_id")));
        if (req.containsKey("low_stock_threshold")) product.setLowStockThreshold(((Number) req.get("low_stock_threshold")).intValue());
        if (req.containsKey("wholesale_enabled")) product.setWholesaleEnabled((boolean) req.get("wholesale_enabled"));
        if (req.containsKey("spec_enabled")) product.setSpecEnabled((boolean) req.get("spec_enabled"));
        if (req.containsKey("is_enabled")) product.setEnabled((boolean) req.get("is_enabled"));
        if (req.containsKey("initial_sales")) product.setInitialSales(((Number) req.get("initial_sales")).intValue());
        if (req.containsKey("sort_order")) product.setSortOrder(((Number) req.get("sort_order")).intValue());
        saveProductSlugHistoryIfChanged(product, oldSlug);
        productRepository.save(product);
    }

    private String generateUniqueProductSlug(String title) {
        String base = SlugUtils.slugify(title);
        if (base.isEmpty()) {
            base = "product-" + UUID.randomUUID().toString().substring(0, 8);
        }
        String candidate = base;
        int index = 2;
        while (isProductSlugOccupied(candidate)) {
            candidate = base + "-" + index++;
        }
        return candidate;
    }

    private boolean isProductSlugOccupied(String slug) {
        return productRepository.existsBySlugAndIsDeleted(slug, 0)
                || productSlugHistoryRepository.existsBySlug(slug);
    }

    private boolean isProductSlugOccupiedForUpdate(UUID productId, String slug) {
        return productRepository.existsBySlugAndIdNotAndIsDeleted(slug, productId, 0)
                || productSlugHistoryRepository.existsBySlug(slug);
    }

    private Product findPublicProductByIdOrSlug(String idOrSlug) {
        return productRepository.findBySlugAndIsDeletedAndEnabled(idOrSlug, 0, true)
                .or(() -> productSlugHistoryRepository.findFirstBySlugOrderByCreatedAtDesc(idOrSlug)
                        .flatMap(history -> productRepository.findById(history.getProductId()))
                        .filter(product -> product.getIsDeleted() == 0 && product.isEnabled()))
                .or(() -> parseUuid(idOrSlug)
                        .flatMap(productRepository::findById)
                        .filter(product -> product.getIsDeleted() == 0 && product.isEnabled()))
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "商品不存在或已下架"));
    }

    private Optional<UUID> parseUuid(String value) {
        try {
            return Optional.of(UUID.fromString(value));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private void saveProductSlugHistoryIfChanged(Product product, String oldSlug) {
        String currentSlug = product.getSlug();
        if (oldSlug == null || oldSlug.isBlank() || Objects.equals(oldSlug, currentSlug)) {
            return;
        }
        if (productSlugHistoryRepository.existsByProductIdAndSlug(product.getId(), oldSlug)) {
            return;
        }
        ProductSlugHistory history = new ProductSlugHistory();
        history.setProductId(product.getId());
        history.setSlug(oldSlug);
        productSlugHistoryRepository.save(history);
    }

    private String normalizeTags(Object raw) {
        if (raw == null) {
            return null;
        }
        Collection<?> source = raw instanceof Collection<?> collection
                ? collection
                : Arrays.asList(raw.toString().split(","));
        LinkedHashSet<String> tags = new LinkedHashSet<>();
        for (Object item : source) {
            if (item == null) {
                continue;
            }
            String value = item.toString().trim();
            if (!value.isEmpty()) {
                tags.add(value);
            }
        }
        return tags.isEmpty() ? null : String.join(",", tags);
    }

    private List<String> splitTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return List.of();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .distinct()
                .toList();
    }


    @Override
    @Transactional
    @CacheEvict(cacheNames = {CACHE_PRODUCT_LIST, CACHE_PRODUCT_DETAIL}, allEntries = true)
    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "商品不存在"));
        product.setIsDeleted(1);
        productRepository.save(product);
    }

    @Override
    public Object listSpecs(UUID productId) {
        return productSpecRepository.findByProductIdAndIsDeletedOrderBySortOrderAsc(productId, 0).stream()
                .map(this::toSpecMap).toList();
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {CACHE_PRODUCT_LIST, CACHE_PRODUCT_DETAIL}, allEntries = true)
    public void createSpec(UUID productId, Map<String, Object> req) {
        productRepository.findById(productId)
                .filter(p -> p.getIsDeleted() == 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "商品不存在"));

        String name = (String) req.get("name");
        if (productSpecRepository.existsByProductIdAndNameAndIsDeleted(productId, name, 0)) {
            throw new BusinessException(ErrorCode.SPEC_NAME_DUPLICATE, "同一商品下规格名称不能重复");
        }

        ProductSpec spec = new ProductSpec();
        spec.setProductId(productId);
        spec.setName(name);
        spec.setPrice(new BigDecimal(req.get("price").toString()));
        if (req.containsKey("is_visible")) spec.setVisible((boolean) req.get("is_visible"));
        if (req.containsKey("sort_order")) spec.setSortOrder(((Number) req.get("sort_order")).intValue());
        productSpecRepository.save(spec);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {CACHE_PRODUCT_LIST, CACHE_PRODUCT_DETAIL}, allEntries = true)
    public void updateSpec(UUID productId, UUID specId, Map<String, Object> req) {
        ProductSpec spec = productSpecRepository.findById(specId)
                .filter(s -> s.getProductId().equals(productId) && s.getIsDeleted() == 0)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPEC_NOT_FOUND, "规格不存在"));

        if (req.containsKey("name")) {
            String newName = (String) req.get("name");
            if (!newName.equals(spec.getName())
                    && productSpecRepository.existsByProductIdAndNameAndIsDeleted(productId, newName, 0)) {
                throw new BusinessException(ErrorCode.SPEC_NAME_DUPLICATE, "同一商品下规格名称不能重复");
            }
            spec.setName(newName);
        }
        if (req.containsKey("price")) spec.setPrice(new BigDecimal(req.get("price").toString()));
        if (req.containsKey("is_visible")) spec.setVisible((boolean) req.get("is_visible"));
        if (req.containsKey("sort_order")) spec.setSortOrder(((Number) req.get("sort_order")).intValue());
        productSpecRepository.save(spec);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {CACHE_PRODUCT_LIST, CACHE_PRODUCT_DETAIL}, allEntries = true)
    public void deleteSpec(UUID productId, UUID specId) {
        ProductSpec spec = productSpecRepository.findById(specId)
                .filter(s -> s.getProductId().equals(productId))
                .orElseThrow(() -> new BusinessException(ErrorCode.SPEC_NOT_FOUND, "规格不存在"));

        // 自动作废该规格下的可用卡密（AVAILABLE → INVALID），避免留下永远无法售出的幽灵库存
        cardKeyRepository.updateStatusByProductIdAndSpecId(
                productId, specId, CardKeyStatus.AVAILABLE, CardKeyStatus.INVALID);

        spec.setIsDeleted(1);
        productSpecRepository.save(spec);
    }

    @Override
    public Object listWholesaleRules(UUID productId) {
        return wholesaleRuleRepository.findByProductIdOrderByMinQuantityAsc(productId).stream()
                .map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("min_quantity", r.getMinQuantity());
                    m.put("unit_price", r.getUnitPrice());
                    return m;
                }).toList();
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    @CacheEvict(cacheNames = {CACHE_PRODUCT_LIST, CACHE_PRODUCT_DETAIL}, allEntries = true)
    public void setWholesaleRules(UUID productId, Map<String, Object> req) {
        UUID specId = req.containsKey("spec_id") && req.get("spec_id") != null
                ? UUID.fromString((String) req.get("spec_id")) : null;
        if (specId != null) {
            wholesaleRuleRepository.deleteByProductIdAndSpecId(productId, specId);
        } else {
            wholesaleRuleRepository.deleteByProductIdAndSpecIdIsNull(productId);
        }
        List<Map<String, Object>> rules = (List<Map<String, Object>>) req.get("rules");
        for (Map<String, Object> r : rules) {
            WholesaleRule rule = new WholesaleRule();
            rule.setProductId(productId);
            rule.setSpecId(specId);
            rule.setMinQuantity(((Number) r.get("min_quantity")).intValue());
            rule.setUnitPrice(new BigDecimal(r.get("unit_price").toString()));
            wholesaleRuleRepository.save(rule);
        }
    }

    private long getStockAvailable(UUID productId, UUID specId) {
        if (specId != null) {
            return cardKeyRepository.countByProductIdAndSpecIdAndStatus(productId, specId, CardKeyStatus.AVAILABLE);
        }
        return cardKeyRepository.countByProductIdAndSpecIdIsNullAndStatus(productId, CardKeyStatus.AVAILABLE);
    }

    private Map<String, Object> toProductCard(Product p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("title", p.getTitle());
        map.put("description", p.getDescription());
        map.put("slug", p.getSlug());
        map.put("seo_title", p.getSeoTitle());
        map.put("seo_description", p.getSeoDescription());
        map.put("seo_keywords", p.getSeoKeywords());
        map.put("tags", splitTags(p.getTags()));
        map.put("cover_url", p.getCoverUrl());
        map.put("base_price", p.getBasePrice());
        map.put("currency", p.getCurrency());
        map.put("category_id", p.getCategoryId());
        ProductCategory category = categoryRepository.findById(p.getCategoryId())
                .filter(c -> c.getIsDeleted() == 0)
                .orElse(null);
        map.put("category_name", category != null ? category.getName() : null);
        map.put("category_slug", category != null ? category.getSlug() : null);
        List<ProductSpec> specs = productSpecRepository.findByProductIdAndIsDeletedOrderBySortOrderAsc(p.getId(), 0);
        boolean hasSpecs = p.isSpecEnabled() && !specs.isEmpty();
        long stockAvailable;
        if (hasSpecs) {
            // 多规格模式：按各规格分别统计可用库存求和（精确隔离，不含默认库存池和已删除规格的卡密）
            stockAvailable = specs.stream()
                    .mapToLong(s -> cardKeyRepository.countByProductIdAndSpecIdAndStatus(p.getId(), s.getId(), CardKeyStatus.AVAILABLE))
                    .sum();
        } else {
            // 无规格模式：仅统计 spec_id=null 的卡密
            stockAvailable = cardKeyRepository.countByProductIdAndSpecIdIsNullAndStatus(p.getId(), CardKeyStatus.AVAILABLE);
        }
        map.put("stock_available", stockAvailable);
        map.put("has_specs", hasSpecs);
        map.put("delivery_type", p.getDeliveryType());
        map.put("sales_count", orderItemRepository.sumQuantityByProductId(p.getId()));
        map.put("initial_sales", p.getInitialSales());
        map.put("created_at", p.getCreatedAt());
        return map;
    }

    private Map<String, Object> toProductDetail(Product p) {
        Map<String, Object> map = new LinkedHashMap<>(toProductCard(p));
        map.put("detail_md", p.getDetailMd());
        List<ProductSpec> specs = productSpecRepository.findByProductIdAndIsDeletedOrderBySortOrderAsc(p.getId(), 0);
        map.put("specs", specs.stream().map(this::toSpecMap).toList());
        map.put("spec_enabled", p.isSpecEnabled());
        map.put("wholesale_enabled", p.isWholesaleEnabled());
        map.put("wholesale_rules", wholesaleRuleRepository.findByProductIdOrderByMinQuantityAsc(p.getId()).stream()
                .map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("min_quantity", r.getMinQuantity());
                    m.put("unit_price", r.getUnitPrice());
                    return m;
                }).toList());
        return map;
    }

    private Map<String, Object> toSpecMap(ProductSpec s) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("name", s.getName());
        map.put("price", s.getPrice());
        map.put("stock_available", getStockAvailable(s.getProductId(), s.getId()));
        // 有效卡密数量（AVAILABLE/SOLD/LOCKED），用于前端判断删除规格时是否需要确认
        map.put("card_key_count", cardKeyRepository.countByProductIdAndSpecIdExcludingStatus(
                s.getProductId(), s.getId(), CardKeyStatus.INVALID));
        return map;
    }
}
