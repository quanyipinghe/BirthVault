/**
 * _middleware.js - Cloudflare Pages 中间件
 * 1. 认证拦截：未登录用户重定向到登录页
 * 2. 数据库初始化：API 请求前确保表存在
 */

// 标记是否已完成迁移检查（进程级缓存）
let dbReady = false;

/**
 * 确保数据库表已创建
 * @param {Object} env - 环境变量绑定
 */
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

/**
 * 从 Cookie 字符串中解析指定 Cookie 的值
 * @param {string} cookieStr - Cookie 头字符串
 * @param {string} name - Cookie 名称
 * @returns {string|null} Cookie 值
 */
function getCookieValue(cookieStr, name) {
    const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? match[1] : null;
}

/**
 * 验证 HMAC Token 是否有效
 * @param {string} token - Token 字符串
 * @param {string} secret - 密钥
 * @returns {Promise<boolean>} 是否有效
 */
async function verifyToken(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 2) return false;

        const [payloadB64, signatureHex] = parts;
        const payload = atob(payloadB64);

        // 重新计算签名
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const expectedSignature = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(payload)
        );

        const expectedHex = Array.from(new Uint8Array(expectedSignature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return signatureHex === expectedHex;
    } catch {
        return false;
    }
}

// 不需要认证的路径白名单
const PUBLIC_PATHS = [
    '/login',
    '/login.html',
    '/api/login',
    '/api/auth-check',
];

/**
 * 检查请求路径是否在白名单中
 * @param {string} pathname - 请求路径
 * @returns {boolean} 是否为公开路径
 */
function isPublicPath(pathname) {
    return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 静态资源（CSS、JS、字体、图片）不拦截
    if (pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        return context.next();
    }

    // 公开路径不拦截
    if (isPublicPath(pathname)) {
        // 登录 API 仍需数据库准备（虽然登录本身不需要，保持一致性）
        return context.next();
    }

    // ===== 认证检查 =====
    const cookie = request.headers.get('Cookie') || '';
    const token = getCookieValue(cookie, 'auth_token');
    const secret = env.AUTH_SECRET || 'birthvault-secret-key-change-me';

    let isAuthenticated = false;
    if (token) {
        isAuthenticated = await verifyToken(token, secret);
    }

    if (!isAuthenticated) {
        // API 请求返回 401
        if (pathname.startsWith('/api/')) {
            return Response.json(
                { success: false, error: '未登录，请先登录' },
                { status: 401 }
            );
        }

        // 页面请求重定向到登录页
        return Response.redirect(new URL('/login', request.url).toString(), 302);
    }

    // ===== 已认证，继续处理 =====
    // API 请求确保数据库就绪
    if (pathname.startsWith('/api/')) {
        await ensureDatabase(env);
    }

    return context.next();
}
