// Phoenix RP Forum - Awards & Level Progression System
// Matches the official 20 Forum Awards & 50 Levels reference

// 1. Calculate XP thresholds for 50 Forum Levels
export const LEVEL_THRESHOLDS = (() => {
  const arr = [0]; // Level 1 starts at 0 XP
  let cumulative = 0;
  for (let lvl = 2; lvl <= 50; lvl++) {
    // Progressive XP requirement per level
    const step = 50 + (lvl * 35);
    cumulative += step;
    arr.push(cumulative);
  }
  return arr;
})();

export function getLevelFromXp(xp = 0) {
  const cleanXp = Math.max(0, parseInt(xp) || 0);
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (cleanXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1; // 1-indexed (Level 1..50)
    }
  }
  return 1;
}

export function getLevelProgress(xp = 0) {
  const cleanXp = Math.max(0, parseInt(xp) || 0);
  const level = getLevelFromXp(cleanXp);
  const levelIdx = level - 1;

  if (level >= 50) {
    const currentLevelXp = LEVEL_THRESHOLDS[49];
    return {
      level: 50,
      currentXp: cleanXp,
      currentLevelXp,
      nextLevelXp: currentLevelXp,
      xpInLevel: cleanXp - currentLevelXp,
      xpNeededForNext: 0,
      percent: 100,
      isMaxLevel: true
    };
  }

  const currentLevelXp = LEVEL_THRESHOLDS[levelIdx];
  const nextLevelXp = LEVEL_THRESHOLDS[levelIdx + 1];
  const range = nextLevelXp - currentLevelXp;
  const xpInLevel = Math.max(0, cleanXp - currentLevelXp);
  const percent = Math.min(100, Math.max(0, Math.round((xpInLevel / range) * 100)));

  return {
    level,
    currentXp: cleanXp,
    currentLevelXp,
    nextLevelXp,
    xpInLevel,
    xpNeededForNext: nextLevelXp - cleanXp,
    percent,
    isMaxLevel: false
  };
}

