import express from 'express';
import { db } from '../../db/mysql';
import { requireAdminAuth } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/apiResponse';
import { NotificationService } from '../../services/notificationService';

const router = express.Router();

// Admin All Products Secure List Endpoint
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string || '').toLowerCase().trim();
    const category = req.query.category as string || 'all';
    const brand = req.query.brand as string || 'all';
    const stockStatus = req.query.stock_status as string || 'all';
    const status = req.query.status as string || 'all';
    const offset = (page - 1) * limit;

    let baseQuery = "FROM products WHERE 1=1";
    let params: any[] = [];

    if (search) {
      baseQuery += " AND (LOWER(name) LIKE ? OR LOWER(id) LIKE ? OR LOWER(category) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(COALESCE(sku, '')) LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (category !== 'all') {
      baseQuery += " AND category = ?";
      params.push(category);
    }

    if (brand !== 'all') {
      baseQuery += " AND brand = ?";
      params.push(brand);
    }

    if (stockStatus !== 'all') {
      if (stockStatus === 'in_stock') {
        baseQuery += " AND stock_quantity >= 15";
      } else if (stockStatus === 'low_stock') {
        baseQuery += " AND stock_quantity > 0 AND stock_quantity < 15";
      } else if (stockStatus === 'out_of_stock') {
        baseQuery += " AND stock_quantity = 0";
      }
    }

    if (status !== 'all') {
      baseQuery += " AND status = ?";
      params.push(status);
    }

    const catRows = await db.executePrepared("SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''");
    const brandRows = await db.executePrepared("SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != ''");
    const uniqueCategories = Array.from(new Set((catRows || []).map((r: any) => (r.category || '').trim()).filter(Boolean)));
    const uniqueBrands = Array.from(new Set((brandRows || []).map((r: any) => (r.brand || '').trim()).filter(Boolean)));

    const countResult = await db.executePrepared(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit) || 1;

    let selectQuery = `SELECT * ${baseQuery} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`;
    let queryParams = [...params, limit, offset];
    const products = await db.executePrepared(selectQuery, queryParams);

    res.json({
      success: true,
      products,
      total,
      page,
      limit,
      pages: totalPages,
      categories: uniqueCategories,
      brands: uniqueBrands
    });
  } catch (err) {
    console.error('[Admin Get Products Error] ', err);
    res.status(500).json({ success: false, error: 'Failed to fetch product management data.' });
  }
});

// Get Single Product Details
router.get('/:id', requireAdminAuth, async (req, res) => {
  try {
    const rows = await db.executePrepared("SELECT * FROM products WHERE id = ? LIMIT 1", [req.params.id]);
    if (rows.length > 0) {
      res.json(successResponse(rows[0]));
    } else {
      res.status(404).json(errorResponse('Product not found.'));
    }
  } catch (err) {
    console.error('[Admin Get Product Detail Error] ', err);
    res.status(500).json(errorResponse('Failed to retrieve product details.'));
  }
});

// Helper to stringify JSON fields safely
const safeJsonString = (val: any, defaultVal = '[]') => {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val);
  } catch {
    return defaultVal;
  }
};

