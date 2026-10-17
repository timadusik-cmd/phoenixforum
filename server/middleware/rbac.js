const ROLE_LEVELS = {
  guest: 0,
  player: 1,
  verified: 1,
  vip: 1,
  streamer: 1,
  helper: 2,
  moderator: 3,
  admin: 4,
  developer: 5,
  superadmin: 5
};

export function hasPermission(userRole, minRole) {
  const userLevel = ROLE_LEVELS[userRole] || 1;
  const targetLevel = ROLE_LEVELS[minRole] || 1;
  return userLevel >= targetLevel;
}

export function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация.' });
    }
    if (!hasPermission(req.user.role, minRole)) {
      return res.status(403).json({ error: 'У вас недостаточно прав для выполнения этого действия.' });
    }
    next();
  };
}
