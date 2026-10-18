// Phoenix RP Forum - Header Component
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { router } from '../router.js';

export function renderHeader() {
  const isForumActive = window.location.pathname.startsWith('/forum') || window.location.pathname === '/';
  const unreadBadge = state.unreadNotifications > 0 ? `<span class="notification-badge">${state.unreadNotifications}</span>` : '';

  return `
    <header class="header">
      <div class="header-left">
        <!-- Logo -->
        <a href="/forum" data-link class="brand-logo" id="header-brand-logo">
          <div class="brand-emblem">
            <img src="/assets/phoenix_bird_header.png" alt="Phoenix RP" class="header-bird-img" />
          </div>
          <div class="brand-text">
            <span class="brand-title">PHOENIX</span>
            <span class="brand-sub">PROJECT RP</span>
          </div>
        </a>

        <!-- Main Nav Links -->
        <nav class="nav-links">
          <a href="/forum" data-link class="nav-link ${window.location.pathname === '/' || window.location.pathname === '/forum' ? 'active' : ''}">
            ${ICONS.home}
            <span>Главная</span>
          </a>
          <a href="/forum" data-link class="nav-link ${window.location.pathname.startsWith('/forum/category') || window.location.pathname.startsWith('/forum/thread') ? 'active' : ''}">
            ${ICONS.forum}
            <span>Форум</span>
          </a>
          <button type="button" class="nav-link nav-btn-link" id="btn-header-servers" title="Мониторинг серверов">
            ${ICONS.servers}
            <span>Серверы</span>
          </button>
          <button type="button" class="nav-link nav-btn-link" id="btn-header-shop" title="Донат-магазин Phoenix RP">
            ${ICONS.shop}
            <span>Магазин</span>
          </button>

          <!-- More Dropdown -->
          <div class="nav-more-dropdown-wrap" id="nav-more-dropdown-wrap">
            <button type="button" class="nav-link nav-link-more" id="btn-nav-more">
              <span>Дополнительно</span>
              ${ICONS.chevronDown}
            </button>

            <div class="nav-more-dropdown" id="nav-more-dropdown-menu">
              <a href="/forum/rules" data-link class="nav-more-item">
                ${ICONS.shield}
                <span>Правила проекта</span>
              </a>
              <a href="/forum/members" data-link class="nav-more-item">
                ${ICONS.users}
                <span>Пользователи форума</span>
              </a>
              <a href="/forum/search" data-link class="nav-more-item">
                ${ICONS.search}
                <span>Расширенный поиск</span>
              </a>
              <button type="button" class="nav-more-item" id="btn-more-connect">
                ${ICONS.server}
                <span>Подключение к серверу</span>
              </button>

              <div class="nav-more-divider"></div>

              <div class="nav-more-socials">
                <a href="https://discord.gg" target="_blank" rel="noopener" class="nav-more-social-link" title="Discord">
                  ${ICONS.discord} <span>Discord</span>
                </a>
                <a href="https://t.me" target="_blank" rel="noopener" class="nav-more-social-link" title="Telegram">
                  ${ICONS.telegram} <span>Telegram</span>
                </a>
                <a href="https://vk.com" target="_blank" rel="noopener" class="nav-more-social-link" title="ВКонтакте">
                  ${ICONS.vk} <span>ВКонтакте</span>
                </a>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <!-- Header Right -->
      <div class="header-right">
        <!-- Search Bar -->
        <div class="search-bar">
          <span class="search-icon">${ICONS.search}</span>
          <input 
            type="text" 
            placeholder="Поиск по форуму..." 
            class="search-input" 
            id="header-search-input"
            value="${state.searchQuery || ''}"
          />
          <span class="search-shortcut">Enter</span>
        </div>

        ${state.user ? `
          <!-- Private Messages Mail Icon -->
          <a href="/forum/messages" data-link class="notification-btn" id="btn-header-messages" title="Личные сообщения">
            ${ICONS.mail}
            ${state.unreadMessages > 0 ? `<span class="notification-badge">${state.unreadMessages}</span>` : ''}
          </a>

          <!-- Notifications Bell -->
          <a href="/forum/notifications" data-link class="notification-btn" id="btn-header-notifs" title="Уведомления">
            ${ICONS.bell}
            ${unreadBadge}
          </a>

          <!-- User Chip with Dropdown -->
          <div class="user-chip-dropdown-wrap">
            <button class="user-chip" id="btn-toggle-user-menu">
              <div class="user-chip-avatar-wrap">
                <img src="${state.user.avatar || '/assets/avatar_ivan.jpg'}" alt="${state.user.username}" class="user-chip-avatar" />
                ${state.user.avatar_decoration ? `<img src="${state.user.avatar_decoration}" class="avatar-decoration" alt="" />` : ''}
              </div>
              <span class="user-chip-name">${state.user.username}</span>
              <span class="user-chip-arrow">${ICONS.chevronDown}</span>
            </button>

            <div class="user-menu-dropdown" id="header-user-menu">
              <div class="user-menu-header">
                <div style="font-weight: 700; color: #FFF; font-size: 14px;">${state.user.username}</div>
                <div style="font-size: 11px; color: #8E95A5; font-weight: 600;">${state.user.fraction || 'Гражданский'} • Lvl ${state.user.level || 1}</div>
              </div>

              <a href="/forum/member/${state.user.id}" data-link class="user-menu-item">
                ${ICONS.user}
                <span>Мой профиль</span>
              </a>
              <a href="/forum/messages" data-link class="user-menu-item">
                ${ICONS.mail}
                <span>Личные сообщения ${state.unreadMessages > 0 ? `(${state.unreadMessages})` : ''}</span>
              </a>
              <a href="/forum/notifications" data-link class="user-menu-item">
                ${ICONS.bell}
                <span>Уведомления ${state.unreadNotifications > 0 ? `(${state.unreadNotifications})` : ''}</span>
              </a>
              <a href="/account/settings" data-link class="user-menu-item">
                ${ICONS.settings}
                <span>Настройки аккаунта</span>
              </a>

              ${['moderator', 'admin', 'superadmin'].includes(state.user.role) ? `
                <a href="/admin" data-link class="user-menu-item" style="color: #FF2338; font-weight: 600;">
                  ${ICONS.shield}
                  <span>Панель управления</span>
                </a>
              ` : ''}

              <div class="user-menu-divider"></div>

              <button class="user-menu-item" id="header-btn-logout" style="color: #ff6b6b; width: 100%; border: none; background: transparent; cursor: pointer;">
                ${ICONS.logOut}
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        ` : `
          <!-- Guest Auth Buttons -->
          <div class="auth-buttons-wrap">
            <button class="btn-auth-login" id="btn-header-login">
              ${ICONS.logIn}
              <span>Войти</span>
            </button>
            <button class="btn-auth-register" id="btn-header-register">
              <span>Регистрация</span>
            </button>
          </div>
        `}
      </div>
    </header>
  `;
}
