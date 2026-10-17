// Phoenix RP Forum - Main Client Application
import './style.css';
import { state, subscribe, notifyStateChange } from './state.js';
import { api, authStorage } from './api/client.js';
import { router } from './router.js';
import { renderHeader } from './components/Header.js';
import { renderSidebarLeft } from './components/SidebarLeft.js';
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
        ${renderSidebarLeft()}
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

// 4. Create Thread
router.addRoute('/forum/create', async (params, query) => {
  if (!state.user) {
    showToast('Для создания темы необходимо авторизоваться');
    openModal('auth');
    router.navigate('/forum');
    return;
  }
  renderAppShell(renderCreateThread(query.category || null));
  attachRichEditorEvents('thread-content');
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
    let customBadges = [];
    let auditLogs = [];

    if (tab === 'reports') {
      const repData = await api.reports.getReports('pending');
      reports = repData.reports || [];
    } else if (tab === 'categories') {
      const catsRes = await api.categories.getAll().catch(() => ({ categories: [], forumCategories: [] }));
      state.categories = catsRes.categories || [];
      state.forumCategories = catsRes.forumCategories || [];
    } else if (tab === 'users') {
      const [uData, cbData] = await Promise.all([
        api.users.getMembers({ limit: 50 }),
        api.admin.getCustomBadges().catch(() => ({ customBadges: [] }))
      ]);
      users = uData.users || [];
      customBadges = cbData.customBadges || [];
    } else if (tab === 'custom_badges') {
      const cbData = await api.admin.getCustomBadges().catch(() => ({ customBadges: [] }));
      customBadges = cbData.customBadges || [];
    } else if (tab === 'logs') {
      const lData = await api.admin.getAuditLogs();
      auditLogs = lData.logs || [];
    }

    renderAppShell(renderAdminPanel({
      activeTab: tab,
      stats: statsData.stats || {},
      reports,
      categories: state.categories,
      forumCategories: state.forumCategories || [],
      users,
      customBadges,
      auditLogs
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
    formCreateThread.onsubmit = async (e) => {
      e.preventDefault();
      const category_id = document.getElementById('thread-category')?.value;
      const tag = document.getElementById('thread-tag')?.value;
      const title = document.getElementById('thread-title')?.value;
      const content = document.getElementById('thread-content')?.value;
      const is_pinned = document.getElementById('thread-pinned')?.checked;

      try {
        const btn = document.getElementById('btn-submit-create-thread');
        btn.disabled = true;
        const res = await api.threads.create({ category_id, tag, title, content, is_pinned });
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
            quotePreview.innerHTML = `<strong>Цитата от ${author}:</strong> «${content.substring(0, 80)}...»`;
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

  document.querySelectorAll('[data-action="toggle-ban"]').forEach(btn => {
    btn.onclick = async () => {
      const uid = btn.getAttribute('data-user-id');
      const isBanned = btn.getAttribute('data-banned') === '1';
      let reason = '';
      if (!isBanned) {
        reason = prompt('Укажите причину блокировки:', 'Нарушение правил сервера');
        if (!reason) return;
      }
      try {
        const res = await api.admin.banUser(uid, { is_banned: !isBanned, ban_reason: reason });
        showToast(res.message);
        router.resolve();
      } catch (err) { alert(err.message); }
    };
  });

  document.querySelectorAll('[data-action="warn-user"]').forEach(btn => {
    btn.onclick = async () => {
      const uid = btn.getAttribute('data-user-id');
      const reason = prompt('Укажите причину выдачи варна:', 'Оффтоп / Нарушение регламента');
      if (!reason) return;
      try {
        const res = await api.admin.warnUser(uid, { reason, points: 1 });
        showToast(res.message);
      } catch (err) { alert(err.message); }
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

      try {
        const res = await api.admin.createCustomBadge({ title, subtitle, key, level, color, icon });
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
    const previewNormal = document.getElementById('live-badge-preview-normal');
    const previewSidebar = document.getElementById('live-badge-preview-sidebar');
    const badgeObj = {
      key: 'preview',
      title: title.toUpperCase(),
      subtitle,
      color,
      glow: `rgba(0, 145, 255, 0.40)`,
      icon
    };
    if (previewNormal) previewNormal.innerHTML = renderRoleBadge(badgeObj, { size: 'normal' });
    if (previewSidebar) previewSidebar.innerHTML = renderRoleBadge(badgeObj, { size: 'sidebar' });
  }

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
}

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
    const [catsRes, recentsRes, onlineRes] = await Promise.all([
      api.categories.getAll().catch(() => ({ categories: [] })),
      api.threads.getRecent().catch(() => ({ threads: [] })),
      api.users.getOnlineStats().catch(() => null)
    ]);
    state.categories = catsRes.categories || [];
    state.forumCategories = catsRes.forumCategories || [];
    state.recentThreads = recentsRes.threads || [];
    if (onlineRes) {
      state.onlineStats = onlineRes;
    }
  } catch (err) {
    console.error('Failed to load initial forum data:', err);
  }

  // Periodic refresh of online stats every 30 seconds
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
  }, 30000);

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
