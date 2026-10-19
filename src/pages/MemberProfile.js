// Phoenix RP Forum - Member Profile Page with 20 Awards & 50 Levels
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { renderRoleBadge, renderUserBadges } from '../utils/badges.js';
import { formatTimeAgo } from '../utils/time.js';
import { renderLevelShield, getLevelProgress, renderAwardCard } from '../utils/awards.js';
import { renderPrefixBadge } from '../utils/prefixes.js';

export function renderMemberProfile(data) {
  const { user, recentTopics = [], recentPosts = [] } = data;
  const isMe = state.user && state.user.id === user.id;

  const progress = user.levelProgress || getLevelProgress(user.current_xp || 0);
  const userAwards = user.awards || [];
  const unlockedCount = userAwards.filter(a => a.is_unlocked).length;

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
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-create-topic btn-open-rep-modal" data-user-id="${user.id}" data-username="${user.username}" style="background: linear-gradient(135deg, #10B981, #059669); box-shadow: 0 4px 14px rgba(16,185,129,0.3);">
                  ${ICONS.plus} <span>Репутация</span>
                </button>
                <button type="button" class="btn-create-topic btn-start-pm-with-user" data-user-id="${user.id}" data-username="${user.username}" style="box-shadow: 0 4px 14px rgba(255,35,56,0.4);">
                  ${ICONS.mail}
                  <span>Написать в ЛС</span>
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="profile-hero-body">
          <div class="profile-page-avatar-wrap">
            <img src="${user.avatar || '/assets/avatar_ivan.jpg'}" alt="${user.username}" class="profile-page-avatar" id="profile-page-avatar-img" />
            ${user.avatar_decoration ? `<img src="${user.avatar_decoration}" class="avatar-decoration profile-decoration" alt="" />` : ''}
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
                ${renderLevelShield(progress.level, { size: 36 })}
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

            <!-- Enhanced XP Progress Bar -->
            <div class="profile-xp-section">
              <div class="profile-xp-row">
                <span class="xp-level-title">
                  <strong style="color: #FF334B;">Уровень ${progress.level}</strong>
                  ${progress.isMaxLevel ? '<span class="max-lvl-badge">MAX</span>' : ''}
                </span>
                <div class="xp-progress-bar" title="Опыт: ${progress.currentXp} XP">
                  <div class="xp-progress-fill" style="width: ${progress.percent}%;"></div>
                </div>
                <span class="xp-numbers">
                  ${progress.isMaxLevel ? `${progress.currentXp} XP (МАКСИМАЛЬНЫЙ УРОВЕНЬ)` : `${progress.xpInLevel} / ${progress.nextLevelXp - progress.currentLevelXp} XP (${progress.percent}%)`}
                </span>
              </div>
              <div class="xp-rates-hint">
                <span>💡 Начисление опыта: <strong>+25 XP</strong> за тему • <strong>+10 XP</strong> за ответ • <strong>+5 XP</strong> за реакцию</span>
              </div>
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
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="val stat-rep-val" style="font-size: 14px;">${(user.reputation ?? 0) >= 0 ? '+' : ''}${user.reputation ?? 0}</span>
                  ${state.user && state.user.id !== user.id ? `
                    <button type="button" class="btn-mini-rep btn-open-rep-modal" data-user-id="${user.id}" data-username="${user.username}" title="Изменить репутацию пользователя">
                      ${ICONS.plus}
                    </button>
                  ` : ''}
                  <button type="button" class="btn-mini-history btn-open-rep-logs" data-user-id="${user.id}" title="История изменений репутации">
                    История
                  </button>
                </div>
              </div>
              <div class="p-stat-item">
                <span class="lbl">${ICONS.shield} Уровень форума:</span>
                <span class="val"><strong>${progress.level}</strong> из 50</span>
              </div>
              <div class="p-stat-item">
                <span class="lbl">${ICONS.flame} Всего опыта (XP):</span>
                <span class="val" style="color: #FF8A00;">${user.current_xp || 0} XP</span>
              </div>
              <div class="p-stat-item">
                <span class="lbl">${ICONS.award} Наград открыто:</span>
                <span class="val" style="color: #FF334B;"><strong>${unlockedCount}</strong> / 20</span>
              </div>
              <div class="p-stat-item">
                <span class="lbl">${ICONS.chatBubble} Тем создано:</span>
                <span class="val">${user.topicsCount ?? 0}</span>
              </div>
              <div class="p-stat-item">
                <span class="lbl">${ICONS.docText} Сообщений:</span>
                <span class="val">${user.postsCount ?? 0}</span>
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
                      ${t.prefix_title ? renderPrefixBadge(t, { size: 'normal' }) : ''}
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

      <!-- ======================================================================
           20 НАГРАД ФОРУМА (Matching Reference Showcase 5x4 Grid)
           ====================================================================== -->
      <div class="profile-awards-showcase-section">
        <div class="awards-section-header">
          <div>
            <div class="awards-section-super">PHOENIX PROJECT RP • СИСТЕМА ДОСТИЖЕНИЙ</div>
            <h2 class="awards-section-title">20 НАГРАД ФОРУМА</h2>
            <p class="awards-section-subtitle">
              Уникальные награды за активность, которые подчеркивают твой статус и участие в жизни сообщества.
            </p>
          </div>
          <div class="awards-counter-badge">
            <span class="count-num">${unlockedCount}</span>
            <span class="count-lbl">/ 20 открыто</span>
          </div>
        </div>

        <div class="awards-ref-grid">
          ${userAwards.map(a => renderAwardCard(a, a.is_unlocked, a.unlocked_at)).join('')}
        </div>
      </div>

      <!-- ======================================================================
           50 УРОВНЕЙ ФОРУМА (Level progression overview)
           ====================================================================== -->
      <div class="profile-levels-showcase-section">
        <div class="awards-section-header">
          <div>
            <div class="awards-section-super">ПРОКАЧКА АККАУНТА</div>
            <h2 class="awards-section-title">50 УРОВНЕЙ ФОРУМА</h2>
            <p class="awards-section-subtitle">
              Повышай уровень, получай опыт и открывай новые возможности.
            </p>
          </div>
          <div class="levels-current-pill">
            <span>Текущий ранг:</span>
            <strong>Уровень ${progress.level}</strong>
          </div>
        </div>

        <div class="levels-ref-grid">
          ${Array.from({ length: 50 }, (_, i) => i + 1).map(lvl => {
            const isCurrent = lvl === progress.level;
            const isUnlocked = lvl <= progress.level;
            return `
              <div class="level-showcase-cell ${isCurrent ? 'current-user-level' : ''} ${isUnlocked ? 'level-reached' : 'level-future'}" title="Уровень ${lvl}">
                ${renderLevelShield(lvl, { size: 34 })}
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;
}
