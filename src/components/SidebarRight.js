import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { renderRoleBadge, renderUserBadges } from '../utils/badges.js';
import { formatTimeAgo } from '../utils/time.js';

export function renderSidebarRight() {
  const user = state.user;

  let profileHtml = '';
  if (user) {
    const xpPercent = Math.min(100, Math.round(((user.current_xp || 0) % 200) / 2));

    profileHtml = `
      <div class="user-profile-widget">
        <div class="widget-subtitle-label">Профиль пользователя</div>
        <div class="profile-header-row">
          <div class="profile-avatar-wrap">
            <img src="${user.avatar || '/assets/avatar_ivan.jpg'}" alt="${user.username}" class="profile-avatar-img" />
            <span class="profile-status-dot online"></span>
          </div>
          <div class="profile-user-info">
            <div class="profile-username">${user.username}</div>
            <div class="profile-meta-row">
              <span class="profile-online-text">• Онлайн</span>
            </div>
          </div>
        </div>

        <div class="sidebar-badge-wrap" style="margin: 8px 0 12px 0;">
          ${renderUserBadges(user, { size: 'compact' })}
        </div>

        <!-- Level & XP Progress -->
        <div class="profile-level-section">
          <div class="level-labels-row">
            <span class="level-title-text">Уровень ${user.level || 12}</span>
            <span class="level-xp-text">${(user.current_xp || 320) % 1000} / 1 000 XP</span>
          </div>
          <div class="level-progress-track">
            <div class="level-progress-fill" style="width: ${xpPercent || 32}%;"></div>
          </div>
        </div>

        <!-- Stats 3-Grid -->
        <div class="profile-stats-row">
          <div class="profile-stat-box">
            <div class="stat-icon-wrap">${ICONS.inbox}</div>
            <div class="stat-text-col">
              <span class="stat-lbl">Сообщения</span>
              <span class="stat-num">${user.postsCount || 124}</span>
            </div>
          </div>
          <div class="profile-stat-box">
            <div class="stat-icon-wrap">${ICONS.chatBubble}</div>
            <div class="stat-text-col">
              <span class="stat-lbl">Темы</span>
              <span class="stat-num">${user.topicsCount || 32}</span>
            </div>
          </div>
          <div class="profile-stat-box">
            <div class="stat-icon-wrap stat-rep-icon">${ICONS.award}</div>
            <div class="stat-text-col">
              <span class="stat-lbl">Репутация</span>
              <span class="stat-num stat-rep-val">+${user.reputation || 156}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    profileHtml = `
      <div class="user-profile-widget">
        <div class="widget-subtitle-label">Авторизация на форуме</div>
        <div class="guest-widget-body">
          <p class="guest-desc-text">
            Войдите в аккаунт или зарегистрируйтесь, чтобы создавать темы, писать ответы и прокачивать уровень персонажа.
          </p>
          <div class="guest-btn-col">
            <button class="btn-guest-primary" id="btn-sidebar-login">
              ${ICONS.logIn}
              <span>Войти в аккаунт</span>
            </button>
            <button class="btn-guest-secondary" id="btn-sidebar-register">
              <span>Регистрация</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Recent Threads List
  let recentThreadsHtml = '';
  if (state.recentThreads && state.recentThreads.length > 0) {
    recentThreadsHtml = state.recentThreads.map(t => `
      <a href="/forum/thread/${t.id}" data-link class="recent-thread-row">
        <img src="${t.author_avatar || '/assets/avatar_ivan.jpg'}" alt="${t.author_name}" class="recent-author-avatar" />
        <div class="recent-thread-body">
          <div class="recent-thread-title">${t.title}</div>
          <div class="recent-thread-meta">
            <span class="recent-author-name">${t.author_name}</span>
            <span class="meta-dot">•</span>
            <span class="recent-thread-time">${formatTimeAgo(t.created_at)}</span>
          </div>
        </div>
        <div class="recent-thread-stats">
          <span class="stat-eye">${ICONS.eye} ${t.views_count || 254}</span>
          <span class="stat-chat">${ICONS.chatBubble} ${t.replies_count || 12}</span>
        </div>
      </a>
    `).join('');
  } else {
    recentThreadsHtml = `
      <div style="font-size: 12px; color: #8E95A5; text-align: center; padding: 16px 0;">
        Тем пока нет. Нажмите «Создать тему», чтобы начать!
      </div>
    `;
  }

  // 1. Staff Online Widget
  const stats = state.onlineStats || {
    staffOnline: [],
    usersOnline: [],
    totalMembersOnline: 0,
    guestsOnline: 18,
    totalOnline: 19,
    recordOnline: 142
  };

  const staff = (stats.staffOnline && stats.staffOnline.length > 0) ? stats.staffOnline : [];
  let staffListHtml = '';
  if (staff.length > 0) {
    staffListHtml = staff.map(s => {
      const displayName = s.character_name || s.username;
      const roleColor = s.role_color || '#FF1F36';
      return `
        <a href="/members/${encodeURIComponent(s.username)}" data-link class="staff-online-card">
          <div class="staff-avatar-box">
            <img src="${s.avatar || '/assets/avatar_ivan.jpg'}" alt="${s.username}" class="staff-avatar-pic" />
            <span class="staff-pulse-dot"></span>
          </div>
          <div class="staff-details">
            <div class="staff-nick-row">
              <span class="staff-nick" style="color: ${roleColor};">${displayName}</span>
            </div>
            <div class="staff-badge-row">
              ${renderUserBadges(s, { size: 'compact' })}
            </div>
          </div>
        </a>
      `;
    }).join('');
  } else {
    staffListHtml = `
      <div class="sidebar-online-empty">
        <span class="empty-online-icon">${ICONS.shield}</span>
        <span>Сейчас нет администрации в сети</span>
      </div>
    `;
  }

  // 2. Forum Online Widget
  const allUsers = (stats.usersOnline && stats.usersOnline.length > 0) ? stats.usersOnline : [];
  const totalMembersOnline = stats.totalMembersOnline || allUsers.length;
  const guestsCount = stats.guestsOnline || 18;
  const totalOnline = stats.totalOnline || (totalMembersOnline + guestsCount);
  const recordCount = stats.recordOnline || 142;

  let usersChipsHtml = '';
  if (allUsers.length > 0) {
    usersChipsHtml = `
      <div class="online-users-cloud">
        ${allUsers.map(u => {
          const roleColor = u.role_color || '#FF8A00';
          return `
            <a href="/members/${encodeURIComponent(u.username)}" data-link class="online-user-tag" title="${u.username} (${u.role_badge || 'Игрок'})">
              <span class="user-tag-dot" style="background: ${roleColor};"></span>
              <span class="user-tag-name" style="color: ${roleColor};">${u.username}</span>
            </a>
          `;
        }).join('')}
      </div>
    `;
  } else {
    usersChipsHtml = `
      <div class="sidebar-online-empty">
        <span>Пользователей в сети нет</span>
      </div>
    `;
  }

  return `
    <aside class="sidebar-right">
      <!-- Profile Widget -->
      ${profileHtml}

      <!-- Staff Online Widget -->
      <div class="sidebar-online-widget staff-widget">
        <div class="widget-header-row">
          <div class="widget-title-group">
            <span class="widget-title-icon staff-icon">${ICONS.shield}</span>
            <h4 class="widget-heading">Команда онлайн</h4>
          </div>
          <span class="online-badge-count ${staff.length > 0 ? 'active' : ''}">${staff.length}</span>
        </div>
        <div class="staff-online-list">
          ${staffListHtml}
        </div>
      </div>

      <!-- Forum Online Widget -->
      <div class="sidebar-online-widget users-widget">
        <div class="widget-header-row">
          <div class="widget-title-group">
            <span class="widget-title-icon">${ICONS.users}</span>
            <h4 class="widget-heading">Онлайн форума</h4>
          </div>
          <span class="online-pulse-indicator">
            <span class="pulse-circle"></span>
            <span class="online-count-val">${totalOnline}</span>
          </span>
        </div>

        <div class="online-stats-pill">
          <span class="stats-pill-item"><strong>${totalMembersOnline}</strong> пользователей</span>
          <span class="stats-pill-divider">•</span>
          <span class="stats-pill-item"><strong>${guestsCount}</strong> гостей</span>
        </div>

        ${usersChipsHtml}

        <div class="online-record-footer">
          <span>Рекорд онлайна: <strong>${recordCount}</strong> игроков</span>
        </div>
      </div>

      <!-- Recent Topics Card -->
      <div class="recent-topics-widget">
        <div class="widget-header-row">
          <h4 class="widget-heading">Последние темы</h4>
          <a href="/forum" data-link class="widget-heading-link">Все темы</a>
        </div>
        <div class="recent-threads-list">
          ${recentThreadsHtml}
        </div>
      </div>

      <!-- Join Server Promo Card (Exact Match to Reference) -->
      <div class="sidebar-join-card">
        <div class="join-card-bg">
          <img src="/assets/hero_banner.jpg" alt="Phoenix RP" class="join-card-img" />
          <div class="join-card-overlay"></div>
        </div>
        <div class="join-card-content">
          <div class="join-brand-row">
            <img src="/assets/phoenix_bird_header.png" alt="Phoenix Bird" class="join-brand-icon" />
            <div class="join-brand-text">
              <span class="join-brand-title">PHOENIX</span>
              <span class="join-brand-sub">PROJECT RP</span>
            </div>
          </div>
          <button class="btn-join-primary" id="btn-sidebar-join-server">
            <span>Присоединяйся к нам</span>
            ${ICONS.arrowRight}
          </button>
        </div>
      </div>
    </aside>
  `;
}
