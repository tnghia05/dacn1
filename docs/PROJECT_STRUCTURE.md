# Project Structure (Phase 1 - Frontend First)

## Muc tieu

Xay dung nhanh giao dien React cho de tai cong dong Esport, dong thoi giu cau truc sach de gan backend/AI service ve sau ma khong phai dap di lam lai.

## Frontend structure

`frontend/src` gom:

- `app`: Entry app, providers, global setup
- `layouts`: Khung trang (header, footer, dashboard shell)
- `features`: Tung nghiep vu theo module
  - `news`
  - `community`
  - `products`
  - `admin`
- `shared`: Thanh phan dung chung
  - `api`: HTTP client + endpoint adapters
  - `components`: UI dung chung
  - `types`: TypeScript types dung chung
  - `styles`: global/theme styles

## Routing blueprint da scaffold

Da tao route va trang khung cho cac nhom:

- Public: Home, News, News Detail, Matches, Match Detail, Teams, Team Detail, Players, Player Detail,
  Comparison, Tournaments, Tournament Detail, Community, Community Post Detail, Store, Product Detail,
  Search, Trending.
- Auth: Login, Register, Forgot Password.
- User: Profile, My Posts, My Comments, Favorites/Cart.
- Admin: Dashboard, Users, Posts, Comments, Moderation Queue, Sentiment Analytics.

Tat ca route hien duoc khai bao tai `frontend/src/app/appPages.ts`.

## Style guide da ap dung

- Dark esports visual voi accent xanh-vang.
- Header sticky + nav chinh + utility nav.
- Card-based content sections.
- Badge theo nhom trang (`public`, `auth`, `user`, `admin`).
- Footer da cot cho thong tin nhanh.

## Backend placeholder

`backend` dang la khung trong, giu cho cac module API sau:

- Auth/User
- Post/Comment
- Moderation/Sentiment
- Trending/Analytics

## Build order (6 phases)

1. Design system + layout tong + Home
2. News + Matches (list/detail)
3. Community + Trending
4. Teams + Players + Comparison + Tournament
5. Store + Profile + Auth
6. Admin dashboard + moderation + responsive polish
