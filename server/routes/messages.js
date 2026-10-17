import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 1. Get All User Conversations
router.get('/conversations', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    const convs = db.prepare(`
      SELECT c.*,
             CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_user_id
      FROM conversations c
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.last_message_at DESC
    `).all(userId, userId, userId);

    const getUser = db.prepare(`
      SELECT id, username, character_name, avatar, role, role_badge, role_color, status
      FROM users WHERE id = ?
    `);

    const getUnread = db.prepare(`
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `);

    const results = convs.map(c => {
      const otherUser = getUser.get(c.other_user_id) || {
        id: c.other_user_id,
        username: 'Неизвестный',
        avatar: '/assets/avatar_ivan.jpg',
        role: 'player',
        status: 'offline'
      };
      const unreadCount = getUnread.get(c.id, userId).count;

      return {
        id: c.id,
        last_message: c.last_message,
        last_message_at: c.last_message_at,
        created_at: c.created_at,
        unreadCount,
        otherUser
      };
    });

    res.json({ conversations: results });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении списка диалогов.' });
  }
});

// 2. Get Messages in a Conversation
router.get('/conversations/:id', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const convId = req.params.id;

    const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
    if (!conv) {
      return res.status(404).json({ error: 'Диалог не найден.' });
    }

    if (conv.user1_id !== userId && conv.user2_id !== userId) {
      return res.status(403).json({ error: 'У вас нет доступа к этой переписке.' });
    }

    const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
    const otherUser = db.prepare(`
      SELECT id, username, character_name, avatar, role, role_badge, role_color, status
      FROM users WHERE id = ?
    `).get(otherUserId);

    // Mark unread messages sent to me as read
    db.prepare(`
      UPDATE messages 
      SET is_read = 1 
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `).run(convId, userId);

    const messages = db.prepare(`
      SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `).all(convId);

    res.json({
      conversation: conv,
      otherUser,
      messages
    });
  } catch (err) {
    console.error('Error fetching conversation messages:', err);
    res.status(500).json({ error: 'Ошибка сервера при загрузке сообщений.' });
  }
});

// 3. Send Message (by conversation_id or directly to recipient_id)
router.post('/send', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { conversation_id, recipient_id, recipient_username, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Текст сообщения не может быть пустым.' });
    }

    const cleanText = text.trim();
    let convId = conversation_id;
    let targetRecipientId = recipient_id;

    if (!targetRecipientId && recipient_username) {
      const foundUser = db.prepare('SELECT id, username FROM users WHERE LOWER(username) = LOWER(?)').get(recipient_username.trim());
      if (!foundUser) {
        return res.status(404).json({ error: `Пользователь с никнеймом "${recipient_username}" не найден.` });
      }
      targetRecipientId = foundUser.id;
    }

    if (convId) {
      const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
      if (!conv) return res.status(404).json({ error: 'Диалог не найден.' });
      if (conv.user1_id !== userId && conv.user2_id !== userId) {
        return res.status(403).json({ error: 'Нет доступа к диалогу.' });
      }
      targetRecipientId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
    } else if (targetRecipientId) {
      if (targetRecipientId === userId) {
        return res.status(400).json({ error: 'Нельзя отправить личное сообщение самому себе.' });
      }

      const recipient = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetRecipientId);
      if (!recipient) {
        return res.status(404).json({ error: 'Получатель не найден.' });
      }

      // Check if conversation already exists between these two users
      const existing = db.prepare(`
        SELECT id FROM conversations 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `).get(userId, targetRecipientId, targetRecipientId, userId);

      if (existing) {
        convId = existing.id;
      } else {
        convId = 'conv_' + Date.now() + '_' + Math.round(Math.random() * 1000);
        db.prepare(`
          INSERT INTO conversations (id, user1_id, user2_id, last_message, last_message_at, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(convId, userId, targetRecipientId, cleanText);
      }
    } else {
      return res.status(400).json({ error: 'Не указан собеседник или диалог.' });
    }

    const msgId = 'msg_' + Date.now() + '_' + Math.round(Math.random() * 1000);

    const tx = db.transaction(() => {
      // 1. Insert message
      db.prepare(`
        INSERT INTO messages (id, conversation_id, sender_id, text, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(msgId, convId, userId, cleanText);

      // 2. Update conversation last message
      db.prepare(`
        UPDATE conversations 
        SET last_message = ?, last_message_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(cleanText, convId);

      // 3. Send notification to recipient
      if (targetRecipientId) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, text, link, is_read, created_at)
          VALUES (?, ?, 'reply', 'Новое личное сообщение', ?, ?, 0, CURRENT_TIMESTAMP)
        `).run(
          'notif_' + Date.now(),
          targetRecipientId,
          `${req.user.username}: «${cleanText.substring(0, 60)}»`,
          `/forum/messages?conv=${convId}`
        );
      }
    });

    tx();

    const createdMsg = db.prepare(`
      SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(msgId);

    res.json({
      message: createdMsg,
      conversationId: convId
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Ошибка сервера при отправке сообщения.' });
  }
});

// 4. Get Total Unread Messages Count
router.get('/unread-count', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const count = db.prepare(`
      SELECT COUNT(*) as count 
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE (c.user1_id = ? OR c.user2_id = ?) 
        AND m.sender_id != ? 
        AND m.is_read = 0
    `).get(userId, userId, userId).count;

    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ error: 'Ошибка при подсчёте сообщений.' });
  }
});

export default router;
