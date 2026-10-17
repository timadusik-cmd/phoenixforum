// Phoenix RP Forum - Private Messages / Conversations Page
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { renderRoleBadge, renderUserBadges } from '../utils/badges.js';
import { formatTimeAgo } from '../utils/time.js';
import { formatPostContent } from './ThreadView.js';

export function renderMessagesPage(data = {}) {
  const { conversations = [], currentConv = null, messages = [], otherUser = null } = data;
  const user = state.user;

  return `
    <div class="main-content messages-page-container">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} <span>Главная</span></a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Личные сообщения</span>
      </div>

      <!-- Messenger Box Layout -->
      <div class="messenger-box-layout">
        <!-- Left: Conversations List -->
        <div class="messenger-sidebar">
          <div class="messenger-sidebar-header">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <h3 class="messenger-sidebar-title">Диалоги</h3>
              <button type="button" class="btn-create-topic" id="btn-start-new-dialog" style="padding: 6px 12px; font-size: 11.5px;">
                ${ICONS.pencil}
                <span>Написать</span>
              </button>
            </div>
          </div>

          <div class="conversations-list-scroll">
            ${conversations.length > 0 ? conversations.map(c => {
              const isActive = currentConv && currentConv.id === c.id;
              const ou = c.otherUser || {};

              return `
                <a href="/forum/messages?conv=${c.id}" data-link class="conversation-item-card ${isActive ? 'active' : ''} ${c.unreadCount > 0 ? 'has-unread' : ''}">
                  <div class="conv-avatar-wrap">
                    <img src="${ou.avatar || '/assets/avatar_ivan.jpg'}" alt="${ou.username}" class="conv-avatar-img" />
                    <span class="conv-status-dot ${ou.status || 'offline'}"></span>
                  </div>

                  <div class="conv-info-col">
                    <div class="conv-top-line">
                      <span class="conv-username">${ou.username}</span>
                      <span class="conv-time">${formatTimeAgo(c.last_message_at)}</span>
                    </div>

                    <div class="conv-bottom-line">
                      <p class="conv-last-text">${c.last_message ? c.last_message.substring(0, 45) + (c.last_message.length > 45 ? '...' : '') : 'Диалог начат'}</p>
                      ${c.unreadCount > 0 ? `<span class="conv-unread-badge">${c.unreadCount}</span>` : ''}
                    </div>
                  </div>
                </a>
              `;
            }).join('') : `
              <div class="empty-conversations-prompt">
                <div class="empty-conv-icon">${ICONS.mail}</div>
                <p>У вас пока нет активных диалогов.</p>
                <button type="button" class="btn-create-topic" id="btn-empty-start-dialog" style="padding: 7px 16px; font-size: 12px;">
                  ${ICONS.pencil}
                  <span>Начать переписку</span>
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- Right: Messages Chat Area -->
        <div class="messenger-chat-area">
          ${otherUser ? `
            <!-- Chat Header -->
            <div class="chat-header-bar">
              <div class="chat-header-user">
                <a href="/forum/member/${otherUser.id}" data-link class="chat-header-avatar-wrap">
                  <img src="${otherUser.avatar || '/assets/avatar_ivan.jpg'}" alt="${otherUser.username}" class="chat-header-avatar" />
                  <span class="conv-status-dot ${otherUser.status || 'offline'}"></span>
                </a>
                <div class="chat-header-details">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <a href="/forum/member/${otherUser.id}" data-link class="chat-header-name">${otherUser.username}</a>
                    <span style="font-size: 11px; color: #8A96A6;">${otherUser.character_name || ''}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    ${renderUserBadges(otherUser, { size: 'compact' })}
                    <span class="chat-header-status">• ${otherUser.status === 'online' ? 'В сети' : 'Не в сети'}</span>
                  </div>
                </div>
              </div>

              <a href="/forum/member/${otherUser.id}" data-link class="btn-secondary" style="font-size: 11.5px; padding: 6px 12px;">
                ${ICONS.user}
                <span>Профиль</span>
              </a>
            </div>

            <!-- Messages Feed -->
            <div class="chat-messages-scroll" id="chat-messages-container">
              ${messages.length > 0 ? messages.map(m => {
                const isMe = user && m.sender_id === user.id;

                return `
                  <div class="chat-bubble-row ${isMe ? 'outgoing' : 'incoming'}">
                    ${!isMe ? `
                      <img src="${m.sender_avatar || '/assets/avatar_ivan.jpg'}" alt="${m.sender_name}" class="chat-msg-avatar" />
                    ` : ''}

                    <div class="chat-bubble-content">
                      ${!isMe ? `<div class="chat-msg-sender-name">${m.sender_name}</div>` : ''}
                      <div class="chat-msg-text">${formatPostContent(m.text)}</div>
                      <div class="chat-msg-meta">
                        <span class="chat-msg-time">${new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        ${isMe ? `
                          <span class="chat-msg-read-check" title="${m.is_read ? 'Прочитано' : 'Отправлено'}">
                            ${m.is_read ? '✓✓' : '✓'}
                          </span>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('') : `
                <div class="chat-empty-feed">
                  <span>В этом диалоге ещё нет сообщений. Напишите первым!</span>
                </div>
              `}
            </div>

            <!-- Chat Footer Input -->
            <div class="chat-input-bar">
              <textarea 
                class="chat-input-textarea" 
                id="chat-message-input" 
                placeholder="Напишите сообщение... (Enter для отправки, Shift+Enter для новой строки)" 
                rows="1"
              ></textarea>
              <button type="button" class="btn-create-topic chat-send-btn" id="btn-chat-send" data-conv-id="${currentConv.id}" data-recipient-id="${otherUser.id}">
                ${ICONS.send}
                <span>Отправить</span>
              </button>
            </div>
          ` : `
            <!-- No Conversation Selected State -->
            <div class="chat-placeholder-state">
              <div class="chat-placeholder-icon">${ICONS.mail}</div>
              <h3>Личные сообщения Phoenix RP</h3>
              <p>Выберите собеседника из списка слева или начните новый диалог с игроком либо администратором.</p>
              <button type="button" class="btn-create-topic" id="btn-chat-empty-start" style="margin-top: 14px;">
                ${ICONS.pencil}
                <span>Написать сообщение</span>
              </button>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}
