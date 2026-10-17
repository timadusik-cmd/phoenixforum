import bcrypt from 'bcryptjs';
import db, { initDatabase } from './db.js';

export function seed() {
  initDatabase();

  const countCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;

  if (countCategories > 0) {
    console.log('[Seed] Database already contains categories. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding database with official categories and administration accounts...');

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Seed Administration and Demo Users
  const insertUser = db.prepare(`
    INSERT INTO users (
      id, email, username, character_name, password_hash, avatar, role, role_color, role_badge, 
      status, level, current_xp, reputation, fraction, server, bio, created_at
    ) VALUES (
      @id, @email, @username, @character_name, @password_hash, @avatar, @role, @role_color, @role_badge,
      @status, @level, @current_xp, @reputation, @fraction, @server, @bio, CURRENT_TIMESTAMP
    )
  `);

  const adminId = 'u_ivan_petrov';

  insertUser.run({
    id: adminId,
    email: 'admin@phoenix-rp.ru',
    username: 'Ivan_Petrov',
    character_name: 'Ivan Petrov',
    password_hash: passwordHash,
    avatar: '/assets/avatar_admin.jpg',
    role: 'superadmin',
    role_color: '#FF1F36',
    role_badge: 'ГЛАВНЫЙ АДМИНИСТРАТОР',
    status: 'online',
    level: 25,
    current_xp: 4500,
    reputation: 250,
    fraction: 'Руководство проекта PHOENIX',
    server: 'Phoenix RP #1 (Los Santos)',
    bio: 'Создатель и руководитель проекта Phoenix RP GTA 5.'
  });

  // Seed default custom badges
  const insertBadge = db.prepare(`
    INSERT OR IGNORE INTO custom_badges (id, key, title, subtitle, color, glow, icon, level, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  insertBadge.run('cb_leader_lspd', 'leader_lspd', 'ШЕФ LSPD', 'Полицейский департамент', '#0091FF', 'rgba(0, 145, 255, 0.4)', 'shield', 2, adminId);
  insertBadge.run('cb_curator_gos', 'curator_gos', 'КУРАТОР ГОС. СТРУКТУР', 'Руководство сервера', '#F59E0B', 'rgba(245, 158, 11, 0.4)', 'award', 4, adminId);
  insertBadge.run('cb_coder', 'coder', 'CODER', 'CODER OF PROJECT', '#ffffff', 'rgba(255, 255, 255, 0.4)', 'code', 5, adminId);
  insertBadge.run('cb_a_r_i_k', 'a_r_i_k', 'ᚹ⧼A̼⧽ᛠ⧼R̼⧽I⧼K̼⧽', 'OWNER', '#9d0b0b', 'rgba(157, 11, 11, 0.4)', 'crown', 2, adminId);

  // 2. Seed the 7 Categories as per prompt specification
  const insertCategory = db.prepare(`
    INSERT INTO categories (id, slug, title, description, icon, display_order, is_locked, min_role_to_post)
    VALUES (@id, @slug, @title, @description, @icon, @display_order, @is_locked, @min_role_to_post)
  `);

  const categories = [
    {
      id: 'cat_news',
      slug: 'news',
      title: 'Новости и объявления',
      description: 'Официальные новости проекта, обновления лаунчера, анонсы и важные события.',
      icon: 'megaphone',
      display_order: 1,
      is_locked: 0,
      min_role_to_post: 'admin'
    },
    {
      id: 'cat_rules',
      slug: 'rules',
      title: 'Правила сервера',
      description: 'Действующий регламент проекта Phoenix RP, правила государственных структур, банд и форума.',
      icon: 'shield',
      display_order: 2,
      is_locked: 0,
      min_role_to_post: 'admin'
    },
    {
      id: 'cat_tech',
      slug: 'tech',
      title: 'Технический раздел',
      description: 'Помощь с запуском игры, сообщения о багах, вопросы по лаунчеру и предложения по улучшению.',
      icon: 'settings',
      display_order: 3,
      is_locked: 0,
      min_role_to_post: 'player'
    },
    {
      id: 'cat_rp',
      slug: 'rp',
      title: 'RolePlay раздел',
      description: 'RP биографии, квенты персонажей, неофициальные организации, мафии и идеи для RP.',
      icon: 'user',
      display_order: 4,
      is_locked: 0,
      min_role_to_post: 'player'
    },
    {
      id: 'cat_reports',
      slug: 'reports',
      title: 'Жалобы',
      description: 'Подача жалоб на игроков, лидеров организаций, администрацию и нарушения правил сервера.',
      icon: 'alert-circle',
      display_order: 5,
      is_locked: 0,
      min_role_to_post: 'player'
    },
    {
      id: 'cat_market',
      slug: 'market',
      title: 'Торговая площадка',
      description: 'Покупка, продажа и обмен транспортных средств, недвижимости, бизнесов и номеров.',
      icon: 'shopping-cart',
      display_order: 6,
      is_locked: 0,
      min_role_to_post: 'player'
    },
    {
      id: 'cat_general',
      slug: 'general',
      title: 'Свободное общение',
      description: 'Флудилка, знакомства, скриншоты, видео с сервера, юмор и свободные обсуждения.',
      icon: 'message-square',
      display_order: 7,
      is_locked: 0,
      min_role_to_post: 'player'
    }
  ];

  for (const cat of categories) {
    insertCategory.run(cat);
  }

  // 3. Seed Starter Threads & First Posts
  const insertThread = db.prepare(`
    INSERT INTO threads (id, category_id, author_id, title, tag, is_pinned, is_locked, is_solved, is_important, views_count, created_at, updated_at)
    VALUES (@id, @category_id, @author_id, @title, @tag, @is_pinned, @is_locked, @is_solved, @is_important, @views_count, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const insertPost = db.prepare(`
    INSERT INTO posts (id, thread_id, author_id, content, is_first_post, is_solution, created_at, updated_at)
    VALUES (@id, @thread_id, @author_id, @content, @is_first_post, @is_solution, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  // Thread 1: Welcome News
  const threadNewsId = 'th_welcome_phoenix';
  insertThread.run({
    id: threadNewsId,
    category_id: 'cat_news',
    author_id: adminId,
    title: 'Открытие официального форума PHOENIX PROJECT RP!',
    tag: 'Анонс',
    is_pinned: 1,
    is_locked: 0,
    is_solved: 0,
    is_important: 1,
    views_count: 142
  });

  insertPost.run({
    id: 'post_' + Date.now() + '_1',
    thread_id: threadNewsId,
    author_id: adminId,
    content: `Уважаемые игроки сервера **PHOENIX RP**!\n\nМы рады представить вам наш новый, современный и функциональный форум. Здесь вы сможете:\n- Быть в курсе всех обновлений проекта и игрового мода.\n- Подавать жалобы и обращаться в технический раздел.\n- Развивать своего персонажа, публиковать RP биографии и регистрировать фракции.\n- Торговать имуществом и общаться с единомышленниками.\n\nДобро пожаловать в семью Phoenix RP!`,
    is_first_post: 1,
    is_solution: 0
  });


  // Thread 2: Official Rules
  const threadRulesId = 'th_official_rules';
  insertThread.run({
    id: threadRulesId,
    category_id: 'cat_rules',
    author_id: adminId,
    title: 'Основной регламент и правила поведения на сервере Phoenix RP',
    tag: 'Правила',
    is_pinned: 1,
    is_locked: 1,
    is_solved: 0,
    is_important: 1,
    views_count: 320
  });

  insertPost.run({
    id: 'post_' + Date.now() + '_3',
    thread_id: threadRulesId,
    author_id: adminId,
    content: `## Основные правила сервера PHOENIX PROJECT RP\n\n1. **DM (Deathmatch)** — запрещено убийство или причинение вреда персонажу без весомой IC причины.\n2. **DB (DriveBy)** — запрещено намеренное нанесение урона транспортом.\n3. **MG (Metagaming)** — запрещено использование информации из реального мира (OOC) в игровом процессе (IC).\n4. **PG (Powergaming)** — запрещено преувеличение физических возможностей своего персонажа.\n5. **Уважение к игрокам** — запрещены любые проявления токсичности, оскорбления родных и расизм.\n\nСоблюдайте правила и приятной игры на Phoenix RP!`,
    is_first_post: 1,
    is_solution: 0
  });

  // System Notification for Admin
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
    VALUES (@id, @user_id, @type, @title, @text, @link, @is_read, CURRENT_TIMESTAMP)
  `);

  insertNotif.run({
    id: 'notif_init_1',
    user_id: adminId,
    type: 'system',
    title: 'Форум Phoenix RP успешно запущен',
    text: 'База данных инициализирована. Доступна панель администратора.',
    link: '/admin',
    is_read: 0
  });

  console.log('[Seed] Database successfully seeded with 7 categories, 1 admin account, and initial topics.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed();
}
