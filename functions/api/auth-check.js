/**
 * GET /api/auth-check - 检查认证状态
 * 验证 Cookie 中的 auth_token 是否有效
 */
export async function onRequestGet(context) {
    const { env, request } = context;

    try {
        const cookie = request.headers.get('Cookie') || '';
        const token = getCookieValue(cookie, 'auth_token');

        if (!token) {
            return Response.json(
                { success: false, authenticated: false },
                { status: 401 }
            );
        }

        // 验证 Token
        const secret = env.AUTH_SECRET || 'birthvault-secret-key-change-me';
        const isValid = await verifyToken(token, secret);

        if (isValid) {
            return Response.json({ success: true, authenticated: true });
        } else {
            return Response.json(
                { success: false, authenticated: false },
                { status: 401 }
            );
        }
    } catch (error) {
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
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
 * @param {string} token - Token 字符串（格式: base64Payload.signatureHex）
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

        // 比较签名
        return signatureHex === expectedHex;
    } catch {
        return false;
    }
}
