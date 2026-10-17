// Phoenix RP Forum - Global Footer Component
import { ICONS } from '../utils/icons.js';

export function renderFooter() {
  return `
    <footer class="global-footer">
      <div class="footer-inner">
        <!-- Left: Logo -->
        <a href="/forum" data-link class="footer-brand">
          <img src="/assets/phoenix_bird_header.png" alt="Phoenix RP" class="footer-bird-icon" />
          <div class="footer-brand-text">
            <span class="footer-brand-title">PHOENIX</span>
            <span class="footer-brand-sub">PROJECT RP</span>
          </div>
        </a>

        <!-- Center: Links -->
        <div class="footer-nav-links">
          <a href="/forum" data-link class="footer-nav-link">Главная</a>
          <a href="/forum" data-link class="footer-nav-link">Форум</a>
          <a href="/forum" data-link class="footer-nav-link">Серверы</a>
          <a href="/forum" data-link class="footer-nav-link">Магазин</a>
          <a href="/forum/rules" data-link class="footer-nav-link">Правила</a>
          <a href="/forum/rules" data-link class="footer-nav-link">Поддержка</a>
        </div>

        <!-- Right: Socials & Copyright -->
        <div class="footer-right-col">
          <div class="footer-social-row">
            <a href="https://discord.gg" target="_blank" rel="noopener" class="footer-social-icon" title="Discord">${ICONS.discord}</a>
            <a href="https://t.me" target="_blank" rel="noopener" class="footer-social-icon" title="Telegram">${ICONS.telegram}</a>
            <a href="https://youtube.com" target="_blank" rel="noopener" class="footer-social-icon" title="YouTube">${ICONS.youtube}</a>
            <a href="https://vk.com" target="_blank" rel="noopener" class="footer-social-icon" title="ВКонтакте">${ICONS.vk}</a>
          </div>
          <div class="footer-copy-text">
            © 2026 Phoenix Project RP. Все права защищены.
          </div>
        </div>
      </div>
    </footer>
  `;
}
