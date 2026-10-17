// Phoenix RP Forum - Left Sidebar Component with Subsections Accordion
import { state } from '../state.js';
import { ICONS, getIcon } from '../utils/icons.js';

export function renderSidebarLeft() {
  const currentPath = window.location.pathname;
  // Group categories: Separate root categories and subsections
  const rootCategories = state.categories.filter(c => !c.parent_id);
  const totalThreads = rootCategories.reduce((acc, c) => acc + (c.threads_count || 0), 0);
  const subCategoriesByParent = {};
  state.categories.forEach(c => {
    if (c.parent_id) {
      if (!subCategoriesByParent[c.parent_id]) subCategoriesByParent[c.parent_id] = [];
      subCategoriesByParent[c.parent_id].push(c);
    }
  });

  const categoriesHtml = rootCategories.map(cat => {
    const subs = subCategoriesByParent[cat.id] || [];
    const hasSubs = subs.length > 0;
    const isDirectActive = currentPath === `/forum/category/${cat.slug}`;
    const isChildActive = subs.some(s => currentPath === `/forum/category/${s.slug}`);
    const isGroupActive = isDirectActive || isChildActive;
    const iconColor = cat.icon_color || '#FF1F36';
    const iconBg = cat.icon_bg || 'rgba(255, 31, 54, 0.12)';
    const totalCatThreads = cat.threads_count || 0;

    if (hasSubs) {
      return `
        <div class="sidebar-accordion-group ${isGroupActive ? 'open' : ''}" data-accordion-group="${cat.id}">
          <div class="sidebar-menu-row">
            <a href="/forum/category/${cat.slug}" data-link class="sidebar-menu-item ${isDirectActive ? 'active' : ''}" style="--item-accent: ${iconColor};">
              <div class="sidebar-menu-item-left">
                <div class="menu-icon-square" style="color: ${iconColor}; background: ${iconBg};">
                  ${getIcon(cat.icon)}
                </div>
                <span>${cat.title}</span>
              </div>
              <span class="menu-badge">${totalCatThreads}</span>
            </a>
            <button type="button" class="sidebar-accordion-btn" data-toggle-sub="${cat.id}" title="${isGroupActive ? 'Свернуть подразделы' : 'Развернуть подразделы'}">
              ${ICONS.chevronDown}
            </button>
          </div>
          <div class="sidebar-accordion-body" id="sub-accordion-${cat.id}">
            ${subs.map(sub => {
              const isSubActive = currentPath === `/forum/category/${sub.slug}`;
              const subColor = sub.icon_color || '#FF1F36';
              return `
                <a href="/forum/category/${sub.slug}" data-link class="sidebar-sub-item ${isSubActive ? 'active' : ''}">
                  <span class="sub-tree-pipe">↳</span>
                  <div class="sub-item-indicator" style="background: ${subColor}; box-shadow: 0 0 6px ${subColor};"></div>
                  <span class="sub-item-title">${sub.title}</span>
                  ${sub.badge_text ? `
                    <span class="sub-item-badge" style="background: ${sub.badge_color || '#FF1F36'};">${sub.badge_text}</span>
                  ` : ''}
                  <span class="sub-item-count">${sub.threads_count || 0}</span>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    return `
      <a href="/forum/category/${cat.slug}" data-link class="sidebar-menu-item ${isDirectActive ? 'active' : ''}" style="--item-accent: ${iconColor};">
        <div class="sidebar-menu-item-left">
          <div class="menu-icon-square" style="color: ${iconColor}; background: ${iconBg};">
            ${getIcon(cat.icon)}
          </div>
          <span>${cat.title}</span>
        </div>
        <span class="menu-badge">${cat.threads_count || 0}</span>
      </a>
    `;
  }).join('');

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
          <span class="menu-badge">${typeof totalThreads === 'number' ? totalThreads : 0}</span>
        </a>

        ${categoriesHtml}
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