// 2. The 20 Official Forum Awards matching Phoenix RP reference
export const AWARDS_LIST = [
  {
    id: 'award_01',
    number: '01',
    title: 'ПЕРВЫЙ ПОЛЬЗОВАТЕЛЬ',
    description: 'Один из первых первопроходцев, зарегистрировавшихся на форуме.',
    icon_key: 'phoenix',
    category: 'honor',
    rarity: 'legendary',
    condition_desc: 'Зарегистрироваться в числе первых участников проекта'
  },
  {
    id: 'award_02',
    number: '02',
    title: 'СТАРОЖИЛ ФОРУМА',
    description: 'Пользователь, чей аккаунт существует на форуме более 30 дней.',
    icon_key: 'crown_laurel',
    category: 'honor',
    rarity: 'epic',
    condition_desc: 'Быть зарегистрированным более 30 дней'
  },
  {
    id: 'award_03',
    number: '03',
    title: 'АКТИВНЫЙ УЧАСТНИК',
    description: 'Написал более 20 полезных ответов в различных темах форума.',
    icon_key: 'chat_laurel',
    category: 'activity',
    rarity: 'rare',
    condition_desc: 'Опубликовать от 20 сообщений на форуме'
  },
  {
    id: 'award_04',
    number: '04',
    title: 'ЛИДЕР ОБСУЖДЕНИЙ',
    description: 'Создал более 5 актуальных тем с высоким интересом участников.',
    icon_key: 'flame_laurel',
    category: 'activity',
    rarity: 'rare',
    condition_desc: 'Создать 5 или более тем на форуме'
  },
  {
    id: 'award_05',
    number: '05',
    title: 'ЛУЧШИЙ ПОСТ',
    description: 'Ответ автора признан официальным решением или собрал массу реакций.',
    icon_key: 'star_doc',
    category: 'honor',
    rarity: 'epic',
    condition_desc: 'Получить отметку официального решения проблемы'
  },
  {
    id: 'award_06',
    number: '06',
    title: 'ЭКСПЕРТ СЕРВЕРА',
    description: 'Обладает глубокими знаниями игрового мода, правил и систем проекта.',
    icon_key: 'grad_cap',
    category: 'special',
    rarity: 'rare',
    condition_desc: 'Достичь 15-го уровня форума или получить статус эксперта'
  },
  {
    id: 'award_07',
    number: '07',
    title: 'ПОМОЩНИК НОВИЧКОВ',
    description: 'Регулярно помогает начинающим игрокам освоиться на сервере.',
    icon_key: 'handshake_laurel',
    category: 'community',
    rarity: 'rare',
    condition_desc: 'Активная помощь в разделе вопросов или статус хелпера'
  },
  {
    id: 'award_08',
    number: '08',
    title: 'ПОДДЕРЖКА ПРОЕКТА',
    description: 'Вносит неоценимый вклад в развитие, стабильность и жизнь комьюнити.',
    icon_key: 'heart_laurel',
    category: 'honor',
    rarity: 'epic',
    condition_desc: 'Особый вклад в развитие и поддержку проекта'
  },
  {
    id: 'award_09',
    number: '09',
    title: 'УЧАСТНИК ИВЕНТОВ',
    description: 'Активный участник официальных форумных мероприятий и конкурсов.',
    icon_key: 'calendar_check',
    category: 'community',
    rarity: 'common',
    condition_desc: 'Участие в форумных конкурсах и мероприятиях'
  },
  {
    id: 'award_10',
    number: '10',
    title: 'КАЗНАЧЕЙ ФОРУМА',
    description: 'Активный участник торговой площадки и экономической жизни сервера.',
    icon_key: 'coins_laurel',
    category: 'activity',
    rarity: 'rare',
    condition_desc: 'Создать тему в торговом разделе или набрать высокий оборот'
  },
  {
    id: 'award_11',
    number: '11',
    title: 'ЦЕНИТЕЛЬ СТИЛЯ',
    description: 'Индивидуально оформил профиль: кастомный аватар, обложку и подпись.',
    icon_key: 'jacket',
    category: 'community',
    rarity: 'common',
    condition_desc: 'Заполнить профиль, установить аватар, баннер и подпись'
  },
  {
    id: 'award_12',
    number: '12',
    title: 'КОЛЛЕКЦИОНЕР РЕДКОСТЕЙ',
    description: 'Собрал коллекцию из не менее чем 5 наград и форумных достижений.',
    icon_key: 'lootbox',
    category: 'honor',
    rarity: 'epic',
    condition_desc: 'Открыть 5 различных наград на форуме'
  },
  {
    id: 'award_13',
    number: '13',
    title: 'ВЕЗУНЧИК',
    description: 'Победитель в розыгрышах ценных призов и форумных викторинах.',
    icon_key: 'dice',
    category: 'special',
    rarity: 'epic',
    condition_desc: 'Победа в официальном розыгрыше или лотерее'
  },
  {
    id: 'award_14',
    number: '14',
    title: 'ГОНЩИК ФОРУМА',
    description: 'Молниеносная реакция на важные события и ответы в первых рядах.',
    icon_key: 'speedometer',
    category: 'activity',
    rarity: 'rare',
    condition_desc: 'Высокая скорость реакции и регулярные ответы'
  },
  {
    id: 'award_15',
    number: '15',
    title: 'ФОТОГРАФ ПРОЕКТА',
    description: 'Автор крутых скриншотов, атмосферных артов и медиа-материалов.',
    icon_key: 'camera',
    category: 'community',
    rarity: 'rare',
    condition_desc: 'Публикация качественных скриншотов и медиа на форуме'
  },
  {
    id: 'award_16',
    number: '16',
    title: 'МАСТЕР КРЕАТИВА',
    description: 'Генератор креативных предложений и идей по улучшению проекта.',
    icon_key: 'lightbulb',
    category: 'community',
    rarity: 'rare',
    condition_desc: 'Предложить одобренное улучшение для проекта'
  },
  {
    id: 'award_17',
    number: '17',
    title: 'ДРУГ СООБЩЕСТВА',
    description: 'Заслужил уважение и дружбу многих участников с репутацией +15 и выше.',
    icon_key: 'users_group',
    category: 'honor',
    rarity: 'epic',
    condition_desc: 'Набрать +15 или более очков репутации'
  },
  {
    id: 'award_18',
    number: '18',
    title: 'ВЕТЕРАН ПРОЕКТА',
    description: 'Достиг 10-го уровня форума и доказал свою преданность серверу.',
    icon_key: 'shield_star',
    category: 'honor',
    rarity: 'epic',
    condition_desc: 'Достичь 10-го уровня на форуме'
  },
  {
    id: 'award_19',
    number: '19',
    title: 'ЛЕГЕНДА ФОРУМА',
    description: 'Достиг 25-го уровня форума и стал непререкаемым авторитетом.',
    icon_key: 'legend_star',
    category: 'honor',
    rarity: 'legendary',
    condition_desc: 'Достичь 25-го уровня на форуме'
  },
  {
    id: 'award_20',
    number: '20',
    title: 'ГЛАВНЫЙ АКТИВИСТ',
    description: 'Высшая награда за покорение 50-го уровня форума и колоссальный вклад.',
    icon_key: 'phoenix_activist',
    category: 'honor',
    rarity: 'legendary',
    condition_desc: 'Достичь максимального 50-го уровня на форуме'
  }
];

