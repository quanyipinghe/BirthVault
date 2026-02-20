/**
 * utils.js - 工具函数
 * 日期计算、格式化、星座等辅助函数
 */

/**
 * 计算距离下一个生日还有多少天
 * @param {Object|string} b - 生日记录对象或日期字符串
 * @returns {number} 距离天数
 */
function daysUntilBirthday(b) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const birthday = typeof b === 'string' ? b : b.birthday;
    const isLunar = typeof b === 'object' && b.lunar === 1;
    const parts = birthday.split('-');
    const bMonth = parseInt(parts[1], 10);
    const bDay = parseInt(parts[2], 10);

    let month, day;
    if (isLunar) {
        // 农历模式：将农历生日转为今年对应的公历日期
        const thisYear = today.getFullYear();
        let solar = LunarCalendar.lunar2solar(thisYear, bMonth, bDay, false);
        if (!solar) {
            // 日期不存在时（如该年该月无此日），取月末
            const maxDay = LunarCalendar.monthDays(thisYear, bMonth);
            solar = LunarCalendar.lunar2solar(thisYear, bMonth, Math.min(bDay, maxDay), false);
        }
        if (solar) {
            month = solar.cMonth;
            day = solar.cDay;
        } else {
            month = bMonth;
            day = bDay;
        }
    } else {
        month = bMonth;
        day = bDay;
    }

    // 今年的生日
    let nextBirthday = new Date(today.getFullYear(), month - 1, day);
    nextBirthday.setHours(0, 0, 0, 0);

    // 如果今年的生日已过，取明年的
    if (nextBirthday < today) {
        if (isLunar) {
            const nextYear = today.getFullYear() + 1;
            let solar = LunarCalendar.lunar2solar(nextYear, bMonth, bDay, false);
            if (!solar) {
                const maxDay = LunarCalendar.monthDays(nextYear, bMonth);
                solar = LunarCalendar.lunar2solar(nextYear, bMonth, Math.min(bDay, maxDay), false);
            }
            if (solar) {
                nextBirthday = new Date(nextYear, solar.cMonth - 1, solar.cDay);
            } else {
                nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
            }
        } else {
            nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
        }
        nextBirthday.setHours(0, 0, 0, 0);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 计算年龄
 * @param {string} birthday - 生日日期字符串 (YYYY-MM-DD)
 * @returns {number} 年龄
 */
function getAge(birthday) {
    const today = new Date();
    const parts = birthday.split('-');
    const birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/**
 * 获取星座
 * @param {string} birthday - 生日日期字符串 (YYYY-MM-DD)
 * @returns {string} 星座名称
 */
function getZodiacSign(birthday) {
    const parts = birthday.split('-');
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const signs = [
        { name: '摩羯座', end: [1, 19] },
        { name: '水瓶座', end: [2, 18] },
        { name: '双鱼座', end: [3, 20] },
        { name: '白羊座', end: [4, 19] },
        { name: '金牛座', end: [5, 20] },
        { name: '双子座', end: [6, 21] },
        { name: '巨蟹座', end: [7, 22] },
        { name: '狮子座', end: [8, 22] },
        { name: '处女座', end: [9, 22] },
        { name: '天秤座', end: [10, 23] },
        { name: '天蝎座', end: [11, 22] },
        { name: '射手座', end: [12, 21] },
        { name: '摩羯座', end: [12, 31] },
    ];

    for (const sign of signs) {
        if (month < sign.end[0] || (month === sign.end[0] && day <= sign.end[1])) {
            return sign.name;
        }
    }
    return '摩羯座';
}

/**
 * 格式化日期为中文显示
 * @param {Object|string} b - 生日记录对象或日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(b) {
    const birthday = typeof b === 'string' ? b : b.birthday;
    const isLunar = typeof b === 'object' && b.lunar === 1;
    const parts = birthday.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);

    if (isLunar) {
        return `农历 ${LunarCalendar.yearToCn(y)}年 ${LunarCalendar.toChinaMonth(m)} ${LunarCalendar.toChinaDay(d)}`;
    }
    return `${y}年${m}月${d}日`;
}

/**
 * 格式化倒计时文本
 * @param {number} days - 天数
 * @returns {{ text: string, type: string }} 文本和类型
 */
function formatCountdown(days) {
    if (days === 0) {
        return { text: '今天生日！🎉', type: 'today' };
    } else if (days <= 7) {
        return { text: `${days} 天后`, type: 'soon' };
    } else if (days <= 30) {
        return { text: `${days} 天后`, type: 'normal' };
    } else {
        return { text: `${days} 天后`, type: 'normal' };
    }
}

/**
 * 获取当月有多少人过生日
 * @param {Array} birthdays - 生日记录列表
 * @returns {number} 本月生日数
 */
function getThisMonthCount(birthdays) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    return birthdays.filter(b => {
        if (b.lunar === 1) {
            // 农历：将农历月日转公历后判断
            const parts = b.birthday.split('-');
            const lm = parseInt(parts[1], 10);
            const ld = parseInt(parts[2], 10);
            const solar = LunarCalendar.lunar2solar(currentYear, lm, ld, false);
            return solar && solar.cMonth === currentMonth;
        }
        const month = parseInt(b.birthday.split('-')[1], 10);
        return month === currentMonth;
    }).length;
}

/**
 * 获取7天内即将过生日的数量
 * @param {Array} birthdays - 生日记录列表
 * @returns {number} 7天内生日数
 */
function getUpcomingCount(birthdays) {
    return birthdays.filter(b => {
        const days = daysUntilBirthday(b);
        return days > 0 && days <= 7;
    }).length;
}

/**
 * 获取今天过生日的数量
 * @param {Array} birthdays - 生日记录列表
 * @returns {number} 今天生日数
 */
function getTodayCount(birthdays) {
    return birthdays.filter(b => daysUntilBirthday(b) === 0).length;
}

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟毫秒数
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
