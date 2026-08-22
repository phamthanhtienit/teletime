# TeleTime — App chấm công cho telesale

Hệ thống chấm công cho nhân viên telesale (Transamerica), gồm 3 phần:

- `backend/` — API (Express + TypeScript + PostgreSQL/Prisma)
- `admin-web/` — Web quản trị cho Admin (React + Vite)
- `mobile-app/` — App di động cho Agent (React Native / Expo)

## Cách hoạt động (tóm tắt)

- Agent chấm công vào/ra trên app di động. App lấy vị trí GPS và gửi lên server.
- Server kiểm tra: (1) GPS phải nằm trong bán kính cho phép quanh văn phòng, và (2) nếu
  Admin có khai báo danh sách IP WiFi công ty thì địa chỉ IP public của request phải nằm
  trong danh sách đó. Đây là cách kết hợp "WiFi + GPS" — dùng IP public thay vì đọc tên
  WiFi (SSID) để tương thích với Expo (không cần quyền native phức tạp).
- Agent tự đăng ký ca làm trong ngày → Admin duyệt mới có hiệu lực.
- Agent xin nghỉ phép → Admin duyệt/từ chối.
- Admin quản lý nhân viên, xem bảng chấm công, cấu hình vị trí văn phòng qua trang web.

## Yêu cầu môi trường

- Node.js 20+ (khuyến nghị dùng bản LTS mới nhất)
- PostgreSQL (chạy local qua Docker, hoặc cài trực tiếp)
- Điện thoại cài app **Expo Go** (để chạy thử mobile-app nhanh nhất) — tải trên App Store /
  Google Play

## 1. Chạy backend

```bash
cd backend
cp .env.example .env      # sua DATABASE_URL/JWT_SECRET neu can
npm install
docker compose up -d      # bat container PostgreSQL local (can cai Docker Desktop)
npx prisma migrate dev --name init
npm run seed               # tao tai khoan Admin mau + 2 ca lam mau
npm run dev                 # chay server tai http://localhost:4000
```

Tài khoản Admin mặc định sau khi seed (xem/đổi trong `.env`):
- Email: `admin@teletime.local`
- Mật khẩu: `Admin@123`

Nếu chưa cài Docker, có thể dùng PostgreSQL cài sẵn trên máy — chỉ cần sửa `DATABASE_URL`
trong `.env` cho đúng.

## 2. Chạy admin-web

```bash
cd admin-web
cp .env.example .env       # VITE_API_URL tro ve dia chi backend
npm install
npm run dev                 # mo http://localhost:5173
```

Đăng nhập bằng tài khoản Admin ở trên. Vào mục **Cấu hình văn phòng** để nhập tọa độ GPS
văn phòng (có nút "Lấy vị trí hiện tại") và bán kính cho phép trước khi Agent chấm công được.

## 3. Chạy mobile-app

```bash
cd mobile-app
npm install
npx expo start
```

Quét mã QR bằng app Expo Go trên điện thoại (điện thoại và máy tính phải cùng mạng WiFi).

**Quan trọng:** mở `src/config/env.ts` và đổi `API_BASE_URL` thành địa chỉ IP LAN của máy
tính đang chạy backend (VD: `http://192.168.1.10:4000/api`), vì điện thoại không thể dùng
`localhost` để trỏ về máy tính. Tìm IP LAN bằng lệnh `ipconfig` (Windows) rồi tìm dòng
"IPv4 Address".

Admin cần tạo trước tài khoản Agent trong trang admin-web (mục **Nhân viên**) để có thể
đăng nhập trên app.

## Cấu trúc thư mục chính

```
backend/
  prisma/schema.prisma       # dinh nghia database
  src/modules/                # tung nhom API: auth, users, attendance, shifts, leave, office
admin-web/
  src/pages/                  # cac trang: dang nhap, cham cong, nhan vien, duyet ca, duyet phep, cau hinh
mobile-app/
  src/screens/                # cac man hinh: dang nhap, cham cong, lich su, dang ky ca, nghi phep
```

## Việc còn lại / hướng phát triển tiếp

- Deploy backend + database lên VPS/cloud, đổi `VITE_API_URL` và `API_BASE_URL` sang domain
  thật, dùng HTTPS.
- Build app thật (APK/IPA) bằng `eas build` khi cần cài đặt chính thức thay vì chạy qua
  Expo Go.
- Có thể bổ sung: thông báo đẩy khi đơn được duyệt, xuất báo cáo chấm công ra Excel, quản
  lý nhiều văn phòng/chi nhánh nếu công ty mở rộng.
