// Phoenix RP Forum - Main Client Application
import './style.css';
import { state, subscribe, notifyStateChange } from './state.js';
import { api, authStorage } from './api/client.js';
import { router } from './router.js';
import { renderHeader } from './components/Header.js';
import { renderSidebarRight } from './components/SidebarRight.js';
import { openModal, closeModal, renderModal } from './components/Modal.js';
import { attachRichEditorEvents } from './components/RichEditor.js';
import { playSound } from './utils/sound.js';

// Import Views
import { renderHomeForum, renderHeroBanner } from './pages/HomeForum.js';
import { renderCategoryView } from './pages/CategoryView.js';
import { renderThreadView } from './pages/ThreadView.js';
import { renderCreateThread } from './pages/CreateThread.js';
import { renderSearchPage } from './pages/SearchPage.js';
import { renderMembersPage } from './pages/MembersPage.js';
import { renderMemberProfile } from './pages/MemberProfile.js';
import { renderNotificationsPage } from './pages/NotificationsPage.js';
import { renderRulesPage } from './pages/RulesPage.js';
import { renderAuthPage } from './pages/AuthPage.js';
import { renderSettingsPage } from './pages/SettingsPage.js';
import { renderAdminPanel } from './pages/AdminPanel.js';
import { renderMessagesPage } from './pages/MessagesPage.js';
import { renderRoleBadge, renderUserBadges, registerCustomBadges, BADGE_ICONS } from './utils/badges.js';
import { renderPrefixBadge } from './utils/prefixes.js';
import { renderStyledUsername, getNicknameStyle } from './utils/nameStyles.js';

import { renderFooter } from './components/Footer.js';

// Toast Notifications Helper
export function showToast(message, type = 'check') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Render Core Shell (Header, Layout, Sidebars, Main Area, Footer)
function renderAppShell(contentHtml, options = {}) {
  const app = document.getElementById('app');
  if (!app) return;

  const isAuthStandalone = window.location.pathname === '/login' || window.location.pathname === '/register';

  if (isAuthStandalone) {
    app.innerHTML = `
      ${renderHeader()}
      <main class="auth-standalone-layout">
        ${contentHtml}
      </main>
      ${renderFooter()}
    `;
  } else {
    const topBannerHtml = options.topBanner || null;

    app.innerHTML = `
      ${renderHeader()}
      ${topBannerHtml ? `
        <div class="forum-top-banner-wrap">
          ${topBannerHtml}
        </div>
      ` : ''}
      <div class="forum-layout">
        <main id="main-area">
          ${contentHtml}
        </main>
        ${renderSidebarRight()}
      </div>
      ${renderFooter()}
    `;
  }

  attachGlobalEvents();
}

// -------------------------------------------------------------
// ROUTE REGISTRATIONS
// -------------------------------------------------------------

// 1. Home Forum
router.addRoute('/forum', async () => {
  renderAppShell('<div class="loading-spinner-wrap"><div class="spinner"></div><p>Загрузка разделов форума...</p></div>', { topBanner: renderHeroBanner() });
  try {
    const res = await api.categories.getAll();
    state.categories = res.categories || [];
    state.forumCategories = res.forumCategories || [];
    renderAppShell(renderHomeForum(), { topBanner: renderHeroBanner() });
  } catch (err) {
    renderAppShell(`<div class="empty-threads-card"><h3>Ошибка загрузки:</h3><p>${err.message}</p></div>`, { topBanner: renderHeroBanner() });
  }
});

// 2. Category Topics View
router.addRoute('/forum/category/:slug', async (params, query) => {
  renderAppShell('<div class="loading-spinner-wrap"><div class="spinner"></div><p>Загрузка темы раздела...</p></div>');
  try {
    const filter = query.filter || 'all';
    const page = query.page || 1;
    const data = await api.categories.getBySlug(params.slug, filter, page);
    renderAppShell(renderCategoryView({ ...data, currentFilter: filter }));
  } catch (err) {
    renderAppShell(`<div class="empty-threads-card"><h3>Раздел не найден</h3><p>${err.message}</p></div>`);
  }
});

// 3. Thread View
router.addRoute('/forum/thread/:id', async (params) => {
  renderAppShell('<div class="loading-spinner-wrap"><div class="spinner"></div><p>Загрузка темы...</p></div>');
  try {
    const data = await api.threads.getById(params.id);
    renderAppShell(renderThreadView(data));
    attachRichEditorEvents('reply-content');
  } catch (err) {
    renderAppShell(`<div class="empty-threads-card"><h3>Тема не найдена</h3><p>${err.message}</p></div>`);
  }
});

// Helper: Load available prefixes for category into Create Thread select
async function updatePrefixOptionsForCreate(catIdOrSlug) {
  const pfxSelect = document.getElementById('thread-prefix');
  if (!pfxSelect) return;
  if (!catIdOrSlug) {
    pfxSelect.innerHTML = '<option value="">[Без префикса]</option>';
    return;
  }
  try {
    const res = await api.categories.getPrefixes(catIdOrSlug);
    const prefixes = res.prefixes || [];
    let opts = '<option value="">[Без префикса]</option>';
    prefixes.forEach(p => {
      opts += `<option value="${p.id}">${p.title}</option>`;
    });
    pfxSelect.innerHTML = opts;
  } catch (err) {
    console.error('Failed to load prefixes for category:', err);
    pfxSelect.innerHTML = '<option value="">[Без префикса]</option>';
  }
}

// 4. Create Thread
router.addRoute('/forum/create', async (params, query) => {
  if (!state.user) {
    showToast('Для создания темы необходимо авторизоваться');
    openModal('auth');
    router.navigate('/forum');
    return;
  }
  if (!state.categories || state.categories.length === 0 || !state.forumCategories || state.forumCategories.length === 0) {
    try {
      const catsRes = await api.categories.getAll();
      state.categories = catsRes.categories || [];
      state.forumCategories = catsRes.forumCategories || [];
    } catch {}
  }
  renderAppShell(renderCreateThread(query.category || null));
  attachRichEditorEvents('thread-content');

  // Populate prefixes for selected category
  const catSelect = document.getElementById('thread-category');
  if (catSelect && catSelect.value) {
    updatePrefixOptionsForCreate(catSelect.value);
  }
});

// 5. Search
router.addRoute('/forum/search', async (params, query) => {
  renderAppShell('<div class="loading-spinner-wrap"><div class="spinner"></div><p>Поиск по форуму...</p></div>');
  try {
    const data = await api.search(query);
    renderAppShell(renderSearchPage({ ...data, query }));
  } catch (err) {
    renderAppShell(`<div class="empty-threads-card"><h3>Ошибка поиска</h3><p>${err.message}</p></div>`);
  }
});

// 6. Members
router.addRoute('/forum/members', async (params, query) => {
  renderAppShell('<div class="loading-spinner-wrap"><div class="spinner"></div><p>Загрузка пользователей...</p></div>');
  try {
    const data = await api.users.getMembers(query);
    renderAppShell(renderMembersPage({ ...data, currentRole: query.role || 'all', searchQuery: query.search || '' }));
  } catch (err) {
    renderAppShell(`<div class="empty-threads-card"><h3>Ошибка</h3><p>${err.message}</p></div>`);
  }
});

// 7. Member Profile
router.addRoute('/forum/member/:id', async (params) => {
  renderAppShell('<div class="loading-spinner-wrap"><div class="spinner"></div><p>Загрузка профиля...</p></div>');
  try {
    const data = await api.users.getProfile(params.id);
    renderAppShell(renderMemberProfile(data));
  } catch (err) {
    renderAppShell(`<div class="empty-threads-card"><h3>Профиль не найден</h3><p>${err.message}</p></div>`);
  }
});

// 8. Notifications
router.addRoute('/forum/notifications', async () => {
  if (!state.user) {
    router.navigate('/login');
    return;
  }
  renderAppShell('<div class="loading-spinner-wrap"><div class="spinner"></div><p>Загрузка уведомлений...</p></div>');
  try {
    const data = await api.notifications.getAll();
    state.unreadNotifications = data.unreadCount || 0;
    renderAppShell(renderNotificationsPage(data));
  } catch (err) {
    renderAppShell(`<div class="empty-threads-card"><h3>Ошибка</h3><p>${err.message}</p></div>`);
  }
});

