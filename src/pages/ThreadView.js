// Phoenix RP Forum - Thread View Page
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { renderRichEditor } from '../components/RichEditor.js';
import { renderRoleBadge, renderUserBadges } from '../utils/badges.js';
import { formatTimeAgo } from '../utils/time.js';

// Simple Markdown parser for post content
export function formatPostContent(rawText) {
  if (!rawText) return '';
  let text = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Markdown images: ![alt](url)
  text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="post-img-wrap"><img src="$2" alt="$1" class="post-attachment-img" /></div>');

  // Markdown links: [text](url)
  text = text.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="post-link">$1</a>');

  // Bold: **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Quotes: > text
  text = text.replace(/^&gt;\s?(.*)$/gm, '<blockquote class="post-quote">$1</blockquote>');

  // Code block: ```code```
  text = text.replace(/```([\s\S]*?)```/g, '<pre class="post-code-block"><code>$1</code></pre>');

  // Line breaks
  text = text.replace(/\n/g, '<br />');

  return text;
}

export function renderThreadView(data) {
  const { thread, posts, isSubscribed } = data;
  const user = state.user;
  const isAuthor = user && user.id === thread.author_id;
  const isMod = user && ['moderator', 'admin', 'superadmin'].includes(user.role);
  const canEditThread = isAuthor || isMod;

  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} <span>Главная</span></a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum/category/${thread.category_slug}" data-link class="breadcrumb-item">${thread.category_title}</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">${thread.title}</span>
      </div>

      <!-- Thread Header Card -->
      <div class="thread-view-header">
        <div class="thread-header-title-row">
          <div class="thread-badges-wrap">
            ${thread.is_pinned ? `<span class="badge-tag pinned">${ICONS.pin} Закреплено</span>` : ''}
            ${thread.is_locked ? `<span class="badge-tag locked">${ICONS.lock} Закрыто</span>` : ''}
            ${thread.is_solved ? `<span class="badge-tag solved">${ICONS.check} Решено</span>` : ''}
            ${thread.tag ? `<span class="badge-tag default">${thread.tag}</span>` : ''}
          </div>
          <h1 class="thread-view-title">${thread.title}</h1>
        </div>

        <div class="thread-header-meta-row">
          <div class="thread-meta-left">
            <span>Автор: <strong>${thread.author_name}</strong></span>
            <span class="meta-dot">•</span>
            <span>Создана: <strong>${formatTimeAgo(thread.created_at)}</strong></span>
            <span class="meta-dot">•</span>
            <span>Просмотров: <strong>${thread.views_count}</strong></span>
            <span class="meta-dot">•</span>
            <span>Ответов: <strong>${posts.length - 1}</strong></span>
          </div>

          <!-- Controls Bar -->
          <div class="mod-controls-bar">
            ${user ? `
              <button class="btn-sub-action ${isSubscribed ? 'active' : ''}" id="btn-toggle-subscribe" data-thread-id="${thread.id}" title="${isSubscribed ? 'Отписаться от уведомлений' : 'Подписаться на новые ответы'}">
                ${ICONS.bell}
                <span>${isSubscribed ? 'Отслеживается' : 'Отслеживать'}</span>
              </button>
            ` : ''}

            ${canEditThread ? `
              <button class="btn-mod-action" id="btn-edit-thread-modal" data-thread-id="${thread.id}" data-title="${encodeURIComponent(thread.title)}" data-tag="${thread.tag || ''}" data-cat-id="${thread.category_id}" title="Редактировать заголовок, тег или раздел темы">
                ${ICONS.pencil}
                <span>${isMod ? 'Изменить / Перенести' : 'Редактировать'}</span>
              </button>
            ` : ''}

            ${isMod ? `
              <button class="btn-mod-action" id="btn-mod-pin" data-thread-id="${thread.id}">
                ${ICONS.pin}
                <span>${thread.is_pinned ? 'Открепить' : 'Закрепить'}</span>
              </button>
              <button class="btn-mod-action" id="btn-mod-lock" data-thread-id="${thread.id}">
                ${ICONS.lock}
                <span>${thread.is_locked ? 'Открыть' : 'Закрыть'}</span>
              </button>
              <button class="btn-mod-action danger" id="btn-mod-delete-thread" data-thread-id="${thread.id}">
                ${ICONS.x}
                <span>Удалить</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Posts List -->
      <div class="thread-posts-list">
        ${posts.map((post, index) => {
          const postDate = formatTimeAgo(post.created_at);
          const isEdited = post.updated_at && post.updated_at !== post.created_at;

          const isPostAuthor = user && user.id === post.author_id;
          const canEditPost = isPostAuthor || isMod;
          const canDeletePost = isPostAuthor || isMod;

          return `
            <div class="thread-post-card ${post.is_solution ? 'solution-post' : ''}" id="post-${post.id}" data-post-id="${post.id}">
              <!-- Post Author Sidebar -->
              <div class="post-author-sidebar">
                <a href="/forum/member/${post.author_id}" data-link class="post-avatar-wrap">
                  <img src="${post.author_avatar || '/assets/avatar_ivan.jpg'}" alt="${post.author_name}" class="post-author-avatar" />
                </a>
                <a href="/forum/member/${post.author_id}" data-link class="post-author-name" style="color: ${post.author_color || '#FF8A00'};">
                  ${post.author_name}
                </a>
                <div class="post-author-badge-wrap" style="margin: 4px 0 6px 0; width: 100%; display: flex; justify-content: center;">
                  ${renderUserBadges(post, { size: 'sidebar' })}
                </div>

                <div class="post-author-stats">
                  <div class="stat-row">
                    <span class="lbl">Уровень:</span>
                    <span class="val">${post.author_level || 1}</span>
                  </div>
                  <div class="stat-row">
                    <span class="lbl">Репутация:</span>
                    <span class="val" style="color: #10B981;">+${post.author_reputation || 0}</span>
                  </div>
                  <div class="stat-row">
                    <span class="lbl">Сообщений:</span>
                    <span class="val">${post.author_posts_count || 1}</span>
                  </div>
                  <div class="stat-row">
                    <span class="lbl">Фракция:</span>
                    <span class="val">${post.author_fraction || 'Гражданский'}</span>
                  </div>
                </div>

                ${user && user.id !== post.author_id ? `
                  <button type="button" class="btn-author-pm btn-start-pm-with-user" data-user-id="${post.author_id}" data-username="${post.author_name}" title="Написать личное сообщение">
                    ${ICONS.mail}
                    <span>Написать в ЛС</span>
                  </button>
                ` : ''}
              </div>

              <!-- Post Body & Footer -->
              <div class="post-content-wrap">
                <div class="post-top-bar">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="post-timestamp">${postDate}</span>
                    ${isEdited ? `<span class="post-edited-tag" title="Сообщение было отредактировано">(ред.)</span>` : ''}
                  </div>
                  <div class="post-top-right">
                    ${post.is_solution ? `<span class="solution-badge">${ICONS.check} Официальное решение</span>` : ''}
                    <span class="post-num">#${index + 1}</span>
                  </div>
                </div>

                ${post.quote_content ? `
                  <div class="post-quoted-box">
                    <div class="quote-header">Цитата: <strong>${post.quote_author || 'Пользователь'}</strong></div>
                    <div class="quote-body">${formatPostContent(post.quote_content)}</div>
                  </div>
                ` : ''}

                <!-- Post Text Body -->
                <div class="post-text-body" id="post-body-${post.id}">
                  ${formatPostContent(post.content)}
                </div>

                <!-- Inline Post Editor (Hidden by default) -->
                <div class="post-inline-editor" id="inline-editor-${post.id}" style="display: none;">
                  <textarea class="rich-editor-textarea inline-edit-textarea" id="edit-textarea-${post.id}">${post.content}</textarea>
                  <div class="inline-edit-actions">
                    <button type="button" class="btn-create-topic btn-save-post-edit" data-post-id="${post.id}">
                      ${ICONS.check} <span>Сохранить</span>
                    </button>
                    <button type="button" class="btn-secondary btn-cancel-post-edit" data-post-id="${post.id}">
                      ${ICONS.x} <span>Отмена</span>
                    </button>
                  </div>
                </div>

                ${post.author_signature ? `
                  <div class="post-signature">
                    ${formatPostContent(post.author_signature)}
                  </div>
                ` : ''}

                <!-- Post Actions Bar -->
                <div class="post-actions-bar">
                  <!-- Reactions Picker -->
                  <div class="post-reactions-wrap">
                    <button class="rx-btn ${post.myReaction === 'like' ? 'active' : ''}" data-post-id="${post.id}" data-rx="like" title="Нравится">
                      👍 <span class="rx-count">${post.reactions.find(r => r.type === 'like')?.count || ''}</span>
                    </button>
                    <button class="rx-btn ${post.myReaction === 'heart' ? 'active' : ''}" data-post-id="${post.id}" data-rx="heart" title="Супер">
                      ❤️ <span class="rx-count">${post.reactions.find(r => r.type === 'heart')?.count || ''}</span>
                    </button>
                    <button class="rx-btn ${post.myReaction === 'fire' ? 'active' : ''}" data-post-id="${post.id}" data-rx="fire" title="Огонь">
                      🔥 <span class="rx-count">${post.reactions.find(r => r.type === 'fire')?.count || ''}</span>
                    </button>
                    <button class="rx-btn ${post.myReaction === 'trophy' ? 'active' : ''}" data-post-id="${post.id}" data-rx="trophy" title="Трофей">
                      🏆 <span class="rx-count">${post.reactions.find(r => r.type === 'trophy')?.count || ''}</span>
                    </button>
                  </div>

                  <!-- Utility Actions -->
                  <div class="post-btns-wrap">
                    ${(isMod || (user && user.id === thread.author_id)) && !post.is_first_post ? `
                      <button class="btn-post-action ${post.is_solution ? 'active' : ''}" data-action="solution" data-post-id="${post.id}">
                        ${ICONS.check}
                        <span>${post.is_solution ? 'Снять решение' : 'Решение'}</span>
                      </button>
                    ` : ''}

                    ${canEditPost ? `
                      <button class="btn-post-action" data-action="edit-post" data-post-id="${post.id}">
                        ${ICONS.edit}
                        <span>Изменить</span>
                      </button>
                    ` : ''}

                    <button class="btn-post-action" data-action="quote" data-post-id="${post.id}" data-author="${post.author_name}">
                      ${ICONS.quote}
                      <span>Ответить</span>
                    </button>

                    <button class="btn-post-action" data-action="report" data-post-id="${post.id}" data-thread-id="${thread.id}">
                      ${ICONS['alert-circle']}
                      <span>Жалоба</span>
                    </button>

                    ${canDeletePost ? `
                      <button class="btn-post-action danger" data-action="delete" data-post-id="${post.id}">
                        ${ICONS.x}
                        <span>Удалить</span>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Quick Reply Form or Lock State -->
      <div class="quick-reply-section">
        ${thread.is_locked && !isMod ? `
          <div class="locked-reply-card">
            ${ICONS.lock}
            <h3>Тема закрыта для публикации ответов</h3>
            <p>Администрация ограничила возможность отправки новых сообщений в этой теме.</p>
          </div>
        ` : user ? `
          <div class="quick-reply-card">
            <h3 class="quick-reply-title">Быстрый ответ в тему</h3>
            <div id="quoted-preview-box" style="display: none; margin-bottom: 12px; padding: 10px; background: #07090D; border-left: 3px solid #FF2338; font-size: 12px; color: #929BAA;"></div>
            ${renderRichEditor('reply-content')}
            <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
              <button class="btn-create-topic" id="btn-submit-reply" data-thread-id="${thread.id}">
                ${ICONS.send}
                <span>Отправить ответ</span>
              </button>
            </div>
          </div>
        ` : `
          <div class="guest-reply-prompt">
            ${ICONS.user}
            <h3>Хотите принять участие в обсуждении?</h3>
            <p>Войдите в аккаунт или зарегистрируйтесь, чтобы написать ответ.</p>
            <button class="btn-create-topic" id="btn-reply-login" style="margin-top: 10px;">
              ${ICONS.logIn}
              <span>Войти и ответить</span>
            </button>
          </div>
        `}
      </div>
    </div>
  `;
}
