// Phoenix RP Forum - Create Thread Page
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { renderRichEditor } from '../components/RichEditor.js';

export function renderCreateThread(selectedCategorySlug = null) {
  const isMod = state.user && ['moderator', 'admin', 'superadmin'].includes(state.user.role);

  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} Главная</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Создание новой темы</span>
      </div>

      <div class="create-thread-card">
        <div class="create-thread-header">
          <div class="create-icon-bubble">
            ${ICONS.pencil}
          </div>
          <div>
            <h2 class="create-title">Создание новой темы</h2>
            <p class="create-subtitle">Заполните поля ниже, выберите раздел и сформулируйте заголовок.</p>
          </div>
        </div>

        <form id="form-create-thread">
          <div class="form-row-grid">
            <!-- Category Select -->
            <div class="modal-field">
              <label>Раздел форума *</label>
              <select class="modal-select" id="thread-category" required>
                ${state.categories.map(cat => `
                  <option value="${cat.id}" ${cat.slug === selectedCategorySlug ? 'selected' : ''}>
                    ${cat.title}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Tag Select -->
            <div class="modal-field">
              <label>Тег темы</label>
              <select class="modal-select" id="thread-tag">
                <option value="Обсуждение">Обсуждение</option>
                <option value="Вопрос">Вопрос</option>
                <option value="Предложение">Предложение</option>
                <option value="Баг / Ошибка">Баг / Ошибка</option>
                <option value="RP Биография">RP Биография</option>
                <option value="Жалоба">Жалоба</option>
                <option value="Торговля">Торговля</option>
                <option value="Гайд">Гайд / Помощь</option>
              </select>
            </div>
          </div>

          <!-- Title Input -->
          <div class="modal-field">
            <label>Заголовок темы *</label>
            <input 
              type="text" 
              class="modal-input" 
              id="thread-title" 
              placeholder="Краткое и понятное название темы..." 
              required 
              minlength="5" 
              maxlength="150" 
            />
          </div>

          <!-- Content Rich Editor -->
          <div class="modal-field">
            <label>Содержание темы *</label>
            ${renderRichEditor('thread-content')}
          </div>

          ${isMod ? `
            <div style="margin: 12px 0; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="thread-pinned" style="accent-color: #FF2338; cursor: pointer; width: 16px; height: 16px;" />
              <label for="thread-pinned" style="font-size: 13px; color: #F4F5F7; cursor: pointer;">
                Закрепить тему вверху раздела (Права модератора)
              </label>
            </div>
          ` : ''}

          <div class="create-actions-bar">
            <a href="/forum" data-link class="btn-secondary">Отмена</a>
            <button type="submit" class="btn-create-topic" id="btn-submit-create-thread">
              ${ICONS.send}
              <span>Опубликовать тему</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}
