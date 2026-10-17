import { state } from '../state.js';
import { ICONS, getIcon } from '../utils/icons.js';
import { formatTimeAgo } from '../utils/time.js';

export function renderHeroBanner() {
  return `
    <div class="hero-banner full-width-hero">
      <img src="/assets/hero_banner.jpg" alt="Phoenix RP" class="hero-bg-img" />
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-tagline">
          <span class="hero-tag-text">PHOENIX PROJECT RP</span>
          <span class="hero-tag-line"></span>
        </div>
        <h1 class="hero-title">ФОРУМ</h1>
        <p class="hero-subtitle">
          Общайся с игроками, находи информацию, делись опытом и будь в курсе всех событий!
        </p>
      </div>
    </div>
  `;
}

export function renderHomeForum() {
  return `
    <div class="forum-main">
      <!-- Action Row: Breadcrumbs, Section Title & Create Topic Button -->
      <div class="forum-sections-header">
        <div class="sections-title-col">
          <div class="breadcrumbs">
            <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} <span>Главная</span></a>
            <span class="breadcrumb-sep">›</span>
            <span class="breadcrumb-item current">Форум</span>
          </div>
          <h2 class="sections-main-title">Разделы форума</h2>
        </div>

        <a href="/forum/create" data-link class="btn-create-topic" id="btn-create-topic-main">
          ${ICONS.pencil}
          <span>Создать тему</span>
        </a>
      </div>

      <!-- Categories Cards List (Exact Match to New Reference) -->
      <div class="categories-cards-list">
        ${state.categories.map(cat => {
          let lastMsgHtml = `
            <div class="last-msg-empty">
              <span>Тем пока нет</span>
            </div>
          `;

          if (cat.lastMessage) {
            const dateStr = formatTimeAgo(cat.lastMessage.createdAt);

            lastMsgHtml = `
              <div class="category-last-msg-card">
                <img src="${cat.lastMessage.authorAvatar || '/assets/avatar_ivan.jpg'}" alt="${cat.lastMessage.authorName}" class="last-msg-avatar" />
                <div class="last-msg-details">
                  <a href="/forum/thread/${cat.lastMessage.threadId}" data-link class="last-msg-topic">
                    ${cat.lastMessage.threadTitle}
                  </a>
                  <div class="last-msg-meta">
                    <span class="last-msg-author">${cat.lastMessage.authorName}</span>
                    <span class="meta-dot">•</span>
                    <span class="last-msg-time">${dateStr}</span>
                  </div>
                </div>
              </div>
            `;
          }

          return `
            <div class="category-card">
              <!-- Left: Icon & Info -->
              <div class="category-main-col">
                <div class="category-icon-box">
                  ${getIcon(cat.icon)}
                </div>
                <div class="category-info">
                  <a href="/forum/category/${cat.slug}" data-link class="category-title">
                    ${cat.title}
                  </a>
                  <p class="category-desc">${cat.description || ''}</p>
                </div>
              </div>

              <!-- Center: Stats (Topics & Posts) -->
              <div class="category-stats-col">
                <div class="cat-stat-block">
                  <div class="cat-stat-val">
                    ${ICONS.chatBubble}
                    <span>${cat.threads_count || 0}</span>
                  </div>
                  <span class="cat-stat-lbl">Темы</span>
                </div>
                <div class="cat-stat-block">
                  <div class="cat-stat-val">
                    ${ICONS.docText}
                    <span>${cat.posts_count || 0}</span>
                  </div>
                  <span class="cat-stat-lbl">Сообщения</span>
                </div>
              </div>

              <!-- Right: Last Message & Arrow -->
              <div class="category-right-col">
                ${lastMsgHtml}
                <a href="/forum/category/${cat.slug}" data-link class="category-arrow-link" title="Перейти в раздел">
                  ${ICONS.chevronRight}
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
