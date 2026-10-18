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

function renderSectionCard(cat) {
  let lastMsgHtml = `
    <div class="last-msg-empty">
      <span>Тем пока нет</span>
    </div>
  `;

  if (cat.lastMessage) {
    const dateStr = formatTimeAgo(cat.lastMessage.createdAt);
    lastMsgHtml = `
      <div class="category-last-msg-card">
        <div class="last-msg-avatar-wrap">
          <img src="${cat.lastMessage.authorAvatar || '/assets/avatar_ivan.jpg'}" alt="${cat.lastMessage.authorName}" class="last-msg-avatar" />
          ${cat.lastMessage.authorAvatarDecoration ? `<img src="${cat.lastMessage.authorAvatarDecoration}" class="avatar-decoration last-msg-decoration" alt="" />` : ''}
        </div>
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

  const iconColor = cat.icon_color || '#FF1F36';
  const iconBg = cat.icon_bg || 'rgba(255, 31, 54, 0.12)';
  const titleColor = cat.title_color || '#FFFFFF';
  const descColor = cat.description_color || '#8E95A5';

  const subCount = cat.subSections ? cat.subSections.length : 0;
  const subsLabel = subCount === 1 ? '1 подраздел' : ((subCount >= 2 && subCount <= 4) ? `${subCount} подраздела` : `${subCount} подразделов`);

  return `
    <div class="category-card" style="--card-accent: ${iconColor};">
      <!-- Left: Icon & Info -->
      <div class="category-main-col">
        <div class="category-icon-box" style="background: ${iconBg}; color: ${iconColor};">
          ${getIcon(cat.icon)}
        </div>
        <div class="category-info">
          <div class="category-title-row">
            <a href="/forum/category/${cat.slug}" data-link class="category-title" style="color: ${titleColor};">
              ${cat.title}
            </a>
            ${cat.badge_text ? `
              <span class="section-custom-badge" style="background: ${cat.badge_color || '#FF1F36'};">
                ${cat.badge_text}
              </span>
            ` : ''}
            ${subCount > 0 ? `
              <a href="/forum/category/${cat.slug}" data-link class="cat-subs-pill" title="Открыть раздел и посмотреть подразделы">
                <span class="cat-subs-pill-icon">${ICONS.folder}</span>
                <span>${subsLabel}</span>
                <span class="cat-subs-pill-arrow">›</span>
              </a>
            ` : ''}
            ${cat.is_locked ? `
              <span class="section-locked-icon" title="Раздел только для чтения">${ICONS.lock}</span>
            ` : ''}
          </div>
          <p class="category-desc" style="color: ${descColor};">${cat.description || ''}</p>
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
}

export function renderHomeForum() {
  const forumCategories = (state.forumCategories && state.forumCategories.length > 0)
    ? state.forumCategories
    : [{ id: 'fcat_all', title: 'Разделы форума', icon: 'folder', color: '#FF1F36', sections: state.categories }];

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

      <!-- Forum Categories Grouped Blocks -->
      <div class="forum-categories-wrapper">
        ${forumCategories.map(fc => {
          const sections = fc.sections || [];
          return `
            <div class="forum-category-block" id="block-${fc.id}" style="--fcat-color: ${fc.color || '#FF1F36'};">
              <div class="forum-category-header">
                <div class="fcat-header-left">
                  <span class="fcat-icon" style="color: ${fc.color || '#FF1F36'};">${getIcon(fc.icon)}</span>
                  <h3 class="fcat-title">${fc.title}</h3>
                  ${fc.description ? `<span class="fcat-desc">${fc.description}</span>` : ''}
                </div>
                <div class="fcat-header-right">
                  <span class="fcat-count-badge">${sections.length} ${sections.length === 1 ? 'раздел' : (sections.length < 5 ? 'раздела' : 'разделов')}</span>
                </div>
              </div>

              <div class="categories-cards-list">
                ${sections.length > 0 ? sections.map(cat => renderSectionCard(cat)).join('') : `
                  <div class="empty-category-notice">
                    <span>В этой категории пока нет созданных разделов</span>
                  </div>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
