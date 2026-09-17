import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'shadghor_ultra_secure_secret_2026_key_99';

export const requireAdminAuth = async (req: any, res: Response, next: NextFunction) => {
  let token = req.cookies?.admin_session;
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in as an administrator.' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // Validate database record still exists and is active
    const rows = await db.executePrepared(
      "SELECT id, name, email, role, role_id, status FROM admin_users WHERE id = ? AND status = 'active' LIMIT 1",
      [decoded.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid session or account deactivated.' });
    }

    req.admin = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role,
      role_id: rows[0].role_id
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

export const requireCustomerAuth = async (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in to your account.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    const rows = await db.executePrepared("SELECT id, full_name, email, phone FROM customers WHERE id = ? LIMIT 1", [decoded.id]);
    if (rows.length === 0) return res.status(401).json({ error: 'Unauthorized' });

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};
