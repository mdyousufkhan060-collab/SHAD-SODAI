import { db } from '../db/mysql';

export const NotificationService = {
  async trigger(eventKey: string, data: any) {
    try {
      // 1. Check master setting
      const masterRows = await db.executePrepared("SELECT config_value FROM site_settings WHERE config_key = ? LIMIT 1", ['notifications_master_enabled']);
      if (masterRows.length > 0 && masterRows[0].config_value === 'false') return;

      // 2. Load template
      const templates = await db.executePrepared("SELECT * FROM notification_templates WHERE event_key = ? LIMIT 1", [eventKey]);
      if (templates.length === 0 || !templates[0].enabled) return;

      const template = templates[0];
      
      // 3. Process variables
      const replaceVars = (text: string) => {
        if (!text) return '';
        let result = text;
        const vars = {
          customer_name: data.customer_name || 'Customer',
          order_id: data.order_id || '',
          order_total: data.order_total || '',
          currency: '৳',
          tracking_number: data.tracking_number || '',
          product_name: data.product_name || '',
          status: data.status || ''
        };
        for (const [key, val] of Object.entries(vars)) {
          result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(val));
        }
        return result;
      };

      const titleEn = replaceVars(template.title_en);
      const messageEn = replaceVars(template.message_en);
      const titleBn = replaceVars(template.title_bn);
      const messageBn = replaceVars(template.message_bn);

      // 4. Save Record
      const userType = eventKey.startsWith('admin_') ? 'admin' : 'customer';
      const userId = userType === 'admin' ? null : data.user_id;

      await db.executePrepared(
        "INSERT INTO notifications (user_id, user_type, title, message, type, link, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userId,
          userType,
          `${titleBn} | ${titleEn}`,
          `${messageBn} \n\n ${messageEn}`,
          data.type || 'info',
          data.link || null,
          data.related_id || null,
          new Date().toISOString()
        ]
      );

      console.log(`[Notification] Triggered: ${eventKey} for ${userType} ${userId || '(Global Admin)'}`);
    } catch (err) {
      console.error('[Notification Trigger Error] ', err);
    }
  }
};
