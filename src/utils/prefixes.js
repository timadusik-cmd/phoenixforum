// Phoenix RP Forum - Topic Prefixes Utilities
import { ICONS, getIcon } from './icons.js';

export const PREFIX_STYLES = [
  { key: 'glow', label: 'Неоновый (Glow)' },
  { key: 'solid', label: 'Сплошной (Solid)' },
  { key: 'outline', label: 'Контурный (Outline)' },
  { key: 'gradient', label: 'Градиентный (Gradient)' }
];

export const PREFIX_ICONS = [
  { key: '', label: 'Без иконки' },
  { key: 'check', label: 'Галочка (Одобрено)' },
  { key: 'x', label: 'Крестик (Отказано)' },
  { key: 'clock', label: 'Часы (Ожидание / Рассмотрение)' },
  { key: 'alert-circle', label: 'Внимание (Важно)' },
  { key: 'info', label: 'Информация (Инфо)' },
  { key: 'lock', label: 'Замок (Закрыто)' },
  { key: 'star', label: 'Звезда (Биография / Топ)' },
  { key: 'flame', label: 'Огонь (Баг / Хот)' },
  { key: 'shield', label: 'Щит (Правила / Гос)' },
  { key: 'help-circle', label: 'Вопрос (Помощь)' }
];

export const COLOR_PRESETS = [
  { label: 'Изумрудный', bg: '#10B981', border: 'rgba(16, 185, 129, 0.45)' },
  { label: 'Красный', bg: '#EF4444', border: 'rgba(239, 68, 68, 0.45)' },
  { label: 'Огненный Phoenix', bg: '#FF1F36', border: 'rgba(255, 31, 54, 0.50)' },
  { label: 'Янтарный', bg: '#F59E0B', border: 'rgba(245, 158, 11, 0.45)' },
  { label: 'Синий', bg: '#0091FF', border: 'rgba(0, 145, 255, 0.45)' },
  { label: 'Фиолетовый', bg: '#8B5CF6', border: 'rgba(139, 92, 246, 0.45)' },
  { label: 'Голубой (Cyan)', bg: '#06B6D4', border: 'rgba(6, 182, 212, 0.45)' },
  { label: 'Оранжевый', bg: '#F97316', border: 'rgba(249, 115, 22, 0.45)' },
  { label: 'Серый', bg: '#475569', border: 'rgba(148, 163, 184, 0.35)' },
  { label: 'Тёмно-серый', bg: '#1E293B', border: 'rgba(255, 255, 255, 0.15)' }
];

/**
 * Render a styled thread prefix badge HTML
 * @param {Object} prefix - prefix object or thread with prefix fields
 * @param {Object} options - { size: 'compact' | 'normal' | 'header', class: '' }
 * @returns {string} HTML string
 */
export function renderPrefixBadge(prefix, options = {}) {
  if (!prefix) return '';

  const title = prefix.prefix_title || prefix.title;
  if (!title) return '';

  const textColor = prefix.prefix_text_color || prefix.text_color || '#FFFFFF';
  const bgColor = prefix.prefix_bg_color || prefix.bg_color || '#10B981';
  const borderColor = prefix.prefix_border_color || prefix.border_color || 'rgba(16, 185, 129, 0.45)';
  const style = prefix.prefix_css_style || prefix.css_style || 'glow';
  const iconKey = prefix.prefix_icon || prefix.icon || '';
  const size = options.size || 'normal';

  let customInline = '';
  let styleClass = `pfx-style-${style}`;

  if (style === 'glow') {
    customInline = `background: ${bgColor}; color: ${textColor}; border: 1px solid ${borderColor}; box-shadow: 0 0 10px ${borderColor};`;
  } else if (style === 'outline') {
    customInline = `background: rgba(0, 0, 0, 0.35); color: ${bgColor}; border: 1px solid ${bgColor}; box-shadow: inset 0 0 8px rgba(0,0,0,0.4);`;
  } else if (style === 'gradient') {
    customInline = `background: linear-gradient(135deg, ${bgColor}, #FF1F36); color: ${textColor}; border: 1px solid ${borderColor}; box-shadow: 0 2px 8px ${borderColor};`;
  } else {
    // solid
    customInline = `background: ${bgColor}; color: ${textColor}; border: 1px solid ${borderColor};`;
  }

  let iconHtml = '';
  if (iconKey && ICONS[iconKey]) {
    iconHtml = `<span class="thread-prefix-icon">${ICONS[iconKey]}</span>`;
  }

  return `
    <span class="thread-prefix-badge ${styleClass} size-${size} ${options.class || ''}" style="${customInline}">
      ${iconHtml}
      <span class="thread-prefix-text">${title}</span>
    </span>
  `;
}