// 8.1. Private Messages / Conversations
router.addRoute('/forum/messages', async (params, query) => {
  if (!state.user) {
    showToast('Для доступа к личным сообщениям необходимо войти в аккаунт');
    openModal('auth');
    router.navigate('/forum');
    return;
  }

  renderAppShell('<div class="loading-spinner-wrap"><div class="spinner"></div><p>Загрузка личных сообщений...</p></div>');
  try {
    const convsRes = await api.messages.getConversations();
    const conversations = convsRes.conversations || [];

    let currentConv = null;
    let messages = [];
    let otherUser = null;

    let selectedConvId = query.conv;
    if (!selectedConvId && conversations.length > 0) {
      selectedConvId = conversations[0].id;
    }

    if (selectedConvId) {
      try {
        const msgRes = await api.messages.getMessages(selectedConvId);
        currentConv = msgRes.conversation;
        messages = msgRes.messages || [];
        otherUser = msgRes.otherUser;

        // Refresh unread messages badge
        const unreadRes = await api.messages.getUnreadCount();
        state.unreadMessages = unreadRes.unreadCount || 0;
        notifyStateChange();
      } catch (e) {
        console.error('Error loading selected conversation:', e);
      }
    }

    renderAppShell(renderMessagesPage({
      conversations,
      currentConv,
      messages,
      otherUser
    }));

    // Auto-scroll messages list to bottom
    const chatContainer = document.getElementById('chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  } catch (err) {
    renderAppShell(`<div class="empty-threads-card"><h3>Ошибка</h3><p>${err.message}</p></div>`);
  }
});

// 9. Rules
router.addRoute('/forum/rules', () => {
  renderAppShell(renderRulesPage());
});

// 10. Login & Register standalone pages
router.addRoute('/login', () => {
  renderAppShell(renderAuthPage('login'));
});

router.addRoute('/register', () => {
  renderAppShell(renderAuthPage('register'));
});

// 11. Account Settings
router.addRoute('/account/settings', () => {
  if (!state.user) {
    router.navigate('/login');
    return;
  }
  renderAppShell(renderSettingsPage());
});

// 12. Administration Panel
router.addRoute('/admin', async (params, query) => {
  if (!state.user || !['moderator', 'admin', 'superadmin'].includes(state.user.role)) {
    showToast('Доступ ограничен. Только для модераторов и администрации.');
    router.navigate('/forum');
    return;
  }

  const tab = query.tab || 'overview';
  renderAppShell('<div class="loading-spinner-wrap"><div class="spinner"></div><p>Загрузка панели управления...</p></div>');

  try {
    const statsData = await api.admin.getStats();
    let reports = [];
    let users = [];
    let pagination = {};
    let customBadges = [];
    let auditLogs = [];
    let decorationsData = null;
    let nicknamesData = null;
    let prefixes = [];
    let servers = [];

    if (tab === 'reports') {
      const repData = await api.reports.getReports('pending');
      reports = repData.reports || [];
    } else if (tab === 'categories') {
      const catsRes = await api.categories.getAll().catch(() => ({ categories: [], forumCategories: [] }));
      state.categories = catsRes.categories || [];
      state.forumCategories = catsRes.forumCategories || [];
    } else if (tab === 'users') {
      const page = parseInt(query.page || 1, 10);
      const search = query.search || '';
      const role = query.role || 'all';
      const [uData, cbData] = await Promise.all([
        api.admin.getUsers({ page, limit: 50, search, role }),
        api.admin.getCustomBadges().catch(() => ({ customBadges: [] }))
      ]);
      users = uData.users || [];
      pagination = uData.pagination || { page: 1, totalPages: 1, total: users.length, limit: 50 };
      customBadges = cbData.customBadges || [];
    } else if (tab === 'custom_badges') {
      const cbData = await api.admin.getCustomBadges().catch(() => ({ customBadges: [] }));
      customBadges = cbData.customBadges || [];
    } else if (tab === 'decorations') {
      const isFounder = state.user && (
        state.user.username === 'KENZO' ||
        state.user.username === 'Ivan_Petrov' ||
        state.user.id === 'u_ivan_petrov' ||
        state.user.role === 'superadmin'
      );
      if (!isFounder) {
        showToast('Доступ к украшениям разрешён создателю проекта KENZO.');
        router.navigate('/admin?tab=overview');
        return;
      }
      try {
        decorationsData = await api.admin.getDecorations();
      } catch (e) {
        console.error('Error fetching decorations data:', e);
      }
    } else if (tab === 'nicknames') {
      const isFounder = state.user && (
        state.user.username === 'KENZO' ||
        state.user.username === 'Ivan_Petrov' ||
        state.user.id === 'u_ivan_petrov' ||
        state.user.role === 'superadmin'
      );
      if (!isFounder) {
        showToast('Доступ к управлению никами разрешён только основателю проекта (KENZO).');
        router.navigate('/admin?tab=overview');
        return;
      }
      try {
        nicknamesData = await api.admin.getNicknames();
      } catch (e) {
        console.error('Error fetching nicknames data:', e);
      }
    } else if (tab === 'prefixes') {
      const pfxRes = await api.admin.getPrefixes().catch(() => ({ prefixes: [] }));
      prefixes = pfxRes.prefixes || [];
      state.currentAdminPrefixes = prefixes;
      if (!state.categories || state.categories.length === 0 || !state.forumCategories || state.forumCategories.length === 0) {
        const catsRes = await api.categories.getAll().catch(() => ({ categories: [], forumCategories: [] }));
        state.categories = catsRes.categories || [];
        state.forumCategories = catsRes.forumCategories || [];
      }
    } else if (tab === 'servers') {
      const srvRes = await api.admin.getServers().catch(() => ({ servers: [] }));
      servers = srvRes.servers || [];
      state.adminServers = servers;
    } else if (tab === 'logs') {
      const lData = await api.admin.getAuditLogs();
      auditLogs = lData.logs || [];
    }

    // Always fetch prefixes and servers count for overview badges if on overview
    if (tab === 'overview') {
      const [pfxRes, srvRes] = await Promise.all([
        api.admin.getPrefixes().catch(() => ({ prefixes: [] })),
        api.admin.getServers().catch(() => ({ servers: [] }))
      ]);
      prefixes = pfxRes.prefixes || [];
      state.currentAdminPrefixes = prefixes;
      servers = srvRes.servers || [];
      state.adminServers = servers;
    }

    renderAppShell(renderAdminPanel({
      activeTab: tab,
      stats: statsData.stats || {},
      reports,
      categories: state.categories,
      forumCategories: state.forumCategories || [],
      users,
      pagination,
      searchQuery: query.search || '',
      selectedRole: query.role || 'all',
      customBadges,
      auditLogs,
      decorationsData,
      nicknamesData,
      prefixes,
      servers
    }));
  } catch (err) {
    renderAppShell(`<div class="empty-threads-card"><h3>Ошибка доступа</h3><p>${err.message}</p></div>`);
  }
});

// -------------------------------------------------------------
// GLOBAL EVENT DELEGATION
// -------------------------------------------------------------
function attachGlobalEvents() {
  // Search bar in header (on Enter)
  const headerSearch = document.getElementById('header-search-input');
  if (headerSearch) {
    headerSearch.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const q = headerSearch.value.trim();
        if (q) router.navigate(`/forum/search?q=${encodeURIComponent(q)}`);
      }
    };
  }

  // Header login/register modal buttons
  const btnLogin = document.getElementById('btn-header-login');
  const btnRegister = document.getElementById('btn-header-register');
  const btnSidebarLogin = document.getElementById('btn-sidebar-login');
  const btnSidebarRegister = document.getElementById('btn-sidebar-register');

  if (btnLogin) btnLogin.onclick = () => { state.authTab = 'login'; openModal('auth'); };
  if (btnRegister) btnRegister.onclick = () => { state.authTab = 'register'; openModal('auth'); };
  if (btnSidebarLogin) btnSidebarLogin.onclick = () => { state.authTab = 'login'; openModal('auth'); };
  if (btnSidebarRegister) btnSidebarRegister.onclick = () => { state.authTab = 'register'; openModal('auth'); };

  // Server connect modal buttons
  const btnSidebarConnect = document.getElementById('btn-sidebar-connect');
  const btnSidebarJoin = document.getElementById('btn-sidebar-join-server');
  if (btnSidebarConnect) btnSidebarConnect.onclick = () => openModal('serverConnect');
  if (btnSidebarJoin) btnSidebarJoin.onclick = () => openModal('serverConnect');

  // Header Servers & Shop modal buttons
  const btnHeaderServers = document.getElementById('btn-header-servers');
  const btnHeaderShop = document.getElementById('btn-header-shop');
  const btnNavMore = document.getElementById('btn-nav-more');
  const navMoreMenu = document.getElementById('nav-more-dropdown-menu');
  const btnMoreConnect = document.getElementById('btn-more-connect');

  if (btnHeaderServers) btnHeaderServers.onclick = () => openModal('servers');
  if (btnHeaderShop) btnHeaderShop.onclick = () => openModal('shop');
  if (btnMoreConnect) btnMoreConnect.onclick = () => openModal('serverConnect');

  if (btnNavMore && navMoreMenu) {
    btnNavMore.onclick = (e) => {
      e.stopPropagation();
      navMoreMenu.classList.toggle('show');
    };
    navMoreMenu.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) {
        navMoreMenu.classList.remove('show');
      }
    });
    document.addEventListener('click', (e) => {
      if (!btnNavMore.contains(e.target) && !navMoreMenu.contains(e.target)) {
        navMoreMenu.classList.remove('show');
      }
    });
  }

  // User menu dropdown toggle
  const userChipBtn = document.getElementById('btn-toggle-user-menu');
  const userMenu = document.getElementById('header-user-menu');
  if (userChipBtn && userMenu) {
    userChipBtn.onclick = (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('show');
    };
    document.addEventListener('click', () => userMenu.classList.remove('show'));
  }

  // Logout button
  const btnLogout = document.getElementById('header-btn-logout');
  if (btnLogout) {
    btnLogout.onclick = () => {
      api.auth.logout();
      state.user = null;
      state.unreadNotifications = 0;
      showToast('Вы вышли из своего аккаунта');
      playSound('click');
      notifyStateChange();
      router.navigate('/forum');
    };
  }

  // Dedicated /login form
  const formPageLogin = document.getElementById('form-page-login');
  if (formPageLogin) {
    formPageLogin.onsubmit = async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('auth-page-error');
      const id = document.getElementById('page-login-id')?.value;
      const pwd = document.getElementById('page-login-pwd')?.value;
      try {
        const res = await api.auth.login(id, pwd);
        authStorage.setToken(res.token);
        state.user = res.user;
        showToast(`С возвращением, ${res.user.username}!`);
        playSound('success');
        notifyStateChange();
        router.navigate('/forum');
      } catch (err) {
        if (errBox) {
          errBox.style.display = 'block';
          errBox.innerText = err.message;
        }
      }
    };
  }

  // Dedicated /register form
  const formPageRegister = document.getElementById('form-page-register');
  if (formPageRegister) {
    formPageRegister.onsubmit = async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('auth-page-error');
      const email = document.getElementById('page-reg-email')?.value;
      const username = document.getElementById('page-reg-username')?.value;
      const pwd = document.getElementById('page-reg-pwd')?.value;
      const rep = document.getElementById('page-reg-repeat')?.value;

      if (pwd !== rep) {
        if (errBox) { errBox.style.display = 'block'; errBox.innerText = 'Пароли не совпадают.'; }
        return;
      }

      try {
        const res = await api.auth.register(email, username, pwd);
        authStorage.setToken(res.token);
        state.user = res.user;
        showToast(`Добро пожаловать в семью Phoenix RP, ${res.user.username}!`);
        playSound('success');
        notifyStateChange();
        router.navigate('/forum');
      } catch (err) {
        if (errBox) {
          errBox.style.display = 'block';
          errBox.innerText = err.message;
        }
      }
    };
  }

  // Create Thread Form Submission
  const formCreateThread = document.getElementById('form-create-thread');
  if (formCreateThread) {
    const threadCatSelect = document.getElementById('thread-category');
    if (threadCatSelect && document.getElementById('thread-prefix')) {
      threadCatSelect.onchange = () => {
        updatePrefixOptionsForCreate(threadCatSelect.value);
      };
    }

    formCreateThread.onsubmit = async (e) => {
      e.preventDefault();
      const category_id = document.getElementById('thread-category')?.value;
      const prefix_id = document.getElementById('thread-prefix')?.value || null;
      const tag = document.getElementById('thread-tag')?.value;
      const title = document.getElementById('thread-title')?.value;
      const content = document.getElementById('thread-content')?.value;
      const is_pinned = document.getElementById('thread-pinned')?.checked;

      try {
        const btn = document.getElementById('btn-submit-create-thread');
        btn.disabled = true;
        const res = await api.threads.create({ category_id, prefix_id, tag, title, content, is_pinned });
        showToast(res.message || 'Тема успешно создана!');
        playSound('success');
        router.navigate(`/forum/thread/${res.threadId}`);
      } catch (err) {
        alert(err.message || 'Ошибка создания темы');
        document.getElementById('btn-submit-create-thread').disabled = false;
      }
    };
  }

  // Reply Submit in Thread
  const btnSubmitReply = document.getElementById('btn-submit-reply');
  if (btnSubmitReply) {
    btnSubmitReply.onclick = async () => {
      const threadId = btnSubmitReply.getAttribute('data-thread-id');
      const content = document.getElementById('reply-content')?.value;
      const quoteId = btnSubmitReply.getAttribute('data-quote-id');

      if (!content || !content.trim()) {
        alert('Напишите текст ответа');
        return;
      }

      try {
        btnSubmitReply.disabled = true;
        await api.posts.create({ thread_id: threadId, content, quote_post_id: quoteId || null });
        showToast('Ответ опубликован (+10 XP)!');
        playSound('success');
        router.resolve(); // Re-render thread view
      } catch (err) {
        alert(err.message || 'Ошибка отправки ответа');
        btnSubmitReply.disabled = false;
      }
    };
  }

  // Reply Prompt Login Button
  const btnReplyLogin = document.getElementById('btn-reply-login');
  if (btnReplyLogin) {
    btnReplyLogin.onclick = () => {
      state.authTab = 'login';
      openModal('auth');
    };
  }

  // Thread Post Reactions
  document.querySelectorAll('.rx-btn[data-post-id]').forEach(btn => {
    btn.onclick = async () => {
      if (!state.user) {
        showToast('Для реакции необходимо войти в аккаунт');
        openModal('auth');
        return;
      }
      const postId = btn.getAttribute('data-post-id');
      const rxType = btn.getAttribute('data-rx');
      try {
        const res = await api.posts.react(postId, rxType);
        // Live update UI
        btn.parentElement.querySelectorAll('.rx-btn').forEach(b => {
          b.classList.remove('active');
          const t = b.getAttribute('data-rx');
          const found = res.reactions.find(r => r.reaction_type === t);
          b.querySelector('.rx-count').innerText = found ? found.count : '';
        });
        if (res.myReaction) {
          btn.classList.add('active');
        }
        playSound('click');
      } catch (err) {
        console.error(err);
      }
    };
  });

  // Post Actions (Quote, Solution, Delete, Report)
  document.querySelectorAll('.btn-post-action[data-action]').forEach(btn => {
    btn.onclick = async () => {
      const action = btn.getAttribute('data-action');
      const postId = btn.getAttribute('data-post-id');

      if (action === 'quote') {
        const author = btn.getAttribute('data-author');
        const postCard = document.getElementById(`post-${postId}`);
        const content = postCard?.querySelector('.post-text-body')?.innerText || '';
        const replyArea = document.getElementById('reply-content');
        const quotePreview = document.getElementById('quoted-preview-box');
        const submitReplyBtn = document.getElementById('btn-submit-reply');

        if (replyArea && submitReplyBtn) {
          submitReplyBtn.setAttribute('data-quote-id', postId);
          if (quotePreview) {
            quotePreview.style.display = 'block';
            quotePreview.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <strong style="color: #0091FF;">Цитата от ${author}:</strong> «<span style="color: #C2C9D6;">${content.substring(0, 100).replace(/\n/g, ' ')}${content.length > 100 ? '...' : ''}</span>»
                </div>
                <button type="button" id="btn-cancel-quote" style="background: rgba(255, 31, 54, 0.12); border: 1px solid rgba(255, 31, 54, 0.3); border-radius: 4px; color: #FF4D5E; cursor: pointer; font-size: 11px; padding: 3px 8px; font-weight: 600; flex-shrink: 0;" title="Отменить цитирование">✕ Отменить</button>
              </div>
            `;
            const btnCancelQuote = document.getElementById('btn-cancel-quote');
            if (btnCancelQuote) {
              btnCancelQuote.onclick = () => {
                quotePreview.style.display = 'none';
                quotePreview.innerHTML = '';
                submitReplyBtn.removeAttribute('data-quote-id');
              };
            }
          }
          replyArea.focus();
          replyArea.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (action === 'report') {
        if (!state.user) { openModal('auth'); return; }
        const threadId = btn.getAttribute('data-thread-id');
        openModal('report', { postId, threadId });
      } else if (action === 'solution') {
        try {
          const res = await api.posts.setSolution(postId);
          showToast(res.message);
          router.resolve();
        } catch (err) { alert(err.message); }
      } else if (action === 'edit-post') {
        const bodyEl = document.getElementById(`post-body-${postId}`);
        const editorEl = document.getElementById(`inline-editor-${postId}`);
        if (bodyEl && editorEl) {
          bodyEl.style.display = 'none';
          editorEl.style.display = 'block';
          const textarea = document.getElementById(`edit-textarea-${postId}`);
          if (textarea) textarea.focus();
        }
      } else if (action === 'delete') {
        if (!confirm('Вы уверены, что хотите удалить это сообщение?')) return;
        try {
          const res = await api.posts.delete(postId);
          showToast(res.message);
          if (res.deletedThread) {
            router.navigate('/forum');
          } else {
            router.resolve();
          }
        } catch (err) { alert(err.message); }
      }
    };
  });

  // Inline Post Editing Cancel & Save Buttons
  document.querySelectorAll('.btn-cancel-post-edit').forEach(btn => {
    btn.onclick = () => {
      const postId = btn.getAttribute('data-post-id');
      const bodyEl = document.getElementById(`post-body-${postId}`);
      const editorEl = document.getElementById(`inline-editor-${postId}`);
      if (bodyEl && editorEl) {
        editorEl.style.display = 'none';
        bodyEl.style.display = 'block';
      }
    };
  });

  document.querySelectorAll('.btn-save-post-edit').forEach(btn => {
    btn.onclick = async () => {
      const postId = btn.getAttribute('data-post-id');
      const textarea = document.getElementById(`edit-textarea-${postId}`);
      const newContent = textarea?.value?.trim();
      if (!newContent) return alert('Сообщение не может быть пустым');

      try {
        btn.disabled = true;
        const res = await api.posts.update(postId, newContent);
        showToast(res.message || 'Сообщение обновлено!');
        playSound('success');
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка обновления сообщения');
        btn.disabled = false;
      }
    };
  });

  // Thread Subscription Toggle
  const btnToggleSub = document.getElementById('btn-toggle-subscribe');
  if (btnToggleSub) {
    btnToggleSub.onclick = async () => {
      const tid = btnToggleSub.getAttribute('data-thread-id');
      try {
        const res = await api.threads.toggleSubscribe(tid);
        showToast(res.message);
        playSound('click');
        router.resolve();
      } catch (err) { alert(err.message); }
    };
  }

  // Edit Thread Modal Trigger
  const btnEditThreadModal = document.getElementById('btn-edit-thread-modal');
  if (btnEditThreadModal) {
    btnEditThreadModal.onclick = () => {
      const tid = btnEditThreadModal.getAttribute('data-thread-id');
      const title = decodeURIComponent(btnEditThreadModal.getAttribute('data-title') || '');
      const tag = btnEditThreadModal.getAttribute('data-tag') || '';
      const categoryId = btnEditThreadModal.getAttribute('data-cat-id') || '';
      openModal('editThread', { threadId: tid, title, tag, categoryId });
    };
  }

  // Mod Controls on Thread (Pin, Lock, Delete)
  const btnModPin = document.getElementById('btn-mod-pin');
  const btnModLock = document.getElementById('btn-mod-lock');
  const btnModDelete = document.getElementById('btn-mod-delete-thread');

  if (btnModPin) {
    btnModPin.onclick = async () => {
      const tid = btnModPin.getAttribute('data-thread-id');
      try {
        const res = await api.threads.togglePin(tid);
        showToast(res.message);
        router.resolve();
      } catch (err) { alert(err.message); }
    };
  }

  if (btnModLock) {
    btnModLock.onclick = async () => {
      const tid = btnModLock.getAttribute('data-thread-id');
      try {
        const res = await api.threads.toggleLock(tid);
        showToast(res.message);
        router.resolve();
      } catch (err) { alert(err.message); }
    };
  }

  if (btnModDelete) {
    btnModDelete.onclick = async () => {
      if (!confirm('Удалить тему безвозвратно?')) return;
      const tid = btnModDelete.getAttribute('data-thread-id');
      try {
        await api.threads.delete(tid);
        showToast('Тема удалена.');
        router.navigate('/forum');
      } catch (err) { alert(err.message); }
    };
  }

  // Fast Thread Prefix Switcher (Moderators & Authors)
  const btnQuickPrefix = document.getElementById('btn-quick-prefix-toggle');
  const prefixDropdown = document.getElementById('thread-prefix-dropdown');
  const prefixDropdownList = document.getElementById('thread-prefix-dropdown-list');

  if (btnQuickPrefix && prefixDropdown) {
    btnQuickPrefix.onclick = async (e) => {
      e.stopPropagation();
      const isOpen = prefixDropdown.style.display !== 'none';
      if (isOpen) {
        prefixDropdown.style.display = 'none';
        return;
      }

      prefixDropdown.style.display = 'block';
      const threadId = btnQuickPrefix.getAttribute('data-thread-id');
      const catId = btnQuickPrefix.getAttribute('data-category-id');

      if (prefixDropdownList) {
        prefixDropdownList.innerHTML = '<div style="padding: 8px; font-size: 12px; color: #8E95A5;">Загрузка префиксов...</div>';
        try {
          const res = await api.categories.getPrefixes(catId);
          const prefixes = res.prefixes || [];

          let itemsHtml = `
            <div class="prefix-picker-item" data-pfx-id="" style="padding: 6px 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #8E95A5; transition: background 0.15s ease;">
              <span style="border: 1px dashed rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-size: 11px;">Без префикса</span>
              <span style="font-size: 11px; color: #555E70;">(Снять префикс)</span>
            </div>
          `;

          prefixes.forEach(p => {
            itemsHtml += `
              <div class="prefix-picker-item" data-pfx-id="${p.id}" style="padding: 6px 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #FFF; transition: background 0.15s ease;">
                ${renderPrefixBadge(p, { size: 'normal' })}
              </div>
            `;
          });

          prefixDropdownList.innerHTML = itemsHtml;

          // Attach click listeners to items
          prefixDropdownList.querySelectorAll('.prefix-picker-item').forEach(item => {
            item.onmouseenter = () => item.style.background = 'rgba(255, 255, 255, 0.08)';
            item.onmouseleave = () => item.style.background = 'transparent';
            item.onclick = async (ev) => {
              ev.stopPropagation();
              const pfxId = item.getAttribute('data-pfx-id') || null;
              try {
                const updateRes = await api.threads.setPrefix(threadId, pfxId);
                showToast(updateRes.message || 'Префикс темы обновлён');
                playSound('success');
                prefixDropdown.style.display = 'none';

                // Update live header badge slot
                const slot = document.getElementById('thread-header-prefix-slot');
                if (slot) {
                  const chosen = prefixes.find(p => p.id === pfxId);
                  slot.innerHTML = chosen ? renderPrefixBadge(chosen, { size: 'header' }) : '';
                }
              } catch (err) {
                alert(err.message || 'Ошибка обновления префикса');
              }
            };
          });
        } catch (err) {
          prefixDropdownList.innerHTML = `<div style="padding: 8px; font-size: 12px; color: #EF4444;">Ошибка: ${err.message}</div>`;
        }
      }
    };

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!btnQuickPrefix.contains(e.target) && !prefixDropdown.contains(e.target)) {
        prefixDropdown.style.display = 'none';
      }
    });
  }

  // Profile Avatar Upload Handlers (in MemberProfile)
  const btnChangeAvatar = document.getElementById('btn-change-avatar-profile');
  const btnUploadFile = document.getElementById('btn-profile-upload-file');
  const fileInput = document.getElementById('profile-page-file-input');
  const btnSaveUrl = document.getElementById('btn-profile-save-url');
  const urlInput = document.getElementById('profile-page-avatar-url');

  if (btnChangeAvatar && fileInput) btnChangeAvatar.onclick = () => fileInput.click();
  if (btnUploadFile && fileInput) btnUploadFile.onclick = () => fileInput.click();

  if (fileInput) {
    fileInput.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('avatarFile', file);

      try {
        showToast('Загрузка аватара...');
        const res = await api.auth.updateAvatar(formData);
        if (state.user) state.user.avatar = res.avatar;
        showToast(res.message || 'Аватар успешно обновлён!');
        playSound('success');
        notifyStateChange();
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка обновления аватара');
      }
    };
  }

  if (btnSaveUrl && urlInput) {
    btnSaveUrl.onclick = async () => {
      const url = urlInput.value.trim();
      if (!url) return alert('Введите ссылку на изображение');
      try {
        const res = await api.auth.updateAvatar(url);
        if (state.user) state.user.avatar = res.avatar;
        showToast('Аватар успешно обновлён!');
        playSound('success');
        notifyStateChange();
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка обновления аватара');
      }
    };
  }

  // Profile Cover Banner Upload Handlers (in MemberProfile)
  const btnChangeCover = document.getElementById('btn-change-cover-profile');
  const btnUploadCoverFile = document.getElementById('btn-profile-upload-cover-file');
  const coverFileInput = document.getElementById('profile-page-cover-file-input');
  const btnSaveCoverUrl = document.getElementById('btn-profile-save-cover-url');
  const coverUrlInput = document.getElementById('profile-page-cover-url');

  if (btnChangeCover && coverFileInput) btnChangeCover.onclick = () => coverFileInput.click();
  if (btnUploadCoverFile && coverFileInput) btnUploadCoverFile.onclick = () => coverFileInput.click();

  if (coverFileInput) {
    coverFileInput.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('coverFile', file);

      try {
        showToast('Загрузка обложки профиля...');
        const res = await api.auth.updateCover(formData);
        if (state.user) state.user.cover_banner = res.cover_banner;
        showToast(res.message || 'Обложка успешно обновлена!');
        playSound('success');
        notifyStateChange();
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка обновления обложки');
      }
    };
  }

  if (btnSaveCoverUrl && coverUrlInput) {
    btnSaveCoverUrl.onclick = async () => {
      const url = coverUrlInput.value.trim();
      if (!url) return alert('Введите ссылку на обложку');
      try {
        const res = await api.auth.updateCover(url);
        if (state.user) state.user.cover_banner = res.cover_banner;
        showToast('Обложка успешно обновлена!');
        playSound('success');
        notifyStateChange();
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка обновления обложки');
      }
    };
  }

  // Start PM with User Buttons (from MemberProfile or Thread Sidebar)
  document.querySelectorAll('.btn-start-pm-with-user').forEach(btn => {
    btn.onclick = () => {
      if (!state.user) {
        showToast('Для отправки сообщений необходимо войти в аккаунт');
        openModal('auth');
        return;
      }
      const recipientId = btn.getAttribute('data-user-id');
      const recipientName = btn.getAttribute('data-username');
      openModal('startConversation', { recipientId, recipientName });
    };
  });

  // Start New Dialog Buttons in /forum/messages
  const btnNewDialog = document.getElementById('btn-start-new-dialog');
  const btnEmptyDialog = document.getElementById('btn-empty-start-dialog');
  const btnChatEmptyStart = document.getElementById('btn-chat-empty-start');

  if (btnNewDialog) btnNewDialog.onclick = () => openModal('startConversation');
  if (btnEmptyDialog) btnEmptyDialog.onclick = () => openModal('startConversation');
  if (btnChatEmptyStart) btnChatEmptyStart.onclick = () => openModal('startConversation');

  // Chat Message Send in /forum/messages
  const btnChatSend = document.getElementById('btn-chat-send');
  const chatInput = document.getElementById('chat-message-input');

  const handleSendMessage = async () => {
    if (!btnChatSend || !chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;

    const convId = btnChatSend.getAttribute('data-conv-id');
    const recipientId = btnChatSend.getAttribute('data-recipient-id');

    try {
      btnChatSend.disabled = true;
      await api.messages.send({
        conversation_id: convId,
        recipient_id: recipientId,
        text
      });
      chatInput.value = '';
      playSound('success');
      router.resolve(); // Re-fetch conversation messages
    } catch (err) {
      alert(err.message || 'Ошибка отправки сообщения');
      btnChatSend.disabled = false;
    }
  };

  if (btnChatSend) btnChatSend.onclick = handleSendMessage;
  if (chatInput) {
    chatInput.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };
  }

  // Settings: Update Profile & Change Password
  const formUpdateProfile = document.getElementById('form-update-profile');
  if (formUpdateProfile) {
    formUpdateProfile.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await api.auth.updateProfile({
          character_name: document.getElementById('set-char-name')?.value,
          fraction: document.getElementById('set-fraction')?.value,
          bio: document.getElementById('set-bio')?.value,
          signature: document.getElementById('set-signature')?.value,
          discord_tag: document.getElementById('set-discord')?.value,
          telegram_tag: document.getElementById('set-telegram')?.value,
          vk_link: document.getElementById('set-vk')?.value
        });
        state.user = { ...state.user, ...res.user };
        showToast('Профиль успешно обновлён!');
        playSound('success');
        notifyStateChange();
      } catch (err) {
        alert(err.message);
      }
    };
  }

  const formChangePassword = document.getElementById('form-change-password');
  if (formChangePassword) {
    formChangePassword.onsubmit = async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('pwd-old')?.value;
      const newPassword = document.getElementById('pwd-new')?.value;
      const confirmPwd = document.getElementById('pwd-confirm')?.value;

      if (newPassword !== confirmPwd) {
        alert('Новые пароли не совпадают.');
        return;
      }

      try {
        const res = await api.auth.changePassword(oldPassword, newPassword);
        showToast(res.message);
        playSound('success');
        formChangePassword.reset();
      } catch (err) {
        alert(err.message);
      }
    };
  }

  // Settings: Avatar Decoration Selection & Saving
  let settingsSelectedDecUrl = state.user?.avatar_decoration || '';
  const settingsPreviewDecImg = document.getElementById('settings-preview-dec-img');
  const settingsPreviewDecName = document.getElementById('settings-preview-dec-name');
  const btnSaveSettingsDec = document.getElementById('btn-save-settings-decoration');
  const btnRemoveSettingsDec = document.getElementById('btn-remove-settings-decoration');

  document.querySelectorAll('.settings-dec-card').forEach(card => {
    card.onclick = () => {
      document.querySelectorAll('.settings-dec-card').forEach(c => {
        c.classList.remove('selected');
        c.style.borderColor = 'rgba(255,255,255,0.08)';
      });
      card.classList.add('selected');
      card.style.borderColor = '#FF1F36';
      settingsSelectedDecUrl = card.getAttribute('data-url') || '';
      const dName = card.getAttribute('data-name') || '';

      if (settingsPreviewDecImg) {
        settingsPreviewDecImg.src = settingsSelectedDecUrl;
        settingsPreviewDecImg.style.display = 'block';
      }
      if (settingsPreviewDecName) {
        settingsPreviewDecName.textContent = dName;
      }
    };
  });

  document.querySelectorAll('.btn-settings-dec-cat').forEach(pill => {
    pill.onclick = () => {
      document.querySelectorAll('.btn-settings-dec-cat').forEach(p => {
        p.classList.remove('active');
        p.style.background = '';
        p.style.borderColor = '';
        p.style.color = '';
      });
      pill.classList.add('active');
      pill.style.background = '#FF1F36';
      pill.style.borderColor = '#FF1F36';
      pill.style.color = '#FFF';

      const catId = pill.getAttribute('data-cat-id');
      document.querySelectorAll('.settings-dec-card').forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (catId === 'all') {
          card.style.display = '';
        } else {
          const matchCat = (catId === 'flame' && cardCat === 'Неон и пламя') ||
                           (catId === 'mystic' && cardCat === 'Мистика и тьма') ||
                           (catId === 'cyber' && cardCat === 'Космос и киберпанк') ||
                           (catId === 'nature' && cardCat === 'Природа и магия') ||
                           (catId === 'anime' && cardCat === 'Аниме и ретро');
          card.style.display = matchCat ? '' : 'none';
        }
      });
    };
  });

  if (btnSaveSettingsDec) {
    btnSaveSettingsDec.onclick = async () => {
      if (!settingsSelectedDecUrl) {
        showToast('Выберите украшение из каталога');
        return;
      }
      btnSaveSettingsDec.disabled = true;
      btnSaveSettingsDec.textContent = 'Сохранение...';
      try {
        const res = await api.auth.updateDecoration(settingsSelectedDecUrl);
        showToast(res.message || 'Украшение успешно установлено!');
        playSound('success');
        if (state.user) {
          state.user.avatar_decoration = settingsSelectedDecUrl;
          authStorage.saveUser(state.user);
          notifyStateChange();
        }
      } catch (err) {
        alert(err.message || 'Ошибка установки украшения');
      } finally {
        btnSaveSettingsDec.disabled = false;
        btnSaveSettingsDec.innerHTML = `${ICONS.check} <span>Применить украшение</span>`;
      }
    };
  }

  if (btnRemoveSettingsDec) {
    btnRemoveSettingsDec.onclick = async () => {
      if (!confirm('Снять текущее украшение аватарки?')) return;
      btnRemoveSettingsDec.disabled = true;
      try {
        const res = await api.auth.updateDecoration(null);
        showToast(res.message || 'Украшение снято.');
        playSound('click');
        settingsSelectedDecUrl = '';
        if (settingsPreviewDecImg) settingsPreviewDecImg.style.display = 'none';
        if (settingsPreviewDecName) settingsPreviewDecName.textContent = 'Без украшения';
        document.querySelectorAll('.settings-dec-card').forEach(c => {
          c.classList.remove('selected');
          c.style.borderColor = 'rgba(255,255,255,0.08)';
        });
        if (state.user) {
          state.user.avatar_decoration = null;
          authStorage.saveUser(state.user);
          notifyStateChange();
        }
      } catch (err) {
        alert(err.message || 'Ошибка снятия украшения');
      } finally {
        btnRemoveSettingsDec.disabled = false;
      }
    };
  }

  // Notifications: Read All & Mark One
  const btnNotifsReadAll = document.getElementById('btn-notifs-read-all');
  if (btnNotifsReadAll) {
    btnNotifsReadAll.onclick = async () => {
      await api.notifications.markAllRead();
      state.unreadNotifications = 0;
      notifyStateChange();
      router.resolve();
    };
  }

  document.querySelectorAll('.btn-mark-read[data-id]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      await api.notifications.markRead(id);
      state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
      notifyStateChange();
      router.resolve();
    };
  });

  // Advanced Search Form Submit
  const formSearchAdvanced = document.getElementById('form-search-advanced');
  if (formSearchAdvanced) {
    formSearchAdvanced.onsubmit = (e) => {
      e.preventDefault();
      const q = document.getElementById('search-q')?.value || '';
      const author = document.getElementById('search-author')?.value || '';
      const category = document.getElementById('search-category')?.value || '';
      const sort = document.getElementById('search-sort')?.value || 'date';
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (author) params.set('author', author);
      if (category) params.set('category', category);
      if (sort) params.set('sort', sort);
      router.navigate(`/forum/search?${params.toString()}`);
    };
  }

  // Members Search Input
  const membersSearchInput = document.getElementById('members-search-input');
  if (membersSearchInput) {
    membersSearchInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const s = membersSearchInput.value.trim();
        router.navigate(`/forum/members?search=${encodeURIComponent(s)}`);
      }
    };
  }

  // Admin Actions (Resolve Report, Delete Category, Change Role, Ban/Unban, Warn)
  document.querySelectorAll('[data-action="resolve-report"], [data-action="dismiss-report"]').forEach(btn => {
    btn.onclick = async () => {
      const repId = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      const card = document.getElementById(`report-${repId}`);
      const notes = card?.querySelector('.report-notes-input')?.value || '';
      const status = action === 'resolve-report' ? 'resolved' : 'dismissed';

      try {
        await api.reports.resolve(repId, { status, resolution_notes: notes });
        showToast(`Жалоба ${status === 'resolved' ? 'рассмотрена' : 'отклонена'}.`);
        router.resolve();
      } catch (err) { alert(err.message); }
    };
  });

  const btnToggleAddCat = document.getElementById('btn-toggle-add-category');
  const addCatBox = document.getElementById('add-category-box');
  if (btnToggleAddCat && addCatBox) {
    btnToggleAddCat.onclick = () => {
      addCatBox.style.display = addCatBox.style.display === 'none' ? 'block' : 'none';
    };
  }

  const btnSubmitNewCat = document.getElementById('btn-submit-new-category');
  if (btnSubmitNewCat) {
    btnSubmitNewCat.onclick = async () => {
      const title = document.getElementById('new-cat-title')?.value;
      const slug = document.getElementById('new-cat-slug')?.value;
      const description = document.getElementById('new-cat-desc')?.value;
      const icon = document.getElementById('new-cat-icon')?.value;
      const min_role_to_post = document.getElementById('new-cat-role')?.value;

      try {
        await api.admin.createCategory({ title, slug, description, icon, min_role_to_post });
        showToast('Раздел создан!');
        const res = await api.categories.getAll();
        state.categories = res.categories || [];
        router.resolve();
      } catch (err) { alert(err.message); }
    };
  }

  document.querySelectorAll('[data-action="delete-category"]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Удалить этот раздел форума?')) return;
      const id = btn.getAttribute('data-id');
      try {
        await api.admin.deleteCategory(id);
        showToast('Раздел удалён.');
        const res = await api.categories.getAll();
        state.categories = res.categories || [];
        router.resolve();
      } catch (err) { alert(err.message); }
    };
  });

  document.querySelectorAll('.change-role-select').forEach(sel => {
    sel.onchange = async () => {
      const uid = sel.getAttribute('data-user-id');
      const newRole = sel.value;
      try {
        const res = await api.admin.changeUserRole(uid, newRole);
        showToast(res.message);

        // Update live badge in user row
        const badgeCell = document.getElementById(`badge-preview-${uid}`);
        if (badgeCell) {
          badgeCell.innerHTML = renderRoleBadge(newRole, { size: 'compact' });
        }

        // If updating currently logged in user, sync state
        if (state.user && state.user.id === uid) {
          state.user.role = newRole;
          if (res.user) {
            state.user.role_badge = res.user.role_badge;
            state.user.role_color = res.user.role_color;
          }
        }
      } catch (err) {
        alert(err.message || 'Ошибка изменения роли');
      }
    };
  });

  // ==============================================================
  // USER SEARCH, FILTER & PAGINATION EVENTS
  // ==============================================================
  const adminUserSearchInput = document.getElementById('admin-user-search-input');
  const adminUserRoleFilter = document.getElementById('admin-user-role-filter');
  const btnAdminSearchUsers = document.getElementById('btn-admin-search-users');
  const btnAdminResetUsers = document.getElementById('btn-admin-reset-users-filter');

  function triggerAdminUserSearch() {
    const s = (adminUserSearchInput?.value || '').trim();
    const r = adminUserRoleFilter?.value || 'all';
    const params = new URLSearchParams();
    params.set('tab', 'users');
    if (s) params.set('search', s);
    if (r && r !== 'all') params.set('role', r);
    params.set('page', '1');
    router.navigate('/admin?' + params.toString());
  }

  if (btnAdminSearchUsers) {
    btnAdminSearchUsers.onclick = triggerAdminUserSearch;
  }
  if (adminUserSearchInput) {
    adminUserSearchInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerAdminUserSearch();
      }
    };
  }
  if (adminUserRoleFilter) {
    adminUserRoleFilter.onchange = triggerAdminUserSearch;
  }
  if (btnAdminResetUsers) {
    btnAdminResetUsers.onclick = () => {
      router.navigate('/admin?tab=users');
    };
  }

  document.querySelectorAll('.btn-admin-page-nav').forEach(btn => {
    btn.onclick = () => {
      const p = btn.getAttribute('data-page');
      if (!p) return;
      const s = (adminUserSearchInput?.value || '').trim();
      const r = adminUserRoleFilter?.value || 'all';
      const params = new URLSearchParams();
      params.set('tab', 'users');
      if (s) params.set('search', s);
      if (r && r !== 'all') params.set('role', r);
      params.set('page', p);
      router.navigate('/admin?' + params.toString());
    };
  });

  // Quick reason presets
  document.querySelectorAll('.btn-quick-reason').forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        targetInput.value = btn.innerText.trim();
        targetInput.focus();
      }
    };
  });

  // ==============================================================
  // TIMED BAN & UNBAN MODAL EVENTS
  // ==============================================================
  let activeBanUserId = null;
  const modalBan = document.getElementById('modal-ban-user');
  const banModalUsername = document.getElementById('ban-modal-username');
  const banModalDuration = document.getElementById('ban-modal-duration');
  const banModalReason = document.getElementById('ban-modal-reason');
  const btnConfirmBan = document.getElementById('btn-confirm-ban');

  document.querySelectorAll('[data-action="open-ban-modal"]').forEach(btn => {
    btn.onclick = () => {
      activeBanUserId = btn.getAttribute('data-user-id');
      const uname = btn.getAttribute('data-username');
      if (banModalUsername) banModalUsername.textContent = uname;
      if (modalBan) modalBan.style.display = 'flex';
    };
  });

  document.querySelectorAll('[data-action="close-ban-modal"]').forEach(btn => {
    btn.onclick = () => {
      if (modalBan) modalBan.style.display = 'none';
      activeBanUserId = null;
    };
  });

  if (btnConfirmBan) {
    btnConfirmBan.onclick = async () => {
      if (!activeBanUserId) return;
      const duration = banModalDuration ? banModalDuration.value : '7d';
      const ban_reason = (banModalReason ? banModalReason.value : '').trim() || 'Нарушение правил сервера';
      btnConfirmBan.disabled = true;
      btnConfirmBan.textContent = 'Блокировка...';
      try {
        const res = await api.admin.banUser(activeBanUserId, { is_banned: true, duration, ban_reason });
        showToast(res.message || 'Пользователь успешно заблокирован.');
        if (modalBan) modalBan.style.display = 'none';
        activeBanUserId = null;
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка блокировки пользователя');
      } finally {
        btnConfirmBan.disabled = false;
        btnConfirmBan.textContent = 'Подтвердить бан';
      }
    };
  }

  // Direct unban
  document.querySelectorAll('[data-action="unban-user"]').forEach(btn => {
    btn.onclick = async () => {
      const uid = btn.getAttribute('data-user-id');
      const uname = btn.getAttribute('data-username');
      if (!confirm(`Разблокировать пользователя «${uname}»?`)) return;
      try {
        const res = await api.admin.banUser(uid, { is_banned: false });
        showToast(res.message || 'Пользователь успешно разблокирован.');
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка разблокировки');
      }
    };
  });

  // ==============================================================
  // WARN SYSTEM (ISSUING, LISTING, REVOKING)
  // ==============================================================
  let activeWarnUserId = null;
  const modalWarn = document.getElementById('modal-warn-user');
  const warnModalUsername = document.getElementById('warn-modal-username');
  const warnModalCount = document.getElementById('warn-modal-count');
  const warnModalHistory = document.getElementById('warn-modal-history');
  const warnModalReason = document.getElementById('warn-modal-reason');
  const btnConfirmWarn = document.getElementById('btn-confirm-warn');

  async function loadUserWarnings(userId) {
    if (!warnModalHistory) return;
    warnModalHistory.innerHTML = '<div style="font-size: 12px; color: #8A96A6; text-align: center; padding: 10px;">Загрузка истории варнов...</div>';
    try {
      const res = await api.admin.getUserWarnings(userId);
      const warnings = res.warnings || [];
      if (warnModalCount) warnModalCount.textContent = `${warnings.length}/3`;
      if (warnings.length === 0) {
        warnModalHistory.innerHTML = '<div style="font-size: 12px; color: #10B981; text-align: center; padding: 10px;">У пользователя нет активных предупреждений</div>';
        return;
      }
      const safeText = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      warnModalHistory.innerHTML = warnings.map(w => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-bottom: 1px solid #1E2330; font-size: 11.5px; gap: 8px;">
          <div>
            <div style="color: #FFF; font-weight: 600;">${safeText(w.reason)}</div>
            <div style="color: #64748B; font-size: 10.5px;">Выдал: ${safeText(w.issuer_name || 'Модератор')} • ${new Date(w.created_at).toLocaleDateString('ru-RU')}</div>
          </div>
          <button type="button" class="btn-secondary btn-revoke-warn" data-warn-id="${w.id}" data-user-id="${userId}" style="padding: 2px 7px; font-size: 10.5px; border-color: rgba(239, 68, 68, 0.4); color: #EF4444; white-space: nowrap;">
            Снять
          </button>
        </div>
      `).join('');

      warnModalHistory.querySelectorAll('.btn-revoke-warn').forEach(revokeBtn => {
        revokeBtn.onclick = async () => {
          const warnId = revokeBtn.getAttribute('data-warn-id');
          if (!confirm('Снять это предупреждение?')) return;
          try {
            const rRes = await api.admin.removeUserWarning(userId, warnId);
            showToast(rRes.message || 'Предупреждение снято');
            loadUserWarnings(userId);
            router.resolve();
          } catch (err) {
            alert(err.message || 'Ошибка при снятии варна');
          }
        };
      });
    } catch (e) {
      warnModalHistory.innerHTML = '<div style="font-size: 12px; color: #EF4444; text-align: center; padding: 10px;">Ошибка загрузки варнов</div>';
    }
  }

  document.querySelectorAll('[data-action="open-warn-modal"]').forEach(btn => {
    btn.onclick = () => {
      activeWarnUserId = btn.getAttribute('data-user-id');
      const uname = btn.getAttribute('data-username');
      const warns = btn.getAttribute('data-warns') || '0';
      if (warnModalUsername) warnModalUsername.textContent = uname;
      if (warnModalCount) warnModalCount.textContent = `${warns}/3`;
      if (modalWarn) modalWarn.style.display = 'flex';
      loadUserWarnings(activeWarnUserId);
    };
  });

  document.querySelectorAll('[data-action="close-warn-modal"]').forEach(btn => {
    btn.onclick = () => {
      if (modalWarn) modalWarn.style.display = 'none';
      activeWarnUserId = null;
    };
  });

  if (btnConfirmWarn) {
    btnConfirmWarn.onclick = async () => {
      if (!activeWarnUserId) return;
      const reason = (warnModalReason ? warnModalReason.value : '').trim() || 'Нарушение регламента';
      btnConfirmWarn.disabled = true;
      btnConfirmWarn.textContent = 'Выдача...';
      try {
        const res = await api.admin.warnUser(activeWarnUserId, { reason, points: 1 });
        showToast(res.message || 'Предупреждение выдано!');
        if (res.auto_banned) {
          alert(`⚡ Пользователь набрал 3 варна и был автоматически заблокирован на 7 дней!`);
        }
        loadUserWarnings(activeWarnUserId);
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка выдачи варна');
      } finally {
        btnConfirmWarn.disabled = false;
        btnConfirmWarn.textContent = 'Выдать варн (+1)';
      }
    };
  }

  // ==============================================================
  // ACCOUNT DELETION
  // ==============================================================
  document.querySelectorAll('[data-action="delete-user"]').forEach(btn => {
    btn.onclick = async () => {
      const uid = btn.getAttribute('data-user-id');
      const uname = btn.getAttribute('data-username');
      if (!confirm(`⚠️ ВЫ ДЕЙСТВИТЕЛЬНО ХОТИТЕ БЕЗВОЗВРАТНО УДАЛИТЬ АККАУНТ «${uname}»?\n\nВсе созданные им темы и сообщения будут отвязаны. Это действие необратимо!`)) {
        return;
      }
      try {
        const res = await api.admin.deleteUser(uid);
        showToast(res.message || 'Аккаунт успешно удалён');
        const row = document.getElementById(`user-row-${uid}`);
        if (row) row.remove();
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка при удалении аккаунта');
      }
    };
  });

  // ==============================================================
  // CUSTOM BADGES CREATOR & MULTI-BADGES ASSIGNMENT EVENTS
  // ==============================================================

  // Form: Create Custom Badge
  const formCustomBadge = document.getElementById('form-create-custom-badge');
  if (formCustomBadge) {
    formCustomBadge.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('custom-badge-title-input')?.value.trim();
      const subtitle = document.getElementById('custom-badge-subtitle-input')?.value.trim();
      const key = document.getElementById('custom-badge-key-input')?.value.trim();
      const level = parseInt(document.getElementById('custom-badge-level-input')?.value) || 1;
      const color = document.getElementById('custom-badge-color-input')?.value.trim() || '#FF1F36';
      const icon = document.getElementById('custom-badge-icon-input')?.value || 'crown';
      const style = document.querySelector('input[name="custom-badge-style"]:checked')?.value || 'classic';

      try {
        const res = await api.admin.createCustomBadge({ title, subtitle, key, level, color, icon, style });
        showToast(res.message);
        if (res.badge) {
          registerCustomBadges([res.badge]);
        }
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка создания плашки');
      }
    };
  }

  // Color picker & presets
  const colorPicker = document.getElementById('custom-badge-color-picker');
  const colorInput = document.getElementById('custom-badge-color-input');
  const titleInput = document.getElementById('custom-badge-title-input');
  const subtitleInput = document.getElementById('custom-badge-subtitle-input');
  const keyInput = document.getElementById('custom-badge-key-input');

  function updateLiveCustomBadge() {
    const title = titleInput ? (titleInput.value.trim() || 'ШЕФ LSPD') : 'ШЕФ LSPD';
    const subtitle = subtitleInput ? (subtitleInput.value.trim() || 'Полицейский департамент') : 'Полицейский департамент';
    const color = colorInput ? (colorInput.value.trim() || '#0091FF') : '#0091FF';
    const icon = document.getElementById('custom-badge-icon-input')?.value || 'shield';
    const style = document.querySelector('input[name="custom-badge-style"]:checked')?.value || 'classic';
    const previewNormal = document.getElementById('live-badge-preview-normal');
    const previewSidebar = document.getElementById('live-badge-preview-sidebar');
    const badgeObj = {
      key: 'preview',
      title: title.toUpperCase(),
      subtitle,
      color,
      glow: `rgba(0, 145, 255, 0.40)`,
      icon,
      style
    };
    if (previewNormal) previewNormal.innerHTML = renderRoleBadge(badgeObj, { size: 'normal' });
    if (previewSidebar) previewSidebar.innerHTML = renderRoleBadge(badgeObj, { size: 'sidebar' });
  }

  document.querySelectorAll('input[name="custom-badge-style"]').forEach(r => {
    r.onchange = () => updateLiveCustomBadge();
  });

  if (colorPicker && colorInput) {
    colorPicker.oninput = () => {
      colorInput.value = colorPicker.value;
      updateLiveCustomBadge();
    };
    colorInput.oninput = () => {
      if (colorInput.value.startsWith('#') && (colorInput.value.length === 4 || colorInput.value.length === 7)) {
        colorPicker.value = colorInput.value;
      }
      updateLiveCustomBadge();
    };
  }

  document.querySelectorAll('.color-pill').forEach(pill => {
    pill.onclick = () => {
      document.querySelectorAll('.color-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const c = pill.getAttribute('data-color');
      if (colorPicker) colorPicker.value = c;
      if (colorInput) colorInput.value = c;
      updateLiveCustomBadge();
    };
  });

  document.querySelectorAll('.icon-picker-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.icon-picker-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const icon = btn.getAttribute('data-icon');
      const hidden = document.getElementById('custom-badge-icon-input');
      if (hidden) hidden.value = icon;
      updateLiveCustomBadge();
    };
  });

  if (titleInput) {
    titleInput.oninput = () => {
      if (keyInput && !keyInput.dataset.manual) {
        const ru = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
        keyInput.value = titleInput.value.toLowerCase().split('').map(c => ru[c] || c).join('').replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      }
      updateLiveCustomBadge();
    };
  }
  if (keyInput) {
    keyInput.onkeydown = () => { keyInput.dataset.manual = 'true'; };
  }
  if (subtitleInput) {
    subtitleInput.oninput = () => updateLiveCustomBadge();
  }

  // Delete Custom Badge
  document.querySelectorAll('[data-action="delete-custom-badge"]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title') || 'эту плашку';
      if (!confirm(`Вы действительно хотите удалить кастомную плашку «${title}»?`)) return;
      try {
        const res = await api.admin.deleteCustomBadge(id);
        showToast(res.message);
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка удаления плашки');
      }
    };
  });

  // Assign user badge dropdown toggle
  document.querySelectorAll('[data-action="toggle-add-badge-menu"]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const uid = btn.getAttribute('data-user-id');
      const menu = document.getElementById(`assign-menu-${uid}`);
      document.querySelectorAll('.assign-badge-menu').forEach(m => {
        if (m !== menu) m.style.display = 'none';
      });
      if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      }
    };
  });

  // Close menus on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.assign-badge-menu').forEach(m => m.style.display = 'none');
  });

  // Click assign badge item
  document.querySelectorAll('[data-action="assign-badge"]').forEach(item => {
    item.onclick = async (e) => {
      e.stopPropagation();
      const uid = item.getAttribute('data-user-id');
      const badgeKey = item.getAttribute('data-badge-key');
      try {
        const res = await api.admin.assignUserBadge(uid, badgeKey);
        showToast(res.message);
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка выдачи плашки');
      }
    };
  });

  // Remove badge from user
  document.querySelectorAll('[data-action="remove-user-badge"]').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const uid = btn.getAttribute('data-user-id');
      const badgeKey = btn.getAttribute('data-badge-key');
      try {
        const res = await api.admin.removeUserBadge(uid, badgeKey);
        showToast(res.message);
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка снятия плашки');
      }
    };
  });

  // -------------------------------------------------------------
  // Avatar Decorations Management (Restricted to Ivan_Petrov)
  // -------------------------------------------------------------
  const assignUserSelect = document.getElementById('assign-user-select');
  const assignDecorationSelect = document.getElementById('assign-decoration-select');
  const btnSubmitAssignDecoration = document.getElementById('btn-submit-assign-decoration');
  const btnSubmitRemoveDecoration = document.getElementById('btn-submit-remove-decoration');

  function updateLiveDecorationPreview() {
    if (!assignUserSelect || !assignDecorationSelect) return;
    const selectedUserOpt = assignUserSelect.selectedOptions?.[0];
    const selectedDecOpt = assignDecorationSelect.selectedOptions?.[0];

    const liveAvatarImg = document.getElementById('assign-live-avatar-img');
    const liveDecImg = document.getElementById('assign-live-decoration-img');
    const liveUsername = document.getElementById('assign-preview-username');
    const liveDecName = document.getElementById('assign-preview-decname');

    if (selectedUserOpt) {
      const avatarUrl = selectedUserOpt.getAttribute('data-avatar') || '/assets/avatar_ivan.jpg';
      const uname = selectedUserOpt.getAttribute('data-username') || 'Пользователь';
      if (liveAvatarImg) liveAvatarImg.src = avatarUrl;
      if (liveUsername) liveUsername.textContent = uname;
    }

    if (selectedDecOpt) {
      const decUrl = selectedDecOpt.getAttribute('data-url') || selectedDecOpt.value;
      const dname = selectedDecOpt.getAttribute('data-name') || 'Украшение';
      if (liveDecImg) {
        liveDecImg.src = decUrl;
        liveDecImg.style.display = 'block';
      }
      if (liveDecName) liveDecName.textContent = dname;
    }
  }

  if (assignUserSelect && assignDecorationSelect) {
    // Check if URL specified assign_user
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('assign_user');
    if (targetUserId) {
      assignUserSelect.value = targetUserId;
    }

    assignUserSelect.onchange = updateLiveDecorationPreview;
    assignDecorationSelect.onchange = updateLiveDecorationPreview;
    updateLiveDecorationPreview();

    if (btnSubmitAssignDecoration) {
      btnSubmitAssignDecoration.onclick = async () => {
        const userId = assignUserSelect.value;
        const selectedDecOpt = assignDecorationSelect.selectedOptions?.[0];
        const decorationUrl = selectedDecOpt?.getAttribute('data-url') || selectedDecOpt?.value;

        if (!userId) {
          showToast('Выберите пользователя для выдачи украшения');
          return;
        }
        if (!decorationUrl) {
          showToast('Выберите украшение из каталога');
          return;
        }

        const originalBtnHtml = btnSubmitAssignDecoration.innerHTML;
        btnSubmitAssignDecoration.disabled = true;
        btnSubmitAssignDecoration.innerText = 'Сохранение...';

        try {
          const res = await api.admin.assignUserDecoration(userId, {
            decoration_url: decorationUrl,
            decoration_id: selectedDecOpt?.value
          });
          showToast(res.message || 'Украшение успешно выдано!');
          playSound('success');

          if (state.user && state.user.id === userId) {
            state.user.avatar_decoration = decorationUrl;
            notifyStateChange();
          }

          router.resolve();
        } catch (err) {
          alert(err.message || 'Ошибка выдачи украшения');
          btnSubmitAssignDecoration.disabled = false;
          btnSubmitAssignDecoration.innerHTML = originalBtnHtml;
        }
      };
    }

    if (btnSubmitRemoveDecoration) {
      btnSubmitRemoveDecoration.onclick = async () => {
        const userId = assignUserSelect.value;
        const selectedUserOpt = assignUserSelect.selectedOptions?.[0];
        const uname = selectedUserOpt?.getAttribute('data-username') || 'пользователя';

        if (!userId) {
          showToast('Выберите пользователя');
          return;
        }

        if (!confirm(`Вы действительно хотите снять украшение с профиля «${uname}»?`)) return;

        try {
          const res = await api.admin.removeUserDecoration(userId);
          showToast(res.message || 'Украшение успешно снято');
          playSound('click');

          if (state.user && state.user.id === userId) {
            state.user.avatar_decoration = null;
            notifyStateChange();
          }

          router.resolve();
        } catch (err) {
          alert(err.message || 'Ошибка при снятии украшения');
        }
      };
    }
  }

  // Quick Edit / Remove wearer in decorations table
  document.querySelectorAll('[data-action="quick-edit-wearer"]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const uid = btn.getAttribute('data-user-id');
      const decUrl = btn.getAttribute('data-dec-url');
      if (assignUserSelect) {
        assignUserSelect.value = uid;
      }
      if (assignDecorationSelect && decUrl) {
        const matchOpt = Array.from(assignDecorationSelect.options).find(o => o.getAttribute('data-url') === decUrl || o.value === decUrl);
        if (matchOpt) assignDecorationSelect.value = matchOpt.value;
      }
      const assignCard = document.getElementById('decorations-assign-card');
      if (assignCard) {
        assignCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        assignCard.style.boxShadow = '0 0 25px rgba(255, 138, 0, 0.4)';
        setTimeout(() => { if (assignCard) assignCard.style.boxShadow = ''; }, 1500);
      }
      updateLiveDecorationPreview();
    };
  });

  document.querySelectorAll('[data-action="quick-del-wearer"]').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const uid = btn.getAttribute('data-user-id');
      const uname = btn.getAttribute('data-username') || 'пользователя';
      if (!confirm(`Снять украшение с аккаунта ${uname}?`)) return;

      try {
        const res = await api.admin.removeUserDecoration(uid);
        showToast(res.message || 'Украшение снято');
        if (state.user && state.user.id === uid) {
          state.user.avatar_decoration = null;
          notifyStateChange();
        }
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка снятия украшения');
      }
    };
  });

  // -------------------------------------------------------------
  // Nicknames & Custom Styles Management (Exclusive to KENZO)
  // -------------------------------------------------------------
  const nickUserSelect = document.getElementById('nick-user-select');
  const nickUsernameInput = document.getElementById('nick-username-input');
  const btnSubmitSaveNick = document.getElementById('btn-submit-save-nick');
  const btnResetNickStyle = document.getElementById('btn-reset-nick-style');

  let currentSelectedStyle = 'default';
  let currentSelectedEffect = '';

  function updateLiveNickPreview() {
    if (!nickUserSelect) return;
    const selectedUserOpt = nickUserSelect.selectedOptions?.[0];
    const username = (nickUsernameInput?.value || '').trim() || selectedUserOpt?.getAttribute('data-username') || 'Игрок';
    const avatar = selectedUserOpt?.getAttribute('data-avatar') || '/assets/avatar_ivan.jpg';
    const badge = selectedUserOpt?.getAttribute('data-badge') || 'Игрок';

    const av1 = document.getElementById('nick-preview-avatar-1');
    const av2 = document.getElementById('nick-preview-avatar-2');
    const av3 = document.getElementById('nick-preview-avatar-3');
    if (av1) av1.src = avatar;
    if (av2) av2.src = avatar;
    if (av3) av3.src = avatar;

    const b1 = document.getElementById('nick-preview-badge-1');
    const b3 = document.getElementById('nick-preview-badge-3');
    if (b1) b1.textContent = badge;
    if (b3) b3.textContent = badge;

    const n1 = document.getElementById('nick-preview-name-1');
    const n2 = document.getElementById('nick-preview-name-2');
    const n3 = document.getElementById('nick-preview-name-3');
    const styledHtml = renderStyledUsername(username, currentSelectedStyle);
    if (n1) n1.innerHTML = styledHtml;
    if (n2) n2.innerHTML = styledHtml;
    if (n3) n3.innerHTML = styledHtml;

    const effectWrap = document.getElementById('nick-preview-effect-wrap');
    const effectImg = document.getElementById('nick-preview-effect-img');
    if (effectWrap && effectImg) {
      if (currentSelectedEffect) {
        effectImg.src = currentSelectedEffect;
        effectWrap.style.display = 'block';
      } else {
        effectWrap.style.display = 'none';
      }
    }
  }

  if (nickUserSelect && nickUsernameInput) {
    const initialOpt = nickUserSelect.selectedOptions?.[0];
    if (initialOpt) {
      currentSelectedStyle = initialOpt.getAttribute('data-current-style') || 'default';
      currentSelectedEffect = initialOpt.getAttribute('data-current-effect') || '';
      nickUsernameInput.value = initialOpt.getAttribute('data-username') || '';
      document.querySelectorAll('.profile-effect-card').forEach(c => {
        c.classList.toggle('selected', (c.getAttribute('data-effect-url') || '') === currentSelectedEffect);
      });
    }

    nickUserSelect.onchange = () => {
      const opt = nickUserSelect.selectedOptions?.[0];
      if (opt) {
        nickUsernameInput.value = opt.getAttribute('data-username') || '';
        currentSelectedStyle = opt.getAttribute('data-current-style') || 'default';
        currentSelectedEffect = opt.getAttribute('data-current-effect') || '';
        document.querySelectorAll('.nick-style-card').forEach(c => {
          c.classList.toggle('selected', c.getAttribute('data-style-key') === currentSelectedStyle);
        });
        document.querySelectorAll('.profile-effect-card').forEach(c => {
          c.classList.toggle('selected', (c.getAttribute('data-effect-url') || '') === currentSelectedEffect);
        });
        updateLiveNickPreview();
      }
    };

    nickUsernameInput.oninput = () => {
      updateLiveNickPreview();
    };

    document.querySelectorAll('.nick-style-card').forEach(card => {
      card.onclick = () => {
        document.querySelectorAll('.nick-style-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        currentSelectedStyle = card.getAttribute('data-style-key') || 'default';
        updateLiveNickPreview();
      };
    });

    document.querySelectorAll('.profile-effect-card').forEach(card => {
      card.onclick = () => {
        document.querySelectorAll('.profile-effect-card').forEach(c => {
          c.classList.remove('selected');
        });
        card.classList.add('selected');
        currentSelectedEffect = card.getAttribute('data-effect-url') || '';
        updateLiveNickPreview();
      };
    });

    if (btnSubmitSaveNick) {
      btnSubmitSaveNick.onclick = async () => {
        const userId = nickUserSelect.value;
        const newNick = (nickUsernameInput.value || '').trim();

        if (!userId) {
          showToast('Выберите пользователя');
          return;
        }
        if (!newNick) {
          showToast('Введите никнейм');
          return;
        }

        const originalHtml = btnSubmitSaveNick.innerHTML;
        btnSubmitSaveNick.disabled = true;
        btnSubmitSaveNick.innerText = 'Сохранение...';

        try {
          const res = await api.admin.updateUserNickname(userId, {
            username: newNick,
            name_style: currentSelectedStyle,
            profile_effect: currentSelectedEffect
          });
          showToast(res.message || 'Никнейм, стиль и эффект успешно сохранены!');
          playSound('success');

          if (state.user && state.user.id === userId) {
            state.user.username = newNick;
            state.user.character_name = newNick;
            state.user.name_style = currentSelectedStyle;
            state.user.profile_effect = currentSelectedEffect;
            authStorage.saveUser(state.user);
            notifyStateChange();
          }

          router.resolve();
        } catch (err) {
          alert(err.message || 'Ошибка сохранения никнейма');
          btnSubmitSaveNick.disabled = false;
          btnSubmitSaveNick.innerHTML = originalHtml;
        }
      };
    }

    if (btnResetNickStyle) {
      btnResetNickStyle.onclick = async () => {
        const userId = nickUserSelect.value;
        const opt = nickUserSelect.selectedOptions?.[0];
        const uname = opt?.getAttribute('data-username') || 'пользователя';

        if (!userId) return;
        if (!confirm(`Сбросить спецстиль ника игрока «${uname}» на стандартный?`)) return;

        try {
          const res = await api.admin.resetUserNicknameStyle(userId);
          showToast(res.message || 'Стиль сброшен');
          playSound('click');

          if (state.user && state.user.id === userId) {
            state.user.name_style = 'default';
            authStorage.saveUser(state.user);
            notifyStateChange();
          }

          router.resolve();
        } catch (err) {
          alert(err.message || 'Ошибка сброса стиля');
        }
      };
    }
  }

  // Quick Edit user in styled users table
  document.querySelectorAll('.btn-quick-select-nick').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const uid = btn.getAttribute('data-user-id');
      const style = btn.getAttribute('data-style') || 'default';
      const username = btn.getAttribute('data-username') || '';

      if (nickUserSelect) {
        nickUserSelect.value = uid;
      }
      if (nickUsernameInput) {
        nickUsernameInput.value = username;
      }
      currentSelectedStyle = style;
      document.querySelectorAll('.nick-style-card').forEach(c => {
        c.classList.toggle('selected', c.getAttribute('data-style-key') === style);
      });
      updateLiveNickPreview();

      const formPanel = document.querySelector('.nick-form-panel');
      if (formPanel) {
        formPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        formPanel.style.boxShadow = '0 0 25px rgba(255, 56, 77, 0.4)';
        setTimeout(() => { if (formPanel) formPanel.style.boxShadow = ''; }, 1500);
      }
    };
  });

  // Quick Remove style in styled users table
  document.querySelectorAll('.btn-quick-remove-nick-style').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const uid = btn.getAttribute('data-user-id');
      const username = btn.getAttribute('data-username') || 'пользователя';

      if (!confirm(`Сбросить спецстиль ника игрока «${username}» на стандартный?`)) return;

      try {
        const res = await api.admin.resetUserNicknameStyle(uid);
        showToast(res.message || 'Стиль сброшен');
        if (state.user && state.user.id === uid) {
          state.user.name_style = 'default';
          authStorage.saveUser(state.user);
          notifyStateChange();
        }
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка сброса стиля');
      }
    };
  });

  // Pick decoration card from gallery
  document.querySelectorAll('[data-action="pick-dec-card"], .dec-card').forEach(card => {
    card.onclick = (e) => {
      const decId = card.getAttribute('data-dec-id') || card.closest('.dec-card')?.getAttribute('data-dec-id');
      if (!decId || !assignDecorationSelect) return;

      assignDecorationSelect.value = decId;
      updateLiveDecorationPreview();

      const assignCard = document.getElementById('decorations-assign-card');
      if (assignCard) {
        assignCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        assignCard.style.boxShadow = '0 0 25px rgba(255, 31, 54, 0.4)';
        setTimeout(() => { if (assignCard) assignCard.style.boxShadow = ''; }, 1500);
      }
    };
  });

  // Filter gallery by category pills and search input
  const decCatPills = document.querySelectorAll('.dec-cat-pill');
  const decSearchInput = document.getElementById('decoration-gallery-search');

  function filterDecorationsGallery() {
    const activePill = document.querySelector('.dec-cat-pill.active');
    const selectedCat = activePill ? activePill.getAttribute('data-cat-id') : 'all';
    const searchQuery = decSearchInput ? decSearchInput.value.toLowerCase().trim() : '';

    document.querySelectorAll('.dec-card').forEach(card => {
      const cardCat = card.getAttribute('data-category') || '';
      const cardName = (card.getAttribute('data-dec-name') || '').toLowerCase();
      const cardDesc = (card.querySelector('.dec-card-desc')?.textContent || '').toLowerCase();

      const catMatches = (selectedCat === 'all' || cardCat === selectedCat);
      const searchMatches = !searchQuery || cardName.includes(searchQuery) || cardDesc.includes(searchQuery);

      if (catMatches && searchMatches) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  decCatPills.forEach(pill => {
    pill.onclick = () => {
      decCatPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterDecorationsGallery();
    };
  });

  if (decSearchInput) {
    decSearchInput.oninput = filterDecorationsGallery;
  }

  // -------------------------------------------------------------
  // Forum Categories & Sections Admin Management
  // -------------------------------------------------------------
  const btnOpenCreateFcat = document.getElementById('btn-open-create-fcat');
  if (btnOpenCreateFcat) {
    btnOpenCreateFcat.onclick = () => {
      openModal('adminCategory', { mode: 'create' });
    };
  }

  const btnOpenCreateSection = document.getElementById('btn-open-create-section');
  if (btnOpenCreateSection) {
    btnOpenCreateSection.onclick = () => {
      openModal('adminSection', {
        mode: 'create',
        forumCategories: state.forumCategories || [],
        categories: state.categories || []
      });
    };
  }

  document.querySelectorAll('[data-action="add-section-to-cat"]').forEach(btn => {
    btn.onclick = () => {
      const fcatId = btn.getAttribute('data-fcat-id');
      openModal('adminSection', {
        mode: 'create',
        defaultFcatId: fcatId,
        forumCategories: state.forumCategories || [],
        categories: state.categories || []
      });
    };
  });

  document.querySelectorAll('[data-action="add-subsection"]').forEach(btn => {
    btn.onclick = () => {
      const parentId = btn.getAttribute('data-parent-id');
      const fcatId = btn.getAttribute('data-fcat-id');
      openModal('adminSection', {
        mode: 'create',
        defaultParentId: parentId,
        defaultFcatId: fcatId,
        forumCategories: state.forumCategories || [],
        categories: state.categories || []
      });
    };
  });

  document.querySelectorAll('[data-action="edit-fcat"]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const cat = (state.forumCategories || []).find(c => c.id === id);
      if (cat) {
        openModal('adminCategory', { mode: 'edit', category: cat });
      }
    };
  });

  document.querySelectorAll('[data-action="delete-fcat"]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title') || 'эту категорию';
      if (!confirm(`Вы действительно хотите удалить категорию «${title}»? Все её разделы останутся сохранены и перейдут в «Разделы без категории».`)) return;

      try {
        const res = await api.admin.deleteForumCategory(id);
        showToast(res.message);
        const catsRes = await api.categories.getAll();
        state.categories = catsRes.categories || [];
        state.forumCategories = catsRes.forumCategories || [];
        notifyStateChange();
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка удаления категории');
      }
    };
  });

  document.querySelectorAll('[data-action="edit-section"]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const section = (state.categories || []).find(c => c.id === id);
      if (section) {
        openModal('adminSection', {
          mode: 'edit',
          section,
          forumCategories: state.forumCategories || [],
          categories: state.categories || []
        });
      }
    };
  });

  document.querySelectorAll('[data-action="delete-section"]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title') || 'этот раздел';
      if (!confirm(`Вы действительно хотите удалить раздел «${title}»? Все темы этого раздела сохранятся в базе данных.`)) return;

      try {
        const res = await api.admin.deleteCategory(id);
        showToast(res.message);
        const catsRes = await api.categories.getAll();
        state.categories = catsRes.categories || [];
        state.forumCategories = catsRes.forumCategories || [];
        notifyStateChange();
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка удаления раздела');
      }
    };
  });

  // -------------------------------------------------------------
  // TOPIC PREFIXES ADMIN MANAGEMENT
  // -------------------------------------------------------------
  const modalPrefixManager = document.getElementById('modal-prefix-manager');
  const btnOpenCreatePrefix = document.getElementById('btn-open-create-prefix-modal');
  const btnClosePrefixModal = document.getElementById('pfx-modal-close');
  const btnCancelPrefixModal = document.getElementById('pfx-btn-cancel');
  const formPrefixManager = document.getElementById('form-prefix-manager');
  const pfxApplyAllCheckbox = document.getElementById('pfx-checkbox-apply-all');
  const pfxCatTreeContainer = document.getElementById('pfx-cat-tree-container');
  const pfxTreeControls = document.getElementById('pfx-tree-controls');

  const pfxInputTitle = document.getElementById('pfx-input-title');
  const pfxSelectStyle = document.getElementById('pfx-select-style');
  const pfxSelectIcon = document.getElementById('pfx-select-icon');
  const pfxColorPicker = document.getElementById('pfx-color-picker');
  const pfxColorHex = document.getElementById('pfx-color-hex');
  const pfxLivePreview = document.getElementById('pfx-live-preview-box');

  function updateLivePrefixBadge() {
    if (!pfxLivePreview) return;
    const title = pfxInputTitle?.value.trim() || 'Одобрено';
    const style = pfxSelectStyle?.value || 'glow';
    const icon = pfxSelectIcon?.value || 'check';
    const color = pfxColorHex?.value.trim() || '#10B981';

    pfxLivePreview.innerHTML = renderPrefixBadge({
      title,
      bg_color: color,
      text_color: '#FFFFFF',
      border_color: color,
      css_style: style,
      icon
    }, { size: 'normal' });
  }

  if (pfxInputTitle) pfxInputTitle.oninput = updateLivePrefixBadge;
  if (pfxSelectStyle) pfxSelectStyle.onchange = updateLivePrefixBadge;
  if (pfxSelectIcon) pfxSelectIcon.onchange = updateLivePrefixBadge;

  if (pfxColorPicker && pfxColorHex) {
    pfxColorPicker.oninput = () => {
      pfxColorHex.value = pfxColorPicker.value;
      updateLivePrefixBadge();
    };
    pfxColorHex.oninput = () => {
      if (pfxColorHex.value.startsWith('#') && (pfxColorHex.value.length === 4 || pfxColorHex.value.length === 7)) {
        pfxColorPicker.value = pfxColorHex.value;
      }
      updateLivePrefixBadge();
    };
  }

  document.querySelectorAll('.pfx-color-swatch').forEach(swatch => {
    swatch.onclick = () => {
      document.querySelectorAll('.pfx-color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const c = swatch.getAttribute('data-color') || '#10B981';
      if (pfxColorPicker) pfxColorPicker.value = c;
      if (pfxColorHex) pfxColorHex.value = c;
      updateLivePrefixBadge();
    };
  });

  if (pfxApplyAllCheckbox) {
    pfxApplyAllCheckbox.onchange = () => {
      const isAll = pfxApplyAllCheckbox.checked;
      if (pfxCatTreeContainer) pfxCatTreeContainer.style.display = isAll ? 'none' : 'block';
      if (pfxTreeControls) pfxTreeControls.style.display = isAll ? 'none' : 'flex';
    };
  }

  const btnSelectAllPfxCats = document.getElementById('pfx-btn-select-all');
  const btnDeselectAllPfxCats = document.getElementById('pfx-btn-deselect-all');
  if (btnSelectAllPfxCats) {
    btnSelectAllPfxCats.onclick = () => {
      document.querySelectorAll('#pfx-cat-tree-container input.pfx-tree-checkbox').forEach(cb => cb.checked = true);
    };
  }
  if (btnDeselectAllPfxCats) {
    btnDeselectAllPfxCats.onclick = () => {
      document.querySelectorAll('#pfx-cat-tree-container input.pfx-tree-checkbox').forEach(cb => cb.checked = false);
    };
  }

  // Parent section checkbox toggles all its child subsection checkboxes
  document.querySelectorAll('.pfx-sec-checkbox').forEach(secCb => {
    secCb.onchange = () => {
      const parentId = secCb.getAttribute('data-cat-id');
      document.querySelectorAll(`.pfx-sub-checkbox[data-parent-id="${parentId}"]`).forEach(subCb => {
        subCb.checked = secCb.checked;
      });
    };
  });

  if (btnOpenCreatePrefix && modalPrefixManager) {
    btnOpenCreatePrefix.onclick = () => {
      const heading = document.getElementById('pfx-modal-heading');
      if (heading) heading.innerText = 'Создание нового префикса темы';
      const saveText = document.getElementById('pfx-save-btn-text');
      if (saveText) saveText.innerText = 'Создать префикс';
      const editId = document.getElementById('pfx-edit-id');
      if (editId) editId.value = '';

      if (pfxInputTitle) pfxInputTitle.value = '';
      if (pfxSelectStyle) pfxSelectStyle.value = 'glow';
      if (pfxSelectIcon) pfxSelectIcon.value = 'check';
      if (pfxColorPicker) pfxColorPicker.value = '#10B981';
      if (pfxColorHex) pfxColorHex.value = '#10B981';
      const roleSel = document.getElementById('pfx-select-min-role');
      if (roleSel) roleSel.value = 'moderator';

      if (pfxApplyAllCheckbox) pfxApplyAllCheckbox.checked = true;
      if (pfxCatTreeContainer) pfxCatTreeContainer.style.display = 'none';
      if (pfxTreeControls) pfxTreeControls.style.display = 'none';
      document.querySelectorAll('#pfx-cat-tree-container input.pfx-tree-checkbox').forEach(cb => cb.checked = false);

      updateLivePrefixBadge();
      modalPrefixManager.style.display = 'flex';
    };
  }

  if (btnClosePrefixModal && modalPrefixManager) {
    btnClosePrefixModal.onclick = () => { modalPrefixManager.style.display = 'none'; };
  }
  if (btnCancelPrefixModal && modalPrefixManager) {
    btnCancelPrefixModal.onclick = () => { modalPrefixManager.style.display = 'none'; };
  }
  if (modalPrefixManager) {
    modalPrefixManager.onclick = (e) => {
      if (e.target === modalPrefixManager) modalPrefixManager.style.display = 'none';
    };
  }

  // Edit Prefix Button
  document.querySelectorAll('[data-action="edit-prefix"]').forEach(btn => {
    btn.onclick = async () => {
      const pfxId = btn.getAttribute('data-id');
      let pfx = (state.currentAdminPrefixes || []).find(p => p.id === pfxId);
      if (!pfx) {
        try {
          const res = await api.admin.getPrefixes();
          state.currentAdminPrefixes = res.prefixes || [];
          pfx = state.currentAdminPrefixes.find(p => p.id === pfxId);
        } catch (e) {
          alert('Ошибка загрузки данных префикса');
          return;
        }
      }
      if (!pfx || !modalPrefixManager) return;

      const heading = document.getElementById('pfx-modal-heading');
      if (heading) heading.innerText = `Редактирование префикса «${pfx.title}»`;
      const saveText = document.getElementById('pfx-save-btn-text');
      if (saveText) saveText.innerText = 'Сохранить изменения';
      const editId = document.getElementById('pfx-edit-id');
      if (editId) editId.value = pfx.id;

      if (pfxInputTitle) pfxInputTitle.value = pfx.title;
      if (pfxSelectStyle) pfxSelectStyle.value = pfx.css_style || 'glow';
      if (pfxSelectIcon) pfxSelectIcon.value = pfx.icon || 'check';
      if (pfxColorPicker) pfxColorPicker.value = pfx.bg_color || '#10B981';
      if (pfxColorHex) pfxColorHex.value = pfx.bg_color || '#10B981';
      const roleSel = document.getElementById('pfx-select-min-role');
      if (roleSel) roleSel.value = pfx.min_role || 'player';

      const isAll = Boolean(pfx.apply_all);
      if (pfxApplyAllCheckbox) pfxApplyAllCheckbox.checked = isAll;
      if (pfxCatTreeContainer) pfxCatTreeContainer.style.display = isAll ? 'none' : 'block';
      if (pfxTreeControls) pfxTreeControls.style.display = isAll ? 'none' : 'flex';

      const assignedCatIds = new Set((pfx.categories || []).map(c => c.id));
      document.querySelectorAll('#pfx-cat-tree-container input.pfx-tree-checkbox').forEach(cb => {
        cb.checked = assignedCatIds.has(cb.value);
      });

      updateLivePrefixBadge();
      modalPrefixManager.style.display = 'flex';
    };
  });

  // Delete Prefix Button
  document.querySelectorAll('[data-action="delete-prefix"]').forEach(btn => {
    btn.onclick = async () => {
      const pfxId = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title') || 'префикс';
      if (!confirm(`Вы действительно хотите удалить префикс «${title}»? Все темы с этим префиксом останутся на форуме (префикс будет снят).`)) return;

      try {
        const res = await api.admin.deletePrefix(pfxId);
        showToast(res.message || 'Префикс удалён');
        playSound('click');
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка удаления префикса');
      }
    };
  });

  // Form Prefix Manager Submit
  if (formPrefixManager) {
    formPrefixManager.onsubmit = async (e) => {
      e.preventDefault();
      const pfxId = document.getElementById('pfx-edit-id')?.value;
      const title = pfxInputTitle?.value.trim();
      const css_style = pfxSelectStyle?.value || 'glow';
      const icon = pfxSelectIcon?.value || 'check';
      const bg_color = pfxColorHex?.value.trim() || '#10B981';
      const min_role = document.getElementById('pfx-select-min-role')?.value || 'player';
      const apply_all = pfxApplyAllCheckbox?.checked ? 1 : 0;

      let category_ids = [];
      if (!apply_all) {
        document.querySelectorAll('#pfx-cat-tree-container input.pfx-tree-checkbox:checked').forEach(cb => {
          category_ids.push(cb.value);
        });
        if (category_ids.length === 0) {
          if (!confirm('Вы не выбрали ни одного раздела. Префикс не будет доступен ни в одном разделе форума. Продолжить?')) {
            return;
          }
        }
      }

      if (!title) {
        alert('Пожалуйста, укажите название префикса');
        return;
      }

      const saveBtn = document.getElementById('pfx-btn-save');
      const originalText = saveBtn?.innerHTML;
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Сохранение...';
      }

      try {
        if (pfxId) {
          const res = await api.admin.updatePrefix(pfxId, {
            title,
            css_style,
            icon,
            bg_color,
            min_role,
            apply_all,
            category_ids
          });
          showToast(res.message || 'Префикс успешно обновлён');
        } else {
          const res = await api.admin.createPrefix({
            title,
            css_style,
            icon,
            bg_color,
            min_role,
            apply_all,
            category_ids
          });
          showToast(res.message || 'Префикс успешно создан');
        }
        playSound('success');
        if (modalPrefixManager) modalPrefixManager.style.display = 'none';
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка сохранения префикса');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalText;
        }
      }
    };
  }

  // -------------------------------------------------------------
  // Reputation & Awards Modals Triggers
  // -------------------------------------------------------------
  document.querySelectorAll('.btn-open-rep-modal').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!state.user) {
        showToast('Для изменения репутации необходимо войти в аккаунт');
        openModal('auth');
        return;
      }
      const targetUserId = btn.getAttribute('data-user-id');
      const targetUsername = btn.getAttribute('data-username') || 'Пользователь';
      const postId = btn.getAttribute('data-post-id') || null;
      openModal('reputation', { targetUserId, targetUsername, postId });
    };
  });

  document.querySelectorAll('.btn-open-rep-logs').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetUserId = btn.getAttribute('data-user-id');
      const targetUsername = btn.getAttribute('data-username') || 'Пользователь';
      openModal('reputation_logs', { targetUserId, targetUsername });
    };
  });

  document.querySelectorAll('.btn-admin-user-awards').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const userId = btn.getAttribute('data-user-id');
      const username = btn.getAttribute('data-username');
      const level = parseInt(btn.getAttribute('data-level')) || 1;
      const current_xp = parseInt(btn.getAttribute('data-xp')) || 0;
      const reputation = parseInt(btn.getAttribute('data-rep')) || 0;
      openModal('admin_user_awards', { userId, username, level, current_xp, reputation });
    };
  });

  // -------------------------------------------------------------
  // GAME SERVERS ADMIN MANAGEMENT
  // -------------------------------------------------------------
  const modalServerManager = document.getElementById('modal-server-manager');
  const btnAdminAddServer = document.getElementById('btn-admin-add-server');
  const btnCloseServerModal = document.getElementById('srv-modal-close');
  const btnCancelServerModal = document.getElementById('srv-btn-cancel');
  const formServerManager = document.getElementById('form-server-manager');

  const srvInputId = document.getElementById('srv-input-id');
  const srvInputName = document.getElementById('srv-input-name');
  const srvInputIp = document.getElementById('srv-input-ip');
  const srvInputPort = document.getElementById('srv-input-port');
  const srvSelectPlatform = document.getElementById('srv-select-platform');
  const srvSelectStatus = document.getElementById('srv-select-status');
  const srvInputOnline = document.getElementById('srv-input-online');
  const srvInputSlots = document.getElementById('srv-input-slots');
  const srvInputPing = document.getElementById('srv-input-ping');
  const srvInputDesc = document.getElementById('srv-input-desc');
  const srvInputLauncher = document.getElementById('srv-input-launcher');
  const srvModalTitle = document.getElementById('srv-modal-title');

  function openServerModal(server = null) {
    if (!modalServerManager) return;
    if (server) {
      if (srvModalTitle) srvModalTitle.textContent = 'Редактирование сервера';
      if (srvInputId) srvInputId.value = server.id;
      if (srvInputName) srvInputName.value = server.name || '';
      if (srvInputIp) srvInputIp.value = server.ip || '193.58.121.34';
      if (srvInputPort) srvInputPort.value = server.port || 22005;
      if (srvSelectPlatform) srvSelectPlatform.value = server.platform || 'ragemp';
      if (srvSelectStatus) srvSelectStatus.value = server.status || 'online';
      if (srvInputOnline) srvInputOnline.value = server.online_players || 0;
      if (srvInputSlots) srvInputSlots.value = server.max_players || 1000;
      if (srvInputPing) srvInputPing.value = server.ping_ms || 24;
      if (srvInputDesc) srvInputDesc.value = server.description || '';
      if (srvInputLauncher) srvInputLauncher.value = server.launcher_url || 'https://phoenix-rp.online/launcher';
    } else {
      if (srvModalTitle) srvModalTitle.textContent = 'Добавление нового сервера';
      if (srvInputId) srvInputId.value = '';
      if (srvInputName) srvInputName.value = '';
      if (srvInputIp) srvInputIp.value = '193.58.121.34';
      if (srvInputPort) srvInputPort.value = '22005';
      if (srvSelectPlatform) srvSelectPlatform.value = 'ragemp';
      if (srvSelectStatus) srvSelectStatus.value = 'online';
      if (srvInputOnline) srvInputOnline.value = '0';
      if (srvInputSlots) srvInputSlots.value = '1000';
      if (srvInputPing) srvInputPing.value = '24';
      if (srvInputDesc) srvInputDesc.value = '';
      if (srvInputLauncher) srvInputLauncher.value = 'https://phoenix-rp.online/launcher';
    }
    modalServerManager.style.display = 'flex';
  }

  function closeServerModal() {
    if (modalServerManager) modalServerManager.style.display = 'none';
  }

  if (btnAdminAddServer) {
    btnAdminAddServer.onclick = () => openServerModal(null);
  }
  if (btnCloseServerModal) btnCloseServerModal.onclick = closeServerModal;
  if (btnCancelServerModal) btnCancelServerModal.onclick = closeServerModal;

  document.querySelectorAll('.btn-admin-edit-server').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const server = (state.adminServers || state.gameServers || []).find(s => s.id === id);
      if (server) {
        openServerModal(server);
      }
    };
  });

  document.querySelectorAll('.btn-admin-del-server').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name') || 'этот сервер';
      if (!confirm(`Вы действительно хотите удалить игровой сервер «${name}» из мониторинга?`)) return;

      try {
        await api.admin.deleteServer(id);
        showToast('Сервер удалён');
        playSound('success');
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка удаления сервера');
      }
    };
  });

  if (formServerManager) {
    formServerManager.onsubmit = async (e) => {
      e.preventDefault();
      const serverId = srvInputId?.value;
      const payload = {
        name: srvInputName?.value.trim(),
        ip: srvInputIp?.value.trim(),
        port: parseInt(srvInputPort?.value) || 22005,
        platform: srvSelectPlatform?.value || 'ragemp',
        status: srvSelectStatus?.value || 'online',
        online_players: parseInt(srvInputOnline?.value) || 0,
        max_players: parseInt(srvInputSlots?.value) || 1000,
        ping_ms: parseInt(srvInputPing?.value) || 24,
        description: srvInputDesc?.value.trim(),
        launcher_url: srvInputLauncher?.value.trim()
      };

      if (!payload.name) {
        alert('Укажите название сервера');
        return;
      }
      if (!payload.ip) {
        alert('Укажите IP адрес');
        return;
      }

      const saveBtn = document.getElementById('srv-btn-save');
      try {
        if (saveBtn) saveBtn.disabled = true;
        if (serverId) {
          await api.admin.updateServer(serverId, payload);
          showToast('Параметры сервера обновлены');
        } else {
          await api.admin.createServer(payload);
          showToast('Новый сервер успешно добавлен');
        }
        playSound('success');
        closeServerModal();
        router.resolve();
      } catch (err) {
        alert(err.message || 'Ошибка сохранения сервера');
        if (saveBtn) saveBtn.disabled = false;
      }
    };
  }
}

