-- BirthVault 数据库初始表结构
-- 生日记录表
CREATE TABLE IF NOT EXISTS birthdays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- 姓名
  birthday TEXT NOT NULL,          -- 生日日期 (YYYY-MM-DD)
  lunar INTEGER DEFAULT 0,        -- 是否农历 (0=公历, 1=农历)
  relation TEXT DEFAULT '',        -- 关系（家人/朋友/同事等）
  phone TEXT DEFAULT '',           -- 联系电话
  notes TEXT DEFAULT '',           -- 备注
  avatar_emoji TEXT DEFAULT '🎂',  -- 头像 emoji
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 索引：按生日日期查询
CREATE INDEX IF NOT EXISTS idx_birthday ON birthdays(birthday);
-- 索引：按关系分类查询
CREATE INDEX IF NOT EXISTS idx_relation ON birthdays(relation);
