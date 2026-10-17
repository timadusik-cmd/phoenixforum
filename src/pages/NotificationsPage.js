// Phoenix RP Forum - Notifications Page
import { ICONS } from '../utils/icons.js';

export function renderNotificationsPage(data = {}) {
  const { notifications = [], unreadCount = 0 } = data;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'reply': return ICONS['message-square'];
      case 'reaction': return ICONS.flame;
      case 'mention': return ICONS.user;
      case 'report_decision': return ICONS.shield;
      case 'warning': return ICONS['alert-circle'];
      default: return ICONS.bell;
    }
  };

  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} Главная</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Уведомления</span>
      </div>

      <div class="notifs-header-card">
        <div>
          <h2 class="notifs-title">Центр уведомлений</h2>
          <p class="notifs-subtitle">Оповещения об ответах, реакциях, упоминаниях и решениях администрации.</p>
        </div>

        ${unreadCount > 0 ? `
          <button class="btn-secondary" id="btn-notifs-read-all">
            ${ICONS.check}
            <span>Отметить все прочитанными</span>
          </button>
        ` : ''}
      </div>

      <div class="notifs-list-container">
        ${notifications.length > 0 ? notifications.map(n => `
          <div class="notif-card-item ${!n.is_read ? 'unread' : ''}" data-id="${n.id}">
            <div class="notif-icon-col">
              ${getNotifIcon(n.type)}
            </div>
            <div class="notif-content-col">
              <div class="notif-title-line">
                <span class="notif-item-title">${n.title}</span>
                <span class="notif-item-date">${new Date(n.created_at).toLocaleString('ru-RU')}</span>
              </div>
              <p class="notif-item-text">${n.text}</p>
              ${n.link ? `
                <a href="${n.link}" data-link class="notif-link-btn">Перейти к просмотру →</a>
              ` : ''}
            </div>
            ${!n.is_read ? `
              <button class="btn-mark-read" data-action="mark-read" data-id="${n.id}" title="Отметить прочитанным">
                ${ICONS.check}
              </button>
            ` : ''}
          </div>
        `).join('') : `
          <div class="empty-threads-card">
            <div class="empty-icon">${ICONS.bell}</div>
            <h3>Уведомлений нет</h3>
            <p>Когда кто-то ответит на вашу тему или поставит реакцию, здесь появится оповещение.</p>
          </div>
        `}
      </div>
    </div>
  `;
}
