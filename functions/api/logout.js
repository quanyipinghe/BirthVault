/**
 * POST /api/logout - 退出登录
 * 清除 auth_token Cookie
 */
export async function onRequestPost() {
    // 通过设置 Max-Age=0 清除 Cookie
    const cookie = 'auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';

    return new Response(
        JSON.stringify({ success: true, message: '已退出登录' }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': cookie,
            },
        }
    );
}
