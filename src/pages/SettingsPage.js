// Phoenix RP Forum - Account Settings Page
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { DECORATIONS, DECORATION_CATEGORIES, getDecorationById } from '../utils/decorations.js';

export function renderSettingsPage() {
  const user = state.user;
  if (!user) return '<div class="main-content"><p>Требуется авторизация</p></div>';

  const currentDecoration = user.avatar_decoration || '';
  const currentDecObj = getDecorationById(currentDecoration);

  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} Главная</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Настройки аккаунта</span>
      </div>

      <div class="settings-page-grid">
        <!-- Profile Info Form -->
        <div class="widget-card" style="padding: 24px;">
          <h2 class="settings-card-title">
            ${ICONS.user}
            <span>Основная информация профиля</span>
          </h2>
          <p style="font-size: 13px; color: #929BAA; margin-bottom: 20px;">
            Эти данные отображаются в вашем профиле и в сообщениях на форуме.
          </p>

          <form id="form-update-profile">
            <div class="form-row-grid">
              <div class="modal-field">
                <label>Имя персонажа (RP Nickname)</label>
                <input type="text" class="modal-input" id="set-char-name" value="${user.character_name || user.username}" />
              </div>
              <div class="modal-field">
                <label>Фракция / Организация</label>
                <input type="text" class="modal-input" id="set-fraction" value="${user.fraction || 'Гражданский'}" />
              </div>
            </div>

            <div class="modal-field">
              <label>О себе (Биография)</label>
              <textarea class="modal-textarea" id="set-bio" placeholder="Краткая информация о вашем персонаже...">${user.bio || ''}</textarea>
            </div>

            <div class="modal-field">
              <label>Подпись сообщений (Signature)</label>
              <textarea class="modal-textarea" id="set-signature" style="min-height: 70px;" placeholder="Текст, который будет отображаться под каждым вашим сообщением...">${user.signature || ''}</textarea>
            </div>

            <div class="form-row-grid">
              <div class="modal-field">
                <label>Discord Tag</label>
                <input type="text" class="modal-input" id="set-discord" placeholder="username#0000" value="${user.discord_tag || ''}" />
              </div>
              <div class="modal-field">
                <label>Telegram</label>
                <input type="text" class="modal-input" id="set-telegram" placeholder="@username" value="${user.telegram_tag || ''}" />
              </div>
              <div class="modal-field">
                <label>Ссылка VK</label>
                <input type="text" class="modal-input" id="set-vk" placeholder="https://vk.com/..." value="${user.vk_link || ''}" />
              </div>
            </div>

            <button type="submit" class="btn-create-topic" style="margin-top: 10px;">
              ${ICONS.check}
              <span>Сохранить профиль</span>
            </button>
          </form>
        </div>

        <!-- Security & Password -->
        <div class="widget-card" style="padding: 24px;">
          <h2 class="settings-card-title">
            ${ICONS.lock}
            <span>Безопасность и смена пароля</span>
          </h2>
          <p style="font-size: 13px; color: #929BAA; margin-bottom: 20px;">
            Регулярно обновляйте пароль для защиты вашего игрового аккаунта.
          </p>

          <form id="form-change-password">
            <div class="modal-field">
              <label>Текущий пароль</label>
              <input type="password" class="modal-input" id="pwd-old" placeholder="Введите старый пароль" required />
            </div>

            <div class="modal-field">
              <label>Новый пароль (минимум 6 символов)</label>
              <input type="password" class="modal-input" id="pwd-new" placeholder="Новый пароль" required minlength="6" />
            </div>

            <div class="modal-field">
              <label>Подтвердите новый пароль</label>
              <input type="password" class="modal-input" id="pwd-confirm" placeholder="Повторите новый пароль" required minlength="6" />
            </div>

            <button type="submit" class="btn-secondary" style="margin-top: 10px; border-color: #FF2338; color: #FFF;">
              <span>Обновить пароль</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Avatar Decorations Card -->
      <div class="widget-card" style="padding: 24px; margin-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 class="settings-card-title" style="margin-bottom: 4px;">
              <span>✨ Оформление аватарки (Discord APNG Эффекты)</span>
              <span style="background: linear-gradient(135deg, #FF1F36, #FF8A00); color: #FFF; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; margin-left: 8px;">${DECORATIONS.length} доступно</span>
            </h2>
            <p style="font-size: 13px; color: #929BAA;">
              Выберите анимированное украшение для вашей аватарки на форуме. Оно будет видно в сообщениях, профиле и списке участников.
            </p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start;" class="settings-decorations-layout">
          <!-- Live Preview Column -->
          <div style="background: #0E1017; border: 1px solid #1E2330; border-radius: 10px; padding: 20px; text-align: center;">
            <div style="font-size: 12px; font-weight: 600; color: #8A96A6; margin-bottom: 12px;">Живой предпросмотр:</div>
            
            <div style="position: relative; width: 90px; height: 90px; margin: 0 auto 12px;">
              <img src="${user.avatar || '/assets/avatar_ivan.jpg'}" alt="${user.username}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #FF1F36;" id="settings-preview-avatar-img" />
              <img src="${currentDecoration || ''}" class="avatar-decoration" id="settings-preview-dec-img" alt="" style="${currentDecoration ? 'display: block;' : 'display: none;'}" />
            </div>

            <div style="font-weight: 700; font-size: 15px; color: #FFF;" id="settings-preview-username">${user.username}</div>
            <div style="font-size: 12px; color: #FF8A00; margin-top: 2px;" id="settings-preview-dec-name">${currentDecObj ? currentDecObj.name : (currentDecoration ? 'Установлено' : 'Без украшения')}</div>

            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
              <button type="button" class="btn-create-topic" id="btn-save-settings-decoration" style="background: linear-gradient(135deg, #FF1F36, #FF8A00); padding: 8px 16px; font-size: 12px; font-weight: 700; justify-content: center;">
                ${ICONS.check} <span>Применить украшение</span>
              </button>
              <button type="button" class="btn-secondary danger" id="btn-remove-settings-decoration" style="padding: 8px 16px; font-size: 12px; justify-content: center;">
                ✕ <span>Снять украшение</span>
              </button>
            </div>
          </div>

          <!-- Catalog Column -->
          <div>
            <!-- Category Filter Buttons -->
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;" id="settings-dec-cat-filter">
              ${DECORATION_CATEGORIES.map((cat, idx) => `
                <button type="button" class="btn-secondary btn-settings-dec-cat ${idx === 0 ? 'active' : ''}" data-cat-id="${cat.id}" style="padding: 4px 10px; font-size: 11.5px; ${idx === 0 ? 'background: #FF1F36; border-color: #FF1F36; color: #FFF;' : ''}">
                  ${cat.name}
                </button>
              `).join('')}
            </div>

            <!-- Grid of decoration cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; max-height: 420px; overflow-y: auto; padding-right: 6px;" id="settings-dec-grid">
              ${DECORATIONS.map(d => {
                const isSelected = d.url === currentDecoration;
                return `
                  <div class="settings-dec-card ${isSelected ? 'selected' : ''}" data-url="${d.url}" data-name="${d.name}" data-category="${d.category}" style="background: #141722; border: 1.5px solid ${isSelected ? '#FF1F36' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; padding: 10px; cursor: pointer; text-align: center; transition: all 0.2s;">
                    <div style="position: relative; width: 56px; height: 56px; margin: 0 auto 6px;">
                      <img src="${user.avatar || '/assets/avatar_ivan.jpg'}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="" />
                      <img src="${d.url}" class="avatar-decoration" alt="${d.name}" loading="lazy" />
                    </div>
                    <div style="font-size: 11px; font-weight: 700; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${d.name}">${d.name}</div>
                    <div style="font-size: 9.5px; color: #8A96A6; margin-top: 1px;">${d.category}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
