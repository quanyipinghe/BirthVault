/**
 * lunar.js - 农历计算工具库
 * 基于查表法实现 1900-2100 年公历↔农历精确互转
 * 数据来源：香港天文台 + 寿星万年历
 * 支持：闰月、大小月、生肖、中文月日名称
 */

const LunarCalendar = (() => {

    // ===== 农历 1900-2100 年闰月/大小月信息表 =====
    // 每个 hex 值编码一年的农历信息：
    //   低 4 位: 闰月月份（0=无闰月）
    //   中间 12 位: 1~12 月大小月（1=大月30天, 0=小月29天）
    //   高 4 位: 闰月天数（0=29天, 1=30天）
    const lunarInfo = [
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
        0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
        0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
        0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
        0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
        0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
        0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252, // 2090-2099
        0x0d520  // 2100
    ];

    // 公历每月天数
    const solarMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // 农历月份中文名
    const monthCnNames = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

    // 农历日期中文名
    const dayCnNames = [
        '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];

    // 中文数字
    const cnNumbers = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

    // 生肖
    const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

    // 天干
    const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

    // 地支
    const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

    // ===== 基础计算函数 =====

    /**
     * 返回农历 y 年闰月是哪个月（1-12），0 表示无闰月
     */
    function leapMonth(y) {
        return lunarInfo[y - 1900] & 0xf;
    }

    /**
     * 返回农历 y 年闰月的天数（0 或 29 或 30）
     */
    function leapDays(y) {
        if (leapMonth(y)) {
            return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
        }
        return 0;
    }

    /**
     * 返回农历 y 年 m 月（非闰月）的天数（29 或 30）
     */
    function monthDays(y, m) {
        if (m > 12 || m < 1) return -1;
        return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
    }

    /**
     * 返回农历 y 年的总天数
     */
    function lYearDays(y) {
        let sum = 348; // 12 个月 × 29 天基数
        let info = lunarInfo[y - 1900];
        for (let i = 0x8000; i > 0x8; i >>= 1) {
            sum += (info & i) ? 1 : 0;
        }
        return sum + leapDays(y);
    }

    /**
     * 判断公历 y 年是否闰年
     */
    function isLeapYear(y) {
        return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
    }

    /**
     * 返回公历 y 年 m 月的天数
     */
    function solarDays(y, m) {
        if (m === 2) {
            return isLeapYear(y) ? 29 : 28;
        }
        return solarMonthDays[m - 1];
    }

    /**
     * 年份转中文（如 2026 → '二〇二六'）
     */
    function yearToCn(y) {
        let s = '';
        const str = String(y);
        for (let i = 0; i < str.length; i++) {
            s += cnNumbers[parseInt(str[i])];
        }
        return s;
    }

    /**
     * 月份转中文（如 1 → '正月'，12 → '腊月'）
     */
    function toChinaMonth(m) {
        return monthCnNames[m - 1] + '月';
    }

    /**
     * 日期转中文（如 1 → '初一'，30 → '三十'）
     */
    function toChinaDay(d) {
        return dayCnNames[d - 1];
    }

    /**
     * 年份转生肖
     */
    function getAnimal(y) {
        return animals[(y - 4) % 12];
    }

    /**
     * 年份转天干地支
     */
    function toGanZhiYear(y) {
        const ganIdx = (y - 4) % 10;
        const zhiIdx = (y - 4) % 12;
        return gan[ganIdx] + zhi[zhiIdx];
    }

    // ===== 核心转换函数 =====

    /**
     * 公历转农历
     * @param {number} y - 公历年
     * @param {number} m - 公历月
     * @param {number} d - 公历日
     * @returns {Object} 农历信息对象
     */
    function solar2lunar(y, m, d) {
        // 参数范围校验
        if (y < 1900 || y > 2100) return null;
        if (y === 1900 && m === 1 && d < 31) return null;

        // 基准日期：1900年1月31日 = 农历1900年正月初一
        const baseDate = new Date(1900, 0, 31);
        const targetDate = new Date(y, m - 1, d);
        let offset = Math.round((targetDate - baseDate) / 86400000);

        // 确定农历年
        let lunarYear = 1900;
        let temp = 0;
        for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
            temp = lYearDays(lunarYear);
            offset -= temp;
        }
        if (offset < 0) {
            offset += temp;
            lunarYear--;
        }

        // 确定农历月
        const leap = leapMonth(lunarYear); // 当年闰月
        let isLeap = false;
        let lunarMonth = 1;
        for (let i = 1; i < 13 && offset > 0; i++) {
            // 闰月
            if (leap > 0 && i === (leap + 1) && !isLeap) {
                --i;
                isLeap = true;
                temp = leapDays(lunarYear);
            } else {
                temp = monthDays(lunarYear, i);
            }
            // 解除闰月标记
            if (isLeap && i === (leap + 1)) {
                isLeap = false;
            }
            offset -= temp;
            if (!isLeap) {
                lunarMonth = i;
            }
        }
        // offset 为 0 时为目标月最后一天
        if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
            if (isLeap) {
                isLeap = false;
            } else {
                isLeap = true;
                --lunarMonth;
            }
        }
        if (offset < 0) {
            offset += temp;
            --lunarMonth;
        }
        const lunarDay = offset + 1;

        return {
            lYear: lunarYear,
            lMonth: lunarMonth,
            lDay: lunarDay,
            isLeap: isLeap,
            monthCn: (isLeap ? '闰' : '') + toChinaMonth(lunarMonth),
            dayCn: toChinaDay(lunarDay),
            yearCn: yearToCn(lunarYear),
            animal: getAnimal(lunarYear),
            gzYear: toGanZhiYear(lunarYear),
            cYear: y,
            cMonth: m,
            cDay: d,
        };
    }

    /**
     * 农历转公历
     * @param {number} y - 农历年
     * @param {number} m - 农历月
     * @param {number} d - 农历日
     * @param {boolean} isLeapMonth - 是否闰月
     * @returns {Object|null} 公历日期对象
     */
    function lunar2solar(y, m, d, isLeapMonth = false) {
        // 参数范围校验
        if (y < 1900 || y > 2100) return null;
        if (m < 1 || m > 12) return null;

        // 验证闰月
        const leap = leapMonth(y);
        if (isLeapMonth && leap !== m) return null;

        // 验证日期范围
        const maxDay = isLeapMonth ? leapDays(y) : monthDays(y, m);
        if (d < 1 || d > maxDay) return null;

        // 计算从基准日期到目标农历日期的天数偏移
        let offset = 0;

        // 累加每年的天数
        for (let i = 1900; i < y; i++) {
            offset += lYearDays(i);
        }

        // 累加当年月份天数
        for (let i = 1; i < m; i++) {
            offset += monthDays(y, i);
            // 如果有闰月且闰月在当前月之前或等于当前月
            if (leap > 0 && i === leap) {
                offset += leapDays(y);
            }
        }

        // 如果是闰月，还需加上该月正常月份天数
        if (isLeapMonth) {
            offset += monthDays(y, m);
        }

        offset += d - 1;

        // 基准日期
        const baseDate = new Date(1900, 0, 31);
        const resultDate = new Date(baseDate.getTime() + offset * 86400000);

        return {
            cYear: resultDate.getFullYear(),
            cMonth: resultDate.getMonth() + 1,
            cDay: resultDate.getDate(),
        };
    }

    /**
     * 获取农历某年的所有月份信息（含闰月）
     * 用于日期选择器联动
     * @param {number} y - 农历年
     * @returns {Array} 月份列表 [{ month, name, isLeap, days }]
     */
    function getYearMonths(y) {
        const months = [];
        const leap = leapMonth(y);
        for (let i = 1; i <= 12; i++) {
            months.push({
                month: i,
                name: toChinaMonth(i),
                isLeap: false,
                days: monthDays(y, i),
            });
            // 在闰月位置插入闰月
            if (leap > 0 && i === leap) {
                months.push({
                    month: i,
                    name: '闰' + toChinaMonth(i),
                    isLeap: true,
                    days: leapDays(y),
                });
            }
        }
        return months;
    }

    // ===== 导出 =====
    return {
        solar2lunar,
        lunar2solar,
        leapMonth,
        leapDays,
        monthDays,
        lYearDays,
        solarDays,
        isLeapYear,
        toChinaMonth,
        toChinaDay,
        yearToCn,
        getAnimal,
        toGanZhiYear,
        getYearMonths,
    };

})();
