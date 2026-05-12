---
name: Esport UI Sitemap
overview: Xác định đầy đủ các trang và nội dung bố cục UI cho nền tảng cộng đồng Esport theo hướng hiện đại, ưu tiên frontend trước và sẵn sàng nối backend/AI sau.
todos:
  - id: confirm-sitemap
    content: Chốt sitemap gồm tất cả nhóm trang public/user/admin theo blueprint
    status: completed
  - id: confirm-layout-style
    content: Chốt style guide (dark modern esports) và bộ layout dùng chung
    status: completed
  - id: phase-build-order
    content: Thống nhất thứ tự build UI theo 6 phase để bắt đầu code
    status: completed
isProject: false
---

# Blueprint giao diện triển khai (Frontend-first)

## 1) Định hướng phong cách tổng thể

- Tone chính: dark theme hiện đại, điểm nhấn neon/vàng/xanh điện (tham chiếu các mẫu esports bạn gửi).
- Bố cục: ưu tiên card-based, khoảng trắng rõ, headline lớn, hero section mạnh về visual.
- Trải nghiệm: responsive trước (desktop-first nhưng tối ưu tablet/mobile), chuyển cảnh mượt, hover states rõ ràng.
- Design system thống nhất: typography, spacing scale, button variants, tag/badge, table styles, chart container.

## 2) Cấu trúc điều hướng chính (IA/Sitemap)

- Public pages
  - Trang chủ
  - Tin tức Esport
  - Chi tiết bài tin
  - Lịch thi đấu / Matches
  - Chi tiết trận đấu
  - Đội tuyển
  - Chi tiết đội tuyển
  - Tuyển thủ (Players)
  - Chi tiết tuyển thủ
  - Giải đấu / Tournament
  - Chi tiết giải đấu (bracket + stream)
  - Cộng đồng (forum/feed)
  - Chi tiết bài thảo luận
  - Cửa hàng
  - Chi tiết sản phẩm
  - Tìm kiếm tổng hợp
  - Trang xu hướng (Trending)
- Auth pages
  - Đăng nhập
  - Đăng ký
  - Quên mật khẩu
- User pages
  - Hồ sơ cá nhân
  - Bài viết của tôi
  - Bình luận của tôi
  - Sản phẩm yêu thích / giỏ hàng cơ bản
- Admin pages
  - Dashboard tổng quan
  - Quản lý user
  - Quản lý bài viết/tin
  - Quản lý bình luận
  - Moderation queue (toxic)
  - Analytics sentiment & trend

## 3) Nội dung triển khai chi tiết theo từng trang

### 3.1 Trang chủ (Home)

- Hero banner lớn: sự kiện nổi bật, CTA vào Matches/Tournament.
- Khối "Hot News" (3–6 card nổi bật).
- Khối "Live/Upcoming Matches" dạng list + trạng thái thời gian thực.
- Khối "Trending Community" (top chủ đề/đội/tuyển thủ đang được nhắc đến).
- Khối "Highlights" video/clip.
- Khối "Top products" (jersey, gear) + CTA vào Store.
- Footer đầy đủ (social, liên hệ, điều khoản).

### 3.2 Trang Tin tức (News List)

- Thanh filter theo game (LoL, Valorant, CS2, Dota2, PUBG...).
- Tabs danh mục: Esport news / Transfer / Tournament / Guides.
- Bố cục: 1 bài nổi bật + grid bài thường + sidebar (most read, tags).
- Tìm kiếm nhanh theo tiêu đề/từ khóa.
- Phân trang hoặc load more.

### 3.3 Trang Chi tiết bài tin (News Detail)

- Header bài: tiêu đề, game tag, tác giả, thời gian.
- Nội dung bài (text + ảnh + quote block).
- Box bài liên quan.
- Khu bình luận cộng đồng.
- Sentiment badge cho bình luận (placeholder UI trước).

### 3.4 Trang Matches (Lịch thi đấu)

- Bộ lọc: game, giải đấu, khu vực, ngày.
- Danh sách trận theo nhóm giải (card/table).
- Trạng thái: upcoming/live/finished.
- Sidebar: top teams, top players.
- CTA vào trang chi tiết trận.

### 3.5 Trang Match Detail

- Header trận: team A vs team B, tỉ số, thời gian.
- Thông tin map stats / round history / player stats (table).
- Timeline diễn biến chính (highlight events).
- Khu "discussion theo trận" để người dùng bình luận.

### 3.6 Trang Teams (Danh sách đội)

- Grid card đội tuyển: logo, quốc gia, phong độ gần đây.
- Filter theo game/khu vực/rank.
- Sort theo phong độ, lượng theo dõi.

### 3.7 Trang Team Detail

- Cover team + roster hiện tại.
- Chỉ số nhanh: winrate, ranking, form 5 trận.
- Biểu đồ hiệu suất (placeholder chart component).
- Lịch sử trận gần đây + lịch thi đấu sắp tới.
- Bài viết/tin liên quan đội tuyển.