// Seed the 20 awards in database if table is empty
export function seedAwards(db) {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM awards').get().count;
    if (count < 20) {
      const insert = db.prepare(`
        INSERT OR REPLACE INTO awards (id, number, title, description, icon_key, category, rarity, condition_desc, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      for (const a of AWARDS_LIST) {
        insert.run(a.id, a.number, a.title, a.description, a.icon_key, a.category, a.rarity, a.condition_desc);
      }
    }
  } catch (err) {
    console.error('Error seeding awards:', err);
  }
}

// Check and automatically grant eligible awards to user
export function checkAndGrantUserAwards(db, userId) {
  if (!userId) return [];
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return [];

    const topicsCount = db.prepare('SELECT COUNT(*) as count FROM threads WHERE author_id = ?').get(userId).count;
    const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE author_id = ?').get(userId).count;
    const solutionsCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE author_id = ? AND is_solution = 1').get(userId).count;

    // Existing user awards
    const existing = new Set(
      db.prepare('SELECT award_id FROM user_awards WHERE user_id = ?').all(userId).map(r => r.award_id)
    );

    const newlyGranted = [];

    const grant = (awardId, reason) => {
      if (existing.has(awardId)) return;
      const aw = AWARDS_LIST.find(a => a.id === awardId);
      if (!aw) return;

      const uaId = 'ua_' + Date.now() + '_' + Math.round(Math.random() * 1000);
      db.prepare(`
        INSERT OR IGNORE INTO user_awards (id, user_id, award_id, assigned_by, reason, created_at)
        VALUES (?, ?, ?, 'system', ?, CURRENT_TIMESTAMP)
      `).run(uaId, userId, awardId, reason);

      existing.add(awardId);
      newlyGranted.push(aw);

      // Notification to user
      try {
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
          VALUES (?, ?, 'award', '🎉 Получена новая награда форума!', ?, ?, 0, CURRENT_TIMESTAMP)
        `).run(
          'notif_' + Date.now() + '_' + Math.round(Math.random() * 1000),
          userId,
          `Вам присвоена официальная награда: «${aw.title}» (${aw.number}). ${reason}`,
          `/forum/profile/${user.username}`
        );
      } catch {}
    };

    // Rule 1: First user (e.g. first 10 registered or Ivan_Petrov)
    const allUsersFirst = db.prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 10').all();
    if (allUsersFirst.some(u => u.id === userId)) {
      grant('award_01', 'Один из первых зарегистрированных участников форума');
    }

    // Rule 2: Registered > 30 days
    if (user.created_at) {
      const days = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (days >= 30) {
        grant('award_02', 'Аккаунт существует более 30 дней');
      }
    }

    // Rule 3: Posts >= 20
    if (postsCount >= 20) {
      grant('award_03', 'Опубликовано более 20 сообщений на форуме');
    }

    // Rule 4: Threads >= 5
    if (topicsCount >= 5) {
      grant('award_04', 'Создано более 5 обсуждений на форуме');
    }

    // Rule 5: Solution post
    if (solutionsCount >= 1) {
      grant('award_05', 'Ответ автора признан официальным решением вопроса');
    }

    // Rule 6: Level >= 15
    if (user.level >= 15) {
      grant('award_06', 'Достигнут 15-й уровень форума');
    }

    // Rule 7: Helper role or moderation
    if (['helper', 'moderator', 'admin', 'superadmin'].includes(user.role)) {
      grant('award_07', 'Статус хелпера или модератора проекта');
    }

    // Rule 11: Style enthusiast (has customized profile, avatar not default, signature or bio)
    if (user.signature && user.bio && user.bio !== 'Игрок сервера Phoenix RP') {
      grant('award_11', 'Индивидуально оформленный профиль и подпись');
    }

    // Rule 17: Reputation >= 15
    if (user.reputation >= 15) {
      grant('award_17', 'Репутация на форуме достигла отметки +15');
    }

    // Rule 18: Level >= 10
    if (user.level >= 10) {
      grant('award_18', 'Достигнут 10-й уровень форума (Ветеран)');
    }

    // Rule 19: Level >= 25
    if (user.level >= 25) {
      grant('award_19', 'Достигнут 25-й уровень форума (Легенда)');
    }

    // Rule 20: Level >= 50
    if (user.level >= 50) {
      grant('award_20', 'Достигнут максимальный 50-й уровень форума (Главный активист)');
    }

    // Rule 12: Collector (if user now has 5+ awards)
    if (existing.size >= 5) {
      grant('award_12', 'Собрано 5 различных наград на форуме');
    }

    return newlyGranted;
  } catch (err) {
    console.error('Error checking user awards:', err);
    return [];
  }
}

// Get full awards status for a user (all 20 with unlocked flag)
export function getUserAwardsFull(db, userId) {
  try {
    const userAwardsMap = new Map();
    if (userId) {
      const rows = db.prepare(`
        SELECT ua.award_id, ua.reason, ua.created_at, ua.assigned_by
        FROM user_awards ua
        WHERE ua.user_id = ?
        ORDER BY ua.created_at ASC
      `).all(userId);
      for (const r of rows) {
        userAwardsMap.set(r.award_id, r);
      }
    }

    return AWARDS_LIST.map(a => {
      const uAward = userAwardsMap.get(a.id);
      return {
        ...a,
        is_unlocked: !!uAward,
        unlocked_at: uAward ? uAward.created_at : null,
        reason: uAward ? uAward.reason : null,
        assigned_by: uAward ? uAward.assigned_by : null
      };
    });
  } catch (err) {
    console.error('Error getting full user awards:', err);
    return AWARDS_LIST.map(a => ({ ...a, is_unlocked: false }));
  }
}
