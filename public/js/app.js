/**
 * app.js - 主应用逻辑
 * 初始化、状态管理、事件绑定、页面渲染
 */

const App = {
    // 应用状态
    state: {
        birthdays: [],          // 所有生日记录
        filteredBirthdays: [],  // 过滤后的记录
        currentFilter: 'all',   // 当前过滤条件
        searchQuery: '',        // 搜索关键词
        editingId: null,        // 正在编辑的记录 ID
        deleteId: null,         // 待删除的记录 ID
        selectedEmoji: '🎂',   // 选中的 emoji
        isLoading: true,        // 加载状态
        // 日期选择器状态
        isLunar: true,          // 默认农历
        dpYear: null,           // 选中年份
        dpMonth: null,          // 选中月份索引
        dpDay: null,            // 选中日
        dpMonths: [],           // 当前年份的月份列表
    },

    // ===== 初始化 =====
    async init() {
        // 初始化主题
        this.initTheme();
        // 绑定事件
        this.bindEvents();
        // 加载数据
        await this.loadBirthdays();
    },

    // ===== 主题管理 =====
    initTheme() {
        const saved = localStorage.getItem('birthvault-theme');
        if (saved === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.updateThemeIcon(true);
        }
    },

    toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('birthvault-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('birthvault-theme', 'dark');
        }
        this.updateThemeIcon(!isDark);
    },

    updateThemeIcon(isDark) {
        const sunIcon = document.getElementById('iconSun');
        const moonIcon = document.getElementById('iconMoon');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = isDark ? 'none' : 'block';
            moonIcon.style.display = isDark ? 'block' : 'none';
        }
    },

    // ===== 数据加载 =====
    async loadBirthdays() {
        try {
            this.state.isLoading = true;
            this.showSkeleton(true);

            const data = await API.fetchBirthdays();
            this.state.birthdays = data;
            this.applyFilter();
            this.updateStats();
            this.buildFilterButtons();

            this.state.isLoading = false;
            this.showSkeleton(false);
            this.render();
        } catch (error) {
            this.state.isLoading = false;
            this.showSkeleton(false);
            this.render();
            Components.showToast('加载失败：' + error.message, 'error');
        }
    },

    // ===== 骨架屏控制 =====
    showSkeleton(show) {
        const skeleton = document.getElementById('skeletonGrid');
        if (skeleton) skeleton.style.display = show ? 'grid' : 'none';
    },

    // ===== 过滤与搜索 =====
    applyFilter() {
        let list = [...this.state.birthdays];

        // 关系过滤
        if (this.state.currentFilter !== 'all') {
            list = list.filter(b => b.relation === this.state.currentFilter);
        }

        // 搜索过滤
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            list = list.filter(b =>
                b.name.toLowerCase().includes(query) ||
                (b.notes && b.notes.toLowerCase().includes(query))
            );
        }

        // 按倒计时排序（最近的排前面）
        list.sort((a, b) => daysUntilBirthday(a) - daysUntilBirthday(b));
        this.state.filteredBirthdays = list;
    },

    setFilter(filter) {
        this.state.currentFilter = filter;
        // 更新按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.applyFilter();
        this.render();
    },

    setSearch(query) {
        this.state.searchQuery = query;
        this.applyFilter();
        this.render();
    },

    buildFilterButtons() {
        const group = document.getElementById('filterGroup');
        if (!group) return;

        // 获取所有不重复的关系类型
        const relations = [...new Set(this.state.birthdays.map(b => b.relation).filter(Boolean))];

        group.innerHTML = '<button class="filter-btn active" data-filter="all">全部</button>';
        relations.forEach(rel => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.filter = rel;
            btn.textContent = rel;
            btn.addEventListener('click', () => this.setFilter(rel));
            group.appendChild(btn);
        });

        // 重新绑定全部按钮
        group.querySelector('[data-filter="all"]').addEventListener('click', () => this.setFilter('all'));
    },

    // ===== 统计更新 =====
    updateStats() {
        const b = this.state.birthdays;
        document.getElementById('statTotal').textContent = b.length;
        document.getElementById('statMonth').textContent = getThisMonthCount(b);
        document.getElementById('statUpcoming').textContent = getUpcomingCount(b);
        document.getElementById('statToday').textContent = getTodayCount(b);
    },

    // ===== 渲染 =====
    render() {
        const grid = document.getElementById('birthdayGrid');
        const empty = document.getElementById('emptyState');

        if (this.state.filteredBirthdays.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'flex';
        } else {
            empty.style.display = 'none';
            grid.style.display = 'grid';
            grid.innerHTML = this.state.filteredBirthdays
                .map(b => Components.birthdayCard(b))
                .join('');
        }
    },

    // ===== 模态框管理 =====
    openModal(title = '添加生日') {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalOverlay').classList.add('active');
        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        document.body.style.overflow = '';
        this.resetForm();
    },

    resetForm() {
        document.getElementById('birthdayForm').reset();
        document.getElementById('formId').value = '';
        document.getElementById('formBirthday').value = '';
        document.getElementById('formLunar').value = '1';
        this.state.editingId = null;
        this.state.selectedEmoji = '🎂';
        this.state.isLunar = true;
        this.state.dpYear = null;
        this.state.dpMonth = null;
        this.state.dpDay = null;
        // 重置日期显示
        const triggerText = document.getElementById('dateTriggerText');
        if (triggerText) {
            triggerText.textContent = '点击选择日期';
            triggerText.classList.remove('has-value');
        }
        // 重置 emoji 选择
        document.querySelectorAll('.emoji-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.emoji === '🎂');
        });
        // 重置关系选择
        document.getElementById('formRelation').value = '';
        document.querySelectorAll('.relation-chip').forEach(chip => chip.classList.remove('selected'));
    },

    // ===== 添加 =====
    openAdd() {
        this.resetForm();
        this.openModal('添加生日');
    },

    // ===== 编辑 =====
    editBirthday(id) {
        const birthday = this.state.birthdays.find(b => b.id === id);
        if (!birthday) return;

        this.state.editingId = id;
        document.getElementById('formId').value = id;
        document.getElementById('formName').value = birthday.name;
        document.getElementById('formRelation').value = birthday.relation || '';
        // 回显关系标签选中状态
        document.querySelectorAll('.relation-chip').forEach(chip => {
            chip.classList.toggle('selected', chip.dataset.value === (birthday.relation || ''));
        });
        document.getElementById('formPhone').value = birthday.phone || '';
        document.getElementById('formNotes').value = birthday.notes || '';

        // 设置农历/公历状态
        this.state.isLunar = birthday.lunar === 1;
        document.getElementById('formLunar').value = birthday.lunar ? '1' : '0';

        // 设置日期
        const parts = birthday.birthday.split('-');
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const d = parseInt(parts[2]);
        document.getElementById('formBirthday').value = birthday.birthday;
        this.state.dpYear = y;
        this.state.dpDay = d;

        // 计算月份索引
        if (this.state.isLunar) {
            const months = LunarCalendar.getYearMonths(y);
            this.state.dpMonths = months;
            // 找到对应的月份索引
            // 注意：birthday 存的月份值不含闰月标记，需要特殊处理
            const idx = months.findIndex(mi => mi.month === m && !mi.isLeap);
            this.state.dpMonth = idx >= 0 ? idx : 0;
        } else {
            this.state.dpMonth = m - 1;
        }

        // 更新触发框显示
        this.updateDateTriggerText();

        // 设置 emoji
        this.state.selectedEmoji = birthday.avatar_emoji || '🎂';
        document.querySelectorAll('.emoji-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.emoji === this.state.selectedEmoji);
        });

        this.openModal('编辑生日');
    },

    // ===== 查看详情(点击编辑) =====
    viewBirthday(id) {
        this.editBirthday(id);
    },

    // ===== 保存 =====
    async saveBirthday(formData) {
        try {
            const data = {
                name: formData.name,
                birthday: formData.birthday,
                relation: formData.relation,
                phone: formData.phone,
                notes: formData.notes,
                avatar_emoji: this.state.selectedEmoji,
                lunar: this.state.isLunar ? 1 : 0,
            };

            if (this.state.editingId) {
                await API.updateBirthday(this.state.editingId, data);
                Components.showToast('更新成功！');
            } else {
                await API.createBirthday(data);
                Components.showToast('添加成功！');
            }

            this.closeModal();
            await this.loadBirthdays();
        } catch (error) {
            Components.showToast('保存失败：' + error.message, 'error');
        }
    },

    // ===== 删除确认 =====
    confirmDelete(id, name) {
        this.state.deleteId = id;
        document.getElementById('confirmMessage').textContent = `确定要删除「${name}」的生日记录吗？此操作不可撤销。`;
        document.getElementById('confirmOverlay').classList.add('active');
    },

    closeConfirm() {
        document.getElementById('confirmOverlay').classList.remove('active');
        this.state.deleteId = null;
    },

    async executeDelete() {
        if (!this.state.deleteId) return;

        try {
            await API.deleteBirthday(this.state.deleteId);
            Components.showToast('已删除');
            this.closeConfirm();
            await this.loadBirthdays();
        } catch (error) {
            Components.showToast('删除失败：' + error.message, 'error');
        }
    },

    // ===== 日期选择器 =====

    /**
     * 打开日期选择器
     */
    openDatePicker() {
        const overlay = document.getElementById('datepickerOverlay');
        overlay.classList.add('active');

        // 设置类型按钮状态
        document.getElementById('btnLunar').classList.toggle('active', this.state.isLunar);
        document.getElementById('btnSolar').classList.toggle('active', !this.state.isLunar);

        // 初始化默认值
        const now = new Date();
        if (!this.state.dpYear) {
            if (this.state.isLunar) {
                const lunarToday = LunarCalendar.solar2lunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
                this.state.dpYear = lunarToday.lYear;
                const months = LunarCalendar.getYearMonths(lunarToday.lYear);
                this.state.dpMonths = months;
                const mIdx = months.findIndex(mi => mi.month === lunarToday.lMonth && !mi.isLeap);
                this.state.dpMonth = mIdx >= 0 ? mIdx : 0;
                this.state.dpDay = lunarToday.lDay;
            } else {
                this.state.dpYear = now.getFullYear();
                this.state.dpMonth = now.getMonth();
                this.state.dpDay = now.getDate();
            }
        }

        // 渲染列
        this.renderYearColumn();
        this.renderMonthColumn();
        this.renderDayColumn();

        // 延迟滚动到选中位置
        setTimeout(() => {
            this.scrollToSelected('dpYear');
            this.scrollToSelected('dpMonth');
            this.scrollToSelected('dpDay');
        }, 50);
    },

    /**
     * 关闭日期选择器
     */
    closeDatePicker() {
        document.getElementById('datepickerOverlay').classList.remove('active');
    },

    /**
     * 切换农历/公历
     */
    switchDateType(isLunar) {
        if (this.state.isLunar === isLunar) return;
        this.state.isLunar = isLunar;
        document.getElementById('btnLunar').classList.toggle('active', isLunar);
        document.getElementById('btnSolar').classList.toggle('active', !isLunar);

        // 尝试转换当前选中的日期
        const y = this.state.dpYear;
        const mInfo = this.state.isLunar ?
            null : // 切换到公历前是农历
            null;  // 反之

        // 重新初始化为当前日期
        const now = new Date();
        if (isLunar) {
            const lunarToday = LunarCalendar.solar2lunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
            this.state.dpYear = lunarToday.lYear;
            const months = LunarCalendar.getYearMonths(lunarToday.lYear);
            this.state.dpMonths = months;
            const mIdx = months.findIndex(mi => mi.month === lunarToday.lMonth && !mi.isLeap);
            this.state.dpMonth = mIdx >= 0 ? mIdx : 0;
            this.state.dpDay = lunarToday.lDay;
        } else {
            this.state.dpYear = now.getFullYear();
            this.state.dpMonth = now.getMonth();
            this.state.dpDay = now.getDate();
        }

        this.renderYearColumn();
        this.renderMonthColumn();
        this.renderDayColumn();

        setTimeout(() => {
            this.scrollToSelected('dpYear');
            this.scrollToSelected('dpMonth');
            this.scrollToSelected('dpDay');
        }, 50);
    },

    /**
     * 渲染年份列
     */
    renderYearColumn() {
        const col = document.getElementById('dpYear');
        const startYear = 1920;
        const endYear = 2100;
        let html = '<div class="datepicker-spacer"></div>';
        for (let y = startYear; y <= endYear; y++) {
            const label = this.state.isLunar ? LunarCalendar.yearToCn(y) + '年' : y + '年';
            const sel = y === this.state.dpYear ? ' selected' : '';
            html += `<div class="datepicker-item${sel}" data-value="${y}">${label}</div>`;
        }
        html += '<div class="datepicker-spacer"></div>';
        col.innerHTML = html;

        // 绑定滚动事件
        col.onscroll = () => this.onColumnScroll('dpYear');
    },

    /**
     * 渲染月份列
     */
    renderMonthColumn() {
        const col = document.getElementById('dpMonth');
        let html = '<div class="datepicker-spacer"></div>';

        if (this.state.isLunar) {
            const months = LunarCalendar.getYearMonths(this.state.dpYear);
            this.state.dpMonths = months;
            // 确保月份索引不越界
            if (this.state.dpMonth >= months.length) {
                this.state.dpMonth = months.length - 1;
            }
            months.forEach((m, idx) => {
                const sel = idx === this.state.dpMonth ? ' selected' : '';
                html += `<div class="datepicker-item${sel}" data-value="${idx}">${m.name}</div>`;
            });
        } else {
            for (let m = 1; m <= 12; m++) {
                const sel = (m - 1) === this.state.dpMonth ? ' selected' : '';
                html += `<div class="datepicker-item${sel}" data-value="${m - 1}">${m}月</div>`;
            }
        }

        html += '<div class="datepicker-spacer"></div>';
        col.innerHTML = html;
        col.onscroll = () => this.onColumnScroll('dpMonth');
    },

    /**
     * 渲染日期列
     */
    renderDayColumn() {
        const col = document.getElementById('dpDay');
        let maxDay;

        if (this.state.isLunar) {
            const months = this.state.dpMonths;
            const mInfo = months[this.state.dpMonth];
            maxDay = mInfo ? mInfo.days : 30;
        } else {
            maxDay = LunarCalendar.solarDays(this.state.dpYear, this.state.dpMonth + 1);
        }

        // 修正日期不越界
        if (this.state.dpDay > maxDay) {
            this.state.dpDay = maxDay;
        }

        let html = '<div class="datepicker-spacer"></div>';
        for (let d = 1; d <= maxDay; d++) {
            const label = this.state.isLunar ? LunarCalendar.toChinaDay(d) : d + '日';
            const sel = d === this.state.dpDay ? ' selected' : '';
            html += `<div class="datepicker-item${sel}" data-value="${d}">${label}</div>`;
        }
        html += '<div class="datepicker-spacer"></div>';
        col.innerHTML = html;
        col.onscroll = () => this.onColumnScroll('dpDay');
    },

    /**
     * 列滚动事件 - 计算当前选中项
     */
    onColumnScroll(colId) {
        // 使用防抖避免频繁计算
        if (this._scrollTimers && this._scrollTimers[colId]) {
            clearTimeout(this._scrollTimers[colId]);
        }
        if (!this._scrollTimers) this._scrollTimers = {};

        this._scrollTimers[colId] = setTimeout(() => {
            const col = document.getElementById(colId);
            const items = col.querySelectorAll('.datepicker-item');
            if (!items.length) return;

            // 计算中心位置
            const containerTop = col.scrollTop;
            const containerCenter = containerTop + col.clientHeight / 2;
            const itemHeight = 42;
            const spacerHeight = 109;

            // 找到最接近中心的项
            let closestIdx = 0;
            let minDist = Infinity;
            items.forEach((item, idx) => {
                const itemCenter = spacerHeight + idx * itemHeight + itemHeight / 2;
                const dist = Math.abs(itemCenter - containerCenter);
                if (dist < minDist) {
                    minDist = dist;
                    closestIdx = idx;
                }
            });

            // 更新选中样式
            items.forEach((item, idx) => {
                item.classList.toggle('selected', idx === closestIdx);
            });

            // 更新状态并联动
            const value = parseInt(items[closestIdx].dataset.value);
            if (colId === 'dpYear') {
                if (this.state.dpYear !== value) {
                    this.state.dpYear = value;
                    // 年份变化重新渲染月份和日期
                    this.renderMonthColumn();
                    this.renderDayColumn();
                    setTimeout(() => {
                        this.scrollToSelected('dpMonth');
                        this.scrollToSelected('dpDay');
                    }, 10);
                }
            } else if (colId === 'dpMonth') {
                if (this.state.dpMonth !== value) {
                    this.state.dpMonth = value;
                    // 月份变化重新渲染日期
                    this.renderDayColumn();
                    setTimeout(() => this.scrollToSelected('dpDay'), 10);
                }
            } else if (colId === 'dpDay') {
                this.state.dpDay = value;
            }
        }, 80);
    },

    /**
     * 滚动到选中项
     */
    scrollToSelected(colId) {
        const col = document.getElementById(colId);
        const selected = col.querySelector('.datepicker-item.selected');
        if (!selected) return;

        const colHeight = col.clientHeight;
        const itemTop = selected.offsetTop;
        const itemHeight = selected.offsetHeight;
        const targetScroll = itemTop - (colHeight / 2) + (itemHeight / 2);
        col.scrollTo({ top: targetScroll, behavior: 'smooth' });
    },

    /**
     * 确认日期选择
     */
    confirmDatePicker() {
        const y = this.state.dpYear;
        const d = this.state.dpDay;
        let m;

        if (this.state.isLunar) {
            const mInfo = this.state.dpMonths[this.state.dpMonth];
            m = mInfo.month;
            // 注意：闰月时在 birthday 字段存储月份值与正常月一样
            // 后续可通过 isLeap 标记区分（暂用正常月值）
        } else {
            m = this.state.dpMonth + 1;
        }

        // 存储为 YYYY-MM-DD 格式
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        document.getElementById('formBirthday').value = dateStr;
        document.getElementById('formLunar').value = this.state.isLunar ? '1' : '0';

        // 更新触发框显示
        this.updateDateTriggerText();

        this.closeDatePicker();
    },

    /**
     * 更新日期触发框文本
     */
    updateDateTriggerText() {
        const triggerText = document.getElementById('dateTriggerText');
        const birthday = document.getElementById('formBirthday').value;
        if (!birthday) {
            triggerText.textContent = '点击选择日期';
            triggerText.classList.remove('has-value');
            return;
        }

        const parts = birthday.split('-');
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const d = parseInt(parts[2]);

        let text;
        if (this.state.isLunar) {
            text = `农历 ${LunarCalendar.yearToCn(y)}年 ${LunarCalendar.toChinaMonth(m)} ${LunarCalendar.toChinaDay(d)}`;
        } else {
            text = `公历 ${y}年${m}月${d}日`;
        }

        triggerText.textContent = text;
        triggerText.classList.add('has-value');
    },

    // ===== 事件绑定 =====
    bindEvents() {
        // 退出登录
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            try {
                await fetch('/api/logout', { method: 'POST' });
            } catch (e) {
                // 即使请求失败也跳转到登录页
            }
            window.location.href = '/login.html';
        });

        // 主题切换
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // 添加按钮
        document.getElementById('addBtn').addEventListener('click', () => this.openAdd());
        document.getElementById('emptyAddBtn').addEventListener('click', () => this.openAdd());

        // 模态框关闭
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('formCancel').addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });

        // 日期选择器
        document.getElementById('dateTrigger').addEventListener('click', () => this.openDatePicker());
        document.getElementById('datepickerCancel').addEventListener('click', () => this.closeDatePicker());
        document.getElementById('datepickerConfirm').addEventListener('click', () => this.confirmDatePicker());
        document.getElementById('datepickerOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeDatePicker();
        });
        document.getElementById('btnLunar').addEventListener('click', () => this.switchDateType(true));
        document.getElementById('btnSolar').addEventListener('click', () => this.switchDateType(false));

        // 表单提交
        document.getElementById('birthdayForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const birthday = document.getElementById('formBirthday').value;
            if (!birthday) {
                Components.showToast('请选择生日日期', 'error');
                return;
            }
            const formData = {
                name: document.getElementById('formName').value.trim(),
                birthday: birthday,
                relation: document.getElementById('formRelation').value,
                phone: document.getElementById('formPhone').value.trim(),
                notes: document.getElementById('formNotes').value.trim(),
            };
            if (formData.name && formData.birthday) {
                this.saveBirthday(formData);
            }
        });

        // Emoji 选择
        document.getElementById('emojiPicker').addEventListener('click', (e) => {
            const option = e.target.closest('.emoji-option');
            if (!option) return;
            this.state.selectedEmoji = option.dataset.emoji;
            document.querySelectorAll('.emoji-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });

        // 关系标签选择
        document.getElementById('relationPicker').addEventListener('click', (e) => {
            const chip = e.target.closest('.relation-chip');
            if (!chip) return;
            const value = chip.dataset.value;
            const isSelected = chip.classList.contains('selected');
            // 取消所有选中
            document.querySelectorAll('.relation-chip').forEach(c => c.classList.remove('selected'));
            if (!isSelected) {
                // 选中当前
                chip.classList.add('selected');
                document.getElementById('formRelation').value = value;
            } else {
                // 取消选中则清空
                document.getElementById('formRelation').value = '';
            }
        });

        // 搜索（防抖）
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', debounce((e) => {
            this.setSearch(e.target.value.trim());
        }, 300));

        // 删除确认
        document.getElementById('confirmCancel').addEventListener('click', () => this.closeConfirm());
        document.getElementById('confirmDelete').addEventListener('click', () => this.executeDelete());
        document.getElementById('confirmOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeConfirm();
        });

        // 键盘事件：ESC 关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // 先关闭日期选择器
                if (document.getElementById('datepickerOverlay').classList.contains('active')) {
                    this.closeDatePicker();
                } else if (document.getElementById('confirmOverlay').classList.contains('active')) {
                    this.closeConfirm();
                } else if (document.getElementById('modalOverlay').classList.contains('active')) {
                    this.closeModal();
                }
            }
        });
    },
};

// ===== 应用启动 =====
document.addEventListener('DOMContentLoaded', () => App.init());
