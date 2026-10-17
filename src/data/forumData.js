// Phoenix RP Forum - Production State & Auth Data Model

export const AVATAR_OPTIONS = [
  { id: 'hooded', name: 'Скрытный RP', path: '/assets/avatar_ivan.jpg' },
  { id: 'admin', name: 'Босс мафии', path: '/assets/avatar_admin.jpg' },
  { id: 'police', name: 'Офицер LSPD', path: '/assets/avatar_moderator.jpg' },
  { id: 'tech', name: 'Хакер / Механик', path: '/assets/avatar_tech.jpg' }
];

export const DEFAULT_USERS = [
  {
    id: 'u_ivan_petrov',
    email: 'admin@phoenix-rp.ru',
    username: 'Ivan_Petrov',
    password: 'password123',
    characterName: 'Ivan Petrov',
    avatar: '/assets/avatar_ivan.jpg',
    role: 'Администратор',
    roleColor: '#FF3D00',
    roleBadge: 'Administrator',
    status: 'online', // 'online' | 'offline'
    level: 1,
    currentXp: 0,
    maxXp: 1000,
    joinedDate: '15 Октября 2026',
    fraction: 'Руководство сервера',
    server: 'Phoenix RP #1 (Los Santos)'
  }
];

export const NOTIFICATIONS = [
  {
    id: 'n_welcome',
    type: 'system',
    title: 'Добро пожаловать на форум Phoenix RP',
    text: 'Форум подготовлен к официальной работе. Вы можете зарегистрироваться или войти в аккаунт, создавать темы и общаться.',
    time: 'Только что',
    unread: true,
    topicId: null
  }
];

export const CATEGORIES = [
  {
    id: 'news',
    title: 'Новости и объявления',
    description: 'Официальные новости сервера, обновления лаунчера, анонсы и важная информация.',
    icon: 'megaphone'
  },
  {
    id: 'rules',
    title: 'Правила сервера',
    description: 'Действующий регламент проекта Phoenix RP, правила государственных структур и банд.',
    icon: 'shield'
  },
  {
    id: 'tech',
    title: 'Технический раздел',
    description: 'Помощь с запуском игры, сообщения о багах, вопросы по лаунчеру и предложения по оптимизации.',
    icon: 'settings'
  },
  {
    id: 'roleplay',
    title: 'RolePlay раздел',
    description: 'RP ситуации, квенты и биографии персонажей, неофициальные организации и фракции.',
    icon: 'user'
  },
  {
    id: 'complaints',
    title: 'Жалобы',
    description: 'Подача жалоб на игроков, лидеров организаций и состав администрации.',
    icon: 'alert-circle'
  },
  {
    id: 'trade',
    title: 'Торговая площадка',
    description: 'Покупка, продажа и обмен транспортных средств, недвижимости, бизнесов и номеров.',
    icon: 'shopping-cart'
  },
  {
    id: 'misc',
    title: 'Свободное общение',
    description: 'Курилка, поиск напарников, медиа, скриншоты и обсуждение всего подряд.',
    icon: 'message-square'
  }
];

export const INITIAL_TOPICS = [];
