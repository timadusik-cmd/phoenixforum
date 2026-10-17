import db from '../db.js';

/**
 * Returns an array of badge objects assigned to a user
 */
export function getUserBadges(userId, fallbackUser = {}) {
  try {
    const rows = db.prepare(`
      SELECT ub.badge_key, ub.is_primary, ub.display_order,
             cb.title as custom_title, cb.subtitle as custom_subtitle,
             cb.color as custom_color, cb.glow as custom_glow,
             cb.icon as custom_icon, cb.level as custom_level
      FROM user_badges ub
      LEFT JOIN custom_badges cb ON ub.badge_key = cb.key
      WHERE ub.user_id = ?
      ORDER BY ub.is_primary DESC, ub.display_order ASC, ub.created_at ASC
    `).all(userId);

    if (rows && rows.length > 0) {
      return rows.map(r => ({
        key: r.badge_key,
        is_primary: r.is_primary === 1,
        display_order: r.display_order,
        title: r.custom_title || null,
        subtitle: r.custom_subtitle || null,
        color: r.custom_color || null,
        glow: r.custom_glow || null,
        icon: r.custom_icon || null,
        level: r.custom_level || null
      }));
    }
  } catch (err) {
    console.error('Error fetching user badges:', err);
  }

  // Fallback to user role
  const role = fallbackUser.role || 'player';
  const badgeTitle = fallbackUser.role_badge || 'Игрок';
  const roleColor = fallbackUser.role_color || '#94A3B8';

  return [{
    key: role,
    title: badgeTitle,
    subtitle: 'Пользователь',
    color: roleColor,
    is_primary: true
  }];
}
