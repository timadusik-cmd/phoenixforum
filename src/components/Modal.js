// Phoenix RP Forum - Modals Component
import { state, notifyStateChange } from '../state.js';
import { ICONS } from '../utils/icons.js';
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
}
