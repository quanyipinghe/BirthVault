/**
 * /api/birthday/:id - 单条生日记录的 CRUD 操作
 * GET    - 获取记录详情
 * PUT    - 更新记录
 * DELETE - 删除记录
 */

// GET /api/birthday/:id - 获取单条记录
export async function onRequestGet(context) {
    const { env, params } = context;
    const id = params.id;

    try {
        const { results } = await env.DB.prepare(
            'SELECT * FROM birthdays WHERE id = ?'
        )
            .bind(id)
            .all();

        if (!results || results.length === 0) {
            return Response.json(
                { success: false, error: '记录不存在' },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            data: results[0],
        });
    } catch (error) {
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/birthday/:id - 更新记录
export async function onRequestPut(context) {
    const { env, params, request } = context;
    const id = params.id;

    try {
        const body = await request.json();

        // 验证必填字段
        if (!body.name || !body.birthday) {
            return Response.json(
                { success: false, error: '姓名和生日日期为必填项' },
                { status: 400 }
            );
        }

        const stmt = env.DB.prepare(
            `UPDATE birthdays
       SET name = ?, birthday = ?, lunar = ?, relation = ?,
           phone = ?, notes = ?, avatar_emoji = ?,
           updated_at = datetime('now')
       WHERE id = ?`
        );

        const result = await stmt
            .bind(
                body.name,
                body.birthday,
                body.lunar ? 1 : 0,
                body.relation || '',
                body.phone || '',
                body.notes || '',
                body.avatar_emoji || '🎂',
                id
            )
            .run();

        if (result.meta.changes === 0) {
            return Response.json(
                { success: false, error: '记录不存在' },
                { status: 404 }
            );
        }

        // 获取更新后的记录
        const { results } = await env.DB.prepare(
            'SELECT * FROM birthdays WHERE id = ?'
        )
            .bind(id)
            .all();

        return Response.json({
            success: true,
            data: results[0],
        });
    } catch (error) {
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/birthday/:id - 删除记录
export async function onRequestDelete(context) {
    const { env, params } = context;
    const id = params.id;

    try {
        const result = await env.DB.prepare(
            'DELETE FROM birthdays WHERE id = ?'
        )
            .bind(id)
            .run();

        if (result.meta.changes === 0) {
            return Response.json(
                { success: false, error: '记录不存在' },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: '已删除',
        });
    } catch (error) {
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
