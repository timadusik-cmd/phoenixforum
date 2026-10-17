// Phoenix RP Forum - Category View Page
import { ICONS, getIcon } from '../utils/icons.js';

export function renderCategoryView(data) {
  const { category, threads, pagination, currentFilter = 'all' } = data;

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
        <p>Станьте первым, кто опубликует вопрос, предложение или информацию!</p>
        <a href="/forum/create?category=${category.slug}" data-link class="btn-create-topic" style="margin-top: 12px; display: inline-flex;">
          ${ICONS.pencil}
          <span>Создать первую тему</span>
        </a>
      </div>
    `;
  }

  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} Главная</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">${category.title}</span>
      </div>

      <!-- Category Hero Header -->
      <div class="category-header-card">
        <div class="cat-header-icon">
          ${getIcon(category.icon)}
        </div>
        <div class="cat-header-info">
          <h2 class="cat-header-title">${category.title}</h2>
          <p class="cat-header-desc">${category.description || ''}</p>
        </div>
        <a href="/forum/create?category=${category.slug}" data-link class="btn-create-topic">
          ${ICONS.pencil}
          <span>Создать тему</span>
        </a>
      </div>

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
