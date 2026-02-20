/**
 * POST /api/login - 管理员登录
 * 验证用户名和密码，成功后设置 auth_token Cookie
 */
export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const body = await request.json();
        const { username, password } = body;

        // 验证输入
        if (!username || !password) {
            return Response.json(
                { success: false, error: '请输入用户名和密码' },
                { status: 400 }
            );
        }

        // 从环境变量获取管理员凭据
        const adminUsername = env.ADMIN_USERNAME || 'admin';
        const adminPassword = env.ADMIN_PASSWORD || 'birthvault2025';

        // 验证凭据
        if (username !== adminUsername || password !== adminPassword) {
            return Response.json(
                { success: false, error: '用户名或密码错误' },
                { status: 401 }
            );
        }

        // 生成认证 Token（HMAC 签名）
        const secret = env.AUTH_SECRET || 'birthvault-secret-key-change-me';
        const payload = `${username}:${Date.now()}`;
        const token = await generateToken(payload, secret);

        // 设置 Cookie，有效期 7 天
        const maxAge = 7 * 24 * 60 * 60; // 604800 秒
        const cookie = `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;

        return new Response(
            JSON.stringify({ success: true, message: '登录成功' }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': cookie,
                },
            }
        );
    } catch (error) {
        return Response.json(
            { success: false, error: '登录失败：' + error.message },
            { status: 500 }
        );
    }
}

/**
 * 使用 HMAC-SHA256 生成认证 Token
 * @param {string} payload - 载荷字符串
 * @param {string} secret - 密钥
 * @returns {Promise<string>} - Base64 编码的 Token
 */
async function generateToken(payload, secret) {
    const encoder = new TextEncoder();

    // 导入密钥
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    // 签名
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
    );

    // 将 payload 和签名拼接，编码为 Base64
    const signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Token 格式: base64(payload).signatureHex
    const payloadB64 = btoa(payload);
    return `${payloadB64}.${signatureHex}`;
}
