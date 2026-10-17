// Phoenix RP Forum - Role Badges System
// Exact design matching the Phoenix RP brand guidelines

export const BADGES = {
  superadmin: {
    key: 'superadmin',
    title: 'ГЛАВНЫЙ АДМИНИСТРАТОР',
    subtitle: 'Команда проекта',
    color: '#FF1F36',
    glow: 'rgba(255, 31, 54, 0.45)',
    icon: 'crown',
    level: 5,
    hasDevBadge: false
  },
  admin: {
    key: 'admin',
    title: 'АДМИНИСТРАТОР',
    subtitle: 'Команда проекта',
    color: '#E52338',
    glow: 'rgba(229, 35, 56, 0.40)',
    icon: 'crown',
    level: 4,
    hasDevBadge: false
  },
  moderator: {
    key: 'moderator',
    title: 'МОДЕРАТОР',
    subtitle: 'Команда форума',
    color: '#D81B60',
    glow: 'rgba(216, 27, 96, 0.40)',
    icon: 'crown',
    level: 3,
    hasDevBadge: false
  },
  helper: {
    key: 'helper',
    title: 'ХЕЛПЕР',
    subtitle: 'Команда форума',
    color: '#FF9800',
    glow: 'rgba(255, 152, 0, 0.40)',
    icon: 'shield',
    level: 2,
    hasDevBadge: false
  },
  verified: {
    key: 'verified',
    title: 'ПРОВЕРЕННЫЙ',
    subtitle: 'Пользователь',
    color: '#0091FF',
    glow: 'rgba(0, 145, 255, 0.40)',
    icon: 'verified',
    level: 1,
    hasDevBadge: false
  },
  streamer: {
    key: 'streamer',
    title: 'СТРИМЕР',
    subtitle: 'Специальный статус',
    color: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.40)',
    icon: 'star',
    level: 1,
    hasDevBadge: false
  },
  vip: {
    key: 'vip',
    title: 'VIP',
    subtitle: 'Привилегированный статус',
    color: '#10B981',
    glow: 'rgba(16, 185, 129, 0.40)',
    icon: 'diamond',
    level: 1,
    hasDevBadge: false
  },
  player: {
    key: 'player',
    title: 'ИГРОК',
    subtitle: 'Обычный пользователь',
    color: '#94A3B8',
    glow: 'rgba(148, 163, 184, 0.28)',
    icon: 'user',
    level: 1,
    hasDevBadge: false
  },
  guest: {
    key: 'guest',
    title: 'ГОСТЬ',
    subtitle: 'Незарегистрированный',
    color: '#64748B',
    glow: 'rgba(100, 116, 139, 0.22)',
    icon: 'userPlus',
    level: 0,
    hasDevBadge: false
  },
  developer: {
    key: 'developer',
    title: 'РАЗРАБОТЧИК',
    subtitle: 'Команда проекта',
    color: '#7C3AED',
    glow: 'rgba(124, 58, 237, 0.45)',
    icon: 'code',
    level: 5,
    hasDevBadge: true
  }
};

// Registry of dynamically loaded custom badges
export const CUSTOM_BADGES_REGISTRY = new Map();

export function registerCustomBadges(badgesList = []) {
  if (!Array.isArray(badgesList)) return;
  badgesList.forEach(b => {
    if (b && b.key) {
      CUSTOM_BADGES_REGISTRY.set(b.key.toLowerCase().trim(), {
        key: b.key,
        title: b.title,
        subtitle: b.subtitle || 'Особый статус',
        color: b.color || '#FF1F36',
        glow: b.glow || 'rgba(255, 31, 54, 0.40)',
        icon: b.icon || 'crown',
        level: b.level || 1,
        style: b.style || 'classic',
        isCustom: true
      });
    }
  });
}

export const BADGE_ICONS = {
  crown: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/></svg>`,
  verified: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14.5l-3.5-3.5 1.41-1.41L11 12.67l6.09-6.09 1.41 1.41L11 15.5z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
  diamond: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5L2 9l10 12L22 9l-3-6zM9.62 8l1.5-3h1.76l1.5 3H9.62zM11 10v6.68L5.44 10H11zm2 0h5.56L13 16.68V10zm-6.26-2l1.62-3h-1.5L4.4 8h2.34zm9.4 0h2.34l-2.46-3h-1.5l1.62 3z"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
  userPlus: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm5-4h-2v2h-2v-2h-2V8h2V6h2v2h2v2z"/></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  flame: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM12 20c-3.31 0-6-2.69-6-6 0-1.53.58-2.95 1.55-4.04.1.28.24.55.45.79 1.14 1.3 3.01 1.75 4.63 1.07 1.48-.62 2.37-2.12 2.37-3.82 0-.64-.13-1.25-.37-1.81 1.93 1.62 3.37 4.07 3.37 6.81 0 3.31-2.69 6-6 6z"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  award: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`,
  police: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4zm-2 5V6a2 2 0 1 1 4 0v1h-4zm-5 8v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2H5zm1 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1H6z"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 8.5 3 11l6.5 2.5L12 20l2.5-6.5L21 11l-6.5-2.5L12 2z"/></svg>`,
  hammer: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 2l5 5-2 2-5-5 2-2zm-2.8 4.2l-9.9 9.9c-.4.4-.4 1 0 1.4l2.1 2.1c.4.4 1 .4 1.4 0l9.9-9.9-3.5-3.5z"/></svg>`
};

