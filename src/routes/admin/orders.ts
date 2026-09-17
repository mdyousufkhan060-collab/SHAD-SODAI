import express from 'express';
import { db } from '../../db/mysql';
import { requireAdminAuth } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/apiResponse';
import { NotificationService } from '../../services/notificationService';

const router = express.Router();

// Get Paginated Orders
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string || 'all';
    const search = (req.query.search as string || '').toLowerCase().trim();
    const offset = (page - 1) * limit;

    let baseQuery = "FROM orders WHERE 1=1";
    let params: any[] = [];

    if (status !== 'all') {
      baseQuery += " AND status = ?";
      params.push(status);
    }

    if (search) {
      baseQuery += " AND (id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const countResult = await db.executePrepared(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit) || 1;

    const orders = await db.executePrepared(`SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);

    res.json({
      success: true,
      orders,
      total,
      page,
      limit,
      pages: totalPages
    });
  } catch (err) {
    console.error('[Admin Get Orders Error] ', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders.' });
  }
});

// Update Order Status
router.put('/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    const orderRows = await db.executePrepared("SELECT * FROM orders WHERE id = ? LIMIT 1", [id]);
    if (orderRows.length === 0) return res.status(404).json(errorResponse('Order not found.'));
    const order = orderRows[0];

    await db.executePrepared("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    // Trigger Notifications
    let eventKey = '';
    switch (status) {
      case 'Confirmed': eventKey = 'order_confirmed'; break;
      case 'Shipped': eventKey = 'order_shipped'; break;
      case 'Delivered': eventKey = 'order_delivered'; break;
      case 'Cancelled': eventKey = 'order_cancelled'; break;
    }

    if (eventKey) {
      await NotificationService.trigger(eventKey, {
        customer_name: order.customer_name,
        order_id: order.id,
        order_total: order.total_amount,
        link: `#/account/orders/${order.id}`,
        related_id: order.id
      });
    }

    res.json(successResponse(null, `Order status updated to ${status}`));
  } catch (err) {
    console.error('[Admin Update Order Status Error] ', err);
    res.status(500).json(errorResponse('Failed to update order status.'));
  }
});

export default router;
