import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { db } from '../../db/mysql';
import { requireAdminAuth } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/apiResponse';

const router = express.Router();

// Multer Config
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
  }
});

// Get Customer Management Stats
router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];

    const [totalResult] = await db.executePrepared("SELECT COUNT(*) as count FROM customers", []);
    const [activeResult] = await db.executePrepared("SELECT COUNT(*) as count FROM customers WHERE status = 'active'", []);
    const [blockedResult] = await db.executePrepared("SELECT COUNT(*) as count FROM customers WHERE status = 'suspended'", []);
    const [newTodayResult] = await db.executePrepared("SELECT COUNT(*) as count FROM customers WHERE created_at LIKE ?", [`${today}%`]);
    const [newMonthResult] = await db.executePrepared("SELECT COUNT(*) as count FROM customers WHERE created_at >= ?", [firstDayOfMonth]);
    
    // Active specific stats
    const [activeNowResult] = await db.executePrepared(
      "SELECT COUNT(*) as count FROM customers WHERE status = 'active' AND last_login_at >= ?", 
      [twentyFourHoursAgo]
    );
    const [newActiveTodayResult] = await db.executePrepared(
      "SELECT COUNT(*) as count FROM customers WHERE status = 'active' AND created_at LIKE ?", 
      [`${today}%`]
    );
    const [activeThisMonthResult] = await db.executePrepared(
      "SELECT COUNT(*) as count FROM customers WHERE status = 'active' AND created_at >= ?", 
      [firstDayOfMonth]
    );
    const [withOrdersResult] = await db.executePrepared(`
      SELECT COUNT(DISTINCT c.id) as count 
      FROM customers c 
      JOIN orders o ON c.email = o.customer_email 
      WHERE c.status = 'active'
    `, []);

    // Blocked specific stats
    const [blockedTodayResult] = await db.executePrepared(
      "SELECT COUNT(*) as count FROM customers WHERE status = 'suspended' AND blocked_at LIKE ?", 
      [`${today}%`]
    );
    const [blockedMonthResult] = await db.executePrepared(
      "SELECT COUNT(*) as count FROM customers WHERE status = 'suspended' AND blocked_at >= ?", 
      [firstDayOfMonth]
    );
    const [blockedWithOrdersResult] = await db.executePrepared(`
      SELECT COUNT(DISTINCT c.id) as count 
      FROM customers c 
      JOIN orders o ON c.email = o.customer_email 
      WHERE c.status = 'suspended'
    `, []);

    res.json(successResponse({
      total: totalResult.count,
      active: activeResult.count,
      blocked: blockedResult.count,
      newToday: newTodayResult.count,
      newMonth: newMonthResult.count,
      // Active Specific
      activeNow: activeNowResult.count,
      newActiveToday: newActiveTodayResult.count,
      activeThisMonth: activeThisMonthResult.count,
      activeWithOrders: withOrdersResult.count,
      // Blocked Specific
      blockedToday: blockedTodayResult.count,
      blockedMonth: blockedMonthResult.count,
      blockedWithOrders: blockedWithOrdersResult.count
    }));
  } catch (err) {
    console.error('[Admin Get Customer Stats Error] ', err);
    res.status(500).json(errorResponse('Failed to fetch customer statistics.'));
  }
});

// Profile Image Upload Route
router.post('/:id/upload-image', requireAdminAuth, upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id;
    if (!req.file) {
      return res.status(400).json(errorResponse('No image file uploaded.'));
    }

    const filename = `customer_${id}_${Date.now()}.webp`;
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'customers', filename);
    const thumbnailFilename = `customer_${id}_${Date.now()}_thumb.webp`;
    const thumbnailPath = path.join(process.cwd(), 'public', 'uploads', 'customers', thumbnailFilename);

    // Ensure directory exists
    const dir = path.join(process.cwd(), 'public', 'uploads', 'customers');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Process main image (resize to max 800x800, convert to webp)
    await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(uploadPath);

    // Process thumbnail (resize to 150x150)
    await sharp(req.file.buffer)
      .resize(150, 150, { fit: 'cover' })
      .webp({ quality: 70 })
      .toFile(thumbnailPath);

    const imageUrl = `/uploads/customers/${filename}`;
    // Update DB
    await db.executePrepared("UPDATE customers SET profile_image = ? WHERE id = ?", [imageUrl, id]);

    res.json(successResponse({ imageUrl }, 'Profile image uploaded successfully.'));
  } catch (err) {
    console.error('[Admin Upload Image Error] ', err);
    res.status(500).json(errorResponse('Failed to process and upload image.'));
  }
});

