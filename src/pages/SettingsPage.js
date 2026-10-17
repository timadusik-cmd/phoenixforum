// Phoenix RP Forum - Account Settings Page
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';

export function renderSettingsPage() {
  const user = state.user;
  if (!user) return '<div class="main-content"><p>Требуется авторизация</p></div>';

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
    </div>
  `;
}
