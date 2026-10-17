// Phoenix RP Forum - Modals Component
import { state, notifyStateChange } from '../state.js';
import { ICONS, getIcon } from '../utils/icons.js';
import { api, authStorage } from '../api/client.js';
import { playSound } from '../utils/sound.js';
import { router } from '../router.js';

export function openModal(name, context = null) {
  state.activeModal = name;
  state.authError = null;
  state.modalContext = context;
  if (context) state.reportContext = context;
  renderModal();
}

export function closeModal() {
  state.activeModal = null;
  state.authError = null;
  state.reportContext = null;
  state.modalContext = null;
  renderModal();
}

export function renderModal() {
  const container = document.getElementById('modal-container');
  if (!container) return;

  if (!state.activeModal) {
    container.innerHTML = '';
    return;
  }

  // 1. Auth Modal
  if (state.activeModal === 'auth') {
    const isLogin = state.authTab === 'login';

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 28px; height: 28px;">
                <img src="/assets/phoenix_logo.png" alt="Phoenix" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
              <h3 class="modal-title">${isLogin ? 'Вход в аккаунт' : 'Регистрация на форуме'}</h3>
            </div>
            <button class="modal-close-btn" id="modal-close-btn">${ICONS.x}</button>
          </div>

          <div class="modal-body">
            <!-- Tabs -->
            <div class="auth-tabs">
              <button class="auth-tab ${isLogin ? 'active' : ''}" id="tab-auth-login">Вход</button>
              <button class="auth-tab ${!isLogin ? 'active' : ''}" id="tab-auth-register">Регистрация</button>
            </div>

            <!-- Error Banner -->
            ${state.authError ? `
              <div class="auth-error-banner">
                ${ICONS['alert-circle']}
                <span>${state.authError}</span>
              </div>
            ` : ''}

            ${isLogin ? `
              <!-- Login Form -->
              <div class="modal-field">
                <label>Логин или Email</label>
                <div class="input-with-icon">
                  <span class="input-icon-prefix">${ICONS.user}</span>
                  <input type="text" class="modal-input" id="auth-login-identifier" placeholder="Ivan_Petrov или email@mail.ru" />
                </div>
              </div>

              <div class="modal-field">
                <label>Пароль</label>
                <div class="input-with-icon">
                  <span class="input-icon-prefix">${ICONS.lock}</span>
                  <input type="password" class="modal-input" id="auth-login-password" placeholder="Введите ваш пароль" />
                </div>
              </div>

              <button class="btn-create-topic" id="btn-submit-login" style="width: 100%; justify-content: center; padding: 12px; margin-top: 6px;">
                ${ICONS.logIn}
                <span>Войти</span>
              </button>

              <div class="auth-switch-link">
                <span>Нет аккаунта?</span>
                <button type="button" id="link-switch-to-register">Зарегистрироваться</button>
              </div>
            ` : `
              <!-- Registration Form -->
              <div class="modal-field">
                <label>Электронная почта</label>
                <div class="input-with-icon">
                  <span class="input-icon-prefix">${ICONS.mail}</span>
                  <input type="email" class="modal-input" id="auth-reg-email" placeholder="example@mail.ru" />
                </div>
              </div>

              <div class="modal-field">
                <label>Логин (Никнейм)</label>
                <div class="input-with-icon">
                  <span class="input-icon-prefix">${ICONS.user}</span>
                  <input type="text" class="modal-input" id="auth-reg-username" placeholder="Например: Ivan_Petrov" />
                </div>
              </div>

              <div class="modal-field">
                <label>Пароль</label>
                <div class="input-with-icon">
                  <span class="input-icon-prefix">${ICONS.lock}</span>
                  <input type="password" class="modal-input" id="auth-reg-password" placeholder="Минимум 6 символов" />
                </div>
              </div>

              <div class="modal-field">
                <label>Повторите пароль</label>
                <div class="input-with-icon">
                  <span class="input-icon-prefix">${ICONS.lock}</span>
                  <input type="password" class="modal-input" id="auth-reg-repeat-password" placeholder="Повторите пароль" />
                </div>
              </div>

              <button class="btn-create-topic" id="btn-submit-register" style="width: 100%; justify-content: center; padding: 12px; margin-top: 6px;">
                <span>Зарегистрироваться</span>
              </button>

              <div class="auth-switch-link">
                <span>Уже есть аккаунт?</span>
                <button type="button" id="link-switch-to-login">Войти</button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // 2. Report Violation Modal
  else if (state.activeModal === 'report') {
    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card" style="max-width: 480px;">
          <div class="modal-header">
            <h3 class="modal-title">Пожаловаться на нарушение</h3>
            <button class="modal-close-btn" id="modal-close-btn">${ICONS.x}</button>
          </div>
          <div class="modal-body">
            <div class="modal-field">
              <label>Причина жалобы</label>
              <textarea class="modal-textarea" id="report-reason" placeholder="Опишите нарушение (DM, оскорбление, спам, оффтоп и т.д.)..."></textarea>
            </div>
            <button class="btn-create-topic" id="btn-submit-report" style="width: 100%; justify-content: center;">
              <span>Отправить жалобу</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Quick Connect Modal
  else if (state.activeModal === 'serverConnect') {
    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card" style="max-width: 460px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 28px; height: 28px;">
                <img src="/assets/phoenix_logo.png" alt="Phoenix" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
              <h3 class="modal-title">Подключение к Phoenix RP</h3>
            </div>
            <button class="modal-close-btn" id="modal-close-btn">${ICONS.x}</button>
          </div>
          <div class="modal-body" style="text-align: center;">
            <p style="font-size: 13px; color: #929BAA; margin-bottom: 16px;">
              Сервер работает на базе платформы RAGE:MP (GTA V). Для прямого подключения скопируйте адрес ниже:
            </p>
            <div style="background: #07090D; border: 1px solid #202631; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 15px; color: #FF2338; font-weight: 700; margin-bottom: 16px;">
              s1.phoenix-rp.ru:22005
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn-secondary" id="btn-copy-ip" style="flex: 1; justify-content: center;">
                ${ICONS.copy}
                <span>Скопировать IP</span>
              </button>
              <a href="https://phoenix-rp.ru/launcher" target="_blank" class="btn-create-topic" style="flex: 1; justify-content: center; text-decoration: none;">
                <span>Скачать лаунчер</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Servers Monitoring Modal
  else if (state.activeModal === 'servers') {
    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card" style="max-width: 580px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="color: #FF2338;">${ICONS.servers}</div>
              <div>
                <h3 class="modal-title">Игровые серверы Phoenix RP</h3>
                <p style="font-size: 11.5px; color: #8A96A6; margin: 0;">Мониторинг онлайна и прямое подключение</p>
              </div>
            </div>
            <button class="modal-close-btn" id="modal-close-btn">${ICONS.x}</button>
          </div>

          <div class="modal-body">
            <!-- Server 1: Active -->
            <div class="server-monitor-card active-server">
              <div class="server-card-top">
                <div>
                  <div class="server-title-row">
                    <span class="server-name">Phoenix RP #1 • Los Santos</span>
                    <span class="server-badge-online">● ONLINE</span>
                  </div>
                  <div class="server-meta-sub">RAGE:MP • Voice RolePlay • Экономика x1.5</div>
                </div>
                <div class="server-ping-wrap">
                  <span class="server-ping-val">24 ms</span>
                  <span class="server-ping-lbl">Пинг</span>
                </div>
              </div>

              <!-- Online Progress -->
              <div class="server-online-bar-wrap">
                <div class="server-online-labels">
                  <span>Онлайн игроков: <strong>842</strong> / 1000</span>
                  <span style="color: #FF2338; font-weight: 700;">84%</span>
                </div>
                <div class="server-progress-track">
                  <div class="server-progress-fill" style="width: 84%;"></div>
                </div>
              </div>

              <div class="server-card-actions">
                <div class="server-ip-code">s1.phoenix-rp.ru:22005</div>
                <button class="btn-secondary btn-copy-server-ip" data-ip="s1.phoenix-rp.ru:22005">
                  ${ICONS.copy} <span>Скопировать</span>
                </button>
                <a href="ragemp://s1.phoenix-rp.ru:22005" class="btn-create-topic" style="padding: 6px 14px; text-decoration: none;">
                  <span>Играть</span>
                </a>
              </div>
            </div>

            <!-- Server 2: Coming soon -->
            <div class="server-monitor-card soon-server" style="margin-top: 14px; opacity: 0.85;">
              <div class="server-card-top">
                <div>
                  <div class="server-title-row">
                    <span class="server-name">Phoenix RP #2 • San Fierro</span>
                    <span class="server-badge-soon">🟡 Скоро открытие</span>
                  </div>
                  <div class="server-meta-sub">Hard RP • Клановые войны • 1000 слотов</div>
                </div>
                <span style="font-size: 12px; color: #8A96A6; font-weight: 600;">Октябрь 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 5. Donate Shop Modal
  else if (state.activeModal === 'shop') {
    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card" style="max-width: 620px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="color: #FF2338;">${ICONS.shop}</div>
              <div>
                <h3 class="modal-title">Донат-магазин Phoenix RP</h3>
                <p style="font-size: 11.5px; color: #8A96A6; margin: 0;">Пополнение счёта, VIP-привилегии и наборы</p>
              </div>
            </div>
            <button class="modal-close-btn" id="modal-close-btn">${ICONS.x}</button>
          </div>

          <div class="modal-body">
            <!-- VIP Statuses Grid -->
            <div class="shop-vip-grid">
              <div class="shop-vip-card">
                <div class="shop-vip-badge gold">GOLD VIP</div>
                <div class="shop-vip-price">399 ₽ <span>/ 30 дней</span></div>
                <ul class="shop-vip-features">
                  <li>✓ 2x зарплата во фракциях</li>
                  <li>✓ +2 слота под транспорт</li>
                  <li>✓ Золотой цвет ника и плашка</li>
                </ul>
                <button class="btn-secondary btn-buy-vip" data-vip="Gold VIP" style="width: 100%; justify-content: center; margin-top: 8px;">Выбрать</button>
              </div>

              <div class="shop-vip-card featured">
                <div class="shop-vip-badge platinum">PLATINUM VIP</div>
                <div class="shop-vip-price">799 ₽ <span>/ 30 дней</span></div>
                <ul class="shop-vip-features">
                  <li>✓ 3x зарплата во всех работах</li>
                  <li>✓ +4 слота под авто + вертолёт</li>
                  <li>✓ Приоритет в очереди входа</li>
                  <li>✓ Платиновая плашка на форуме</li>
                </ul>
                <button class="btn-create-topic btn-buy-vip" data-vip="Platinum VIP" style="width: 100%; justify-content: center; margin-top: 8px;">Выбрать</button>
              </div>

              <div class="shop-vip-card">
                <div class="shop-vip-badge diamond">DIAMOND VIP</div>
                <div class="shop-vip-price">1 499 ₽ <span>/ 30 дней</span></div>
                <ul class="shop-vip-features">
                  <li>✓ 4x зарплата и опыт (XP)</li>
                  <li>✓ Доступ к эксклюзивным карам</li>
                  <li>✓ Вход без очереди всегда</li>
                  <li>✓ VIP-плашка Diamond</li>
                </ul>
                <button class="btn-secondary btn-buy-vip" data-vip="Diamond VIP" style="width: 100%; justify-content: center; margin-top: 8px;">Выбрать</button>
              </div>
            </div>

            <!-- Currency Top-Up Box -->
            <div class="shop-currency-box" style="margin-top: 18px; background: #0A0D13; border: 1px solid #1C222E; border-radius: 10px; padding: 14px;">
              <h4 style="color: #FFF; font-size: 13px; margin-bottom: 8px;">Покупка Phoenix Coins (1 ₽ = 10 Coins)</h4>
              <div class="form-row-grid">
                <div class="modal-field" style="margin-bottom: 0;">
                  <label>Сумма в рублях (₽)</label>
                  <input type="number" class="modal-input" id="shop-amount-input" value="500" min="50" step="50" />
                </div>
                <div class="modal-field" style="margin-bottom: 0;">
                  <label>Вы получите Coins (+10% бонус)</label>
                  <input type="text" class="modal-input" id="shop-coins-output" value="5 500 Coins" readonly style="color: #FF8A00; font-weight: 700;" />
                </div>
              </div>
              <button class="btn-create-topic" id="btn-submit-shop-pay" style="width: 100%; justify-content: center; margin-top: 12px;">
                <span>Перейти к безопасной оплате</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 6. Edit Thread Modal
  else if (state.activeModal === 'editThread') {
    const ctx = state.modalContext || {};
    const isMod = state.user && ['moderator', 'admin', 'superadmin'].includes(state.user.role);

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card" style="max-width: 520px;">
          <div class="modal-header">
            <h3 class="modal-title">Редактирование темы</h3>
            <button class="modal-close-btn" id="modal-close-btn">${ICONS.x}</button>
          </div>
          <div class="modal-body">
            <div class="modal-field">
              <label>Заголовок темы *</label>
              <input type="text" class="modal-input" id="modal-edit-thread-title" value="${ctx.title || ''}" required minlength="5" maxlength="150" />
            </div>

            <div class="form-row-grid">
              <div class="modal-field">
                <label>Тег темы</label>
                <select class="modal-select" id="modal-edit-thread-tag">
                  <option value="Обсуждение" ${ctx.tag === 'Обсуждение' ? 'selected' : ''}>Обсуждение</option>
                  <option value="Вопрос" ${ctx.tag === 'Вопрос' ? 'selected' : ''}>Вопрос</option>
                  <option value="Предложение" ${ctx.tag === 'Предложение' ? 'selected' : ''}>Предложение</option>
                  <option value="Баг / Ошибка" ${ctx.tag === 'Баг / Ошибка' ? 'selected' : ''}>Баг / Ошибка</option>
                  <option value="RP Биография" ${ctx.tag === 'RP Биография' ? 'selected' : ''}>RP Биография</option>
                  <option value="Жалоба" ${ctx.tag === 'Жалоба' ? 'selected' : ''}>Жалоба</option>
                  <option value="Торговля" ${ctx.tag === 'Торговля' ? 'selected' : ''}>Торговля</option>
                  <option value="Гайд" ${ctx.tag === 'Гайд' ? 'selected' : ''}>Гайд / Помощь</option>
                </select>
              </div>

              ${isMod ? `
                <div class="modal-field">
                  <label style="color: #FF2338;">Перенос в раздел (Модерация)</label>
                  <select class="modal-select" id="modal-edit-thread-category">
                    ${state.categories.map(c => `
                      <option value="${c.id}" ${c.id === ctx.categoryId ? 'selected' : ''}>
                        ${c.title}
                      </option>
                    `).join('')}
                  </select>
                </div>
              ` : ''}
            </div>

            <button class="btn-create-topic" id="btn-submit-edit-thread" data-thread-id="${ctx.threadId}" style="width: 100%; justify-content: center; margin-top: 10px;">
              ${ICONS.check}
              <span>Сохранить изменения</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 7. Start Conversation (Private Message) Modal
  else if (state.activeModal === 'startConversation') {
    const ctx = state.modalContext || {};

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card" style="max-width: 480px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="color: #FF2338;">${ICONS.mail}</div>
              <h3 class="modal-title">Новое личное сообщение</h3>
            </div>
            <button class="modal-close-btn" id="modal-close-btn">${ICONS.x}</button>
          </div>
          <div class="modal-body">
            <div class="modal-field">
              <label>Получатель</label>
              <input type="text" class="modal-input" id="modal-conv-recipient-name" value="${ctx.recipientName || ''}" ${ctx.recipientId ? 'readonly' : ''} placeholder="Никнейм игрока (например, Ivan_Petrov)..." />
              ${!ctx.recipientId ? `
                <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; align-items: center;">
                  <span style="font-size: 11px; color: #8A96A6;">Быстрый выбор:</span>
                  <button type="button" class="btn-quick-recipient" data-name="Ivan_Petrov" style="background: #141A26; border: 1px solid #1E273A; color: #E2E8F0; font-size: 11px; padding: 3px 8px; border-radius: 6px; cursor: pointer;">Ivan_Petrov (Администратор)</button>
                  <button type="button" class="btn-quick-recipient" data-name="Marcus_Vance" style="background: #141A26; border: 1px solid #1E273A; color: #E2E8F0; font-size: 11px; padding: 3px 8px; border-radius: 6px; cursor: pointer;">Marcus_Vance (Шеф LSPD)</button>
                  <button type="button" class="btn-quick-recipient" data-name="Alex_Cross" style="background: #141A26; border: 1px solid #1E273A; color: #E2E8F0; font-size: 11px; padding: 3px 8px; border-radius: 6px; cursor: pointer;">Alex_Cross (Модератор)</button>
                </div>
              ` : ''}
            </div>

            <div class="modal-field">
              <label>Текст сообщения *</label>
              <textarea class="modal-textarea" id="modal-conv-text" placeholder="Напишите личное сообщение..." style="min-height: 100px;"></textarea>
            </div>

            <button class="btn-create-topic" id="btn-submit-start-conv" data-recipient-id="${ctx.recipientId || ''}" style="width: 100%; justify-content: center;">
              ${ICONS.send}
              <span>Отправить сообщение</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 8. Admin Category Modal (Создание и Редактирование Категории форума)
  else if (state.activeModal === 'adminCategory') {
    const ctx = state.modalContext || {};
    const isEdit = ctx.mode === 'edit';
    const cat = ctx.category || {};
    const defaultColor = cat.color || '#FF1F36';
    const defaultIcon = cat.icon || 'folder';

    const availableIcons = [
      'folder', 'star', 'crown', 'shield', 'flame', 'car', 'briefcase', 
      'scale', 'gavel', 'users', 'help-circle', 'message-square', 'wrench', 
      'newspaper', 'servers', 'shopping-cart'
    ];

    const presetColors = [
      '#FF1F36', '#FF8A00', '#F59E0B', '#10B981', '#0091FF', '#38BDF8', '#8B5CF6', '#EC4899', '#64748B'
    ];

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card" style="max-width: 540px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="color: ${defaultColor};">${ICONS.folder}</div>
              <h3 class="modal-title">${isEdit ? 'Редактировать категорию форума' : 'Создать категорию форума'}</h3>
            </div>
            <button class="modal-close-btn" id="modal-close-btn">${ICONS.x}</button>
          </div>

          <div class="modal-body">
            <!-- Live Preview -->
            <div style="margin-bottom: 18px;">
              <label style="font-size: 11px; color: #8A96A6; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin-bottom: 6px; display: block;">Предпросмотр шапки категории:</label>
              <div class="admin-live-fcat-preview" id="live-fcat-preview" style="--fcat-p-color: ${defaultColor};">
                <span class="admin-live-fcat-accent" id="preview-fcat-accent" style="background: ${defaultColor};"></span>
                <div class="admin-live-fcat-icon" id="preview-fcat-icon" style="color: ${defaultColor};">
                  ${getIcon(defaultIcon)}
                </div>
                <div>
                  <h4 class="admin-live-fcat-title" id="preview-fcat-title">${cat.title || 'НАЗВАНИЕ КАТЕГОРИИ'}</h4>
                  <p class="admin-live-fcat-desc" id="preview-fcat-desc">${cat.description || 'Описание категории форума...'}</p>
                </div>
              </div>
            </div>

            <!-- Form fields -->
            <div class="modal-field">
              <label>Название категории *</label>
              <input type="text" class="modal-input" id="fcat-input-title" value="${cat.title || ''}" placeholder="Например: ОСНОВНОЙ РАЗДЕЛ или СЕРВЕР PHOENIX RP" required />
            </div>

            <div class="modal-field">
              <label>Краткое описание категории</label>
              <input type="text" class="modal-input" id="fcat-input-desc" value="${cat.description || ''}" placeholder="Например: Новости проекта, правила и объявления руководства" />
            </div>

            <div class="modal-field">
              <label>Цвет акцента категории</label>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                <input type="color" id="fcat-color-picker" value="${defaultColor}" style="width: 40px; height: 38px; border: none; border-radius: 6px; background: none; cursor: pointer;" />
                <input type="text" class="modal-input" id="fcat-color-text" value="${defaultColor}" style="width: 130px; font-family: monospace; text-transform: uppercase;" />
              </div>
              <div class="color-presets-row">
                ${presetColors.map(c => `
                  <button type="button" class="color-preset-dot ${c === defaultColor ? 'active' : ''}" data-fcat-color="${c}" style="background: ${c};" title="${c}"></button>
                `).join('')}
              </div>
            </div>

            <div class="modal-field">
              <label>Иконка категории</label>
              <input type="hidden" id="fcat-input-icon" value="${defaultIcon}" />
              <div class="icon-picker-grid">
                ${availableIcons.map(ic => `
                  <button type="button" class="icon-choice-btn ${ic === defaultIcon ? 'active' : ''}" data-fcat-icon="${ic}" title="${ic}">
                    ${getIcon(ic)}
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="modal-field">
              <label>Порядок отображения на странице</label>
              <input type="number" class="modal-input" id="fcat-input-order" value="${cat.display_order ?? 10}" step="1" style="width: 120px;" />
            </div>

            <button class="btn-create-topic" id="btn-submit-fcat" data-id="${cat.id || ''}" style="width: 100%; justify-content: center; margin-top: 14px;">
              ${ICONS.check}
              <span>${isEdit ? 'Сохранить категорию' : 'Создать категорию'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 9. Admin Section Modal (Масштабная настройка Раздела / Подраздела)
  else if (state.activeModal === 'adminSection') {
    const ctx = state.modalContext || {};
    const isEdit = ctx.mode === 'edit';
    const s = ctx.section || {};
    const forumCategories = ctx.forumCategories || state.forumCategories || [];
    const parentCandidates = (ctx.categories || state.categories || []).filter(c => c.id !== s.id && !c.parent_id);

    const defaultFcatId = s.forum_category_id || ctx.defaultFcatId || (forumCategories[0] ? forumCategories[0].id : '');
    const defaultParentId = s.parent_id || ctx.defaultParentId || '';

    const defaultIcon = s.icon || 'message-square';
    const defaultIconColor = s.icon_color || '#FF1F36';
    const defaultIconBg = s.icon_bg || 'rgba(255, 31, 54, 0.12)';
    const defaultTitleColor = s.title_color || '#FFFFFF';
    const defaultDescColor = s.description_color || '#8E95A5';
    const defaultBadgeText = s.badge_text || '';
    const defaultBadgeColor = s.badge_color || '#FF1F36';

    const availableIcons = [
      'newspaper', 'megaphone', 'users', 'message-square', 'chatBubble', 'shield', 
      'flame', 'wrench', 'car', 'briefcase', 'scale', 'gavel', 'star', 'crown', 
      'heart', 'help-circle', 'award', 'folder', 'lock', 'server', 'shopping-cart'
    ];

    const presetColors = [
      '#FF1F36', '#FF8A00', '#F59E0B', '#10B981', '#0091FF', '#38BDF8', '#8B5CF6', '#EC4899', '#FFFFFF', '#8E95A5'
    ];

    const presetBgColors = [
      'rgba(255, 31, 54, 0.12)', 'rgba(255, 138, 0, 0.12)', 'rgba(16, 185, 129, 0.12)',
      'rgba(0, 145, 255, 0.12)', 'rgba(139, 92, 246, 0.12)', 'rgba(236, 72, 153, 0.12)',
      'rgba(255, 255, 255, 0.08)', '#141721', '#1C2230', '#07090D'
    ];

    container.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card" style="max-width: 680px; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="color: #FF1F36;">${ICONS.settings}</div>
              <h3 class="modal-title">${isEdit ? 'Масштабная настройка раздела форума' : 'Создать раздел / подраздел форума'}</h3>
            </div>
            <button class="modal-close-btn" id="modal-close-btn">${ICONS.x}</button>
          </div>

          <div class="modal-body">
            <!-- LIVE PREVIEW CARD -->
            <div style="margin-bottom: 20px;">
              <label style="font-size: 11px; color: #8A96A6; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin-bottom: 6px; display: block;">Живой предпросмотр карточки раздела:</label>
              <div class="admin-section-live-preview">
                <div class="category-card" id="preview-section-card" style="margin: 0; background: #0B0E14; border: 1px solid #1E2535;">
                  <div class="category-main-col">
                    <div class="category-icon-box" id="preview-sec-icon-box" style="background: ${defaultIconBg}; color: ${defaultIconColor};">
                      ${getIcon(defaultIcon)}
                    </div>
                    <div class="category-info">
                      <div class="category-title-row">
                        <span class="category-title" id="preview-sec-title" style="color: ${defaultTitleColor}; font-weight: 700; font-size: 14.5px;">
                          ${s.title || 'Название раздела'}
                        </span>
                        <span class="section-custom-badge" id="preview-sec-badge" style="background: ${defaultBadgeColor}; display: ${defaultBadgeText ? 'inline-flex' : 'none'};">
                          ${defaultBadgeText || 'HOT'}
                        </span>
                        <span class="section-locked-icon" id="preview-sec-locked" style="display: ${s.is_locked ? 'inline-flex' : 'none'};" title="Только чтение">
                          ${ICONS.lock}
                        </span>
                      </div>
                      <p class="category-desc" id="preview-sec-desc" style="color: ${defaultDescColor}; font-size: 12px; margin-top: 2px;">
                        ${s.description || 'Описание раздела появится здесь в реальном времени...'}
                      </p>
                    </div>
                  </div>
                  <div class="category-stats-col">
                    <div class="cat-stat-block">
                      <div class="cat-stat-val">${ICONS.chatBubble} <span>14</span></div>
                      <span class="cat-stat-lbl">Темы</span>
                    </div>
                    <div class="cat-stat-block">
                      <div class="cat-stat-val">${ICONS.docText} <span>182</span></div>
                      <span class="cat-stat-lbl">Сообщения</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab / Section 1: Основные данные -->
            <div class="admin-config-group-box">
              <h4 class="admin-config-group-title">${ICONS.folder} 1. Основные параметры и привязка</h4>
              
              <div class="form-row-grid">
                <div class="modal-field">
                  <label>Родительская категория *</label>
                  <select class="modal-select" id="sec-select-fcat">
                    <option value="">(Без категории)</option>
                    ${forumCategories.map(fc => `
                      <option value="${fc.id}" ${fc.id === defaultFcatId ? 'selected' : ''}>${fc.title}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="modal-field">
                  <label>Сделать подразделом внутри</label>
                  <select class="modal-select" id="sec-select-parent">
                    <option value="">Нет (Основной раздел категории)</option>
                    ${parentCandidates.map(p => `
                      <option value="${p.id}" ${p.id === defaultParentId ? 'selected' : ''}>↳ ${p.title}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="form-row-grid">
                <div class="modal-field">
                  <label>Название раздела *</label>
                  <input type="text" class="modal-input" id="sec-input-title" value="${s.title || ''}" placeholder="Например: Жалобы на администрацию" required />
                </div>

                <div class="modal-field">
                  <label>URL-слаг (ID раздела) *</label>
                  <input type="text" class="modal-input" id="sec-input-slug" value="${s.slug || ''}" placeholder="admin-complaints" required style="font-family: monospace;" ${isEdit ? 'data-manual="true"' : ''} />
                </div>
              </div>

              <div class="modal-field" style="margin-bottom: 0;">
                <label>Описание раздела</label>
                <textarea class="modal-textarea" id="sec-input-desc" placeholder="Краткое описание назначения раздела..." style="min-height: 60px;">${s.description || ''}</textarea>
              </div>
            </div>

            <!-- Tab / Section 2: Масштабное визуальное оформление -->
            <div class="admin-config-group-box" style="margin-top: 16px;">
              <h4 class="admin-config-group-title">🎨 2. Масштабная настройка цветов, иконки и бейджа</h4>

              <!-- Выбор иконки -->
              <div class="modal-field">
                <label>Иконка раздела</label>
                <input type="hidden" id="sec-input-icon" value="${defaultIcon}" />
                <div class="icon-picker-grid" style="max-height: 120px; overflow-y: auto;">
                  ${availableIcons.map(ic => `
                    <button type="button" class="icon-choice-btn ${ic === defaultIcon ? 'active' : ''}" data-sec-icon="${ic}" title="${ic}">
                      ${getIcon(ic)}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Цвета иконки и фона -->
              <div class="form-row-grid">
                <div class="modal-field">
                  <label>Цвет иконки</label>
                  <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                    <input type="color" id="sec-color-icon-picker" value="${defaultIconColor.startsWith('#') ? defaultIconColor : '#FF1F36'}" style="width: 36px; height: 34px; border: none; border-radius: 6px; background: none; cursor: pointer;" />
                    <input type="text" class="modal-input" id="sec-color-icon-text" value="${defaultIconColor}" style="width: 120px; font-family: monospace;" />
                  </div>
                  <div class="color-presets-row">
                    ${presetColors.map(c => `
                      <button type="button" class="color-preset-dot" data-sec-target="icon" data-color="${c}" style="background: ${c};" title="${c}"></button>
                    `).join('')}
                  </div>
                </div>

                <div class="modal-field">
                  <label>Фоновый цвет иконки (CSS/RGBA)</label>
                  <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                    <input type="text" class="modal-input" id="sec-color-icon-bg-text" value="${defaultIconBg}" style="width: 100%; font-family: monospace;" />
                  </div>
                  <div class="color-presets-row">
                    ${presetBgColors.map(c => `
                      <button type="button" class="color-preset-dot" data-sec-target="icon-bg" data-color="${c}" style="background: ${c};" title="${c}"></button>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- Цвет заголовка и цвет описания -->
              <div class="form-row-grid">
                <div class="modal-field">
                  <label>Цвет названия раздела</label>
                  <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                    <input type="color" id="sec-color-title-picker" value="${defaultTitleColor.startsWith('#') ? defaultTitleColor : '#FFFFFF'}" style="width: 36px; height: 34px; border: none; border-radius: 6px; background: none; cursor: pointer;" />
                    <input type="text" class="modal-input" id="sec-color-title-text" value="${defaultTitleColor}" style="width: 120px; font-family: monospace;" />
                  </div>
                  <div class="color-presets-row">
                    ${presetColors.map(c => `
                      <button type="button" class="color-preset-dot" data-sec-target="title" data-color="${c}" style="background: ${c};" title="${c}"></button>
                    `).join('')}
                  </div>
                </div>

                <div class="modal-field">
                  <label>Цвет описания раздела</label>
                  <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                    <input type="color" id="sec-color-desc-picker" value="${defaultDescColor.startsWith('#') ? defaultDescColor : '#8E95A5'}" style="width: 36px; height: 34px; border: none; border-radius: 6px; background: none; cursor: pointer;" />
                    <input type="text" class="modal-input" id="sec-color-desc-text" value="${defaultDescColor}" style="width: 120px; font-family: monospace;" />
                  </div>
                  <div class="color-presets-row">
                    ${['#8E95A5', '#A0AEC0', '#CBD5E1', '#E2E8F0', '#FFFFFF', '#FF8A00'].map(c => `
                      <button type="button" class="color-preset-dot" data-sec-target="desc" data-color="${c}" style="background: ${c};" title="${c}"></button>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- Кастомный бейдж (плашка раздела) -->
              <div class="form-row-grid" style="border-top: 1px dashed #1E2535; padding-top: 12px; margin-top: 4px;">
                <div class="modal-field" style="margin-bottom: 0;">
                  <label>Текст бейджа/плашки (опционально)</label>
                  <input type="text" class="modal-input" id="sec-input-badge-text" value="${defaultBadgeText}" placeholder="Например: ВАЖНО, HOT, NEW, RP, LSPD" />
                </div>

                <div class="modal-field" style="margin-bottom: 0;">
                  <label>Цвет бейджа</label>
                  <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                    <input type="color" id="sec-color-badge-picker" value="${defaultBadgeColor.startsWith('#') ? defaultBadgeColor : '#FF1F36'}" style="width: 36px; height: 34px; border: none; border-radius: 6px; background: none; cursor: pointer;" />
                    <input type="text" class="modal-input" id="sec-color-badge-text" value="${defaultBadgeColor}" style="width: 120px; font-family: monospace;" />
                  </div>
                  <div class="color-presets-row">
                    ${presetColors.map(c => `
                      <button type="button" class="color-preset-dot" data-sec-target="badge" data-color="${c}" style="background: ${c};" title="${c}"></button>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab / Section 3: Доступ и поведение -->
            <div class="admin-config-group-box" style="margin-top: 16px;">
              <h4 class="admin-config-group-title">🔒 3. Права доступа и параметры отображения</h4>

              <div class="form-row-grid">
                <div class="modal-field" style="margin-bottom: 0;">
                  <label>Кто может создавать темы в разделе</label>
                  <select class="modal-select" id="sec-select-min-role">
                    <option value="player" ${s.min_role_to_post === 'player' ? 'selected' : ''}>Все авторизованные игроки (Player)</option>
                    <option value="helper" ${s.min_role_to_post === 'helper' ? 'selected' : ''}>Только Хелперы и выше</option>
                    <option value="moderator" ${s.min_role_to_post === 'moderator' ? 'selected' : ''}>Только Модераторы и выше</option>
                    <option value="admin" ${s.min_role_to_post === 'admin' ? 'selected' : ''}>Только Администраторы и выше</option>
                    <option value="superadmin" ${s.min_role_to_post === 'superadmin' ? 'selected' : ''}>Только Главные Администраторы</option>
                  </select>
                </div>

                <div class="modal-field" style="margin-bottom: 0;">
                  <label>Порядок сортировки</label>
                  <input type="number" class="modal-input" id="sec-input-order" value="${s.display_order ?? 0}" step="1" />
                </div>
              </div>

              <div style="margin-top: 14px; display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="sec-input-locked" ${s.is_locked ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #FF1F36; cursor: pointer;" />
                <label for="sec-input-locked" style="color: #FFF; font-size: 13px; cursor: pointer; user-select: none;">
                  <strong>Закрыть раздел (Только чтение)</strong> — обычные пользователи не смогут создавать новые темы в этом разделе.
                </label>
              </div>
            </div>

            <button class="btn-create-topic" id="btn-submit-section" data-id="${s.id || ''}" style="width: 100%; justify-content: center; margin-top: 20px; padding: 12px; font-size: 13.5px;">
              ${ICONS.check}
              <span>${isEdit ? 'Сохранить масштабные настройки раздела' : 'Создать раздел форума'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachModalEvents();
}

function attachModalEvents() {
  const closeBtn = document.getElementById('modal-close-btn');
  const backdrop = document.getElementById('modal-backdrop');

  if (closeBtn) closeBtn.onclick = closeModal;
  if (backdrop) {
    backdrop.onclick = (e) => {
      if (e.target === backdrop) closeModal();
    };
  }

  // Auth Modal Tab Switchers
  const tabLogin = document.getElementById('tab-auth-login');
  const tabRegister = document.getElementById('tab-auth-register');
  const linkToRegister = document.getElementById('link-switch-to-register');
  const linkToLogin = document.getElementById('link-switch-to-login');

  if (tabLogin) tabLogin.onclick = () => { state.authTab = 'login'; state.authError = null; renderModal(); };
  if (tabRegister) tabRegister.onclick = () => { state.authTab = 'register'; state.authError = null; renderModal(); };
  if (linkToRegister) linkToRegister.onclick = () => { state.authTab = 'register'; state.authError = null; renderModal(); };
  if (linkToLogin) linkToLogin.onclick = () => { state.authTab = 'login'; state.authError = null; renderModal(); };

  // Login Submit
  const submitLoginBtn = document.getElementById('btn-submit-login');
  if (submitLoginBtn) {
    submitLoginBtn.onclick = async () => {
      const identifier = document.getElementById('auth-login-identifier')?.value;
      const password = document.getElementById('auth-login-password')?.value;
      try {
        submitLoginBtn.disabled = true;
        const res = await api.auth.login(identifier, password);
        authStorage.setToken(res.token);
        state.user = res.user;
        closeModal();
        playSound('success');
        notifyStateChange();
        router.resolve();
      } catch (err) {
        state.authError = err.message;
        playSound('click');
        renderModal();
      }
    };
  }

  // Register Submit
  const submitRegisterBtn = document.getElementById('btn-submit-register');
  if (submitRegisterBtn) {
    submitRegisterBtn.onclick = async () => {
      const email = document.getElementById('auth-reg-email')?.value;
      const username = document.getElementById('auth-reg-username')?.value;
      const password = document.getElementById('auth-reg-password')?.value;
      const repeat = document.getElementById('auth-reg-repeat-password')?.value;

      if (password !== repeat) {
        state.authError = 'Пароли не совпадают.';
        renderModal();
        return;
      }

      try {
        submitRegisterBtn.disabled = true;
        const res = await api.auth.register(email, username, password);
        authStorage.setToken(res.token);
        state.user = res.user;
        closeModal();
        playSound('success');
        notifyStateChange();
        router.resolve();
      } catch (err) {
        state.authError = err.message;
        renderModal();
      }
    };
  }

  // Report Submit
  const submitReportBtn = document.getElementById('btn-submit-report');
  if (submitReportBtn) {
    submitReportBtn.onclick = async () => {
      const reason = document.getElementById('report-reason')?.value;
      if (!reason || !reason.trim()) {
        alert('Укажите причину жалобы');
        return;
      }
      try {
        submitReportBtn.disabled = true;
        await api.reports.create({
          reason: reason.trim(),
          post_id: state.reportContext?.postId || null,
          thread_id: state.reportContext?.threadId || null
        });
        closeModal();
        alert('Жалоба успешно отправлена модераторам.');
      } catch (err) {
        alert(err.message || 'Ошибка отправки жалобы');
        submitReportBtn.disabled = false;
      }
    };
  }

  // Copy IP Buttons
  document.querySelectorAll('#btn-copy-ip, .btn-copy-server-ip').forEach(btn => {
    btn.onclick = () => {
      const ip = btn.getAttribute('data-ip') || 's1.phoenix-rp.ru:22005';
      navigator.clipboard.writeText(ip);
      const prevHtml = btn.innerHTML;
      btn.innerHTML = `${ICONS.check} <span>Скопировано!</span>`;
      setTimeout(() => {
        btn.innerHTML = prevHtml;
      }, 2000);
    };
  });

  // Shop Calculator
  const amountInput = document.getElementById('shop-amount-input');
  const coinsOutput = document.getElementById('shop-coins-output');
  if (amountInput && coinsOutput) {
    amountInput.oninput = () => {
      const val = parseInt(amountInput.value) || 0;
      const bonusRate = val >= 1000 ? 1.2 : 1.1;
      const coins = Math.round(val * 10 * bonusRate);
      coinsOutput.value = `${coins.toLocaleString('ru-RU')} Coins`;
    };
  }

  const payBtn = document.getElementById('btn-submit-shop-pay');
  if (payBtn) {
    payBtn.onclick = () => {
      alert('Тестовый режим платежной системы: на реальном хостинге здесь открывается платёжный шлюз СБП / ЮKassa / Карты.');
      closeModal();
    };
  }

  document.querySelectorAll('.btn-buy-vip').forEach(btn => {
    btn.onclick = () => {
      const vipType = btn.getAttribute('data-vip');
      alert(`Выбран статус: ${vipType}. На хостинге открывается переход к оплате.`);
      closeModal();
    };
  });

  // Submit Edit Thread
  const submitEditThreadBtn = document.getElementById('btn-submit-edit-thread');
  if (submitEditThreadBtn) {
    submitEditThreadBtn.onclick = async () => {
      const threadId = submitEditThreadBtn.getAttribute('data-thread-id');
      const title = document.getElementById('modal-edit-thread-title')?.value;
      const tag = document.getElementById('modal-edit-thread-tag')?.value;
      const category_id = document.getElementById('modal-edit-thread-category')?.value;

      if (!title || title.trim().length < 5) {
        alert('Заголовок должен содержать минимум 5 символов');
        return;
      }

      try {
        submitEditThreadBtn.disabled = true;
        const res = await api.threads.update(threadId, { title, tag, category_id });
        closeModal();
        playSound('success');
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка обновления темы');
        submitEditThreadBtn.disabled = false;
      }
    };
  }

  // Submit Start Conversation
  const submitStartConvBtn = document.getElementById('btn-submit-start-conv');
  if (submitStartConvBtn) {
    submitStartConvBtn.onclick = async () => {
      const recipientId = submitStartConvBtn.getAttribute('data-recipient-id');
      const recipientName = document.getElementById('modal-conv-recipient-name')?.value?.trim();
      const text = document.getElementById('modal-conv-text')?.value;

      if (!recipientId && !recipientName) {
        alert('Укажите никнейм получателя');
        return;
      }

      if (!text || !text.trim()) {
        alert('Введите текст сообщения');
        return;
      }

      try {
        submitStartConvBtn.disabled = true;
        const res = await api.messages.send({
          recipient_id: recipientId || undefined,
          recipient_username: !recipientId ? recipientName : undefined,
          text: text.trim()
        });
        closeModal();
        playSound('success');
        router.navigate(`/forum/messages?conv=${res.conversationId}`);
      } catch (err) {
        alert(err.message || 'Ошибка отправки сообщения');
        submitStartConvBtn.disabled = false;
      }
    };
  }

  // Quick recipient chips
  document.querySelectorAll('.btn-quick-recipient').forEach(btn => {
    btn.onclick = () => {
      const name = btn.getAttribute('data-name');
      const input = document.getElementById('modal-conv-recipient-name');
      if (input) input.value = name;
    };
  });

  // -----------------------------------------------------------
  // Admin Category Modal Events & Live Preview
  // -----------------------------------------------------------
  const fcatTitleInput = document.getElementById('fcat-input-title');
  const fcatDescInput = document.getElementById('fcat-input-desc');
  const fcatColorPicker = document.getElementById('fcat-color-picker');
  const fcatColorText = document.getElementById('fcat-color-text');
  const fcatIconInput = document.getElementById('fcat-input-icon');
  const fcatOrderInput = document.getElementById('fcat-input-order');
  const btnSubmitFcat = document.getElementById('btn-submit-fcat');

  const pFcatTitle = document.getElementById('preview-fcat-title');
  const pFcatDesc = document.getElementById('preview-fcat-desc');
  const pFcatAccent = document.getElementById('preview-fcat-accent');
  const pFcatIcon = document.getElementById('preview-fcat-icon');

  function updateFcatColor(c) {
    if (pFcatAccent) pFcatAccent.style.background = c;
    if (pFcatIcon) pFcatIcon.style.color = c;
    const card = document.getElementById('live-fcat-preview');
    if (card) card.style.setProperty('--fcat-p-color', c);
  }

  if (fcatTitleInput && pFcatTitle) {
    fcatTitleInput.oninput = () => {
      pFcatTitle.textContent = fcatTitleInput.value.trim() || 'НАЗВАНИЕ КАТЕГОРИИ';
    };
  }

  if (fcatDescInput && pFcatDesc) {
    fcatDescInput.oninput = () => {
      pFcatDesc.textContent = fcatDescInput.value.trim() || 'Описание категории форума...';
    };
  }

  if (fcatColorPicker && fcatColorText) {
    fcatColorPicker.oninput = () => {
      fcatColorText.value = fcatColorPicker.value;
      updateFcatColor(fcatColorPicker.value);
    };
    fcatColorText.oninput = () => {
      const val = fcatColorText.value.trim();
      if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
        fcatColorPicker.value = val;
      }
      updateFcatColor(val);
    };
  }

  document.querySelectorAll('[data-fcat-color]').forEach(btn => {
    btn.onclick = () => {
      const c = btn.getAttribute('data-fcat-color');
      if (fcatColorPicker) fcatColorPicker.value = c;
      if (fcatColorText) fcatColorText.value = c;
      updateFcatColor(c);
      document.querySelectorAll('[data-fcat-color]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  document.querySelectorAll('[data-fcat-icon]').forEach(btn => {
    btn.onclick = () => {
      const ic = btn.getAttribute('data-fcat-icon');
      if (fcatIconInput) fcatIconInput.value = ic;
      if (pFcatIcon) pFcatIcon.innerHTML = getIcon(ic);
      document.querySelectorAll('[data-fcat-icon]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  if (btnSubmitFcat) {
    btnSubmitFcat.onclick = async () => {
      const title = fcatTitleInput?.value?.trim();
      if (!title) {
        alert('Укажите название категории');
        return;
      }

      const id = btnSubmitFcat.getAttribute('data-id');
      const isEdit = Boolean(id);
      const payload = {
        title,
        description: fcatDescInput?.value?.trim() || '',
        color: fcatColorText?.value || '#FF1F36',
        icon: fcatIconInput?.value || 'folder',
        display_order: parseInt(fcatOrderInput?.value) || 10
      };

      try {
        btnSubmitFcat.disabled = true;
        if (isEdit) {
          await api.admin.updateForumCategory(id, payload);
        } else {
          await api.admin.createForumCategory(payload);
        }

        const catsRes = await api.categories.getAll();
        state.categories = catsRes.categories || [];
        state.forumCategories = catsRes.forumCategories || [];
        notifyStateChange();
        closeModal();
        playSound('success');
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка сохранения категории');
        btnSubmitFcat.disabled = false;
      }
    };
  }

  // -----------------------------------------------------------
  // Admin Section Modal Events & Live Preview
  // -----------------------------------------------------------
  const secTitleInput = document.getElementById('sec-input-title');
  const secSlugInput = document.getElementById('sec-input-slug');
  const secDescInput = document.getElementById('sec-input-desc');
  const secFcatSelect = document.getElementById('sec-select-fcat');
  const secParentSelect = document.getElementById('sec-select-parent');
  const secIconInput = document.getElementById('sec-input-icon');

  const secIconColorPicker = document.getElementById('sec-color-icon-picker');
  const secIconColorText = document.getElementById('sec-color-icon-text');
  const secIconBgText = document.getElementById('sec-color-icon-bg-text');

  const secTitleColorPicker = document.getElementById('sec-color-title-picker');
  const secTitleColorText = document.getElementById('sec-color-title-text');

  const secDescColorPicker = document.getElementById('sec-color-desc-picker');
  const secDescColorText = document.getElementById('sec-color-desc-text');

  const secBadgeTextInput = document.getElementById('sec-input-badge-text');
  const secBadgeColorPicker = document.getElementById('sec-color-badge-picker');
  const secBadgeColorText = document.getElementById('sec-color-badge-text');

  const secRoleSelect = document.getElementById('sec-select-min-role');
  const secOrderInput = document.getElementById('sec-input-order');
  const secLockedInput = document.getElementById('sec-input-locked');
  const btnSubmitSection = document.getElementById('btn-submit-section');

  const pSecTitle = document.getElementById('preview-sec-title');
  const pSecDesc = document.getElementById('preview-sec-desc');
  const pSecIconBox = document.getElementById('preview-sec-icon-box');
  const pSecBadge = document.getElementById('preview-sec-badge');
  const pSecLocked = document.getElementById('preview-sec-locked');

  function updateSectionLivePreview() {
    if (pSecTitle && secTitleInput) {
      pSecTitle.textContent = secTitleInput.value.trim() || 'Название раздела';
      if (secTitleColorText) pSecTitle.style.color = secTitleColorText.value || '#FFFFFF';
    }

    if (pSecDesc && secDescInput) {
      pSecDesc.textContent = secDescInput.value.trim() || 'Описание раздела появится здесь в реальном времени...';
      if (secDescColorText) pSecDesc.style.color = secDescColorText.value || '#8E95A5';
    }

    if (pSecIconBox && secIconInput) {
      const ic = secIconInput.value || 'message-square';
      pSecIconBox.innerHTML = getIcon(ic);
      const icColor = secIconColorText?.value || '#FF1F36';
      const icBg = secIconBgText?.value || 'rgba(255, 31, 54, 0.12)';
      pSecIconBox.style.color = icColor;
      pSecIconBox.style.background = icBg;
      pSecIconBox.style.boxShadow = `0 0 10px ${icColor}25`;
    }

    if (pSecBadge && secBadgeTextInput) {
      const bText = secBadgeTextInput.value.trim();
      if (bText) {
        pSecBadge.style.display = 'inline-flex';
        pSecBadge.textContent = bText;
        pSecBadge.style.background = secBadgeColorText?.value || '#FF1F36';
      } else {
        pSecBadge.style.display = 'none';
      }
    }

    if (pSecLocked && secLockedInput) {
      pSecLocked.style.display = secLockedInput.checked ? 'inline-flex' : 'none';
    }
  }

  if (secTitleInput) {
    secTitleInput.oninput = () => {
      if (secSlugInput && !secSlugInput.dataset.manual) {
        const ru = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
        secSlugInput.value = secTitleInput.value.toLowerCase().split('').map(c => ru[c] || c).join('').replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      }
      updateSectionLivePreview();
    };
  }

  if (secSlugInput) {
    secSlugInput.onkeydown = () => { secSlugInput.dataset.manual = 'true'; };
  }

  if (secDescInput) {
    secDescInput.oninput = updateSectionLivePreview;
  }

  if (secLockedInput) {
    secLockedInput.onchange = updateSectionLivePreview;
  }

  if (secBadgeTextInput) {
    secBadgeTextInput.oninput = updateSectionLivePreview;
  }

  // Color Pickers <-> Text inputs linking
  if (secIconColorPicker && secIconColorText) {
    secIconColorPicker.oninput = () => {
      secIconColorText.value = secIconColorPicker.value;
      updateSectionLivePreview();
    };
    secIconColorText.oninput = () => {
      if (secIconColorText.value.startsWith('#') && (secIconColorText.value.length === 4 || secIconColorText.value.length === 7)) {
        secIconColorPicker.value = secIconColorText.value;
      }
      updateSectionLivePreview();
    };
  }

  if (secIconBgText) {
    secIconBgText.oninput = updateSectionLivePreview;
  }

  if (secTitleColorPicker && secTitleColorText) {
    secTitleColorPicker.oninput = () => {
      secTitleColorText.value = secTitleColorPicker.value;
      updateSectionLivePreview();
    };
    secTitleColorText.oninput = () => {
      if (secTitleColorText.value.startsWith('#') && (secTitleColorText.value.length === 4 || secTitleColorText.value.length === 7)) {
        secTitleColorPicker.value = secTitleColorText.value;
      }
      updateSectionLivePreview();
    };
  }

  if (secDescColorPicker && secDescColorText) {
    secDescColorPicker.oninput = () => {
      secDescColorText.value = secDescColorPicker.value;
      updateSectionLivePreview();
    };
    secDescColorText.oninput = () => {
      if (secDescColorText.value.startsWith('#') && (secDescColorText.value.length === 4 || secDescColorText.value.length === 7)) {
        secDescColorPicker.value = secDescColorText.value;
      }
      updateSectionLivePreview();
    };
  }

  if (secBadgeColorPicker && secBadgeColorText) {
    secBadgeColorPicker.oninput = () => {
      secBadgeColorText.value = secBadgeColorPicker.value;
      updateSectionLivePreview();
    };
    secBadgeColorText.oninput = () => {
      if (secBadgeColorText.value.startsWith('#') && (secBadgeColorText.value.length === 4 || secBadgeColorText.value.length === 7)) {
        secBadgeColorPicker.value = secBadgeColorText.value;
      }
      updateSectionLivePreview();
    };
  }

  // Section Swatches Click
  document.querySelectorAll('[data-sec-target]').forEach(dot => {
    dot.onclick = () => {
      const target = dot.getAttribute('data-sec-target');
      const c = dot.getAttribute('data-color');
      if (target === 'icon') {
        if (secIconColorPicker) secIconColorPicker.value = c;
        if (secIconColorText) secIconColorText.value = c;
      } else if (target === 'icon-bg') {
        if (secIconBgText) secIconBgText.value = c;
      } else if (target === 'title') {
        if (secTitleColorPicker) secTitleColorPicker.value = c;
        if (secTitleColorText) secTitleColorText.value = c;
      } else if (target === 'desc') {
        if (secDescColorPicker) secDescColorPicker.value = c;
        if (secDescColorText) secDescColorText.value = c;
      } else if (target === 'badge') {
        if (secBadgeColorPicker) secBadgeColorPicker.value = c;
        if (secBadgeColorText) secBadgeColorText.value = c;
      }
      updateSectionLivePreview();
    };
  });

  // Section Icon Choices Click
  document.querySelectorAll('[data-sec-icon]').forEach(btn => {
    btn.onclick = () => {
      const ic = btn.getAttribute('data-sec-icon');
      if (secIconInput) secIconInput.value = ic;
      document.querySelectorAll('[data-sec-icon]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateSectionLivePreview();
    };
  });

  // Section Submit
  if (btnSubmitSection) {
    btnSubmitSection.onclick = async () => {
      const title = secTitleInput?.value?.trim();
      const slug = secSlugInput?.value?.trim();

      if (!title) {
        alert('Укажите название раздела');
        return;
      }
      if (!slug) {
        alert('Укажите URL-идентификатор (slug)');
        return;
      }

      const id = btnSubmitSection.getAttribute('data-id');
      const isEdit = Boolean(id);

      const payload = {
        forum_category_id: secFcatSelect?.value || null,
        parent_id: secParentSelect?.value || null,
        title,
        slug,
        description: secDescInput?.value?.trim() || '',
        icon: secIconInput?.value || 'message-square',
        icon_color: secIconColorText?.value || '#FF1F36',
        icon_bg: secIconBgText?.value || 'rgba(255, 31, 54, 0.12)',
        title_color: secTitleColorText?.value || '#FFFFFF',
        description_color: secDescColorText?.value || '#8E95A5',
        badge_text: secBadgeTextInput?.value?.trim() || null,
        badge_color: secBadgeColorText?.value || '#FF1F36',
        min_role_to_post: secRoleSelect?.value || 'player',
        display_order: parseInt(secOrderInput?.value) || 0,
        is_locked: secLockedInput?.checked ? 1 : 0
      };

      try {
        btnSubmitSection.disabled = true;
        if (isEdit) {
          await api.admin.updateCategory(id, payload);
        } else {
          await api.admin.createCategory(payload);
        }

        const catsRes = await api.categories.getAll();
        state.categories = catsRes.categories || [];
        state.forumCategories = catsRes.forumCategories || [];
        notifyStateChange();
        closeModal();
        playSound('success');
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка сохранения раздела');
        btnSubmitSection.disabled = false;
      }
    };
  }
}
