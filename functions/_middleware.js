/**
 * _middleware.js - Cloudflare Pages 中间件
 * 在 API 请求前自动执行数据库迁移（确保表存在）
 */

// 标记是否已完成迁移检查（进程级缓存）
let dbReady = false;

async function ensureDatabase(env) {
    if (dbReady) return;

    try {
        // 尝试查询表是否已存在
        await env.DB.prepare('SELECT count(*) as c FROM birthdays').first();
        dbReady = true;
    } catch (e) {
        // 表不存在，逐条执行 DDL
        await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS birthdays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        birthday TEXT NOT NULL,
        lunar INTEGER DEFAULT 0,
        relation TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        avatar_emoji TEXT DEFAULT '🎂',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

        await env.DB.prepare(
            'CREATE INDEX IF NOT EXISTS idx_birthday ON birthdays(birthday)'
        ).run();

        await env.DB.prepare(
            'CREATE INDEX IF NOT EXISTS idx_relation ON birthdays(relation)'
        ).run();

        dbReady = true;
    }
}

export async function onRequest(context) {
    // 仅在 API 请求时确保数据库就绪
    if (context.request.url.includes('/api/')) {
        await ensureDatabase(context.env);
    }
    return context.next();
}
