// Phoenix RP Forum - Search Page
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';

export function renderSearchPage(data = {}) {
  const { threads = [], pagination = {}, query = {} } = data;
  const currentQ = query.q || '';
  const currentAuthor = query.author || '';
  const currentCategory = query.category || '';
  const currentSort = query.sort || 'date';

  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} Главная</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Поиск по форуму</span>
      </div>

      <!-- Search Control Card -->
      <div class="search-page-card">
        <h2 class="search-page-title">${ICONS.search} Расширенный поиск</h2>
        <p class="search-page-subtitle">Ищите темы и сообщения по ключевым словам, авторам и разделам.</p>

        <form id="form-search-advanced" class="search-form-grid">
          <div class="modal-field">
            <label>Ключевые слова</label>
            <input type="text" class="modal-input" id="search-q" placeholder="Что вы хотите найти?..." value="${currentQ}" />
          </div>

          <div class="modal-field">
            <label>Автор (Никнейм)</label>
            <input type="text" class="modal-input" id="search-author" placeholder="Имя игрока..." value="${currentAuthor}" />
          </div>

          <div class="modal-field">
            <label>Раздел форума</label>
            <select class="modal-select" id="search-category">
              <option value="">Все разделы</option>
              ${state.categories.map(c => `
                <option value="${c.slug}" ${c.slug === currentCategory ? 'selected' : ''}>${c.title}</option>
              `).join('')}
            </select>
          </div>

          <div class="modal-field">
            <label>Сортировка</label>
            <select class="modal-select" id="search-sort">
              <option value="date" ${currentSort === 'date' ? 'selected' : ''}>Сначала новые</option>
              <option value="replies" ${currentSort === 'replies' ? 'selected' : ''}>Больше всего ответов</option>
              <option value="views" ${currentSort === 'views' ? 'selected' : ''}>Больше всего просмотров</option>
            </select>
          </div>

          <div class="search-submit-row">
            <button type="submit" class="btn-create-topic" id="btn-submit-search">
              ${ICONS.search}
              <span>Найти темы</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Search Results Section -->
      <div class="search-results-section">
        <div class="search-results-header">
          <h3>Результаты поиска ${pagination.total !== undefined ? `(${pagination.total})` : ''}</h3>
        </div>

        ${threads.length > 0 ? `
          <div class="threads-container">
            ${threads.map(t => `
              <div class="thread-row">
                <div class="thread-avatar-col">
                  <img src="${t.author_avatar || '/assets/avatar_ivan.jpg'}" alt="${t.author_name}" class="thread-author-avatar" />
                </div>
                <div class="thread-info-col">
                  <div class="thread-title-wrap">
                    <span class="badge-tag default">${t.category_title}</span>
                    ${t.tag ? `<span class="badge-tag" style="background:#121722;">${t.tag}</span>` : ''}
                    <a href="/forum/thread/${t.id}" data-link class="thread-title-link">${t.title}</a>
                  </div>
                  ${t.snippet ? `<p class="search-snippet">${t.snippet.substring(0, 180)}...</p>` : ''}
                  <div class="thread-meta-wrap">
                    <span class="thread-author" style="color: ${t.author_color || '#FF8A00'};">${t.author_name}</span>
                    <span class="meta-dot">•</span>
                    <span class="thread-date">${new Date(t.created_at).toLocaleDateString('ru-RU')}</span>
                    <span class="meta-dot">•</span>
                    <span>${t.replies_count || 0} ответов</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-threads-card">
            <div class="empty-icon">${ICONS.search}</div>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить формулировку запроса или выбрать другие критерии фильтрации.</p>
          </div>
        `}
      </div>
    </div>
  `;
}
