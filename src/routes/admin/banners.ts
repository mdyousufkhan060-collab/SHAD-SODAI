import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { db } from '../../db/mysql';
import { requireAdminAuth } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/apiResponse';

const router = express.Router();

// Multer Config for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|avif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp, avif) are allowed!'));
  }
});

// Helper to ensure directory exists
const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Image processing endpoint
router.post('/upload', requireAdminAuth, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('No image file uploaded.'));
    }

    const type = req.query.type as string; // 'desktop' or 'mobile'
    const bannerType = req.query.bannerType as string || 'main'; // for folder structure
    
    const targetWidth = type === 'mobile' ? 1080 : 1920;
    const targetHeight = type === 'mobile' ? 1350 : 700;

    const timestamp = Date.now();
    const filename = `banner_${type}_${timestamp}.webp`;
    const relativePath = `/uploads/banners/${bannerType}/${filename}`;
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', 'banners', bannerType, filename);

    ensureDir(path.dirname(absolutePath));

    // Get original metadata for validation response
    const metadata = await sharp(req.file.buffer).metadata();

    // Process image
    // fit: 'cover' ensures the area is filled without stretching, though it may crop if aspect ratio differs.
    // However, the user said "Never stretch/distort" and "Never crop important content unexpectedly".
    // Banners usually require a specific aspect ratio. 
    // We will use 'inside' with high quality and no enlargement if smaller than target, 
    // OR 'cover' if we want to strictly fill the banner area (standard for heroes).
    // I will use 'cover' as it's standard for hero banners to ensure they always fill the slot.
    
    const processed = await sharp(req.file.buffer)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85, effort: 6 })
      .toFile(absolutePath);

    res.json(successResponse({
      url: relativePath,
      filename: filename,
      originalSize: req.file.size,
      optimizedSize: processed.size,
      dimensions: {
        width: processed.width,
        height: processed.height
      },
      originalDimensions: {
        width: metadata.width,
        height: metadata.height
      },
      format: processed.format
    }, 'Image processed and uploaded successfully.'));
  } catch (err) {
    console.error('[Admin Banner Upload Error] ', err);
    res.status(500).json(errorResponse('Failed to process and upload banner image.'));
  }
});

// GET all banners for admin
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const location = req.query.location as string;
    let query = `
      SELECT b.*, c.name as category_name, c.name_bn as category_name_bn
      FROM homepage_banners b
      LEFT JOIN categories c ON b.category_id = c.id
    `;
    let params: any[] = [];

    if (location) {
      query += " WHERE b.display_location = ?";
      params.push(location);
    }

    query += " ORDER BY b.sort_order ASC, b.created_at DESC";
    
    const rows = await db.executePrepared(query, params);
    res.json(successResponse(rows));
  } catch (err) {
    console.error('[Admin Get Banners Error] ', err);
    res.status(500).json(errorResponse('Failed to fetch banners.'));
  }
});

// POST create banner
router.post('/', requireAdminAuth, async (req: any, res) => {
  try {
    const b = req.body;
    
    const [result]: any = await db.executePrepared(
      `INSERT INTO homepage_banners (
        name, image_url_desktop, image_url_mobile, heading_en, heading_bn, 
        description_en, description_bn, alt_en, alt_bn, category_id, button_text_en, button_text_bn, 
        button_link, destination_type, display_location, status, sort_order, start_date, end_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.name, b.image_url_desktop, b.image_url_mobile, b.heading_en || null, b.heading_bn || null,
        b.description_en || null, b.description_bn || null, b.alt_en || null, b.alt_bn || null,
        b.category_id || null, b.button_text_en || null, b.button_text_bn || null,
        b.button_link || null, b.destination_type || 'internal', b.display_location || 'homepage_hero',
        b.status || 'active', b.sort_order || 0, b.start_date || null, b.end_date || null, new Date().toISOString()
      ]
    );

    res.json(successResponse({ id: result.insertId }, 'Banner created successfully.'));
  } catch (err) {
    console.error('[Admin Create Banner Error] ', err);
    res.status(500).json(errorResponse('Failed to create banner.'));
  }
});

// PUT update banner
router.put('/:id', requireAdminAuth, async (req: any, res) => {
  try {
    const id = req.params.id;
    const b = req.body;

    await db.executePrepared(
      `UPDATE homepage_banners SET 
        name = ?, image_url_desktop = ?, image_url_mobile = ?, heading_en = ?, heading_bn = ?, 
        description_en = ?, description_bn = ?, alt_en = ?, alt_bn = ?, category_id = ?, button_text_en = ?, button_text_bn = ?, 
        button_link = ?, destination_type = ?, display_location = ?, status = ?, 
        sort_order = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        b.name, b.image_url_desktop, b.image_url_mobile, b.heading_en || null, b.heading_bn || null,
        b.description_en || null, b.description_bn || null, b.alt_en || null, b.alt_bn || null,
        b.category_id || null, b.button_text_en || null, b.button_text_bn || null,
        b.button_link || null, b.destination_type || 'internal', b.display_location || 'homepage_hero',
        b.status || 'active', b.sort_order || 0, b.start_date || null, b.end_date || null, id
      ]
    );

    res.json(successResponse(null, 'Banner updated successfully.'));
  } catch (err) {
    console.error('[Admin Update Banner Error] ', err);
    res.status(500).json(errorResponse('Failed to update banner.'));
  }
});

// PATCH update status
router.patch('/:id/status', requireAdminAuth, async (req: any, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    await db.executePrepared("UPDATE homepage_banners SET status = ? WHERE id = ?", [status, id]);
    res.json(successResponse(null, 'Banner status updated.'));
  } catch (err) {
    console.error('[Admin Update Banner Status Error] ', err);
    res.status(500).json(errorResponse('Failed to update banner status.'));
  }
});

// DELETE banner
router.delete('/:id', requireAdminAuth, async (req: any, res) => {
  try {
    const id = req.params.id;
    await db.executePrepared("DELETE FROM homepage_banners WHERE id = ?", [id]);
    res.json(successResponse(null, 'Banner deleted successfully.'));
  } catch (err) {
    console.error('[Admin Delete Banner Error] ', err);
    res.status(500).json(errorResponse('Failed to delete banner.'));
  }
});

export default router;