// Create Product
router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const { 
      id, name, name_bn, sku, price, old_price, cost_price, buying_price, image_url, category, brand, badge, 
      stock_quantity, unit, status, featured, description, seo_title, seo_description, slug, 
      rating, view_count, review_count, short_description, gallery,
      variants, key_features, specifications, ingredients, nutrition, storage, usage_info, faqs,
      inside_dhaka_time, outside_dhaka_time, delivery_info, return_policy,
      weight, dimensions, low_stock_threshold, track_inventory, technical_details,
      delivery_charge_enabled, delivery_charge_amount, courier_note, youtube_link, condition_type
    } = req.body;

    const finalId = id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const finalBuyingPrice = Number(buying_price !== undefined ? buying_price : (cost_price !== undefined ? cost_price : 0)) || 0;
    const finalSlug = slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    await db.executePrepared(
      `INSERT INTO products (
        id, name, name_bn, sku, price, old_price, cost_price, buying_price, image_url, category, brand, badge, 
        stock_quantity, unit, status, featured, description, seo_title, seo_description, slug, 
        rating, view_count, review_count, short_description, gallery,
        variants, key_features, specifications, ingredients, nutrition, storage, usage_info, faqs,
        inside_dhaka_time, outside_dhaka_time, delivery_info, return_policy,
        weight, dimensions, low_stock_threshold, track_inventory, technical_details,
        delivery_charge_enabled, delivery_charge_amount, courier_note, youtube_link, condition_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalId,
        name,
        name_bn || '',
        sku || '',
        Number(price) || 0,
        Number(old_price) || 0,
        finalBuyingPrice,
        finalBuyingPrice,
        image_url || '',
        category || 'Dry Food',
        brand || 'Shad Ghor',
        badge || '',
        Number(stock_quantity) || 0,
        unit || 'kg',
        status || 'active',
        featured !== undefined ? (Boolean(featured) ? 1 : 0) : 1,
        description || '',
        seo_title || '',
        seo_description || '',
        finalSlug,
        Number(rating) || 5.0,
        Number(view_count) || 0,
        Number(review_count) || 0,
        short_description || '',
        safeJsonString(gallery, '[]'),
        safeJsonString(variants, '[]'),
        safeJsonString(key_features, '[]'),
        safeJsonString(specifications, '{}'),
        ingredients || '',
        safeJsonString(nutrition, '[]'),
        storage || '',
        usage_info || '',
        safeJsonString(faqs, '[]'),
        inside_dhaka_time || '24-48 Hours',
        outside_dhaka_time || '2-4 Days',
        delivery_info || '',
        return_policy || '',
        weight || '',
        dimensions || '',
        Number(low_stock_threshold) || 5,
        track_inventory !== undefined ? (Boolean(track_inventory) ? 1 : 0) : 1,
        technical_details || '',
        delivery_charge_enabled !== undefined ? (Boolean(delivery_charge_enabled) ? 1 : 0) : 0,
        Number(delivery_charge_amount) || 0,
        courier_note || '',
        youtube_link || '',
        condition_type || 'new',
        new Date().toISOString()
      ]
    );

    res.json(successResponse({ id: finalId, slug: finalSlug }, 'Product created successfully.'));
  } catch (err) {
    console.error('[Admin Create Product Error] ', err);
    res.status(500).json(errorResponse('Failed to create product.'));
  }
});

// Update Product
router.put('/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { 
      name, name_bn, sku, price, old_price, cost_price, buying_price, image_url, category, brand, badge, 
      stock_quantity, unit, status, featured, description, seo_title, seo_description, slug, 
      rating, view_count, review_count, short_description, gallery,
      variants, key_features, specifications, ingredients, nutrition, storage, usage_info, faqs,
      inside_dhaka_time, outside_dhaka_time, delivery_info, return_policy,
      weight, dimensions, low_stock_threshold, track_inventory, technical_details,
      delivery_charge_enabled, delivery_charge_amount, courier_note, youtube_link, condition_type
    } = req.body;

    const productRows = await db.executePrepared("SELECT stock_quantity, name FROM products WHERE id = ? LIMIT 1", [id]);
    const oldStock = productRows.length > 0 ? Number(productRows[0].stock_quantity) : 0;
    const productName = productRows.length > 0 ? productRows[0].name : 'Product';
    const finalBuyingPrice = Number(buying_price !== undefined ? buying_price : (cost_price !== undefined ? cost_price : 0)) || 0;
    const finalSlug = slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    await db.executePrepared(
      `UPDATE products SET 
        name = ?, name_bn = ?, sku = ?, price = ?, old_price = ?, cost_price = ?, buying_price = ?, image_url = ?, 
        category = ?, brand = ?, badge = ?, stock_quantity = ?, unit = ?, status = ?, featured = ?, 
        description = ?, seo_title = ?, seo_description = ?, slug = ?, rating = ?, view_count = ?, review_count = ?, 
        short_description = ?, gallery = ?, variants = ?, key_features = ?, specifications = ?, ingredients = ?, 
        nutrition = ?, storage = ?, usage_info = ?, faqs = ?, inside_dhaka_time = ?, outside_dhaka_time = ?, 
        delivery_info = ?, return_policy = ?, weight = ?, dimensions = ?, low_stock_threshold = ?, 
        track_inventory = ?, technical_details = ?, delivery_charge_enabled = ?, delivery_charge_amount = ?, 
        courier_note = ?, youtube_link = ?, condition_type = ?
      WHERE id = ?`,
      [
        name,
        name_bn || '',
        sku || '',
        Number(price) || 0,
        Number(old_price) || 0,
        finalBuyingPrice,
        finalBuyingPrice,
        image_url || '',
        category || 'Dry Food',
        brand || 'Shad Ghor',
        badge || '',
        Number(stock_quantity) || 0,
        unit || 'kg',
        status || 'active',
        featured !== undefined ? (Boolean(featured) ? 1 : 0) : 1,
        description || '',
        seo_title || '',
        seo_description || '',
        finalSlug,
        Number(rating) || 5.0,
        Number(view_count) || 0,
        Number(review_count) || 0,
        short_description || '',
        safeJsonString(gallery, '[]'),
        safeJsonString(variants, '[]'),
        safeJsonString(key_features, '[]'),
        safeJsonString(specifications, '{}'),
        ingredients || '',
        safeJsonString(nutrition, '[]'),
        storage || '',
        usage_info || '',
        safeJsonString(faqs, '[]'),
        inside_dhaka_time || '24-48 Hours',
        outside_dhaka_time || '2-4 Days',
        delivery_info || '',
        return_policy || '',
        weight || '',
        dimensions || '',
        Number(low_stock_threshold) || 5,
        track_inventory !== undefined ? (Boolean(track_inventory) ? 1 : 0) : 1,
        technical_details || '',
        delivery_charge_enabled !== undefined ? (Boolean(delivery_charge_enabled) ? 1 : 0) : 0,
        Number(delivery_charge_amount) || 0,
        courier_note || '',
        youtube_link || '',
        condition_type || 'new',
        id
      ]
    );

    // Trigger Low Stock Notification if stock dropped below threshold
    const newStock = Number(stock_quantity);
    const threshold = Number(low_stock_threshold) || 15;
    if (newStock < threshold && oldStock >= threshold) {
      await NotificationService.trigger('admin_low_stock', {
        product_name: productName,
        type: 'alert',
        link: `#/admin/products`
      });
    }

    res.json(successResponse(null, 'Product updated successfully.'));
  } catch (err) {
    console.error('[Admin Update Product Error] ', err);
    res.status(500).json(errorResponse('Failed to update product.'));
  }
});

