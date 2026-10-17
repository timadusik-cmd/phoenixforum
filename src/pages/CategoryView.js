// Phoenix RP Forum - Category View Page
import { ICONS, getIcon } from '../utils/icons.js';

export function renderCategoryView(data) {
  const { category, parentCategory, subSections, threads, pagination, currentFilter = 'all' } = data;

  const iconColor = category.icon_color || '#FF1F36';
  const iconBg = category.icon_bg || 'rgba(255, 31, 54, 0.12)';
  const titleColor = category.title_color || '#FFFFFF';
  const descColor = category.description_color || '#8E95A5';

  let threadsListHtml = '';
  if (threads && threads.length > 0) {
    threadsListHtml = threads.map(t => {
      const createdDate = new Date(t.created_at).toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      return `
        <div class="thread-row ${t.is_pinned ? 'pinned' : ''}">
          <div class="thread-avatar-col">
            <img src="${t.author_avatar || '/assets/avatar_ivan.jpg'}" alt="${t.author_name}" class="thread-author-avatar" />
          </div>

          <div class="thread-info-col">
            <div class="thread-title-wrap">
              ${t.is_pinned ? `<span class="badge-tag pinned">${ICONS.pin} Закреплено</span>` : ''}
              ${t.is_locked ? `<span class="badge-tag locked">${ICONS.lock} Закрыто</span>` : ''}
              ${t.is_solved ? `<span class="badge-tag solved">${ICONS.check} Решено</span>` : ''}
              ${t.tag ? `<span class="badge-tag default">${t.tag}</span>` : ''}
              ${t.category_title && t.category_id !== category.id ? `
                <a href="/forum/category/${t.category_slug}" data-link class="badge-tag subsection" style="text-decoration:none; color: #8E95A5; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);">
                  ${t.category_title}
                </a>
              ` : ''}
              <a href="/forum/thread/${t.id}" data-link class="thread-title-link">${t.title}</a>
            </div>
            <div class="thread-meta-wrap">
              <span class="thread-author" style="color: ${t.author_color || '#FF8A00'}; font-weight: 600;">${t.author_name}</span>
              <span class="meta-dot">•</span>
              <span class="thread-date">${createdDate}</span>
              ${t.last_reply_user ? `
                <span class="meta-dot">•</span>
                <span class="thread-last-reply">Посл. ответ: <strong>${t.last_reply_user}</strong></span>
              ` : ''}
            </div>
          </div>

          <div class="thread-stats-col">
            <div class="stat-pair">
              <span class="stat-count">${t.replies_count || 0}</span>
              <span class="stat-title">ответов</span>
            </div>
            <div class="stat-pair">
              <span class="stat-count">${t.views_count || 0}</span>
              <span class="stat-title">просмотров</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    threadsListHtml = `
      <div class="empty-threads-card">
        <div class="empty-icon">${ICONS['message-square']}</div>
        <h3>В этом разделе пока нет тем</h3>
        <p>${category.is_locked ? 'В данном разделе создание новых тем отключено администрацией.' : 'Станьте первым, кто опубликует вопрос, предложение или важную информацию!'}</p>
        ${!category.is_locked ? `
          <a href="/forum/create?category=${category.slug}" data-link class="btn-create-topic" style="margin-top: 12px; display: inline-flex;">
            ${ICONS.pencil}
            <span>Создать первую тему</span>
          </a>
        ` : ''}
      </div>
    `;
  }

  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} <span>Главная</span></a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        ${parentCategory ? `
          <span class="breadcrumb-separator">›</span>
          <a href="/forum/category/${parentCategory.slug}" data-link class="breadcrumb-item">${parentCategory.title}</a>
        ` : ''}
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">${category.title}</span>
      </div>

      <!-- Category Hero Header -->
      <div class="category-header-card" style="border-left: 3px solid ${iconColor};">
        <div class="cat-header-icon" style="background: ${iconBg}; color: ${iconColor};">
          ${getIcon(category.icon)}
        </div>
        <div class="cat-header-info">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <h2 class="cat-header-title" style="color: ${titleColor};">${category.title}</h2>
            ${category.badge_text ? `
              <span class="section-custom-badge" style="background: ${category.badge_color || '#FF1F36'}; font-size: 11px;">
                ${category.badge_text}
              </span>
            ` : ''}
            ${category.is_locked ? `
              <span class="section-locked-icon" title="Раздел только для чтения" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; background: rgba(255, 31, 54, 0.15); color: #FF4D4D; font-size: 11px; font-weight: 600;">
                ${ICONS.lock} Закрытый раздел
              </span>
            ` : ''}
          </div>
          <p class="cat-header-desc" style="color: ${descColor};">${category.description || ''}</p>
        </div>
        ${!category.is_locked ? `
          <a href="/forum/create?category=${category.slug}" data-link class="btn-create-topic">
            ${ICONS.pencil}
            <span>Создать тему</span>
          </a>
        ` : `
          <div class="btn-create-topic locked" style="opacity: 0.6; cursor: not-allowed; background: #1A202C; pointer-events: none;">
            ${ICONS.lock}
            <span>Раздел закрыт</span>
          </div>
        `}
      </div>

      <!-- Subsections Block (if parent category has child subsections) -->
      ${subSections && subSections.length > 0 ? `
        <div class="category-subsections-block">
          <div class="category-subsections-header">
            <span class="cat-subs-title">${ICONS.folder} Подразделы</span>
            <span class="cat-subs-count">${subSections.length}</span>
          </div>
          <div class="category-subsections-grid">
            ${subSections.map(sub => `
              <a href="/forum/category/${sub.slug}" data-link class="category-subsection-card" style="--sub-color: ${sub.icon_color || '#FF1F36'};">
                <div class="sub-card-left">
                  <div class="sub-card-icon" style="background: ${sub.icon_bg || 'rgba(255, 31, 54, 0.12)'}; color: ${sub.icon_color || '#FF1F36'};">
                    ${getIcon(sub.icon)}
                  </div>
                  <div class="sub-card-text">
                    <div class="sub-card-title-row">
                      <span class="sub-card-title" style="color: ${sub.title_color || '#FFFFFF'};">${sub.title}</span>
                      ${sub.badge_text ? `
                        <span class="section-custom-badge" style="background: ${sub.badge_color || '#FF1F36'}; font-size: 10px; padding: 1px 6px;">
                          ${sub.badge_text}
                        </span>
                      ` : ''}
                    </div>
                    ${sub.description ? `<p class="sub-card-desc" style="color: ${sub.description_color || '#8E95A5'};">${sub.description}</p>` : ''}
                  </div>
                </div>
                <div class="sub-card-stats">
                  <span class="sub-stat-num">${sub.threads_count || 0} тем</span>
                  <span class="sub-card-arrow">›</span>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Filter Tabs -->
      <div class="thread-filter-bar">
        <div class="filter-tabs">
          <a href="/forum/category/${category.slug}?filter=all" data-link class="filter-tab ${currentFilter === 'all' ? 'active' : ''}">Все темы</a>
          <a href="/forum/category/${category.slug}?filter=pinned" data-link class="filter-tab ${currentFilter === 'pinned' ? 'active' : ''}">Закреплённые</a>
          <a href="/forum/category/${category.slug}?filter=important" data-link class="filter-tab ${currentFilter === 'important' ? 'active' : ''}">Важные</a>
          <a href="/forum/category/${category.slug}?filter=open" data-link class="filter-tab ${currentFilter === 'open' ? 'active' : ''}">Открытые</a>
          <a href="/forum/category/${category.slug}?filter=solved" data-link class="filter-tab ${currentFilter === 'solved' ? 'active' : ''}">Решённые</a>
        </div>
      </div>

      <!-- Threads List -->
      <div class="threads-container">
        ${threadsListHtml}
      </div>

      <!-- Pagination -->
      ${pagination && pagination.totalPages > 1 ? `
        <div class="pagination-bar">
          ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => `
            <a href="/forum/category/${category.slug}?page=${p}&filter=${currentFilter}" data-link class="page-link ${p === pagination.page ? 'active' : ''}">
              ${p}
            </a>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}
