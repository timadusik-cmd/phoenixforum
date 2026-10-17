// Phoenix RP Forum - Awards & Level Progression Frontend Utilities
// Matches official 20 Forum Awards & 50 Levels Reference

export const LEVEL_THRESHOLDS = (() => {
  const arr = [0];
  let cumulative = 0;
  for (let lvl = 2; lvl <= 50; lvl++) {
    const step = 50 + (lvl * 35);
    cumulative += step;
    arr.push(cumulative);
  }
  return arr;
})();

export function getLevelFromXp(xp = 0) {
  const cleanXp = Math.max(0, parseInt(xp) || 0);
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (cleanXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getLevelProgress(xp = 0) {
  const cleanXp = Math.max(0, parseInt(xp) || 0);
  const level = getLevelFromXp(cleanXp);
  const levelIdx = level - 1;

  if (level >= 50) {
    const currentLevelXp = LEVEL_THRESHOLDS[49];
    return {
      level: 50,
      currentXp: cleanXp,
      currentLevelXp,
      nextLevelXp: currentLevelXp,
      xpInLevel: cleanXp - currentLevelXp,
      xpNeededForNext: 0,
      percent: 100,
      isMaxLevel: true
    };
  }

  const currentLevelXp = LEVEL_THRESHOLDS[levelIdx];
  const nextLevelXp = LEVEL_THRESHOLDS[levelIdx + 1];
  const range = nextLevelXp - currentLevelXp;
  const xpInLevel = Math.max(0, cleanXp - currentLevelXp);
  const percent = Math.min(100, Math.max(0, Math.round((xpInLevel / range) * 100)));

  return {
    level,
    currentXp: cleanXp,
    currentLevelXp,
    nextLevelXp,
    xpInLevel,
    xpNeededForNext: nextLevelXp - cleanXp,
    percent,
    isMaxLevel: false
  };
}

// Render Level Shield Badge matching reference image (1..50)
export function renderLevelShield(level = 1, options = {}) {
  const lvl = Math.min(50, Math.max(1, parseInt(level) || 1));
  const { size = 32, showCrown = true, className = '' } = options;
  const isMilestone = (lvl % 10 === 0);
  const hasCrown = showCrown && isMilestone;
  const isMax = (lvl === 50);

  const crownSvg = hasCrown ? `
    <g class="shield-crown" transform="translate(16, 2)">
      <path d="M-6 4 L-9 -1 L-4 1 L0 -3 L4 1 L9 -1 L6 4 Z" fill="${isMax ? '#F59E0B' : '#FF1F36'}" stroke="${isMax ? '#FDE68A' : '#FFA8B0'}" stroke-width="0.8" filter="drop-shadow(0 0 2px ${isMax ? 'rgba(245,158,11,0.8)' : 'rgba(255,31,54,0.8)'})" />
      <circle cx="-9" cy="-1" r="0.7" fill="#FFF" />
      <circle cx="0" cy="-3" r="0.9" fill="#FFF" />
      <circle cx="9" cy="-1" r="0.7" fill="#FFF" />
    </g>
  ` : '';

  const shieldColor = isMax ? '#F59E0B' : (lvl >= 40 ? '#FF334B' : (lvl >= 20 ? '#E52338' : '#D11B2F'));
  const strokeColor = isMax ? '#FBBF24' : '#FF4D61';

  return `
    <div class="level-shield-wrap ${className}" title="Уровень форума: ${lvl}${isMilestone ? ' (Особый ранг)' : ''}" style="width: ${size}px; height: ${size * 1.15}px;">
      <svg viewBox="0 0 32 38" width="100%" height="100%">
        <defs>
          <linearGradient id="shieldBg-${lvl}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1E070A" />
            <stop offset="100%" stop-color="#0A0B0E" />
          </linearGradient>
          <filter id="glow-${lvl}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="${shieldColor}" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Outer Shield Border -->
        <path d="M 4 8 L 16 3 L 28 8 L 28 22 C 28 29, 16 35, 16 35 C 16 35, 4 29, 4 22 Z" 
              fill="url(#shieldBg-${lvl})" 
              stroke="${strokeColor}" 
              stroke-width="1.4"
              filter="url(#glow-${lvl})" />

        <!-- Inner Accent Line -->
        <path d="M 7 10 L 16 6 L 25 10 L 25 21 C 25 26, 16 31, 16 31 C 16 31, 7 26, 7 21 Z" 
              fill="none" 
              stroke="${shieldColor}" 
              stroke-width="0.7" 
              opacity="0.5" />

        <!-- Crown for milestones 10, 20, 30, 40, 50 -->
        ${crownSvg}

        <!-- Level Number -->
        <text x="16" y="${hasCrown ? 23 : 22}" 
              text-anchor="middle" 
              dominant-baseline="middle" 
              font-family="'Inter', sans-serif" 
              font-weight="900" 
              font-size="${lvl >= 10 ? '11.5' : '13'}" 
              fill="#FFFFFF" 
              letter-spacing="-0.5">
          ${lvl}
        </text>
      </svg>
    </div>
  `;
}

// 20 Official Forum Awards SVG Icons (Red Neon Circular Badges)
export function getAwardSvg(iconKey) {
  switch (iconKey) {
    case 'phoenix':
      return `<path d="M12 3 L14 7 L17 5 L16 9 L20 8 L18 12 L22 13 L17 16 L19 20 L14 18 L12 21 L10 18 L5 20 L7 16 L2 13 L6 12 L4 8 L8 9 L7 5 L10 7 Z" fill="currentColor"/>`;
    case 'crown_laurel':
      return `<path d="M5 8 L8 14 L12 9 L16 14 L19 8 L18 17 L6 17 Z" fill="currentColor"/><path d="M4 19 C2 15, 2 10, 4 7 M20 19 C22 15, 22 10, 20 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'chat_laurel':
      return `<path d="M7 8 H17 C18.1 8 19 8.9 19 10 V14 C19 15.1 18.1 16 17 16 H10 L6 19 V10 C6 8.9 6.9 8 7 8 Z" fill="currentColor"/><circle cx="9.5" cy="12" r="1" fill="#000"/><circle cx="12" cy="12" r="1" fill="#000"/><circle cx="14.5" cy="12" r="1" fill="#000"/>`;
    case 'flame_laurel':
      return `<path d="M12 3 C10 6 7 9 7 13 C7 16.5 9.5 19 12 19 C14.5 19 17 16.5 17 13 C17 9 13.5 6 12 3 Z M12 17 C10.8 17 9.5 15.5 9.5 14 C9.5 12.5 11 11 12 9 C13 11 14.5 12.5 14.5 14 C14.5 15.5 13.2 17 12 17 Z" fill="currentColor"/>`;
    case 'star_doc':
      return `<path d="M6 4 H14 L18 8 V20 H6 Z" fill="currentColor"/><polygon points="12,10 13,13 16,13 13.5,15 14.5,18 12,16 9.5,18 10.5,15 8,13 11,13" fill="#000"/>`;
    case 'grad_cap':
      return `<path d="M12 4 L2 9 L12 14 L22 9 Z M5 11.5 V16 C5 18 8 20 12 20 C16 20 19 18 19 16 V11.5 M22 9 V16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'handshake_laurel':
      return `<path d="M12 12 L8 8 L4 12 L7 15 L10 12 L14 16 L17 13 L20 16 L22 14 L17 9 Z" fill="currentColor"/>`;
    case 'heart_laurel':
      return `<path d="M12 19 C10 17 4 13.5 4 8.5 C4 5.5 6.5 3.5 9.5 3.5 C11 3.5 12 4.5 12 4.5 C12 4.5 13 3.5 14.5 3.5 C17.5 3.5 20 5.5 20 8.5 C20 13.5 14 17 12 19 Z" fill="currentColor"/>`;
    case 'calendar_check':
      return `<rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" stroke-width="2"/><line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" stroke-width="2"/><polyline points="8 13 11 16 16 10" stroke="currentColor" stroke-width="2" fill="none"/>`;
    case 'coins_laurel':
      return `<ellipse cx="9" cy="8" rx="5" ry="2.5" fill="currentColor"/><path d="M4 8 V14 C4 15.5 6.2 16.5 9 16.5 C11.8 16.5 14 15.5 14 14 V8" stroke="currentColor" stroke-width="2" fill="none"/><ellipse cx="15" cy="11" rx="5" ry="2.5" fill="currentColor"/><path d="M10 11 V17 C10 18.5 12.2 19.5 15 19.5 C17.8 19.5 20 18.5 20 17 V11" stroke="currentColor" stroke-width="2" fill="none"/>`;
    case 'jacket':
      return `<path d="M8 4 L12 8 L16 4 L20 6 L18 12 L16 11 V20 H8 V11 L6 12 L4 6 Z" fill="currentColor"/>`;
    case 'lootbox':
      return `<polygon points="12,3 20,7 20,17 12,21 4,17 4,7" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" stroke-width="1.5"/>`;
    case 'dice':
      return `<rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="16" cy="16" r="1.3" fill="currentColor"/><circle cx="16" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="16" r="1.3" fill="currentColor"/>`;
    case 'speedometer':
      return `<path d="M4 16 A9 9 0 1 1 20 16 Z" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="16" x2="16" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`;
    case 'camera':
      return `<path d="M4 8 H7 L8 6 H16 L17 8 H20 C21 8 22 9 22 10 V18 C22 19 21 20 20 20 H4 C3 20 2 19 2 18 V10 C2 9 3 8 4 8 Z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="14" r="3.5" stroke="currentColor" stroke-width="2" fill="none"/>`;
    case 'lightbulb':
      return `<path d="M9 16 H15 M10 19 H14 M12 3 C8.5 3 6 5.5 6 9 C6 11.5 7.5 13.5 9 15 H15 C16.5 13.5 18 11.5 18 9 C18 5.5 15.5 3 12 3 Z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'users_group':
      return `<circle cx="12" cy="7" r="3" fill="currentColor"/><path d="M6 18 C6 14.5 8.5 12 12 12 C15.5 12 18 14.5 18 18 Z" fill="currentColor"/><circle cx="5" cy="9" r="2" fill="currentColor" opacity="0.6"/><circle cx="19" cy="9" r="2" fill="currentColor" opacity="0.6"/>`;
    case 'shield_star':
      return `<path d="M12 3 L20 6 V13 C20 18 12 21 12 21 C12 21 4 18 4 13 V6 Z" stroke="currentColor" stroke-width="2" fill="none"/><polygon points="12,7 13.5,10.5 17,11 14.5,13.5 15,17 12,15 9,17 9.5,13.5 7,11 10.5,10.5" fill="currentColor"/>`;
    case 'legend_star':
      return `<polygon points="12,2 15,8 21,9 17,14 18,20 12,17 6,20 7,14 3,9 9,8" fill="currentColor"/><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 3" fill="none"/>`;
    case 'phoenix_activist':
      return `<path d="M12 2 C13 5 16 6 19 4 C18 8 21 9 23 9 C20 12 21 15 23 17 C19 16 18 18 18 21 C15 18 14 19 12 22 C10 19 9 18 6 21 C6 18 5 16 1 17 C3 15 4 12 1 9 C3 9 6 8 5 4 C8 6 11 5 12 2 Z" fill="currentColor"/>`;
    default:
      return `<circle cx="12" cy="12" r="8" fill="currentColor"/>`;
  }
}

// 3D Generated Award Image Assets
export const AWARD_IMAGES = {
  award_01: '/assets/awards/phoenix.jpg',   // ПЕРВЫЙ ПОЛЬЗОВАТЕЛЬ
  award_02: '/assets/awards/crown.jpg',     // СТАРОЖИЛ ФОРУМА
  award_03: '/assets/awards/chat.jpg',      // АКТИВНЫЙ УЧАСТНИК
  award_04: '/assets/awards/flame.jpg',     // ЛИДЕР ОБСУЖДЕНИЙ
  award_05: '/assets/awards/star.jpg',      // ЛУЧШИЙ ПОСТ
  award_06: '/assets/awards/grad.jpg',      // ЭКСПЕРТ СЕРВЕРА
  award_07: '/assets/awards/handshake.jpg', // ПОМОЩНИК НОВИЧКОВ
  award_08: '/assets/awards/heart.jpg',     // ПОДДЕРЖКА ПРОЕКТА
  award_09: '/assets/awards/crown.jpg',     // УЧАСТНИК ИВЕНТОВ
  award_10: '/assets/awards/crate.jpg',     // КАЗНАЧЕЙ ФОРУМА
  award_11: '/assets/awards/crown.jpg',     // ЦЕНИТЕЛЬ СТИЛЯ
  award_12: '/assets/awards/crate.jpg',     // КОЛЛЕКЦИОНЕР РЕДКОСТЕЙ
  award_13: '/assets/awards/dice.jpg',      // ВЕЗУНЧИК
  award_14: '/assets/awards/speed.jpg',     // ГОНЩИК ФОРУМА
  award_15: '/assets/awards/heart.jpg',     // ФОТОГРАФ ПРОЕКТА
  award_16: '/assets/awards/flame.jpg',     // МАСТЕР КРЕАТИВА
  award_17: '/assets/awards/handshake.jpg', // ДРУГ СООБЩЕСТВА
  award_18: '/assets/awards/shield.jpg',    // ВЕТЕРАН ПРОЕКТА
  award_19: '/assets/awards/star.jpg',      // ЛЕГЕНДА ФОРУМА
  award_20: '/assets/awards/phoenix.jpg',   // ГЛАВНЫЙ АКТИВИСТ
};

export function getAwardImage(award) {
  if (award && award.id && AWARD_IMAGES[award.id]) {
    return AWARD_IMAGES[award.id];
  }
  const keyMap = {
    phoenix: '/assets/awards/phoenix.jpg',
    crown_laurel: '/assets/awards/crown.jpg',
    chat_laurel: '/assets/awards/chat.jpg',
    flame_laurel: '/assets/awards/flame.jpg',
    star_doc: '/assets/awards/star.jpg',
    grad_cap: '/assets/awards/grad.jpg',
    handshake_laurel: '/assets/awards/handshake.jpg',
    heart_laurel: '/assets/awards/heart.jpg',
    calendar_check: '/assets/awards/crown.jpg',
    coins_laurel: '/assets/awards/crate.jpg',
    jacket: '/assets/awards/crown.jpg',
    lootbox: '/assets/awards/crate.jpg',
    dice: '/assets/awards/dice.jpg',
    speedometer: '/assets/awards/speed.jpg',
    camera: '/assets/awards/heart.jpg',
    lightbulb: '/assets/awards/flame.jpg',
    users_group: '/assets/awards/handshake.jpg',
    shield_star: '/assets/awards/shield.jpg',
    legend_star: '/assets/awards/star.jpg',
    phoenix_activist: '/assets/awards/phoenix.jpg'
  };
  return (award && keyMap[award.icon_key]) || '/assets/awards/phoenix.jpg';
}

export function getRankTitle(level = 1) {
  const lvl = parseInt(level) || 1;
  if (lvl >= 50) return 'ЛЕГЕНДА ФОРУМА';
  if (lvl >= 40) return 'МАСТЕР ПРОЕКТА';
  if (lvl >= 30) return 'ВЕТЕРАН СООБЩЕСТВА';
  if (lvl >= 20) return 'ОПЫТНЫЙ УЧАСТНИК';
  if (lvl >= 10) return 'АКТИВИСТ RP';
  return 'НОВИЧОК ФОРУМА';
}

// Render Award Card (matching 5x4 grid in reference image with 3D generated icons)
export function renderAwardCard(award, isUnlocked = false, unlockedAt = null) {
  const num = award.number || '01';
  const imgUrl = getAwardImage(award);
  const statusClass = isUnlocked ? 'unlocked' : 'locked';

  return `
    <div class="award-ref-card ${statusClass}" data-award-id="${award.id}" title="${award.title}: ${award.description}">
      <div class="award-card-header">
        <span class="award-number">${num}</span>
        ${isUnlocked ? `<span class="award-unlocked-badge" title="Разблокировано">✔</span>` : `<span class="award-locked-icon" title="Ещё не получено">🔒</span>`}
      </div>

      <div class="award-emblem-wrap">
        <div class="award-glow-circle ${statusClass}">
          <img src="${imgUrl}" alt="${award.title}" class="award-3d-img" />
        </div>
      </div>

      <div class="award-title">${award.title}</div>
      <div class="award-desc">${award.description}</div>

      <div class="award-footer">
        ${isUnlocked ? `
          <span class="award-status-label unlocked">ПОЛУЧЕНО</span>
        ` : `
          <span class="award-status-label locked">${award.condition_desc || 'Выполните условия'}</span>
        `}
      </div>
    </div>
  `;
}

// Render Mini Awards Rack for thread post author block with rich 3D icons
export function renderMiniAwards(awardsList = [], max = 4) {
  if (!awardsList || awardsList.length === 0) return '';
  const displayList = awardsList.slice(0, max);
  const moreCount = awardsList.length - max;

  return `
    <div class="author-mini-awards-rack" title="Награды автора (${awardsList.length})">
      ${displayList.map(a => {
        const imgUrl = getAwardImage(a);
        return `
          <div class="mini-award-item" title="[${a.number || ''}] ${a.title || ''}">
            <img src="${imgUrl}" alt="${a.title || 'Награда'}" class="mini-award-img" />
          </div>
        `;
      }).join('')}
      ${moreCount > 0 ? `<div class="mini-award-more" title="Ещё ${moreCount} наград">+${moreCount}</div>` : ''}
    </div>
  `;
}