### 3.8 Trang Players + Player Detail

- Players list: search + filter theo đội/vị trí/game.
- Player detail:
  - Thông tin cơ bản + đội hiện tại.
  - Chỉ số chính theo game.
  - So sánh nhanh với player khác (link sang Compare).
  - Lịch sử thi đấu gần đây.

### 3.9 Trang Comparison

- Chọn 2 tuyển thủ hoặc 2 đội để so sánh.
- Bảng stats song song + bar chart/radar chart.
- Bộ lọc theo khoảng thời gian / giải đấu.

### 3.10 Trang Tournament (List)

- Hero theo giải đấu hot.
- Danh sách giải upcoming/ongoing/completed.
- Card giải: prize pool, thời gian, số đội.

### 3.11 Trang Tournament Detail

- Banner giải + mốc thời gian quan trọng.
- Bracket khu vực trung tâm (visual nổi bật).
- Danh sách teams tham gia.
- Video stream embed area.
- News liên quan giải đấu.

### 3.12 Trang Community (Forum/Feed)

- Feed bài thảo luận (new/hot/top).
- Composer box: tạo post nhanh.
- Topic tags (đội/tuyển thủ/sự kiện).
- Sidebar: trending topics, leaderboard thành viên.

### 3.13 Trang Community Post Detail

- Nội dung post + media.
- Thread bình luận nhiều cấp (2 cấp là đủ giai đoạn đầu).
- Gắn sentiment badge từng comment.
- Report / reaction / reply actions.

### 3.14 Trang Store (Danh sách sản phẩm)

- Danh mục: jersey, accessories, gaming gear.
- Bộ lọc: giá, loại, đánh giá, team brand.
- Grid sản phẩm + card hiện đại, có quick action.

### 3.15 Trang Product Detail

- Gallery ảnh sản phẩm.
- Biến thể size/màu, giá, tồn kho.
- Mô tả + thông số.
- Reviews người dùng + sentiment hiển thị bên review (placeholder).

### 3.16 Trang Search tổng hợp

- Ô search trung tâm + filter phạm vi (news/matches/teams/players/posts/products).
- Kết quả chia theo từng block loại dữ liệu.

### 3.17 Trang Trending

- Top keyword/chủ đề đang tăng trưởng.
- Biểu đồ xu hướng theo ngày/tuần.
- Top đội/tuyển thủ được nhắc đến nhiều.

### 3.18 Nhóm trang Auth + User Profile

- Auth: login/register/forgot password giao diện tối giản hiện đại.
- User profile: thông tin cá nhân, lịch sử hoạt động, bài đã đăng, bình luận gần đây, mục yêu thích.

### 3.19 Nhóm trang Admin

- Admin dashboard: cards KPI + chart sentiment/toxic/trend.
- Quản lý user/posts/comments: table + filter + action.
- Moderation queue: danh sách bình luận toxic chờ duyệt.
- Analytics: biểu đồ sentiment theo thời gian, top chủ đề nổi bật.

## 4) Bố cục khung dùng chung (layout system)

- Header sticky:
  - Logo + nav chính (Home, News, Matches, Community, Store, Tournament)
  - Ô search
  - User menu (login/avatar)
- Optional left sidebar (ở trang data-heavy như Compare/Admin)
- Main content container theo 2 dạng:
  - Content-focused (news detail, post detail)
  - Dashboard-focused (matches, compare, admin)
- Footer multi-column:
  - About, danh mục nhanh, policy, social links

## 5) Components cần chuẩn hóa để giao diện nhìn hiện đại

- Core: `Button`, `Input`, `Select`, `Tabs`, `Badge`, `Card`, `Modal`, `Tooltip`, `Pagination`.
- Data: `StatCard`, `DataTable`, `TrendChip`, `MatchRow`, `CommentItem`, `PostComposer`.
- Charts wrapper: container thống nhất cho line/bar/radar.
- Skeleton/loading + Empty states + Error states.

## 6) Lộ trình triển khai UI đề xuất (không code backend)

- Phase 1: Design system + layout tổng + Home + Header/Footer.
- Phase 2: News (list/detail) + Matches (list/detail).
- Phase 3: Community (feed/detail/comment UI) + Trending page.
- Phase 4: Team/Player/Comparison + Tournament.
- Phase 5: Store + Product detail + Profile/Auth.
- Phase 6: Admin dashboard + moderation UI + polish responsive.

## 7) Tiêu chí hoàn thiện giao diện giai đoạn đầu

- Đủ toàn bộ trang chính theo đề tài.
- Có điều hướng xuyên suốt giữa các trang.
- Dùng mock data có cấu trúc để sau này nối API.
- Responsive tốt cho desktop và mobile phổ biến.
- Nhất quán visual và tương tác (hover, loading, empty state).