// Phoenix RP Forum - Administration Panel
import { state } from '../state.js';
import { ICONS, getIcon } from '../utils/icons.js';
import { BADGES, BADGE_ICONS, renderRoleBadge, renderUserBadges } from '../utils/badges.js';

export function renderAdminPanel(data = {}) {
  const { 
    activeTab = 'overview', 
    stats = {}, 
    reports = [], 
    categories = [], 
    forumCategories = [],
    users = [], 
    customBadges = [], 
    auditLogs = [] 
  } = data;

  const canManageCustomBadges = state.user && ['superadmin', 'admin'].includes(state.user.role);

  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} Главная</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Панель управления форумом</span>
      </div>

      <div class="admin-header-card">
        <div class="admin-badge-icon">${ICONS.shield}</div>
        <div>
          <h1 class="admin-header-title">Панель Администрации и Модерации</h1>
          <p class="admin-header-subtitle">Управление разделами, модерация жалоб, права доступа, кастомные плашки и журнал действий.</p>
        </div>
      </div>

      <!-- Admin Tabs Navigation -->
      <div class="thread-filter-bar" style="margin-bottom: 20px;">
        <div class="filter-tabs">
          <a href="/admin?tab=overview" data-link class="filter-tab ${activeTab === 'overview' ? 'active' : ''}">Обзор и статистика</a>
          <a href="/admin?tab=reports" data-link class="filter-tab ${activeTab === 'reports' ? 'active' : ''}">
            Жалобы ${stats.pendingReports > 0 ? `<span class="admin-tab-counter">${stats.pendingReports}</span>` : ''}
          </a>
          <a href="/admin?tab=categories" data-link class="filter-tab ${activeTab === 'categories' ? 'active' : ''}">Управление разделами</a>
          <a href="/admin?tab=users" data-link class="filter-tab ${activeTab === 'users' ? 'active' : ''}">Пользователи и роли</a>
          ${canManageCustomBadges ? `
            <a href="/admin?tab=custom_badges" data-link class="filter-tab ${activeTab === 'custom_badges' ? 'active' : ''}">
              👑 Кастомные плашки ${customBadges.length > 0 ? `<span class="admin-tab-counter">${customBadges.length}</span>` : ''}
            </a>
          ` : ''}
          <a href="/admin?tab=logs" data-link class="filter-tab ${activeTab === 'logs' ? 'active' : ''}">Журнал аудита</a>
        </div>
      </div>

      <!-- Tab 1: Overview -->
      ${activeTab === 'overview' ? `
        <div class="admin-stats-grid">
          <div class="admin-stat-card">
            <span class="admin-stat-num">${stats.totalUsers || 0}</span>
            <span class="admin-stat-lbl">Пользователей</span>
          </div>
          <div class="admin-stat-card">
            <span class="admin-stat-num">${stats.totalThreads || 0}</span>
            <span class="admin-stat-lbl">Тем на форуме</span>
          </div>
          <div class="admin-stat-card">
            <span class="admin-stat-num">${stats.totalPosts || 0}</span>
            <span class="admin-stat-lbl">Сообщений</span>
          </div>
          <div class="admin-stat-card" style="border-color: #FF2338;">
            <span class="admin-stat-num" style="color: #FF2338;">${stats.pendingReports || 0}</span>
            <span class="admin-stat-lbl">Активных жалоб</span>
          </div>
          <div class="admin-stat-card">
            <span class="admin-stat-num" style="color: #EF4444;">${stats.bannedUsers || 0}</span>
            <span class="admin-stat-lbl">Заблокировано</span>
          </div>
        </div>

        <div class="widget-card" style="margin-top: 20px; padding: 20px;">
          <h3 style="color: #FFF; font-size: 16px; margin-bottom: 8px;">Быстрые действия администратора:</h3>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <a href="/admin?tab=reports" data-link class="btn-create-topic">Рассмотреть жалобы</a>
            <a href="/admin?tab=categories" data-link class="btn-secondary">Добавить раздел</a>
            <a href="/admin?tab=users" data-link class="btn-secondary">Выдача ролей пользователям</a>
            ${canManageCustomBadges ? `
              <a href="/admin?tab=custom_badges" data-link class="btn-secondary" style="border-color: #FF2338; color: #FFF;">+ Создать кастомную плашку</a>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Tab 2: Reports -->
      ${activeTab === 'reports' ? `
        <div class="admin-section-card">
          <h3 style="color: #FFF; font-size: 16px; margin-bottom: 16px;">Список активных жалоб от пользователей</h3>
          ${reports.length > 0 ? reports.map(r => `
            <div class="admin-report-item" id="report-${r.id}">
              <div class="report-meta-row">
                <span>Жалоба от: <strong>${r.reporter_name}</strong></span>
                <span class="meta-dot">•</span>
                <span>Нарушитель: <strong style="color: #FF2338;">${r.reported_user_name || 'Неизвестно'}</strong></span>
                <span class="meta-dot">•</span>
                <span>${new Date(r.created_at).toLocaleString('ru-RU')}</span>
              </div>

              <div class="report-reason-box">
                <strong>Причина жалобы:</strong> ${r.reason}
              </div>

              ${r.post_content ? `
                <div class="report-context-box">
                  <strong>Содержимое сообщения:</strong> «${r.post_content}»
                </div>
              ` : ''}

              <div class="report-actions-row">
                <input type="text" class="modal-input report-notes-input" placeholder="Комментарий к решению..." style="flex: 1;" />
                <button class="btn-create-topic" data-action="resolve-report" data-id="${r.id}" style="padding: 6px 14px; font-size: 12px;">
                  Принять меры
                </button>
                <button class="btn-secondary" data-action="dismiss-report" data-id="${r.id}" style="padding: 6px 14px; font-size: 12px;">
                  Отклонить
                </button>
              </div>
            </div>
          `).join('') : `
            <div class="empty-threads-card">
              <p>Активных жалоб нет. Сообщество соблюдает правила!</p>
            </div>
          `}
        </div>
      ` : ''}

      <!-- Tab 3: Categories & Sections Management -->
      ${activeTab === 'categories' ? `
        <div class="admin-section-card">
          <!-- Top Header Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #1C222E; padding-bottom: 16px;">
            <div>
              <h3 style="color: #FFF; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                ${ICONS.folder} <span>Управление категориями и разделами форума</span>
              </h3>
              <p style="font-size: 12.5px; color: #8A96A6; margin-top: 3px;">
                Создавайте категории, группируйте разделы и подразделы, настраивайте уникальные цвета, иконки, бейджи и права доступа.
              </p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="btn-secondary" id="btn-open-create-fcat" style="padding: 7px 14px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                ${ICONS.folder} <span>+ Создать категорию</span>
              </button>
              <button class="btn-create-topic" id="btn-open-create-section" style="padding: 7px 16px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                ${ICONS.plus} <span>+ Добавить раздел</span>
              </button>
            </div>
          </div>

          <!-- Categories and Sections Hierarchy List -->
          <div class="admin-categories-hierarchy">
            ${forumCategories.length > 0 ? forumCategories.map(fc => {
              const sections = fc.sections || [];
              return `
                <div class="admin-catgroup-card" id="fcat-card-${fc.id}" style="--catgroup-color: ${fc.color || '#FF1F36'};">
                  <!-- Category Header -->
                  <div class="admin-catgroup-header">
                    <div class="admin-catgroup-header-left">
                      <span class="admin-catgroup-accent-bar" style="background: ${fc.color || '#FF1F36'};"></span>
                      <div class="admin-catgroup-icon" style="color: ${fc.color || '#FF1F36'};">
                        ${getIcon(fc.icon)}
                      </div>
                      <div>
                        <div class="admin-catgroup-title-row">
                          <h4 class="admin-catgroup-title">${fc.title}</h4>
                          <span class="admin-catgroup-count-badge">${sections.length} ${sections.length === 1 ? 'раздел' : (sections.length < 5 ? 'раздела' : 'разделов')}</span>
                          <span class="admin-catgroup-order-tag">#${fc.display_order ?? 10}</span>
                        </div>
                        ${fc.description ? `<p class="admin-catgroup-desc">${fc.description}</p>` : ''}
                      </div>
                    </div>

                    <div class="admin-catgroup-actions">
                      <button class="btn-secondary" data-action="add-section-to-cat" data-fcat-id="${fc.id}" data-fcat-title="${fc.title}" style="padding: 5px 10px; font-size: 11.5px;">
                        ${ICONS.plus} Раздел
                      </button>
                      <button class="btn-secondary" data-action="edit-fcat" data-id="${fc.id}" style="padding: 5px 10px; font-size: 11.5px;" title="Редактировать категорию">
                        ${ICONS.pencil}
                      </button>
                      <button class="btn-secondary danger" data-action="delete-fcat" data-id="${fc.id}" data-title="${fc.title}" style="padding: 5px 10px; font-size: 11.5px;" title="Удалить категорию">
                        ${ICONS.trash}
                      </button>
                    </div>
                  </div>

                  <!-- Sections within this Category -->
                  <div class="admin-catgroup-sections">
                    ${sections.length > 0 ? sections.map(cat => {
                      const iconColor = cat.icon_color || '#FF1F36';
                      const iconBg = cat.icon_bg || 'rgba(255, 31, 54, 0.12)';
                      const titleColor = cat.title_color || '#FFFFFF';
                      const descColor = cat.description_color || '#8E95A5';
                      const subSections = cat.subSections || [];

                      return `
                        <div class="admin-section-item-row" id="section-row-${cat.id}">
                          <div class="admin-section-main-info">
                            <div class="admin-section-icon-box" style="background: ${iconBg}; color: ${iconColor}; box-shadow: 0 0 10px ${iconColor}20;">
                              ${getIcon(cat.icon)}
                            </div>
                            <div class="admin-section-text-info">
                              <div class="admin-section-title-line">
                                <span class="admin-section-title" style="color: ${titleColor};">${cat.title}</span>
                                ${cat.badge_text ? `
                                  <span class="section-custom-badge" style="background: ${cat.badge_color || '#FF1F36'};">
                                    ${cat.badge_text}
                                  </span>
                                ` : ''}
                                ${cat.is_locked ? `
                                  <span class="admin-locked-pill" title="Создание тем отключено">${ICONS.lock} Закрыт</span>
                                ` : ''}
                              </div>
                              <p class="admin-section-desc" style="color: ${descColor};">${cat.description || 'Без описания'}</p>
                              
                              <div class="admin-section-meta-row">
                                <span>URL: <code>/forum/category/${cat.slug}</code></span>
                                <span>Доступ к темам: <strong>${cat.min_role_to_post || 'player'}</strong></span>
                                <span>Сортировка: <strong>#${cat.display_order || 0}</strong></span>
                              </div>

                              <!-- Subsections Chips -->
                              ${subSections.length > 0 ? `
                                <div class="admin-subsections-chips-row">
                                  <span style="font-size: 11px; color: #8A96A6;">↳ Подразделы:</span>
                                  ${subSections.map(sub => `
                                    <div class="admin-sub-chip" style="--sub-c: ${sub.icon_color || '#FF1F36'};">
                                      <span>${getIcon(sub.icon)}</span>
                                      <span style="color: ${sub.title_color || '#FFF'};">${sub.title}</span>
                                      ${sub.badge_text ? `<span class="sub-chip-badge" style="background: ${sub.badge_color || '#FF1F36'};">${sub.badge_text}</span>` : ''}
                                      <button type="button" class="btn-sub-chip-edit" data-action="edit-section" data-id="${sub.id}" title="Настроить подраздел">✏️</button>
                                      <button type="button" class="btn-sub-chip-del" data-action="delete-section" data-id="${sub.id}" data-title="${sub.title}" title="Удалить подраздел">✕</button>
                                    </div>
                                  `).join('')}
                                </div>
                              ` : ''}
                            </div>
                          </div>

                          <div class="admin-section-actions">
                            <button class="btn-secondary" data-action="add-subsection" data-parent-id="${cat.id}" data-fcat-id="${fc.id}" data-parent-title="${cat.title}" style="padding: 6px 10px; font-size: 11.5px;" title="Добавить подраздел внутрь этого раздела">
                              ${ICONS.plus} Подраздел
                            </button>
                            <button class="btn-secondary" data-action="edit-section" data-id="${cat.id}" style="padding: 6px 12px; font-size: 12px;">
                              ${ICONS.pencil} Настроить
                            </button>
                            <button class="btn-secondary danger" data-action="delete-section" data-id="${cat.id}" data-title="${cat.title}" style="padding: 6px 10px; font-size: 12px;" title="Удалить раздел">
                              ${ICONS.trash}
                            </button>
                          </div>
                        </div>
                      `;
                    }).join('') : `
                      <div class="admin-empty-fcat-notice">
                        <p>В этой категории пока нет разделов.</p>
                        <button class="btn-secondary" data-action="add-section-to-cat" data-fcat-id="${fc.id}" data-fcat-title="${fc.title}" style="margin-top: 8px; font-size: 11.5px; padding: 5px 12px;">
                          ${ICONS.plus} Добавить первый раздел
                        </button>
                      </div>
                    `}
                  </div>
                </div>
              `;
            }).join('') : `
              <div class="empty-threads-card">
                <p>Категории форума ещё не созданы. Нажмите «+ Создать категорию» выше!</p>
              </div>
            `}

            <!-- Uncategorized Sections (if any exist) -->
            ${(() => {
              const uncategorized = categories.filter(c => !c.forum_category_id && !c.parent_id);
              if (uncategorized.length === 0) return '';
              return `
                <div class="admin-catgroup-card" style="--catgroup-color: #64748B; margin-top: 24px;">
                  <div class="admin-catgroup-header">
                    <div class="admin-catgroup-header-left">
                      <span class="admin-catgroup-accent-bar" style="background: #64748B;"></span>
                      <div class="admin-catgroup-icon" style="color: #64748B;">${ICONS.folder}</div>
                      <div>
                        <div class="admin-catgroup-title-row">
                          <h4 class="admin-catgroup-title">Разделы без категории</h4>
                          <span class="admin-catgroup-count-badge">${uncategorized.length}</span>
                        </div>
                        <p class="admin-catgroup-desc">Эти разделы ещё не привязаны ни к одной категории форума. Отредактируйте их, чтобы назначить категорию.</p>
                      </div>
                    </div>
                  </div>
                  <div class="admin-catgroup-sections">
                    ${uncategorized.map(cat => `
                      <div class="admin-section-item-row" id="section-row-${cat.id}">
                        <div class="admin-section-main-info">
                          <div class="admin-section-icon-box" style="background: ${cat.icon_bg || 'rgba(255, 31, 54, 0.12)'}; color: ${cat.icon_color || '#FF1F36'};">
                            ${getIcon(cat.icon)}
                          </div>
                          <div class="admin-section-text-info">
                            <div class="admin-section-title-line">
                              <span class="admin-section-title" style="color: ${cat.title_color || '#FFF'};">${cat.title}</span>
                              ${cat.badge_text ? `<span class="section-custom-badge" style="background: ${cat.badge_color || '#FF1F36'};">${cat.badge_text}</span>` : ''}
                            </div>
                            <p class="admin-section-desc">${cat.description || 'Без описания'}</p>
                            <div class="admin-section-meta-row">
                              <span>URL: <code>/forum/category/${cat.slug}</code></span>
                            </div>
                          </div>
                        </div>
                        <div class="admin-section-actions">
                          <button class="btn-secondary" data-action="edit-section" data-id="${cat.id}" style="padding: 6px 12px; font-size: 12px;">
                            ${ICONS.pencil} Настроить
                          </button>
                          <button class="btn-secondary danger" data-action="delete-section" data-id="${cat.id}" data-title="${cat.title}" style="padding: 6px 10px; font-size: 12px;">
                            ${ICONS.trash}
                          </button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            })()}
          </div>
        </div>
      ` : ''}

      <!-- Tab 4: Users and Multiple Badges -->
      ${activeTab === 'users' ? `
        <div class="admin-section-card">
          <!-- Header Row -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3 style="color: #FFF; font-size: 16px;">Пользователи форума и управление ролями</h3>
              <p style="font-size: 12px; color: #8A96A6; margin-top: 2px;">
                Вы можете назначать игроку сразу несколько ролей и плашек, а также удалять их в 1 клик.
              </p>
            </div>
            ${canManageCustomBadges ? `
              <a href="/admin?tab=custom_badges" data-link class="btn-create-topic" style="font-size: 12px; padding: 7px 14px;">
                ${ICONS.plus} Создать кастомную плашку
              </a>
            ` : ''}
          </div>

          <div class="admin-users-table">
            ${users.map(u => `
              <div class="admin-user-row" id="user-row-${u.id}">
                <img src="${u.avatar || '/assets/avatar_ivan.jpg'}" alt="${u.username}" class="admin-user-avatar" />
                
                <div class="admin-user-info-col">
                  <div style="font-weight: 700; color: #FFF; font-size: 14px;">${u.username}</div>
                  <div style="font-size: 12px; color: #8A96A6;">
                    ${u.email} • LVL: <strong>${u.level || 1}</strong> • Репутация: <strong style="color: #10B981;">+${u.reputation || 0}</strong>
                  </div>
                </div>

                <!-- Assigned Badges Chips List -->
                <div class="admin-user-badges-box" id="user-badges-box-${u.id}">
                  <div class="user-assigned-chips-wrap">
                    ${(u.badges || []).map(b => `
                      <div class="user-badge-chip" style="--chip-color: ${b.color || '#FF1F36'};" title="${b.title || b.key}">
                        <span class="chip-icon">${BADGE_ICONS[b.icon] || BADGE_ICONS.crown}</span>
                        <span class="chip-title">${b.title || b.key}</span>
                        ${(u.badges || []).length > 1 ? `
                          <button type="button" class="btn-remove-user-badge" data-action="remove-user-badge" data-user-id="${u.id}" data-badge-key="${b.key}" title="Снять плашку ${b.title || b.key}">✕</button>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>

                  <!-- Quick Add Badge Dropdown -->
                  <div class="assign-badge-dropdown-wrap">
                    <button type="button" class="btn-add-user-badge" data-action="toggle-add-badge-menu" data-user-id="${u.id}">
                      ${ICONS.plus} <span>Выдать плашку</span>
                    </button>

                    <div class="assign-badge-menu" id="assign-menu-${u.id}" style="display: none;">
                      <div class="assign-menu-title">Выберите плашку для выдачи:</div>
                      <div class="assign-menu-list">
                        ${customBadges.length > 0 ? `
                          <div class="assign-menu-group-label">Кастомные плашки</div>
                          ${customBadges.map(cb => `
                            <button type="button" class="assign-menu-item" data-action="assign-badge" data-user-id="${u.id}" data-badge-key="${cb.key}">
                              <span class="assign-item-dot" style="background: ${cb.color};"></span>
                              <span class="assign-item-title">${cb.title}</span>
                              <span class="assign-item-sub">${cb.subtitle}</span>
                            </button>
                          `).join('')}
                        ` : ''}

                        <div class="assign-menu-group-label">Официальные роли</div>
                        ${Object.keys(BADGES).map(key => `
                          <button type="button" class="assign-menu-item" data-action="assign-badge" data-user-id="${u.id}" data-badge-key="${key}">
                            <span class="assign-item-dot" style="background: ${BADGES[key].color};"></span>
                            <span class="assign-item-title">${BADGES[key].title}</span>
                            <span class="assign-item-sub">${BADGES[key].subtitle}</span>
                          </button>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Primary Role Selector & Quick Actions -->
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                  <button type="button" class="btn-create-topic btn-admin-user-awards" data-user-id="${u.id}" data-username="${u.username}" data-level="${u.level || 1}" data-xp="${u.current_xp || 0}" data-rep="${u.reputation || 0}" style="padding: 6px 12px; font-size: 11.5px; background: linear-gradient(135deg, #FF1F36, #FF8A00); display: inline-flex; align-items: center; gap: 6px;">
                    ${ICONS.award} <span>Уровень и Награды</span>
                  </button>

                  <select class="modal-select change-role-select" data-user-id="${u.id}" title="Основная системная роль" style="width: 170px; padding: 6px 10px; font-size: 11.5px; font-weight: 600; background: #12151D; border-color: #262D3D; color: #FFF;">
                    <option value="superadmin" ${u.role === 'superadmin' ? 'selected' : ''}>👑 Главный Администратор</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>👑 Администратор</option>
                    <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>👑 Модератор</option>
                    <option value="helper" ${u.role === 'helper' ? 'selected' : ''}>🛡️ Хелпер</option>
                    <option value="verified" ${u.role === 'verified' ? 'selected' : ''}>🛡️ Проверенный</option>
                    <option value="streamer" ${u.role === 'streamer' ? 'selected' : ''}>⭐ Стример</option>
                    <option value="vip" ${u.role === 'vip' ? 'selected' : ''}>💎 VIP</option>
                    <option value="player" ${u.role === 'player' ? 'selected' : ''}>👤 Игрок</option>
                    <option value="guest" ${u.role === 'guest' ? 'selected' : ''}>👤+ Гость</option>
                    <option value="developer" ${u.role === 'developer' ? 'selected' : ''}>&lt;/&gt; Разработчик</option>
                  </select>

                  <button class="btn-secondary ${u.is_banned ? '' : 'danger'}" data-action="toggle-ban" data-user-id="${u.id}" data-banned="${u.is_banned}" style="padding: 6px 10px; font-size: 11.5px;">
                    ${u.is_banned ? 'Разблокировать' : 'Забанить'}
                  </button>

                  <button class="btn-secondary" data-action="warn-user" data-user-id="${u.id}" style="padding: 6px 10px; font-size: 11.5px;">
                    Варн
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Tab 5: Custom Badges Creator (Only Superadmin and Admin) -->
      ${activeTab === 'custom_badges' ? `
        <div class="admin-section-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="color: #FFF; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <span>Конструктор кастомных ролей и плашек</span>
                <span class="admin-badge-pill">Доступ: Администрация</span>
              </h2>
              <p style="font-size: 13px; color: #8A96A6; margin-top: 4px;">
                Создавайте кастомные плашки с индивидуальным цветом, иконкой и текстом на подобии оригинальных. Доступно только Главному Администратору и Администраторам.
              </p>
            </div>
          </div>

          <!-- Creator Layout (Form + Live Preview) -->
          <div class="custom-badge-creator-layout">
            <!-- Form -->
            <form id="form-create-custom-badge" class="custom-badge-form">
              <div class="modal-field">
                <label>Название плашки (заголовок) <span style="color:#FF1F36;">*</span></label>
                <input type="text" class="modal-input" id="custom-badge-title-input" placeholder="Например: ШЕФ LSPD, КУРАТОР ГОС. СТРУКТУР..." required maxlength="40" value="ШЕФ LSPD" />
              </div>

              <div class="modal-field">
                <label>Подпись (подзаголовок под названием)</label>
                <input type="text" class="modal-input" id="custom-badge-subtitle-input" placeholder="Например: Полицейский департамент, Руководство..." maxlength="50" value="Полицейский департамент" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="modal-field">
                  <label>Идентификатор (slug) <small style="color:#8A96A6;">(англ. буквы и цифры)</small></label>
                  <input type="text" class="modal-input" id="custom-badge-key-input" placeholder="leader_lspd" value="leader_lspd" />
                </div>
                <div class="modal-field">
                  <label>Приоритет (уровень)</label>
                  <select class="modal-select" id="custom-badge-level-input">
                    <option value="5">Уровень 5 — Высшее руководство</option>
                    <option value="4">Уровень 4 — Администрация</option>
                    <option value="3">Уровень 3 — Модерация и кураторы</option>
                    <option value="2" selected>Уровень 2 — Лидеры фракций</option>
                    <option value="1">Уровень 1 — Игровой статус / VIP</option>
                  </select>
                </div>
              </div>

              <!-- Badge Style Selection -->
              <div class="modal-field">
                <label>Стиль оформления плашки</label>
                <div class="badge-style-selector-grid">
                  <label class="badge-style-option">
                    <input type="radio" name="custom-badge-style" value="classic" checked />
                    <div class="badge-style-card">
                      <div class="badge-style-title">Классический Phoenix</div>
                      <div class="badge-style-desc">Тёмная карточка с круглой эмблемой, градиентом и диагональными полосами</div>
                    </div>
                  </label>
                  <label class="badge-style-option">
                    <input type="radio" name="custom-badge-style" value="neon_crystal" />
                    <div class="badge-style-card">
                      <div class="badge-style-title">💎 Неоновый кристалл (Blue Plate)</div>
                      <div class="badge-style-desc">Футуристичная неоновая плашка с текстурой синего кристалла и свечением</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Color Picker + Presets -->
              <div class="modal-field">
                <label>Цвет акцента и свечения</label>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <input type="color" id="custom-badge-color-picker" value="#0091FF" class="color-picker-native" />
                  <input type="text" class="modal-input" id="custom-badge-color-input" value="#0091FF" style="width: 120px; font-family: monospace;" maxlength="7" />
                </div>

                <div class="color-preset-pills">
                  <button type="button" class="color-pill" data-color="#FF1F36" style="background:#FF1F36;" title="Красный Phoenix"></button>
                  <button type="button" class="color-pill" data-color="#F59E0B" style="background:#F59E0B;" title="Благородное золото"></button>
                  <button type="button" class="color-pill active" data-color="#0091FF" style="background:#0091FF;" title="Неоновый синий LSPD"></button>
                  <button type="button" class="color-pill" data-color="#10B981" style="background:#10B981;" title="Изумрудный / Медицина"></button>
                  <button type="button" class="color-pill" data-color="#8B5CF6" style="background:#8B5CF6;" title="Фиолетовый / Ballas"></button>
                  <button type="button" class="color-pill" data-color="#EC4899" style="background:#EC4899;" title="Малиновый / Стример"></button>
                  <button type="button" class="color-pill" data-color="#06B6D4" style="background:#06B6D4;" title="Бирюзовый"></button>
                  <button type="button" class="color-pill" data-color="#94A3B8" style="background:#94A3B8;" title="Стальной серый"></button>
                </div>
              </div>

              <!-- Icon Selector -->
              <div class="modal-field">
                <label>Иконка плашки</label>
                <input type="hidden" id="custom-badge-icon-input" value="shield" />
                <div class="icon-picker-grid">
                  ${[
                    { key: 'shield', label: 'Щит' },
                    { key: 'police', label: 'Полиция' },
                    { key: 'crown', label: 'Корона' },
                    { key: 'briefcase', label: 'Мэрия' },
                    { key: 'award', label: 'Награда' },
                    { key: 'flame', label: 'Огонь' },
                    { key: 'zap', label: 'Молния' },
                    { key: 'star', label: 'Звезда' },
                    { key: 'diamond', label: 'Алмаз' },
                    { key: 'verified', label: 'Галочка' },
                    { key: 'target', label: 'Армия' },
                    { key: 'heart', label: 'EMS' },
                    { key: 'sparkles', label: 'Искры' },
                    { key: 'code', label: 'Код' },
                    { key: 'hammer', label: 'Молот' },
                    { key: 'user', label: 'Игрок' }
                  ].map(item => `
                    <button type="button" class="icon-picker-btn ${item.key === 'shield' ? 'active' : ''}" data-icon="${item.key}" title="${item.label}">
                      ${BADGE_ICONS[item.key] || BADGE_ICONS.crown}
                      <span class="icon-lbl">${item.label}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

              <button type="submit" class="btn-create-topic" id="btn-submit-custom-badge" style="width: 100%; justify-content: center; padding: 12px; margin-top: 14px;">
                ${ICONS.plus}
                <span>Создать кастомную плашку</span>
              </button>
            </form>

            <!-- Live Preview Column -->
            <div class="custom-badge-preview-column">
              <h3 style="color: #FFF; font-size: 14px; margin-bottom: 12px; font-weight: 600;">Живой предпросмотр плашки</h3>
              <div class="badge-live-preview-box">
                <div style="font-size: 11px; color: #8A96A6; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">В карточке профиля:</div>
                <div id="live-badge-preview-normal" style="width: 100%; display: flex; justify-content: center;">
                  ${renderRoleBadge({
                    key: 'preview',
                    title: 'ШЕФ LSPD',
                    subtitle: 'Полицейский департамент',
                    color: '#0091FF',
                    glow: 'rgba(0, 145, 255, 0.4)',
                    icon: 'shield'
                  }, { size: 'normal' })}
                </div>

                <div style="font-size: 11px; color: #8A96A6; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin-top: 16px;">В боковой колонке темы форума:</div>
                <div id="live-badge-preview-sidebar" style="width: 100%; display: flex; justify-content: center;">
                  ${renderRoleBadge({
                    key: 'preview',
                    title: 'ШЕФ LSPD',
                    subtitle: 'Полицейский департамент',
                    color: '#0091FF',
                    glow: 'rgba(0, 145, 255, 0.4)',
                    icon: 'shield'
                  }, { size: 'sidebar' })}
                </div>
              </div>
            </div>
          </div>

          <!-- Existing Custom Badges Grid -->
          <div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #1C222E;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="color: #FFF; font-size: 16px;">Созданные кастомные плашки (${customBadges.length})</h3>
            </div>

            ${customBadges.length > 0 ? `
              <div class="custom-badges-grid">
                ${customBadges.map(cb => `
                  <div class="custom-badge-item-card" id="custom-badge-card-${cb.id}">
                    <div style="width: 100%; display: flex; justify-content: center; margin-bottom: 12px;">
                      ${renderRoleBadge(cb, { size: 'compact' })}
                    </div>
                    <div class="custom-badge-meta-row">
                      <span>Ключ: <code>${cb.key}</code></span>
                      <span style="font-size: 11px; color: ${cb.style === 'neon_crystal' ? '#38BDF8' : '#8A96A6'}; font-weight: 600;">
                        ${cb.style === 'neon_crystal' ? '💎 Неоновый' : 'Классика'} (${cb.level} ур.)
                      </span>
                    </div>
                    <div class="custom-badge-meta-row" style="margin-top: 6px;">
                      <span>Выдано: <strong>${cb.assigned_users_count || 0}</strong> игр.</span>
                      <button class="btn-delete-custom-badge" data-action="delete-custom-badge" data-id="${cb.id}" data-title="${cb.title}">
                        ${ICONS.trash} Удалить
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="empty-threads-card">
                <p>Вы пока не создали ни одной кастомной плашки. Заполните форму выше и нажмите «Создать кастомную плашку»!</p>
              </div>
            `}
          </div>
        </div>
      ` : ''}

      <!-- Tab 6: Audit Logs -->
      ${activeTab === 'logs' ? `
        <div class="admin-section-card">
          <h3 style="color: #FFF; font-size: 16px; margin-bottom: 16px;">Журнал аудита действий администрации</h3>
          <div class="audit-logs-list">
            ${auditLogs.map(l => `
              <div class="audit-log-item">
                <div class="audit-log-header">
                  <span class="audit-action-tag">${l.action}</span>
                  <span class="audit-time">${new Date(l.created_at).toLocaleString('ru-RU')}</span>
                </div>
                <div class="audit-details-text">${l.details || '—'}</div>
                <div class="audit-author-info">
                  Модератор: <strong>${l.user_name || 'Система'}</strong> (IP: ${l.ip_address || '127.0.0.1'})
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
