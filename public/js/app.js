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
        list.sort((a, b) => daysUntilBirthday(a.birthday) - daysUntilBirthday(b.birthday));
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
        this.state.editingId = null;
        this.state.selectedEmoji = '🎂';
        // 重置 emoji 选择
        document.querySelectorAll('.emoji-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.emoji === '🎂');
        });
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
        document.getElementById('formBirthday').value = birthday.birthday;
        document.getElementById('formRelation').value = birthday.relation || '';
        document.getElementById('formPhone').value = birthday.phone || '';
        document.getElementById('formNotes').value = birthday.notes || '';

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
                lunar: 0,
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

    // ===== 事件绑定 =====
    bindEvents() {
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

        // 表单提交
        document.getElementById('birthdayForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('formName').value.trim(),
                birthday: document.getElementById('formBirthday').value,
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
                if (document.getElementById('confirmOverlay').classList.contains('active')) {
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