// Vector SVG Phoenix Bird for sharp emblem rendering
export const PHOENIX_EMBLEM_SVG = `
  <svg viewBox="0 0 100 100" fill="currentColor" class="phoenix-vector-bird">
    <path d="M50 12c-2 6-5 11-10 15 4 1 7 0 9-1-6 8-15 14-25 15 6 3 13 4 20 2-8 7-18 10-28 8 7 6 16 9 26 7-6 6-14 9-23 8 9 8 20 10 31 7-4 7-9 13-16 17 9 0 17-4 24-10-3 9-8 16-15 21 11-3 20-10 27-20 7 10 16 17 27 20-7-5-12-12-15-21 7 6 15 10 24 10-7-4-12-10-16-17 11 3 22 1 31-7-9 1-17-2-23-8 10 2 19-1 26-7-10 2-20-1-28-8 7 2 14 1 20-2-10-1-19-7-25-15 2 1 5 2 9 1-5-4-8-9-10-15z" />
  </svg>
`;

/**
 * Resolves user/role string or badge object to a badge definition
 */
export function getBadgeConfig(roleKey, roleBadge) {
  if (!roleKey && !roleBadge) return BADGES.player;

  const key = String(roleKey || '').toLowerCase().trim();
  const badgeTitle = String(roleBadge || '').toLowerCase().trim();

  // 1. Direct match in Custom Badges Registry
  if (CUSTOM_BADGES_REGISTRY.has(key)) {
    return CUSTOM_BADGES_REGISTRY.get(key);
  }

  // 2. Direct match in Built-in Badges
  if (BADGES[key]) return BADGES[key];

  // Aliases
  if (key === 'main_admin' || key === 'root') return BADGES.superadmin;
  if (key === 'dev') return BADGES.developer;
  if (key === 'mod') return BADGES.moderator;
  if (key === 'user') return BADGES.player;

  // 3. Search in Custom Badges by Title
  for (const [_, customBadge] of CUSTOM_BADGES_REGISTRY.entries()) {
    if (customBadge.title.toLowerCase() === badgeTitle) {
      return customBadge;
    }
  }

  // 4. Built-in Title matching in Russian
  if (badgeTitle.includes('главный')) return BADGES.superadmin;
  if (badgeTitle.includes('разработчик') || key.includes('dev')) return BADGES.developer;
  if (badgeTitle.includes('администратор')) return BADGES.admin;
  if (badgeTitle.includes('модератор')) return BADGES.moderator;
  if (badgeTitle.includes('хелпер')) return BADGES.helper;
  if (badgeTitle.includes('проверен')) return BADGES.verified;
  if (badgeTitle.includes('стример')) return BADGES.streamer;
  if (badgeTitle.includes('vip') || badgeTitle.includes('вип')) return BADGES.vip;
  if (badgeTitle.includes('гость')) return BADGES.guest;
  if (badgeTitle.includes('игрок')) return BADGES.player;

  return BADGES.player;
}

/**
 * Renders the full stylized Role Badge matching the reference design
 * @param {string|object} roleOrUser - Role key, custom badge object, or user object
 * @param {object} options - Sizing and display options { size: 'normal'|'sidebar'|'compact'|'mini' }
 */
