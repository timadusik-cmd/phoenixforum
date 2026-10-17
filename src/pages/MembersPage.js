// Phoenix RP Forum - Members Directory Page
import { ICONS } from '../utils/icons.js';
import { renderRoleBadge, renderUserBadges } from '../utils/badges.js';

export function renderMembersPage(data = {}) {
  const { users = [], pagination = {}, currentRole = 'all', searchQuery = '' } = data;

  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} Главная</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Пользователи форума</span>
      </div>

      <div class="members-header-card">
        <div>
          <h2 class="members-title">Сообщество Phoenix RP</h2>
          <p class="members-subtitle">Список всех зарегистрированных игроков и администрации сервера.</p>
        </div>

        <div class="members-search-box">
          <input 
            type="text" 
            class="modal-input" 
            id="members-search-input" 
            placeholder="Поиск по никнейму..." 
            value="${searchQuery}" 
          />
        </div>
      </div>

      <!-- Role Filter Tabs -->
      <div class="thread-filter-bar">
        <div class="filter-tabs">
          <a href="/forum/members?role=all" data-link class="filter-tab ${currentRole === 'all' ? 'active' : ''}">Все игроки</a>
          <a href="/forum/members?role=staff" data-link class="filter-tab ${currentRole === 'staff' ? 'active' : ''}">Администрация и модераторы</a>
          <a href="/forum/members?role=player" data-link class="filter-tab ${currentRole === 'player' ? 'active' : ''}">Игроки</a>
        </div>
      </div>

      <!-- Members Grid -->
      <div class="members-grid">
        ${users.map(u => `
          <div class="member-card">
            <div class="member-card-avatar-wrap">
              <img src="${u.avatar || '/assets/avatar_ivan.jpg'}" alt="${u.username}" class="member-card-avatar" />
              <span class="avatar-status-dot ${u.status || 'online'}"></span>
            </div>

            <a href="/forum/member/${u.id}" data-link class="member-card-name">${u.username}</a>
            <div style="margin: 6px 0; width: 100%; display: flex; justify-content: center;">
              ${renderUserBadges(u, { size: 'compact' })}
            </div>

            <div class="member-card-stats">
              <div class="m-stat">
                <span class="m-stat-val">${u.level || 1}</span>
                <span class="m-stat-lbl">Lvl</span>
              </div>
              <div class="m-stat">
                <span class="m-stat-val" style="color: #10B981;">+${u.reputation || 0}</span>
                <span class="m-stat-lbl">Репутация</span>
              </div>
              <div class="m-stat">
                <span class="m-stat-val">${u.posts_count || 0}</span>
                <span class="m-stat-lbl">Ответов</span>
              </div>
            </div>

            <a href="/forum/member/${u.id}" data-link class="btn-secondary" style="width: 100%; justify-content: center; font-size: 11.5px; margin-top: 10px;">
              <span>Смотреть профиль</span>
            </a>
          </div>
        `).join('')}
      </div>

      <!-- Pagination -->
      ${pagination.totalPages > 1 ? `
        <div class="pagination-bar">
          ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => `
            <a href="/forum/members?page=${p}&role=${currentRole}" data-link class="page-link ${p === pagination.page ? 'active' : ''}">
              ${p}
            </a>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}
