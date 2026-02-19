/**
 * api.js - API 请求封装
 * 统一处理与后端 Cloudflare Functions 的通信
 */

const API = {
    /**
     * 获取所有生日记录
     * @param {Object} params - 查询参数
     * @param {string} [params.relation] - 按关系过滤
     * @param {string} [params.search] - 按姓名搜索
     * @returns {Promise<Array>} 生日记录列表
     */
    async fetchBirthdays(params = {}) {
        const url = new URL('/api/birthdays', window.location.origin);
        if (params.relation) url.searchParams.set('relation', params.relation);
        if (params.search) url.searchParams.set('search', params.search);

        const res = await fetch(url.toString());
        const data = await res.json();
        if (!data.success) throw new Error(data.error || '获取数据失败');
        return data.data;
    },

    /**
     * 创建新的生日记录
     * @param {Object} birthday - 生日数据
     * @returns {Promise<Object>} 创建的记录
     */
    async createBirthday(birthday) {
        const res = await fetch('/api/birthday', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(birthday),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || '创建失败');
        return data.data;
    },

    /**
     * 更新生日记录
     * @param {number} id - 记录 ID
     * @param {Object} birthday - 更新数据
     * @returns {Promise<Object>} 更新后的记录
     */
    async updateBirthday(id, birthday) {
        const res = await fetch(`/api/birthday/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(birthday),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || '更新失败');
        return data.data;
    },

    /**
     * 删除生日记录
     * @param {number} id - 记录 ID
     * @returns {Promise<void>}
     */
    async deleteBirthday(id) {
        const res = await fetch(`/api/birthday/${id}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || '删除失败');
    },
};