// Get Paginated & Filtered Customers
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string || '').toLowerCase().trim();
    const status = req.query.status as string || 'all';
    const sortBy = req.query.sortBy as string || 'newest';
    const hasOrders = req.query.hasOrders as string || 'all'; // all, yes, no
    
    // Extra Filters
    const minOrders = parseInt(req.query.min_orders as string) || 0;
    const minSpent = parseFloat(req.query.min_spent as string) || 0;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM customers c
      LEFT JOIN (
        SELECT customer_email, COUNT(*) as order_count, SUM(total_amount) as total_spent, MAX(created_at) as last_order_date
        FROM orders
        GROUP BY customer_email
      ) o ON c.email = o.customer_email
      WHERE 1=1
    `;
    let params: any[] = [];

    if (search) {
      baseQuery += " AND (LOWER(c.full_name) LIKE ? OR LOWER(c.full_name_bn) LIKE ? OR LOWER(c.email) LIKE ? OR LOWER(c.phone) LIKE ? OR CAST(c.id AS CHAR) LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (status !== 'all') {
      const dbStatus = status === 'blocked' ? 'suspended' : status;
      baseQuery += " AND c.status = ?";
      params.push(dbStatus);
    }

    if (req.query.block_reason && req.query.block_reason !== 'all') {
      baseQuery += " AND c.block_reason = ?";
      params.push(req.query.block_reason);
    }

    if (hasOrders === 'yes') {
      baseQuery += " AND o.order_count > 0";
    } else if (hasOrders === 'no') {
      baseQuery += " AND (o.order_count IS NULL OR o.order_count = 0)";
    }

    if (minOrders > 0) {
      baseQuery += " AND o.order_count >= ?";
      params.push(minOrders);
    }

    if (minSpent > 0) {
      baseQuery += " AND o.total_spent >= ?";
      params.push(minSpent);
    }

    if (startDate) {
      baseQuery += " AND c.created_at >= ?";
      params.push(startDate);
    }

    if (endDate) {
      baseQuery += " AND c.created_at <= ?";
      params.push(`${endDate} 23:59:59`);
    }

    // Sort Mapping
    let orderBy = "c.created_at DESC";
    switch (sortBy) {
      case 'oldest': orderBy = "c.created_at ASC"; break;
      case 'name_az': orderBy = "c.full_name ASC"; break;
      case 'name_za': orderBy = "c.full_name DESC"; break;
      case 'highest_spending': orderBy = "COALESCE(o.total_spent, 0) DESC"; break;
      case 'lowest_spending': orderBy = "COALESCE(o.total_spent, 0) ASC"; break;
      case 'most_orders': orderBy = "COALESCE(o.order_count, 0) DESC"; break;
      case 'least_orders': orderBy = "COALESCE(o.order_count, 0) ASC"; break;
      case 'recently_active': orderBy = "c.last_login_at DESC"; break;
    }

    const countResult = await db.executePrepared(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit) || 1;

    const query = `
      SELECT 
        c.*, 
        COALESCE(o.order_count, 0) as total_orders, 
        COALESCE(o.total_spent, 0) as total_spent,
        o.last_order_date
      ${baseQuery} 
      ORDER BY ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    const customers = await db.executePrepared(query, [...params, limit, offset]);

    res.json(successResponse({
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    }));
  } catch (err) {
    console.error('[Admin Get Customers Error] ', err);
    res.status(500).json(errorResponse('Failed to fetch customers.'));
  }
});

