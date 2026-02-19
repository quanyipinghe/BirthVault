/**
 * POST /api/birthday - 创建新的生日记录
 */
export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const body = await request.json();

        // 验证必填字段
        if (!body.name || !body.birthday) {
            return Response.json(
                { success: false, error: '姓名和生日日期为必填项' },
                { status: 400 }
            );
        }

        // 验证日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(body.birthday)) {
            return Response.json(
                { success: false, error: '日期格式应为 YYYY-MM-DD' },
                { status: 400 }
            );
        }

        const stmt = env.DB.prepare(
            `INSERT INTO birthdays (name, birthday, lunar, relation, phone, notes, avatar_emoji)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        const result = await stmt
            .bind(
                body.name,
                body.birthday,
                body.lunar ? 1 : 0,
                body.relation || '',
                body.phone || '',
                body.notes || '',
                body.avatar_emoji || '🎂'
            )
            .run();

        // 获取刚创建的记录
        const { results } = await env.DB.prepare(
            'SELECT * FROM birthdays WHERE id = ?'
        )
            .bind(result.meta.last_row_id)
            .all();

        return Response.json({
            success: true,
            data: results[0],
        }, { status: 201 });
    } catch (error) {
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