// Quick Status Toggle (Live <-> Inactive <-> Draft)
router.patch('/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status || !['active', 'inactive', 'draft'].includes(status)) {
      return res.status(400).json(errorResponse('Valid status required (active, inactive, draft).'));
    }

    await db.executePrepared("UPDATE products SET status = ? WHERE id = ?", [status, id]);
    res.json(successResponse({ id, status }, `Product status updated to ${status}.`));
  } catch (err) {
    console.error('[Admin Update Product Status Error] ', err);
    res.status(500).json(errorResponse('Failed to update product status.'));
  }
});

// Quick Stock Update
router.patch('/:id/stock', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { stock_quantity } = req.body;
    if (stock_quantity === undefined || isNaN(Number(stock_quantity)) || Number(stock_quantity) < 0) {
      return res.status(400).json(errorResponse('Valid non-negative stock_quantity required.'));
    }

    const newStock = Math.max(0, parseInt(stock_quantity, 10));
    await db.executePrepared("UPDATE products SET stock_quantity = ? WHERE id = ?", [newStock, id]);
    res.json(successResponse({ id, stock_quantity: newStock }, `Product stock updated to ${newStock}.`));
  } catch (err) {
    console.error('[Admin Update Product Stock Error] ', err);
    res.status(500).json(errorResponse('Failed to update product stock.'));
  }
});

