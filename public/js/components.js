/**
 * components.js - UI 组件
 * 生日卡片、Toast 通知等可复用 UI 组件
 */

const Components = {
    /**
     * 渲染生日卡片 HTML
     * @param {Object} birthday - 生日记录
     * @returns {string} HTML 字符串
     */
    birthdayCard(birthday) {
        const days = daysUntilBirthday(birthday.birthday);
        const age = getAge(birthday.birthday);
        const zodiac = getZodiacSign(birthday.birthday);
        const countdown = formatCountdown(days);
        const dateStr = formatDate(birthday.birthday);

        return `
      <div class="birthday-card" data-id="${birthday.id}" onclick="App.viewBirthday(${birthday.id})">
        <div class="card-actions">
          <button class="card-action-btn" onclick="event.stopPropagation(); App.editBirthday(${birthday.id})" title="编辑">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="card-action-btn delete" onclick="event.stopPropagation(); App.confirmDelete(${birthday.id}, '${birthday.name.replace(/'/g, "\\'")}')" title="删除">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="card-header">
          <div class="card-avatar">${birthday.avatar_emoji || '🎂'}</div>
          <div class="card-info">
            <div class="card-name">${this.escapeHtml(birthday.name)}</div>
            ${birthday.relation ? `<div class="card-relation">${this.escapeHtml(birthday.relation)}</div>` : ''}
          </div>
        </div>
        <div class="card-body">
          <div class="card-detail">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${dateStr}</span>
          </div>
          <div class="card-detail">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${age >= 0 ? age + ' 岁' : ''} · ${zodiac}</span>
          </div>
        </div>
        <div class="card-countdown">
          <span class="countdown-badge ${countdown.type}">${countdown.text}</span>
        </div>
      </div>
    `;
    },

    /**
     * 显示 Toast 通知
     * @param {string} message - 消息内容
     * @param {'success'|'error'} type - 类型
     * @param {number} duration - 显示时长(毫秒)
     */
    showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toastContainer');

        // SVG 图标
        const icons = {
            success: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `${icons[type] || ''}<span>${message}</span>`;
        container.appendChild(toast);

        // 触发动画
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 自动移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    },

    /**
     * HTML 转义
     * @param {string} str - 原始字符串
     * @returns {string} 转义后的字符串
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
};
