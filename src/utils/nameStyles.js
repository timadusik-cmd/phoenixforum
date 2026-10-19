// Phoenix RP Forum - Custom Nickname Styles & Animations
// Exclusively curated high-end GTA 5 RP, Discord & Telegram Premium effects

export const NICKNAME_STYLES = [
  {
    key: 'default',
    title: 'Стандартный',
    description: 'Обычный цвет роли без анимации',
    icon: '⚪',
    previewColor: '#CBD5E1',
    badge: 'Базовый'
  },
  {
    key: 'phoenix_fire',
    title: 'Пламя Феникса',
    description: 'Магматический огненный градиент с мерцающим жаром',
    icon: '🔥',
    previewColor: '#FF384D',
    badge: 'Огонь'
  },
  {
    key: 'cyber_neon',
    title: 'Кибер Неон',
    description: 'Электрический бирюзово-фиолетовый киберпанк градиент',
    icon: '⚡',
    previewColor: '#00F5FF',
    badge: 'Неон'
  },
  {
    key: 'chrome_shimmer',
    title: 'Алмазный Хром',
    description: 'Жидкий платиновый металл с бегущим световым бликом',
    icon: '✨',
    previewColor: '#FFFFFF',
    badge: 'Блик'
  },
  {
    key: 'royal_gold',
    title: 'Королевское Золото',
    description: 'Полированное 24K золото с благородным сиянием',
    icon: '👑',
    previewColor: '#F59E0B',
    badge: 'Золото'
  },
  {
    key: 'amethyst',
    title: 'Тёмный Аметист',
    description: 'Глубокий мистический ультрафиолет с неоновой аурой',
    icon: '🔮',
    previewColor: '#C084FC',
    badge: 'Магия'
  },
  {
    key: 'emerald_pulse',
    title: 'Изумрудный Пульс',
    description: 'Яркий токсично-мятный градиент с дыханием био-света',
    icon: '🌿',
    previewColor: '#10B981',
    badge: 'Изумруд'
  },
  {
    key: 'blood_storm',
    title: 'Кровавый Шторм',
    description: 'Глубокий рубиново-алый градиент с пульсирующей тенью',
    icon: '🩸',
    previewColor: '#EF4444',
    badge: 'Шторм'
  },
  {
    key: 'cosmic_nebula',
    title: 'Космическая Небула',
    description: 'Галактический перелив авроры (розовый, индиго, фиолетовый)',
    icon: '🌌',
    previewColor: '#EC4899',
    badge: 'Космос'
  },
  {
    key: 'glitch_pulse',
    title: 'Киберпанк Глитч',
    description: 'Цифровой стиль со стильным хроматическим RGB-эффектом',
    icon: '👾',
    previewColor: '#00F0FF',
    badge: 'Глитч'
  }
];

export function getNicknameStyle(key) {
  return NICKNAME_STYLES.find(s => s.key === key) || NICKNAME_STYLES[0];
}

export function renderStyledUsername(username, nameStyle = 'default', extraClass = '') {
  if (!username) return '';
  const safeName = String(username).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (!nameStyle || nameStyle === 'default') {
    return `<span class="nick-wrap ${extraClass}">${safeName}</span>`;
  }
  return `<span class="nick-wrap styled-nick nick-style-${nameStyle} ${extraClass}" data-style="${nameStyle}">${safeName}</span>`;
}
