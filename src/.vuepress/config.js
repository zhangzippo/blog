module.exports = {
  // 网站 Title
  title: '一个懒癌程序员',
  // 网站描述
  description:'个人博客',
  // 网站语言
  locales: {
    '/': {
      lang: 'zh-CN',
    },
  },
  // 使用的主题
  theme: 'meteorlxy',

  // 主题配置
  themeConfig: {
    // 主题语言，参考下方 [主题语言] 章节
    lang: require('vuepress-theme-meteorlxy/lib/langs/zh-CN'),

    // 个人信息（没有或不想设置的，删掉对应字段即可）
    personalInfo: {
      // 昵称
      nickname: 'zippo',

      // 个人简介
      description: 'the more you want<br/>the less you got',

      // 电子邮箱
      email: 'zhangzhp3@163.com',

      // 所在地
      location: 'beijing City, China',

      // 组织
      // organization: 'Xi\'an Jiao Tong University',

      // 头像
      // 设置为外部链接
      avatar: '/img/avatar.jpeg',
      // 或者放置在 .vuepress/public 文件夹，例如 .vuepress/public/img/avatar.jpg
      // avatar: '/img/avatar.jpg',
      

      // 社交平台帐号信息
      sns: {
        // Github 帐号和链接
        github: {
          account: 'meteorlxy',
          link: 'https://github.com/zhangZippo',
        },

        // 知乎 帐号和链接
        zhihu: {
          account: 'zippo',
          link: 'https://www.zhihu.com/people/kevin-51-3/activities',
        },
      },
    },

    // 上方 header 的相关设置
    header: {
      // header 的背景，可以使用图片，或者随机变化的图案（geopattern）
      background: {
        // 使用图片的 URL，如果设置了图片 URL，则不会生成随机变化的图案，下面的 useGeo 将失效
        url: '/img/background.jpg',

        // 使用随机变化的图案，如果设置为 false，且没有设置图片 URL，将显示为空白背景
        useGeo: true,
      },
      // 是否在 header 显示标题
      showTitle: true,
    },

    // 是否显示文章的最近更新时间
    lastUpdated: true,

    // 顶部导航栏内容
    nav: [
      { text: '首页', link: '/', exact: true },
      { text: '文章', link: '/posts/', exact: false },
      { text: '心路', link: '/heart/', exact: false },
    ],

    // 评论配置，参考下方 [页面评论] 章节
    comments: {
      platform: 'github',
      owner: 'zhangzippo',
      repo: 'zhangzippo.github.io',
      clientId: '13ba6a84d27ba53bd7d1',
      clientSecret: 'ac2697b271741c47c64244ea5ef4207bbf0e787a',
      // autoCreateIssue: process.env.NODE_ENV !== 'development',
    },
  },
}