// Export Customers CSV
router.get('/export/csv', requireAdminAuth, async (req, res) => {
  try {
    const search = (req.query.search as string || '').toLowerCase().trim();
    const status = req.query.status as string || 'all';
    
    let baseQuery = `
      FROM customers c
      LEFT JOIN (
        SELECT customer_email, COUNT(*) as order_count, SUM(total_amount) as total_spent, MAX(created_at) as last_order_date
        FROM orders
        GROUP BY customer_email
      ) o ON c.email = o.customer_email
      WHERE 1=1
    `;
    let params: any[] = [];

    if (search) {
      baseQuery += " AND (LOWER(c.full_name) LIKE ? OR LOWER(c.full_name_bn) LIKE ? OR LOWER(c.email) LIKE ? OR LOWER(c.phone) LIKE ? OR CAST(c.id AS CHAR) LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (status !== 'all') {
      const dbStatus = status === 'blocked' ? 'suspended' : status;
      baseQuery += " AND c.status = ?";
      params.push(dbStatus);
    }

    const query = `
      SELECT 
        c.id, c.full_name, c.full_name_bn, c.email, c.phone, c.status, c.created_at, c.last_login_at,
        c.block_reason, c.blocked_at, c.blocked_by_name,
        COALESCE(o.order_count, 0) as total_orders, 
        COALESCE(o.total_spent, 0) as total_spent
      ${baseQuery} 
      ORDER BY c.created_at DESC
    `;
    const customers = await db.executePrepared(query, params);

    // Convert to CSV
    const headers = ['ID', 'Name', 'Bengali Name', 'Email', 'Phone', 'Status', 'Joined', 'Last Active', 'Total Orders', 'Total Spent', 'Block Reason', 'Blocked At', 'Blocked By'];
    const rows = customers.map((c: any) => [
      c.id,
      `"${c.full_name}"`,
      `"${c.full_name_bn || ''}"`,
      c.email,
      c.phone,
      c.status,
      c.created_at,
      c.last_login_at || 'N/A',
      c.total_orders,
      c.total_spent,
      `"${c.block_reason || ''}"`,
      c.blocked_at || '',
      `"${c.blocked_by_name || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers_export_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (err) {
    console.error('[Admin Export Customers Error] ', err);
    res.status(500).json(errorResponse('Failed to export customers.'));
  }
});

// Get Single Customer Details
router.get('/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Get customer basic info
    const customerRows = await db.executePrepared("SELECT * FROM customers WHERE id = ? LIMIT 1", [id]);
    if (customerRows.length === 0) return res.status(404).json(errorResponse('Customer not found.'));
    const customer = customerRows[0];

    // Get order statistics
    const orderStatsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'Processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN status = 'Shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN status = 'Returned' THEN 1 ELSE 0 END) as returned_orders,
        SUM(total_amount) as total_spending
      FROM orders
      WHERE customer_email = ?
    `;
    const [stats] = await db.executePrepared(orderStatsQuery, [customer.email]);

    // Get recent orders
    const recentOrders = await db.executePrepared(
      "SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC LIMIT 10",
      [customer.email]
    );

    res.json(successResponse({
      ...customer,
      stats: {
        total_orders: stats.total_orders || 0,
        delivered_orders: stats.delivered_orders || 0,
        pending_orders: stats.pending_orders || 0,
        processing_orders: stats.processing_orders || 0,
        shipped_orders: stats.shipped_orders || 0,
        cancelled_orders: stats.cancelled_orders || 0,
        returned_orders: stats.returned_orders || 0,
        total_spending: stats.total_spending || 0
      },
      recent_orders: recentOrders
    }));
  } catch (err) {
    console.error('[Admin Get Customer Details Error] ', err);
    res.status(500).json(errorResponse('Failed to fetch customer details.'));
  }
});

// Update Customer Basic Info
router.put('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { full_name, full_name_bn, phone, address } = req.body;
    const id = req.params.id;

    if (!full_name || !phone) {
      return res.status(400).json(errorResponse('Name and phone are required.'));
    }

    await db.executePrepared(
      "UPDATE customers SET full_name = ?, full_name_bn = ?, phone = ?, address = ? WHERE id = ?",
      [full_name, full_name_bn, phone, address, id]
    );

    res.json(successResponse(null, 'Customer information updated successfully.'));
  } catch (err: any) {
    console.error('[Admin Update Customer Error] ', err);
    if (err.message?.includes('Duplicate entry')) {
      return res.status(400).json(errorResponse('Phone number already in use by another customer.'));
    }
    res.status(500).json(errorResponse('Failed to update customer information.'));
  }
});

// Update Customer Status (Block/Unblock)
router.put('/:id/status', requireAdminAuth, async (req: any, res) => {
  try {
    const id = req.params.id;
    const { status, reason } = req.body;
    const admin = req.admin;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json(errorResponse('Invalid status. Use "active" or "suspended".'));
    }

    let query = "UPDATE customers SET status = ?, updated_at = CURRENT_TIMESTAMP";
    let params: any[] = [status];

    if (status === 'suspended') {
      query += ", block_reason = ?, blocked_at = ?, blocked_by_id = ?, blocked_by_name = ?";
      params.push(
        reason || 'Violation of terms of service',
        new Date().toISOString(),
        admin.id,
        admin.name
      );
    } else {
      // Clear block info when unblocking
      query += ", block_reason = NULL, blocked_at = NULL, blocked_by_id = NULL, blocked_by_name = NULL";
    }

    query += " WHERE id = ?";
    params.push(id);

    const result = await db.executePrepared(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse('Customer not found.'));
    }

    // Log the action
    try {
      await db.executePrepared(
        "INSERT INTO admin_audit_logs (admin_id, admin_name, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)",
        [admin.id, admin.name, status === 'active' ? 'Unblock Customer' : 'Block Customer', 'Customers', id, JSON.stringify({ reason, status })]
      );
    } catch (auditErr) {
      console.error('[Audit Log Error] ', auditErr);
    }

    res.json(successResponse(null, `Customer account ${status === 'active' ? 'activated' : 'suspended'} successfully.`));
  } catch (err) {
    console.error('[Admin Update Customer Status Error] ', err);
    res.status(500).json(errorResponse('Failed to update customer status.'));
  }
});

export default router;
