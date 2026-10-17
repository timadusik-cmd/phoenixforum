// Phoenix RP Forum - Left Sidebar Component
import { state } from '../state.js';
import { ICONS, getIcon } from '../utils/icons.js';

export function renderSidebarLeft() {
  const currentPath = window.location.pathname;
  const totalThreads = state.categories.reduce((acc, c) => acc + (c.threads_count || 0), 0);

  return `
    <aside class="sidebar-left">
      <!-- Categories Navigation -->
      <nav class="sidebar-menu">
        <a href="/forum" data-link class="sidebar-menu-item ${currentPath === '/forum' || currentPath === '/' ? 'active' : ''}">
          <div class="sidebar-menu-item-left">
            <div class="menu-icon-square active-sq">
              ${ICONS.home}
            </div>
            <span>Все разделы</span>
          </div>
          <span class="menu-badge">${totalThreads || 142}</span>
        </a>

        ${state.categories.map(cat => {
          const isActive = currentPath === `/forum/category/${cat.slug}`;
          return `
            <a href="/forum/category/${cat.slug}" data-link class="sidebar-menu-item ${isActive ? 'active' : ''}">
              <div class="sidebar-menu-item-left">
                <div class="menu-icon-square">
                  ${getIcon(cat.icon)}
                </div>
                <span>${cat.title}</span>
              </div>
              <span class="menu-badge">${cat.threads_count || 0}</span>
            </a>
          `;
        }).join('')}
      </nav>

      <!-- Sidebar Promo Card -->
      <div class="sidebar-promo-card">
        <div class="promo-image-wrapper">
          <img src="/assets/hero_banner.jpg" alt="Phoenix RP" class="promo-image" />
          <div class="promo-gradient-overlay"></div>
          <div class="promo-brand-center">
            <img src="/assets/phoenix_bird_header.png" alt="Phoenix Bird" class="promo-brand-icon" />
            <div class="promo-brand-title">PHOENIX</div>
            <div class="promo-brand-sub">PROJECT RP</div>
          </div>
        </div>
        <div class="promo-content">
          <h3 class="promo-title">ИГРАЙ. ОБЩАЙСЯ.<br />РАЗВИВАЙСЯ.</h3>
          <button class="btn-promo-action" id="btn-sidebar-connect">
            <span>Перейти на сайт</span>
            ${ICONS.externalLink}
          </button>
        </div>
      </div>
    </aside>
  `;
}
