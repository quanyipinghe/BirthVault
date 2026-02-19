/**
 * GET /api/birthdays - 获取所有生日记录
 * 支持查询参数：
 *   ?relation=xxx  按关系过滤
 *   ?search=xxx    按姓名搜索
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const relation = url.searchParams.get('relation');
  const search = url.searchParams.get('search');

  try {
    let query = 'SELECT * FROM birthdays';
    const params = [];
    const conditions = [];

    // 按关系过滤
    if (relation) {
      conditions.push('relation = ?');
      params.push(relation);
    }

    // 按姓名搜索
    if (search) {
      conditions.push('name LIKE ?');
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY birthday ASC';

    const { results } = await env.DB.prepare(query).bind(...params).all();

    return Response.json({
      success: true,
      data: results || [],
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
