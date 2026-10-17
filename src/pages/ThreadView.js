// Phoenix RP Forum - Thread View Page
import { state } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { renderRichEditor } from '../components/RichEditor.js';
import { renderRoleBadge, renderUserBadges } from '../utils/badges.js';
import { formatTimeAgo } from '../utils/time.js';
import { renderLevelShield, renderMiniAwards, getRankTitle } from '../utils/awards.js';

// Rich Markdown & BBCode parser for post content
export function formatPostContent(rawText) {
  if (!rawText) return '';
  let text = String(rawText)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Code blocks: ```code``` (protect from inner markdown processing)
  const codeBlocks = [];
  text = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre class="post-code-block"><div class="code-block-header"><span>${lang || 'CODE'}</span></div><code>${code.trim()}</code></pre>`);
    return `__CODE_BLOCK_${idx}__`;
  });

  // 2. Inline code: `code`
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (match, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code class="post-inline-code">${code}</code>`);
    return `__INLINE_CODE_${idx}__`;
  });

  // 3. Spoilers: [spoiler=Title]content[/spoiler] or [spoiler]content[/spoiler]
  text = text.replace(/\[spoiler=(.*?)\]([\s\S]*?)\[\/spoiler\]/gi, (m, title, content) => {
    return `<details class="post-spoiler"><summary class="post-spoiler-title"><span class="spoiler-icon">▶</span> Спойлер: <strong>${title}</strong></summary><div class="post-spoiler-content">${content}</div></details>`;
  });
  text = text.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, (m, content) => {
    return `<details class="post-spoiler"><summary class="post-spoiler-title"><span class="spoiler-icon">▶</span> Нажмите, чтобы открыть спойлер</summary><div class="post-spoiler-content">${content}</div></details>`;
  });

  // 4. Video embeds: [video](url) or [video]url[/video]
  text = text.replace(/\[video\]\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)(?:[^\s]*)?)\s*\[\/video\]/gi, (m, fullUrl, id) => {
    return `<div class="post-video-wrap"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  });

  // 5. Images: ![alt](url)
  text = text.replace(/!\[(.*?)\]\((https?:\/\/.*?|\/uploads\/.*?)\)/g, '<div class="post-img-wrap"><img src="$2" alt="$1" class="post-attachment-img" loading="lazy" onclick="window.open(this.src, \'_blank\')" title="Нажмите для открытия в полном размере" /></div>');

  // 6. Links: [text](url)
  text = text.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="post-link">$1</a>');

  // 7. Colors: [color=#hex]text[/color] or [color=red]text[/color]
  text = text.replace(/\[color=(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color: $1;">$2</span>');

  // 8. Alignments: [center]text[/center], [right]text[/right]
  text = text.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div style="text-align: center;">$1</div>');
  text = text.replace(/\[right\]([\s\S]*?)\[\/right\]/gi, '<div style="text-align: right;">$1</div>');

  // 9. BBCode Underline & Strike
  text = text.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
  text = text.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<del>$1</del>');
  text = text.replace(/~~(.*?)~~/g, '<del>$1</del>');
  text = text.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, '<u>$1</u>');

  // 10. Headers: #, ##, ###
  text = text.replace(/^###\s+(.*)$/gm, '<h4 class="post-h3">$1</h4>');
  text = text.replace(/^##\s+(.*)$/gm, '<h3 class="post-h2">$1</h3>');
  text = text.replace(/^#\s+(.*)$/gm, '<h2 class="post-h1">$1</h2>');

  // 11. Bold & Italic
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>');

  // 12. Quotes: [quote=Author]text[/quote] or [quote]text[/quote] or > text
  text = text.replace(/\[quote=(.*?)\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="post-quote"><div class="post-quote-author">Цитата от <strong>$1</strong>:</div><div class="post-quote-body">$2</div></blockquote>');
  text = text.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="post-quote"><div class="post-quote-body">$1</div></blockquote>');
  text = text.replace(/^&gt;\s?(.*)$/gm, '<blockquote class="post-quote">$1</blockquote>');

  // 13. Horizontal divider: ---
  text = text.replace(/^---$/gm, '<hr class="post-divider" />');

  // 14. Lists: - item or * item
  text = text.replace(/^[-*]\s+(.*)$/gm, '<li class="post-list-item">$1</li>');

  // 15. Line breaks: \n -> <br />
  text = text.replace(/\n/g, '<br />');

  // 16. Restore code blocks and inline code
  inlineCodes.forEach((codeHtml, idx) => {
    text = text.replace(`__INLINE_CODE_${idx}__`, codeHtml);
  });
  codeBlocks.forEach((codeHtml, idx) => {
    text = text.replace(`__CODE_BLOCK_${idx}__`, codeHtml);
  });

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
                <div class="post-author-badge-wrap" style="margin: 4px 0 6px 0; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                  ${renderUserBadges(post, { size: 'sidebar' })}
                </div>

                <div class="post-author-stats">
                  <div class="stat-row">
                    <span class="lbl">Уровень:</span>
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <img src="/assets/awards/level_shield.jpg" alt="LVL" class="stat-level-mini-img" />
                      <span class="val" style="font-weight: 700;">${post.author_level || 1}</span>
                    </div>
                  </div>
                  <div class="stat-row">
                    <span class="lbl">Репутация:</span>
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <span class="val" style="color: #10B981; font-weight: 700;">${(post.author_reputation ?? 0) >= 0 ? '+' : ''}${post.author_reputation ?? 0}</span>
                      ${user && user.id !== post.author_id ? `
                        <button type="button" class="btn-post-give-rep btn-open-rep-modal" data-user-id="${post.author_id}" data-username="${post.author_name}" data-post-id="${post.id}" title="Изменить репутацию автора">+</button>
                      ` : ''}
                    </div>
                  </div>
                  <div class="stat-row">
                    <span class="lbl">Сообщений:</span>
                    <span class="val">${post.author_posts_count ?? 1}</span>
                  </div>
                  <div class="stat-row">
                    <span class="lbl">Фракция:</span>
                    <span class="val">${post.author_fraction || 'Гражданский'}</span>
                  </div>
                </div>

                <!-- Mini Awards Shelf (with 3D rendered medals) -->
                ${renderMiniAwards(post.author_awards, 5)}

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
            <div id="quoted-preview-box" style="display: none; margin-bottom: 12px; padding: 10px 14px; background: #0E121B; border: 1px solid #1F2739; border-left: 3px solid #0091FF; border-radius: 6px; font-size: 12.5px; color: #929BAA;"></div>
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
