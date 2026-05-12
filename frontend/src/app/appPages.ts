export type PageSection = {
  title: string
  items: string[]
}

export type AppPage = {
  path: string
  label: string
  group: 'public' | 'auth' | 'user' | 'admin'
  intro: string
  sections: PageSection[]
}

export const appPages: AppPage[] = [
  {
    path: '/news',
    label: 'News',
    group: 'public',
    intro: 'Trang tin tuc Esport gom bai noi bat, bo loc theo game va khu vuc bai doc nhieu.',
    sections: [
      {
        title: 'Main Layout',
        items: [
          'Hero bai noi bat + 2 bai phu cap nhat nhanh',
          'Tabs danh muc: News, Transfers, Tournament, Guides',
          'Grid bai viet 3 cot desktop va 1 cot mobile',
        ],
      },
      {
        title: 'Sidebar',
        items: ['Most read 24h', 'Topic tags theo game', 'Lich su kien sap dien ra'],
      },
    ],
  },
  {
    path: '/news/detail',
    label: 'News Detail',
    group: 'public',
    intro: 'Trang doc bai chi tiet voi noi dung da phuong tien, block bai lien quan va khu binh luan.',
    sections: [
      {
        title: 'Article Blocks',
        items: ['Header meta (author, time, game tag)', 'Noi dung + gallery anh + quote', 'Box bai lien quan'],
      },
      {
        title: 'Community Layer',
        items: ['Comment list 2 cap', 'Sentiment badge placeholder', 'Report va reaction actions'],
      },
    ],
  },
  {
    path: '/matches',
    label: 'Matches',
    group: 'public',
    intro: 'Trang lich thi dau theo bo loc game-giai dau-ngay va trang thai live/upcoming/finished.',
    sections: [
      {
        title: 'Filters',
        items: ['Game switcher (LoL, Valorant, CS2...)', 'Region + Tournament dropdown', 'Date range'],
      },
      {
        title: 'Data Zone',
        items: ['Bang lich thi dau theo giai', 'Trang thai real-time', 'CTA sang Match Detail'],
      },
    ],
  },
  {
    path: '/matches/detail',
    label: 'Match Detail',
    group: 'public',
    intro: 'Trang tran dau chi tiet voi map stats, player stats, timeline va khu thao luan theo tran.',
    sections: [
      {
        title: 'Top Section',
        items: ['Scoreboard team A vs team B', 'Moc thoi gian va bo5/bo3 status', 'Danh sach doi hinh'],
      },
      {
        title: 'Insights',
        items: ['Map stats chart', 'Round history table', 'Live discussion panel'],
      },
    ],
  },
  {
    path: '/teams',
    label: 'Teams',
    group: 'public',
    intro: 'Danh sach doi tuyen dang card layout, co filter theo game, rank, khu vuc va phong do.',
    sections: [
      {
        title: 'Discovery',
        items: ['Team cards voi logo + ranking', 'Sort by winrate/followers', 'Quick view recent form'],
      },
    ],
  },
  {
    path: '/teams/detail',
    label: 'Team Detail',
    group: 'public',
    intro: 'Trang profile doi tuyen ket hop roster, chi so, lich su tran dau va bai viet lien quan.',
    sections: [
      {
        title: 'Team Profile',
        items: ['Cover + lineup hien tai', 'Winrate and ranking cards', 'Performance chart placeholder'],
      },
      {
        title: 'Activity',
        items: ['Recent results', 'Upcoming matches', 'Related news'],
      },
    ],
  },
  {
    path: '/players',
    label: 'Players',
    group: 'public',
    intro: 'Danh sach player theo bo loc doi tuyen, vi tri, game va thanh tim kiem nhanh.',
    sections: [
      {
        title: 'List View',
        items: ['Search by name', 'Filter by team and role', 'Cards voi chi so chinh'],
      },
    ],
  },
  {
    path: '/players/detail',
    label: 'Player Detail',
    group: 'public',
    intro: 'Trang player detail voi thong tin ca nhan, chi so thi dau, phong do va lien ket so sanh.',
    sections: [
      {
        title: 'Personal Stats',
        items: ['KDA or role metrics', 'Recent match form', 'Compare shortcut'],
      },
    ],
  },
  {
    path: '/comparison',
    label: 'Comparison',
    group: 'public',
    intro: 'So sanh 2 doi hoac 2 player bang side-by-side stats, radar chart va bo loc theo mua giai.',
    sections: [
      {
        title: 'Compare Workspace',
        items: ['Selector 2 doi tuong', 'Stats table song song', 'Radar/bar chart placeholder'],
      },
    ],
  },
  {
    path: '/tournaments',
    label: 'Tournaments',
    group: 'public',
    intro: 'Danh sach giai dau sap dien ra, dang dien ra va da ket thuc voi card visual lon.',
    sections: [
      {
        title: 'Tournament Feed',
        items: ['Hero event noi bat', 'Upcoming/Ongoing/Completed tabs', 'Prize pool and teams counter'],
      },
    ],
  },
  {
    path: '/tournaments/detail',
    label: 'Tournament Detail',
    group: 'public',
    intro: 'Trang giai dau chi tiet gom timeline, bracket, stream area, teams va tin lien quan.',
    sections: [
      {
        title: 'Event Core',
        items: ['Bracket visual center', 'Match schedule timeline', 'Streaming embed frame'],
      },
      {
        title: 'Support Blocks',
        items: ['Participant teams', 'Related news', 'Community thread'],
      },
    ],
  },
  {
    path: '/community',
    label: 'Community',
    group: 'public',
    intro: 'Feed thao luan cong dong theo New/Hot/Top, co composer box va topic tags.',
    sections: [
      {
        title: 'Discussion Feed',
        items: ['Post composer', 'Post cards with reactions', 'Trending topics sidebar'],
      },
    ],
  },
  {
    path: '/community/post',
    label: 'Community Post Detail',
    group: 'public',
    intro: 'Trang chi tiet bai thao luan voi binh luan nhieu cap, reaction, report va sentiment badge.',
    sections: [
      {
        title: 'Thread View',
        items: ['Main post + media', 'Nested comments (2 levels)', 'Reply / report / vote actions'],
      },
    ],
  },
  {
    path: '/store',
    label: 'Store',
    group: 'public',
    intro: 'Trang cua hang gom danh muc jersey/phu kien/gear va bo loc gia, danh gia, doi tuyen.',
    sections: [
      {
        title: 'Shopping Layout',
        items: ['Promotional banner', 'Product grid modern cards', 'Quick add action'],
      },
    ],
  },
  {
    path: '/store/detail',
    label: 'Product Detail',
    group: 'public',
    intro: 'Trang chi tiet san pham voi gallery, bien the size-mau, reviews va sentiment preview.',
    sections: [
      {
        title: 'Product Blocks',
        items: ['Image gallery', 'Variants and stock', 'Reviews + rating sentiment badge'],
      },
    ],
  },
  {
    path: '/search',
    label: 'Search',
    group: 'public',
    intro: 'Trang tim kiem tong hop theo nhieu nhom du lieu va bo loc pham vi ket qua.',
    sections: [
      {
        title: 'Search Result Areas',
        items: ['Search bar center', 'Scope tabs', 'Result blocks: news/matches/teams/players/posts/products'],
      },
    ],
  },
  {
    path: '/trending',
    label: 'Trending',
    group: 'public',
    intro: 'Trang xu huong cong dong gom top keyword, top doi/tuyen thu va bieu do theo thoi gian.',
    sections: [
      {
        title: 'Trend Insights',
        items: ['Trend cards by topic', 'Time-series chart placeholder', 'Most-mentioned entities list'],
      },
    ],
  },
  {
    path: '/auth/login',
    label: 'Login',
    group: 'auth',
    intro: 'Trang dang nhap voi giao dien gon, social sign-in placeholder va split banner.',
    sections: [
      {
        title: 'Auth Form',
        items: ['Email/password fields', 'Remember me and forgot password', 'Primary CTA + social buttons'],
      },
    ],
  },
  {
    path: '/auth/register',
    label: 'Register',
    group: 'auth',
    intro: 'Trang dang ky voi luong tao tai khoan va xac nhan dieu khoan.',
    sections: [
      {
        title: 'Sign Up',
        items: ['Basic account fields', 'Agreement checkbox', 'Switch to login'],
      },
    ],
  },
  {
    path: '/auth/forgot-password',
    label: 'Forgot Password',
    group: 'auth',
    intro: 'Trang quen mat khau cho phep gui email khoi phuc.',
    sections: [
      {
        title: 'Recovery',
        items: ['Email input', 'Instruction panel', 'Back to login link'],
      },
    ],
  },
  {
    path: '/profile',
    label: 'User Profile',
    group: 'user',
    intro: 'Trang ho so nguoi dung gom thong tin ca nhan, lich su hoat dong va thong ke dong gop.',
    sections: [
      {
        title: 'Profile Overview',
        items: ['Bio and avatar area', 'Activity summary cards', 'Recent actions timeline'],
      },
    ],
  },
  {
    path: '/profile/posts',
    label: 'My Posts',
    group: 'user',
    intro: 'Trang quan ly bai viet da dang cua nguoi dung voi filter theo trang thai.',
    sections: [
      {
        title: 'Post Management',
        items: ['Draft/published tabs', 'Table or card list', 'Edit/delete actions'],
      },
    ],
  },
  {
    path: '/profile/comments',
    label: 'My Comments',
    group: 'user',
    intro: 'Trang theo doi binh luan da gui va tinh trang moderation.',
    sections: [
      {
        title: 'Comment History',
        items: ['Comment list', 'Sentiment/toxic state placeholder', 'Navigate to original thread'],
      },
    ],
  },
  {
    path: '/profile/favorites',
    label: 'Favorites & Cart',
    group: 'user',
    intro: 'Trang yeu thich va gio hang co ban de mo rong thanh checkout sau nay.',
    sections: [
      {
        title: 'Saved Items',
        items: ['Wishlisted products', 'Mini cart summary', 'Quick move to cart'],
      },
    ],
  },
  {
    path: '/admin/dashboard',
    label: 'Admin Dashboard',
    group: 'admin',
    intro: 'Tong quan KPI he thong voi cards, sentiment distribution va trend panels.',
    sections: [
      {
        title: 'Admin KPIs',
        items: ['Users/posts/comments counters', 'Toxicity ratio chart placeholder', 'Daily activity trend'],
      },
    ],
  },
  {
    path: '/admin/users',
    label: 'Admin Users',
    group: 'admin',
    intro: 'Quan ly tai khoan nguoi dung qua bang du lieu, filter vai tro va trang thai.',
    sections: [
      {
        title: 'User Management',
        items: ['Search + role filter', 'Status badges', 'Action menu (ban/unban/view)'],
      },
    ],
  },
  {
    path: '/admin/posts',
    label: 'Admin Posts',
    group: 'admin',
    intro: 'Quan ly bai viet tin tuc va bai cong dong tren cung mot workspace.',
    sections: [
      {
        title: 'Post Moderation',
        items: ['Content table', 'Category and status filters', 'Approve/reject actions'],
      },
    ],
  },
  {
    path: '/admin/comments',
    label: 'Admin Comments',
    group: 'admin',
    intro: 'Quan ly binh luan toan he thong, loc theo sentiment, toxic score va nguon bai.',
    sections: [
      {
        title: 'Comment Control',
        items: ['Comment queue table', 'Sentiment and toxic indicators', 'Hide/restore actions'],
      },
    ],
  },
  {
    path: '/admin/moderation',
    label: 'Moderation Queue',
    group: 'admin',
    intro: 'Hang cho kiem duyet cac binh luan nghiem trong de admin xu ly nhanh.',
    sections: [
      {
        title: 'Priority Queue',
        items: ['High-risk toxic comments', 'Context preview', 'Bulk approve/deny actions'],
      },
    ],
  },
  {
    path: '/admin/analytics',
    label: 'Sentiment Analytics',
    group: 'admin',
    intro: 'Trang phan tich sentiment va xu huong de theo doi suc khoe cong dong.',
    sections: [
      {
        title: 'Analytics Panels',
        items: ['Sentiment line and donut placeholder', 'Top topics trending', 'Toxic escalation alerts'],
      },
    ],
  },
]