export function renderRoleBadge(roleOrUser, options = {}) {
  let config = null;

  if (typeof roleOrUser === 'string') {
    config = getBadgeConfig(roleOrUser);
  } else if (roleOrUser && typeof roleOrUser === 'object') {
    // If it's already a full badge object with title and color
    if (roleOrUser.title && roleOrUser.color) {
      config = {
        key: roleOrUser.key || 'custom',
        title: roleOrUser.title,
        subtitle: roleOrUser.subtitle || 'Особый статус',
        color: roleOrUser.color,
        glow: roleOrUser.glow || `rgba(255, 31, 54, 0.40)`,
        icon: roleOrUser.icon || 'crown',
        level: roleOrUser.level || 1,
        style: roleOrUser.style || 'classic',
        isCustom: !!roleOrUser.isCustom
      };
    } else {
      const roleKey = roleOrUser.key || roleOrUser.role || roleOrUser.author_role || 'player';
      const roleBadge = roleOrUser.title || roleOrUser.role_badge || roleOrUser.author_badge || '';
      config = getBadgeConfig(roleKey, roleBadge);
      if (roleOrUser.style) {
        config = { ...config, style: roleOrUser.style };
      }
    }
  }

  if (!config) config = BADGES.player;

  const size = options.size || 'normal'; // 'normal', 'sidebar', 'compact', 'mini'
  const customClass = options.class || '';
  const iconSvg = BADGE_ICONS[config.icon] || BADGE_ICONS.crown;

  // Variant 2: Neon Crystal (Blue Plate Graphic)
  if (config.style === 'neon_crystal' || config.style === 'blue_btn') {
    return `
      <div class="rp-role-badge badge-style-neon badge-${size} ${customClass}" 
           style="--badge-accent: ${config.color || '#38BDF8'}; --badge-glow: ${config.glow || 'rgba(56, 189, 248, 0.45)'};" 
           data-role="${config.key}" 
           data-style="neon_crystal"
           title="${config.title} • ${config.subtitle}">
        <div class="badge-neon-icon">
          ${iconSvg}
        </div>
        <div class="badge-neon-content">
          <div class="badge-title">${config.title}</div>
          ${config.subtitle ? `<div class="badge-subtitle">${config.subtitle}</div>` : ''}
        </div>
      </div>
    `;
  }

  // Determine emblem (built-in PNG vs dynamic SVG icon emblem)
  const isBuiltIn = !!BADGES[config.key];
  const emblemHtml = isBuiltIn ? `
    <img src="/assets/badge_emblem_${config.key}.png" 
         alt="${config.title}" 
         class="badge-emblem-img" 
         loading="eager" 
         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
    <div class="badge-emblem-fallback" style="display: none; background: radial-gradient(circle, ${config.color}35 0%, #0d0f17 100%); border: 1.5px solid ${config.color}; color: ${config.color};">
      ${iconSvg}
    </div>
  ` : `
    <div class="badge-emblem-fallback" style="background: radial-gradient(circle, ${config.color}35 0%, #0d0f17 100%); border: 1.5px solid ${config.color}; color: ${config.color}; box-shadow: 0 0 8px ${config.glow};">
      ${iconSvg}
    </div>
  `;

  return `
    <div class="rp-role-badge badge-${size} ${customClass}" 
         style="--badge-accent: ${config.color}; --badge-glow: ${config.glow};" 
         data-role="${config.key}" 
         title="${config.title} • ${config.subtitle}">
      
      <!-- Left Circular Emblem -->
      <div class="badge-emblem-wrap">
        ${emblemHtml}
      </div>

      <!-- Badge Center Content -->
      <div class="badge-content">
        <div class="badge-title">${config.title}</div>
        <div class="badge-subtitle">${config.subtitle}</div>
      </div>

      <!-- Right Decor (Icon + Slashes) -->
      <div class="badge-right-decor">
        <div class="badge-top-icon">
          ${iconSvg}
        </div>
        <div class="badge-slashes-wrap">
          <svg class="badge-slashes" viewBox="0 0 28 14" fill="none">
            <path d="M4 12L9 2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4" />
            <path d="M11 12L16 2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.75" />
            <path d="M18 12L23 2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="1" />
          </svg>
        </div>
      </div>

    </div>
  `;
}

/**
 * Renders multiple role badges for a user in a clean, elegant stack or wrap
 * @param {object|array|string} userOrBadges - User object with .badges or .author_badges, or array of badge objects
 * @param {object} options - { size: 'sidebar'|'normal'|'compact'|'mini', maxBadges: number }
 */
export function renderUserBadges(userOrBadges, options = {}) {
  let badgeList = [];

  if (Array.isArray(userOrBadges)) {
    badgeList = userOrBadges;
  } else if (userOrBadges && typeof userOrBadges === 'object') {
    if (Array.isArray(userOrBadges.author_badges) && userOrBadges.author_badges.length > 0) {
      badgeList = userOrBadges.author_badges;
    } else if (Array.isArray(userOrBadges.badges) && userOrBadges.badges.length > 0) {
      badgeList = userOrBadges.badges;
    } else {
      // Single fallback badge from user object
      badgeList = [{
        key: userOrBadges.role || userOrBadges.author_role || 'player',
        title: userOrBadges.role_badge || userOrBadges.author_badge || 'Игрок',
        color: userOrBadges.role_color || userOrBadges.author_color || '#94A3B8',
        is_primary: true
      }];
    }
  } else if (typeof userOrBadges === 'string') {
    badgeList = [{ key: userOrBadges, is_primary: true }];
  }

  if (badgeList.length === 0) {
    badgeList = [{ key: 'player', is_primary: true }];
  }

  // Deduplicate badges by key
  const seenKeys = new Set();
  const uniqueBadges = [];
  for (const b of badgeList) {
    const k = (b.key || b).toLowerCase();
    if (!seenKeys.has(k)) {
      seenKeys.add(k);
      uniqueBadges.push(b);
    }
  }

  const size = options.size || 'sidebar';
  const max = options.maxBadges || 5;
  const visibleBadges = uniqueBadges.slice(0, max);

  return `
    <div class="user-badges-stack size-${size}">
      ${visibleBadges.map((badge, index) => {
        // If sidebar and there are multiple badges, secondary badges are slightly more compact
        const badgeSize = (size === 'sidebar' && index > 0) ? 'sidebar badge-secondary-role' : size;
        return renderRoleBadge(badge, { size: badgeSize });
      }).join('')}
    </div>
  `;
}

