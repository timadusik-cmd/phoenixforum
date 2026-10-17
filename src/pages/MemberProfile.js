// Phoenix RP Forum - Member Profile Page
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { renderRoleBadge, renderUserBadges } from '../utils/badges.js';
import { formatTimeAgo } from '../utils/time.js';

export function renderMemberProfile(data) {
  const { user, recentTopics = [], recentPosts = [] } = data;
  const isMe = state.user && state.user.id === user.id;

  const xpPercent = Math.min(100, Math.round(((user.current_xp || 0) % 1000) / 10));
  const joinedDate = new Date(user.created_at || Date.now()).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  return `
    <div class="main-content profile-page-container">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} <span>Главная</span></a>
        <span class="breadcrumb-sep">›</span>
        <a href="/forum/members" data-link class="breadcrumb-item">Пользователи</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-item current">${user.username}</span>
      </div>

      <!-- Profile Hero Card -->
      <div class="profile-page-hero">
        <div class="profile-hero-banner">
          <img src="${user.cover_banner || '/assets/hero_banner.jpg'}" alt="Cover" class="profile-cover-img" id="profile-page-cover-img" />
          <div class="profile-hero-overlay"></div>
          
          <div class="profile-hero-actions">
            ${isMe ? `
              <button type="button" class="btn-cover-change" id="btn-change-cover-profile" title="Сменить обложку профиля">
                ${ICONS.camera}
                <span>Сменить обложку</span>
              </button>
              <input type="file" id="profile-page-cover-file-input" accept="image/*" style="display: none;" />

              <a href="/account/settings" data-link class="btn-profile-settings" title="Настройки аккаунта">
                ${ICONS.settings}
                <span>Настройки</span>
              </a>
            ` : state.user ? `
              <button type="button" class="btn-create-topic btn-start-pm-with-user" data-user-id="${user.id}" data-username="${user.username}" style="box-shadow: 0 4px 14px rgba(255,35,56,0.4);">
                ${ICONS.mail}
                <span>Написать сообщение</span>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="profile-hero-body">
          <div class="profile-page-avatar-wrap">
            <img src="${user.avatar || '/assets/avatar_ivan.jpg'}" alt="${user.username}" class="profile-page-avatar" id="profile-page-avatar-img" />
            <span class="profile-avatar-status-badge ${user.status || 'online'}"></span>
            ${isMe ? `
              <button type="button" class="btn-avatar-camera-overlay" id="btn-change-avatar-profile" title="Сменить аватарку">
                ${ICONS.camera}
                <span>Изменить</span>
              </button>
              <input type="file" id="profile-page-file-input" accept="image/*" style="display: none;" />
            ` : ''}
          </div>

          <div class="profile-hero-info">
            <div class="profile-hero-top-line">
              <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                <h1 class="profile-hero-name">${user.username}</h1>
                <span class="profile-online-text">
                  <span class="status-dot-green"></span>
                  <span>${user.status === 'online' ? 'В сети' : 'Не в сети'}</span>
                </span>
              </div>
              <div class="profile-badge-wrap" style="margin: 8px 0;">
                ${renderUserBadges(user, { size: 'normal' })}
              </div>
            </div>

            <div class="profile-character-name">
              <span>Персонаж:</span> <strong>${user.character_name || user.username}</strong>
              <span class="meta-dot">•</span>
              <span>${user.fraction || 'Гражданский'}</span>
            </div>

            <div class="profile-xp-row">
              <span class="xp-level-title">Уровень ${user.level || 1}</span>
              <div class="xp-progress-bar">
                <div class="xp-progress-fill" style="width: ${xpPercent || 46}%;"></div>
              </div>
              <span class="xp-numbers">${(user.current_xp || 465) % 1000} / 1 000 XP</span>
            </div>
          </div>
        </div>
      </div>

      ${isMe ? `
        <!-- Custom Avatar & Cover Toolbox Card -->
        <div class="profile-avatar-toolbox-card">
          <div class="avatar-toolbox-header">
            <div class="avatar-toolbox-title">
              ${ICONS.camera}
              <span>Оформление профиля (Аватар и Обложка)</span>
            </div>
            <span class="avatar-toolbox-hint">Поддерживаются форматы JPG, PNG, WebP или прямая ссылка</span>
          </div>

          <div class="avatar-toolbox-controls" style="flex-direction: column; gap: 12px;">
            <!-- Avatar row -->
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; width: 100%;">
              <span style="font-size: 12px; color: #8A96A6; width: 80px;">Аватарка:</span>
              <button type="button" class="btn-upload-avatar" id="btn-profile-upload-file">
                ${ICONS.upload}
                <span>Файл аватара</span>
              </button>
              <div class="avatar-url-input-wrap" style="flex: 1;">
                <input 
                  type="text" 
                  class="avatar-url-input" 
                  id="profile-page-avatar-url" 
                  placeholder="Ссылка на аватарку (https://...)" 
                />
                <button type="button" class="btn-save-avatar-url" id="btn-profile-save-url">Сохранить</button>
              </div>
            </div>

            <!-- Cover banner row -->
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; width: 100%;">
              <span style="font-size: 12px; color: #8A96A6; width: 80px;">Обложка:</span>
              <button type="button" class="btn-upload-avatar" id="btn-profile-upload-cover-file">
                ${ICONS.upload}
                <span>Файл обложки</span>
              </button>
              <div class="avatar-url-input-wrap" style="flex: 1;">
                <input 
                  type="text" 
                  class="avatar-url-input" 
                  id="profile-page-cover-url" 
                  placeholder="Ссылка на баннер обложки (https://...)" 
                />
                <button type="button" class="btn-save-avatar-url" id="btn-profile-save-cover-url">Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Profile Grid (Stats & Bio on Left, Recent Topics on Right) -->
      <div class="profile-content-grid">
        <!-- Left: Stats & About -->
        <div class="profile-sidebar-col">
          <!-- Stats Card -->
          <div class="profile-widget-card">
            <h3 class="profile-widget-title">Статистика</h3>
            <div class="profile-stats-list">
              <div class="p-stat-item">
                <span class="lbl">${ICONS.award} Репутация:</span>
                <span class="val stat-rep-val">+${user.reputation || 0}</span>
              </div>
              <div class="p-stat-item">
                <span class="lbl">${ICONS.chatBubble} Тем создано:</span>
                <span class="val">${user.topicsCount || 0}</span>
              </div>
              <div class="p-stat-item">
                <span class="lbl">${ICONS.docText} Сообщений:</span>
                <span class="val">${user.postsCount || 0}</span>
              </div>
              <div class="p-stat-item">
                <span class="lbl">${ICONS.server} Сервер:</span>
                <span class="val">${user.server || 'Phoenix RP #1 (Los Santos)'}</span>
              </div>
              <div class="p-stat-item">
                <span class="lbl">${ICONS.calendar} Регистрация:</span>
                <span class="val">${joinedDate}</span>
              </div>
            </div>
          </div>

          <!-- Bio & Contacts Card -->
          <div class="profile-widget-card">
            <h3 class="profile-widget-title">О себе</h3>
            <p class="profile-bio-text">${user.bio || 'Игрок сервера Phoenix RP.'}</p>

            ${(user.discord_tag || user.telegram_tag || user.vk_link) ? `
              <div class="profile-contacts-list">
                ${user.discord_tag ? `<div class="contact-item">${ICONS.discord} <span>${user.discord_tag}</span></div>` : ''}
                ${user.telegram_tag ? `<div class="contact-item">${ICONS.telegram} <span>${user.telegram_tag}</span></div>` : ''}
                ${user.vk_link ? `<div class="contact-item">${ICONS.vk} <a href="${user.vk_link}" target="_blank" rel="noopener">ВКонтакте</a></div>` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Right: Recent Topics & Posts -->
        <div class="profile-activity-col">
          <div class="profile-widget-card">
            <div class="profile-activity-header">
              <h3 class="profile-widget-title">Недавние темы автора</h3>
              <span class="profile-activity-count">${recentTopics.length} тем</span>
            </div>

            ${recentTopics.length > 0 ? `
              <div class="profile-topics-list">
                ${recentTopics.map(t => `
                  <div class="profile-topic-card">
                    <div class="profile-topic-left">
                      <div class="profile-topic-cat-badge">
                        ${t.category_title || 'Новости и объявления'}
                      </div>
                      <a href="/forum/thread/${t.id}" data-link class="profile-topic-title">
                        ${t.title}
                      </a>
                    </div>
                    <div class="profile-topic-meta">
                      <span class="meta-date">${formatTimeAgo(t.created_at)}</span>
                      <div class="meta-counters">
                        <span class="counter-item" title="Ответов">${ICONS.chatBubble} ${t.replies_count || 0}</span>
                        <span class="counter-item" title="Просмотров">${ICONS.eye} ${t.views_count || 0}</span>
                      </div>
                      <a href="/forum/thread/${t.id}" data-link class="profile-topic-arrow">
                        ${ICONS.chevronRight}
                      </a>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="empty-profile-activity">
                <span>Пользователь ещё не создал ни одной темы.</span>
              </div>
            `}
          </div>

          ${recentPosts && recentPosts.length > 0 ? `
            <div class="profile-widget-card" style="margin-top: 16px;">
              <div class="profile-activity-header">
                <h3 class="profile-widget-title">Недавние ответы в темах</h3>
                <span class="profile-activity-count">${recentPosts.length} ответов</span>
              </div>
              <div class="profile-posts-list">
                ${recentPosts.map(p => `
                  <div class="profile-recent-post-card">
                    <a href="/forum/thread/${p.thread_id}" data-link class="post-thread-title-link">
                      ${p.thread_title}
                    </a>
                    <p class="post-snippet-text">${(p.content || '').substring(0, 140)}...</p>
                    <span class="post-time-meta">${formatTimeAgo(p.created_at)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}