// Duplicate / Clone Product
router.post('/:id/duplicate', requireAdminAuth, async (req, res) => {
  try {
    const sourceId = req.params.id;
    const rows = await db.executePrepared("SELECT * FROM products WHERE id = ? LIMIT 1", [sourceId]);
    if (rows.length === 0) {
      return res.status(404).json(errorResponse('Source product not found to duplicate.'));
    }

    const source = rows[0];
    const newId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newName = `${source.name} (Copy)`;
    const newSlug = `${source.slug || source.name.toLowerCase().replace(/ /g, '-')}-copy-${Date.now().toString().slice(-4)}`;
    const newSku = source.sku ? `${source.sku}-COPY` : '';

    await db.executePrepared(
      `INSERT INTO products (
        id, name, name_bn, sku, price, old_price, cost_price, buying_price, image_url, category, brand, badge, 
        stock_quantity, unit, status, featured, description, seo_title, seo_description, slug, 
        rating, view_count, review_count, short_description, gallery,
        variants, key_features, specifications, ingredients, nutrition, storage, usage_info, faqs,
        inside_dhaka_time, outside_dhaka_time, delivery_info, return_policy,
        weight, dimensions, low_stock_threshold, track_inventory, technical_details,
        delivery_charge_enabled, delivery_charge_amount, courier_note, youtube_link, condition_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        newName,
        source.name_bn ? `${source.name_bn} (কপি)` : '',
        newSku,
        source.price,
        source.old_price,
        source.cost_price || 0,
        source.buying_price || 0,
        source.image_url,
        source.category,
        source.brand,
        source.badge,
        source.stock_quantity,
        source.unit,
        'draft', // Set cloned products as draft by default
        0,
        source.description,
        source.seo_title,
        source.seo_description,
        newSlug,
        source.rating || 5.0,
        0,
        0,
        source.short_description,
        source.gallery || '[]',
        source.variants || '[]',
        source.key_features || '[]',
        source.specifications || '{}',
        source.ingredients || '',
        source.nutrition || '[]',
        source.storage || '',
        source.usage_info || '',
        source.faqs || '[]',
        source.inside_dhaka_time,
        source.outside_dhaka_time,
        source.delivery_info,
        source.return_policy,
        source.weight,
        source.dimensions,
        source.low_stock_threshold || 5,
        source.track_inventory || 1,
        source.technical_details,
        source.delivery_charge_enabled || 0,
        source.delivery_charge_amount || 0,
        source.courier_note,
        source.youtube_link,
        source.condition_type || 'new',
        new Date().toISOString()
      ]
    );

    res.json(successResponse({ id: newId, name: newName }, 'Product duplicated successfully as draft.'));
  } catch (err) {
    console.error('[Admin Duplicate Product Error] ', err);
    res.status(500).json(errorResponse('Failed to duplicate product.'));
  }
});

// Delete Product
router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const check = await db.executePrepared("SELECT name FROM products WHERE id = ? LIMIT 1", [id]);
    if (check.length === 0) {
      return res.status(404).json(errorResponse('Product not found or already deleted.'));
    }

    const prodName = check[0].name;
    await db.executePrepared("DELETE FROM products WHERE id = ?", [id]);

    res.json(successResponse(null, `Product "${prodName}" deleted successfully.`));
  } catch (err) {
    console.error('[Admin Delete Product Error] ', err);
    res.status(500).json(errorResponse('Failed to delete product from database.'));
  }
});

export default router;
