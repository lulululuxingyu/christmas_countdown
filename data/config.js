const CONFIG = {
  // 倒数开始日期（春节）
  startDate: "2026-02-18",

  // 登录密码（Base64编码：lxy-tz）
  passwordHash: "bHh5LXR6",

  // GitHub Token（反转+Base64编码）
  githubTokenHash: "ZHI2NkgwS2xJS3FDdkhTdDI3eXM4NUlidUNXTzRvbjl6RUZKX3BoZw==",

  // 贵重礼物池：每个只能出现一次
  exclusiveGifts: [
    {
      id: "exclusive_1",
      name: "宝诗龙戒指一枚！",
      content: "💍 获得宝诗龙戒指一枚！",
      image: "💍"
    },
    {
      id: "exclusive_2",
      name: "🥿 alaiya小鞋子一双！",
      content: "🥿 获得alaiya小鞋子一双！",
      image: "🥿"
    },
    {
      id: "exclusive_3",
      name: "🐷 灰珍珠一颗！",
      content: "🐷 灰珍珠一颗！",
      image: "🐷 灰珍珠一颗！"
    },
    {
      id: "exclusive_4",
      name: "🥘 adv盘子一个",
      content: "🥘 adv盘子一个",
      image: "🥘"
    },
    {
      id: "exclusive_5",
      name: "💍 戒指！",
      content: "💍 嫁给我吧！",
      image: "💍"
    },
    {
      id: "exclusive_6",
      name: "🧸 Jellycat 玩偶一只！",
      content: "🧸 获得 Jellycat 玩偶一只！",
      image: "🧸"
    }
  ],

  // 普通礼物池：可以重复抽取
  commonGifts: [
    { content: "☕ 今天的奶茶我包了", image: "☕" },
    { content: "🤗 一个大大的拥抱", image: "🤗" },
    { content: "👑 听你指挥一晚上", image: "👑" },
    { content: "💋 圣诞老人的亲亲", image: "💋" },
    { content: "🎬 陪你看一部电影", image: "🎬" },
    { content: "🏃 周末一起出去约会吧", image: "🏃" },
    { content: "🍰 给你做饭", image: "🍰" },
    { content: "🍚 出去吃好吃的！", image: "🍚" }
  ],

  // 特殊日期：指定日期的特定礼物
  specialDays: {
    "2026-12-25": {
      giftId: "exclusive_5",
      title: "🎅 没想到圣诞终极大礼是啥吧",
      message: "Merry Christmas! Marry LXY!"
    },
    "2026-05-18": {
      title: "两周年快乐!",
      message: "感谢我们一起走过的两年!"
    },
    "2026-09-16": {
      giftId: "exclusive_6",
      title: "🎂 生日快乐!",
      message: "感谢我们一起走过的两年!"
    },
    "2026-08-19": {
      title: "七夕快乐!",
      message: "让我们鹊桥相会，过的潇潇洒洒!"
    }
  },

  // 贵重礼物抽取概率（10%）
  exclusiveGiftProbability: 0.1,

  // 保底机制配置
  pity: {
    threshold: 9,   // 连续 9 次空礼物后，第 10 次必中（emptyCount >= threshold 时触发）
    hitRate: 0.18   // 基础中奖率
  }
};
