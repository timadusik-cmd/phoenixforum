import express from 'express';
import db from '../db.js';

const router = express.Router();

function formatConnectUrl(platform, ip, port) {
  if (platform === 'ragemp') {
    return `ragemp://${ip}:${port}`;
  } else if (platform === 'fivem') {
    return `fivem://connect/${ip}:${port}`;
  } else if (platform === 'altv') {
    return `altv://connect/${ip}:${port}`;
  }
  return `ragemp://${ip}:${port}`;
}

// GET /api/servers - Public server list and live stats
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM game_servers ORDER BY display_order ASC, created_at ASC').all();
    
    let totalOnline = 0;
    let totalSlots = 0;

    const servers = rows.map(s => {
      const isOnline = s.status === 'online';
      const online = parseInt(s.online_players) || 0;
      const max = parseInt(s.max_players) || 1000;
      const percent = max > 0 ? Math.min(100, Math.round((online / max) * 100)) : 0;
      
      if (isOnline) {
        totalOnline += online;
        totalSlots += max;
      }

      return {
        id: s.id,
        name: s.name,
        description: s.description || '',
        ip: s.ip,
        port: s.port,
        platform: s.platform || 'ragemp',
        status: s.status || 'online',
        online_players: online,
        max_players: max,
        ping_ms: parseInt(s.ping_ms) || 24,
        percent,
        launcher_url: s.launcher_url || 'https://phoenix-rp.online/launcher',
        connect_url: formatConnectUrl(s.platform, s.ip, s.port),
        banner_img: s.banner_img || '/assets/hero_banner.jpg',
        display_order: s.display_order || 1
      };
    });

    res.json({
      servers,
      totalOnline,
      totalSlots,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching game servers:', err);
    res.status(500).json({ error: 'Не удалось загрузить список серверов' });
  }
});

export default router;
