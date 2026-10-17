// Phoenix RP Forum - Dedicated Auth Page (/login, /register)
import { ICONS } from '../utils/icons.js';

export function renderAuthPage(mode = 'login') {
  const isLogin = mode === 'login';

  return `
    <div class="auth-page-container">
      <div class="auth-page-card">
        <div class="auth-page-header">
          <div class="auth-brand-emblem">
            <img src="/assets/phoenix_logo.png" alt="Phoenix RP" />
          </div>
          <h2 class="auth-page-title">${isLogin ? 'Вход в аккаунт' : 'Регистрация на форуме'}</h2>
          <p class="auth-page-subtitle">PHOENIX PROJECT RP — Официальный форум</p>
        </div>

        <div class="auth-tabs" style="margin-bottom: 20px;">
          <a href="/login" data-link class="auth-tab ${isLogin ? 'active' : ''}">Вход</a>
          <a href="/register" data-link class="auth-tab ${!isLogin ? 'active' : ''}">Регистрация</a>
        </div>

        <div id="auth-page-error" class="auth-error-banner" style="display: none; margin-bottom: 14px;"></div>

        ${isLogin ? `
          <form id="form-page-login">
            <div class="modal-field">
              <label>Логин или Email</label>
              <div class="input-with-icon">
                <span class="input-icon-prefix">${ICONS.user}</span>
                <input type="text" class="modal-input" id="page-login-id" placeholder="Ваш никнейм или почта" required />
              </div>
            </div>

            <div class="modal-field">
              <label>Пароль</label>
              <div class="input-with-icon">
                <span class="input-icon-prefix">${ICONS.lock}</span>
                <input type="password" class="modal-input" id="page-login-pwd" placeholder="Пароль" required />
              </div>
            </div>

            <button type="submit" class="btn-create-topic" style="width: 100%; justify-content: center; padding: 12px; margin-top: 10px;">
              ${ICONS.logIn}
              <span>Войти в аккаунт</span>
            </button>

            <div class="auth-switch-link" style="margin-top: 16px;">
              <span>Нет аккаунта?</span>
              <a href="/register" data-link>Зарегистрироваться</a>
            </div>
          </form>
        ` : `
          <form id="form-page-register">
            <div class="modal-field">
              <label>Электронная почта</label>
              <div class="input-with-icon">
                <span class="input-icon-prefix">${ICONS.mail}</span>
                <input type="email" class="modal-input" id="page-reg-email" placeholder="example@mail.ru" required />
              </div>
            </div>

            <div class="modal-field">
              <label>Логин (Никнейм)</label>
              <div class="input-with-icon">
                <span class="input-icon-prefix">${ICONS.user}</span>
                <input type="text" class="modal-input" id="page-reg-username" placeholder="Например: Ivan_Petrov" required />
              </div>
            </div>

            <div class="modal-field">
              <label>Пароль</label>
              <div class="input-with-icon">
                <span class="input-icon-prefix">${ICONS.lock}</span>
                <input type="password" class="modal-input" id="page-reg-pwd" placeholder="Минимум 6 символов" required />
              </div>
            </div>

            <div class="modal-field">
              <label>Повторите пароль</label>
              <div class="input-with-icon">
                <span class="input-icon-prefix">${ICONS.lock}</span>
                <input type="password" class="modal-input" id="page-reg-repeat" placeholder="Повторите пароль" required />
              </div>
            </div>

            <button type="submit" class="btn-create-topic" style="width: 100%; justify-content: center; padding: 12px; margin-top: 10px;">
              <span>Зарегистрироваться</span>
            </button>

            <div class="auth-switch-link" style="margin-top: 16px;">
              <span>Уже есть аккаунт?</span>
              <a href="/login" data-link>Войти</a>
            </div>
          </form>
        `}
      </div>
    </div>
  `;
}
