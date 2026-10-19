// Phoenix RP Forum - Create Thread Page
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { renderRichEditor } from '../components/RichEditor.js';

export function renderCreateThread(selectedCategorySlug = null) {
  const isMod = state.user && ['moderator', 'admin', 'superadmin'].includes(state.user.role);
  const isAdmin = state.user && ['admin', 'superadmin'].includes(state.user.role);

  // Map subsections by parent_id
  const subSectionsByParent = {};
  (state.categories || []).forEach(cat => {
    if (cat.parent_id) {
      if (!subSectionsByParent[cat.parent_id]) {
        subSectionsByParent[cat.parent_id] = [];
      }
      subSectionsByParent[cat.parent_id].push(cat);
    }
  });

  // Check if a category matches selectedCategorySlug
  const isTargetSelected = (cat) => {
    if (!selectedCategorySlug) return false;
    const target = String(selectedCategorySlug).trim().toLowerCase();
    const id = String(cat.id || '').trim().toLowerCase();
    const slug = String(cat.slug || '').trim().toLowerCase();
    return target === id || target === slug;
  };

  const selectedCat = (state.categories || []).find(c => isTargetSelected(c));
  const isSelectedLocked = selectedCat && Boolean(selectedCat.is_locked);

  const renderOption = (cat, isSub = false) => {
    const isSelected = isTargetSelected(cat);
    const isLocked = Boolean(cat.is_locked);
    // Locked categories can only be posted to by Administrators / Superadmins
    const disabledAttr = (isLocked && !isAdmin) ? 'disabled' : '';
    const prefix = isSub ? '　↳ ' : '';
    let lockLabel = '';
    if (isLocked) {
      lockLabel = isAdmin ? ' [🔒 Закрыт — доступно админам]' : ' [🔒 Закрыт (только чтение)]';
    }

    return `
      <option value="${cat.id}" data-slug="${cat.slug}" ${isSelected ? 'selected' : ''} ${disabledAttr}>
        ${prefix}${cat.title}${lockLabel}
      </option>
    `;
  };

  let selectOptionsHtml = '';
  if (state.forumCategories && state.forumCategories.length > 0) {
    selectOptionsHtml = state.forumCategories.map(fc => {
      const sections = fc.sections || [];
      if (sections.length === 0) return '';

      const secOptions = sections.map(sec => {
        let out = renderOption(sec, false);
        const subs = (sec.subSections && sec.subSections.length > 0)
          ? sec.subSections
          : (subSectionsByParent[sec.id] || []);
        if (subs.length > 0) {
          out += subs.map(sub => renderOption(sub, true)).join('');
        }
        return out;
      }).join('');

      return `<optgroup label="${fc.title}">${secOptions}</optgroup>`;
    }).join('');
  } else {
    const topCats = (state.categories || []).filter(c => !c.parent_id);
    selectOptionsHtml = topCats.map(sec => {
      let out = renderOption(sec, false);
      const subs = subSectionsByParent[sec.id] || [];
      if (subs.length > 0) {
        out += subs.map(sub => renderOption(sub, true)).join('');
      }
      return out;
    }).join('');
  }

  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} Главная</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        ${selectedCat ? `
          <span class="breadcrumb-separator">›</span>
          <a href="/forum/category/${selectedCat.slug}" data-link class="breadcrumb-item">${selectedCat.title}</a>
        ` : ''}
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

        ${isSelectedLocked && !isAdmin ? `
          <div class="create-thread-alert warning" style="margin: 0 0 20px 0; padding: 12px 16px; background: rgba(255, 31, 54, 0.12); border: 1px solid rgba(255, 31, 54, 0.3); border-radius: 8px; color: #FFA3A3; font-size: 13px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 16px;">${ICONS.lock}</span>
            <span>Раздел «<strong>${selectedCat.title}</strong>» закрыт администрацией только для чтения. Выберите открытый подраздел или раздел для публикации темы.</span>
          </div>
        ` : ''}

        ${isSelectedLocked && isAdmin ? `
          <div class="create-thread-alert info" style="margin: 0 0 20px 0; padding: 12px 16px; background: rgba(0, 145, 255, 0.12); border: 1px solid rgba(0, 145, 255, 0.3); border-radius: 8px; color: #90CAF9; font-size: 13px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 16px;">${ICONS.shield}</span>
            <span>Раздел «<strong>${selectedCat.title}</strong>» закрыт для обычных пользователей. Как Администратор, вы обладаете правами публикации в этом разделе.</span>
          </div>
        ` : ''}

        <form id="form-create-thread">
          <div class="form-row-grid" style="grid-template-columns: 1.8fr 1.2fr 1fr;">
            <!-- Category Select -->
            <div class="modal-field">
              <label>Раздел / подраздел форума *</label>
              <select class="modal-select" id="thread-category" required>
                ${selectOptionsHtml}
              </select>
            </div>

            <!-- Prefix Select -->
            <div class="modal-field" id="field-thread-prefix">
              <label>Префикс темы</label>
              <select class="modal-select" id="thread-prefix">
                <option value="">[Без префикса]</option>
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