// Sidebar Accordion Subsections Toggle
document.addEventListener('click', (e) => {
  const toggleBtn = e.target.closest('[data-toggle-sub]');
  if (toggleBtn) {
    e.preventDefault();
    e.stopPropagation();
    const group = toggleBtn.closest('.sidebar-accordion-group');
    if (group) {
      group.classList.toggle('open');
      const isOpen = group.classList.contains('open');
      toggleBtn.setAttribute('title', isOpen ? 'Свернуть подразделы' : 'Развернуть подразделы');
    }
  }
});

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------
async function initApp() {
  console.log('[App] Bootstrapping Phoenix RP Forum...');

  // 1. Check Auth Session
  const token = authStorage.getToken();
  if (token) {
    try {
      const res = await api.auth.me();
      state.user = res.user;
      state.unreadNotifications = res.user.unreadNotifications || 0;

      // Fetch unread messages
      try {
        const unreadMsgs = await api.messages.getUnreadCount();
        state.unreadMessages = unreadMsgs.unreadCount || 0;
      } catch {}
    } catch {
      authStorage.clearToken();
      state.user = null;
    }
  }

  // 1.5. Fetch Custom Badges for global registration
  try {
    const cbRes = await api.badges.getCustom();
    if (cbRes.customBadges) {
      registerCustomBadges(cbRes.customBadges);
    }
  } catch (err) {
    console.error('Failed to load custom badges:', err);
  }

  // 2. Fetch Initial Categories, Recent Threads & Online Stats
  try {
    const [catsRes, recentsRes, onlineRes, srvRes] = await Promise.all([
      api.categories.getAll().catch(() => ({ categories: [] })),
      api.threads.getRecent().catch(() => ({ threads: [] })),
      api.users.getOnlineStats().catch(() => null),
      api.servers.getAll().catch(() => ({ servers: [] }))
    ]);
    state.categories = catsRes.categories || [];
    state.forumCategories = catsRes.forumCategories || [];
    state.recentThreads = recentsRes.threads || [];
    if (onlineRes) {
      state.onlineStats = onlineRes;
    }
    if (srvRes && srvRes.servers) {
      state.gameServers = srvRes.servers;
    }
  } catch (err) {
    console.error('Failed to load initial forum data:', err);
  }

  // Real-time Heartbeat ping: only active tabs and interactive users keep session online
  let lastUserActivity = Date.now();
  const markUserActive = () => { lastUserActivity = Date.now(); };
  ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, markUserActive, { passive: true });
  });

  setInterval(async () => {
    try {
      const isVisible = document.visibilityState === 'visible';
      const isRecentlyActive = (Date.now() - lastUserActivity) < 4 * 60 * 1000;
      if (isVisible && isRecentlyActive) {
        await api.users.heartbeat();
      }
    } catch {}
  }, 25000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lastUserActivity = Date.now();
      api.users.heartbeat().catch(() => {});
    }
  });

  // Periodic refresh of online stats every 15 seconds
  setInterval(async () => {
    try {
      const stats = await api.users.getOnlineStats();
      if (stats) {
        state.onlineStats = stats;
        const rightSidebar = document.querySelector('.sidebar-right');
        if (rightSidebar) {
          rightSidebar.outerHTML = renderSidebarRight();
          attachGlobalEvents();
        }
      }
    } catch {}
  }, 15000);

  // 3. Subscribe State Change to Re-render Header & Sidebars
  subscribe(() => {
    const topNav = document.querySelector('.header, .top-nav');
    if (topNav) {
      topNav.outerHTML = renderHeader();
    }
    const sidebarRight = document.querySelector('.sidebar-right');
    if (sidebarRight) {
      sidebarRight.outerHTML = renderSidebarRight();
    }
    attachGlobalEvents();
  });

  // 4. Resolve Current Route
  router.resolve();
}

// Start Application
initApp();
