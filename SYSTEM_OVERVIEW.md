# Tổng quan hệ thống Deplao Builder

## Mục đích kinh doanh

**Deplao** là ứng dụng desktop all-in-one giúp doanh nghiệp Việt Nam quản lý **bán hàng qua Zalo và Facebook Messenger** từ một giao diện duy nhất. Thay vì mở nhiều tab trình duyệt hay điện thoại cho từng tài khoản, người dùng có thể xử lý tất cả từ một nơi.

**Đối tượng khách hàng mục tiêu:**
- Nhà bán lẻ online, shop thương mại điện tử
- Doanh nghiệp vừa và nhỏ (SME)
- Agency marketing
- Dịch vụ khách hàng, CSKH

**Điểm khác biệt cốt lõi:**
- Dữ liệu lưu **100% trên máy người dùng** (SQLite local), không phụ thuộc cloud
- Hỗ trợ **nhiều tài khoản Zalo/Facebook** cùng lúc không giới hạn
- Tích hợp **CRM + ERP + Workflow Automation + AI** trong một ứng dụng

---

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────┐
│                 Electron Main Process                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ ZaloService │  │ DatabaseSvc  │  │ WorkflowSvc│  │
│  │ FacebookSvc │  │  (SQLite)    │  │ CRMQueueSvc│  │
│  │  AI / ERP   │  │              │  │ HttpRelay  │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
│                     IPC Bridge (21 channels)         │
├─────────────────────────────────────────────────────┤
│               React UI (Renderer Process)            │
│  Chat │ CRM │ Workflow │ ERP │ Integrations │ AI     │
└─────────────────────────────────────────────────────┘
                         │
               SQLite (local file)
```

**Electron** = ứng dụng desktop chạy cả Windows, macOS, Linux  
**IPC Bridge** = kênh giao tiếp an toàn giữa backend (Node.js) và frontend (React)  
**SQLite** = database nhúng trong máy, không cần server ngoài

---

## Các tính năng chính

### 1. Quản lý tin nhắn đa tài khoản (Chat Hub)

- Đăng nhập nhiều tài khoản Zalo/Facebook Messenger cùng lúc
- Hộp thư thống nhất: xem và trả lời tất cả tin nhắn từ một nơi
- Hỗ trợ tin nhắn, hình ảnh, file, voice, sticker
- Quản lý nhóm Zalo, trang Facebook

**Cách hoạt động kỹ thuật:**
- Zalo: dùng thư viện `zca-js` (thư viện mã nguồn mở giả lập Zalo Web)
- Facebook: kết nối qua giao thức **MQTT** (real-time messaging protocol)
- Mỗi tài khoản có một listener riêng, chạy song song

---

### 2. CRM — Quản lý khách hàng

- Gắn nhãn (tag) khách hàng theo nhiều tiêu chí
- Ghi chú lịch sử tương tác
- Tìm kiếm, lọc contact theo tag/trạng thái

**Chiến dịch nhắn tin hàng loạt (Mass Campaign):**
- Gửi tin theo danh sách contact đã lọc
- Giới hạn tốc độ: **60 tin/giờ/tài khoản**, tối thiểu 30 giây giữa 2 tin (tránh bị Zalo khóa)
- Thuật toán **Token Bucket**: mỗi tài khoản có "bình chứa" 60 token, mỗi lần gửi trừ 1 token, tái nạp dần theo thời gian

---

### 3. Workflow Automation — Tự động hóa

Trình tạo workflow **kéo-thả trực quan** (không cần code) với **50+ loại node**:

| Nhóm | Ví dụ node |
|------|-----------|
| **Trigger** | Nhận tin nhắn, kết bạn mới, tin nhắn trong nhóm, lịch hẹn (cron) |
| **Hành động Zalo** | Gửi tin, gửi ảnh/file, thêm bạn, quản lý nhóm |
| **Logic** | If/Switch, vòng lặp forEach, chờ (Wait), dừng nếu (StopIf) |
| **Dữ liệu** | Parse JSON, format ngày giờ, chọn ngẫu nhiên, format text |
| **Tích hợp** | Google Sheets, POS, vận chuyển, thanh toán |
| **AI** | Sinh text, phân loại nội dung |
| **Thông báo** | Telegram, Discord, Email, Notion |
| **Facebook** | Gửi tin, reaction |

**Ví dụ workflow thực tế:**
1. Khách gửi từ khóa "Giá" → AI phân tích → Gửi báo giá tự động → Ghi nhận vào Google Sheets
2. Mỗi ngày 8h → Lấy đơn hàng mới từ KiotViet → Gửi thông báo Telegram cho nhân viên

---

### 4. Tích hợp bên thứ ba (Integrations)

**Phần mềm quản lý bán hàng (POS):**
- KiotViet, Haravan, Sapo, Nhanh.vn, Pancake, iPos

**Vận chuyển:**
- GHN (Giao Hàng Nhanh), GHTK (Giao Hàng Tiết Kiệm)

**Thanh toán / Đối soát:**
- Casso, SePay

**Công cụ làm việc:**
- Google Sheets
- Telegram, Discord (nhận thông báo)
- Email

---

### 5. ERP — Quản lý nội bộ doanh nghiệp

- **Dự án & Công việc**: Board Kanban, checklist, bình luận, đính kèm file
- **Lịch nhóm**: Quản lý sự kiện, lịch hẹn
- **Nhân sự**: Quản lý nhân viên, phòng ban
- **Ghi chú nhóm**: Shared notes cho team
- **Báo cáo**: Dashboard thống kê tin nhắn, chiến dịch, hiệu suất nhân viên

---

### 6. AI Assistant

Tích hợp nhiều model AI để hỗ trợ trả lời khách hàng:

| Provider | Model |
|----------|-------|
| OpenAI | GPT-4, GPT-3.5 |
| Google | Gemini |
| Anthropic | Claude |
| Deepseek | Deepseek Chat |
| xAI | Grok |
| Mistral | Mistral AI |

AI có thể đọc file tài liệu (product catalog, FAQ...) để trả lời theo ngữ cảnh doanh nghiệp.

---

### 7. Mô hình Boss-Employee (Làm việc từ xa)

Cho phép **chủ shop** và **nhân viên** làm việc trên cùng một không gian dữ liệu:

- **Chủ** khởi chạy relay server trên máy chủ (LAN hoặc qua internet)
- **Nhân viên** kết nối đến workspace qua IP nội bộ hoặc Cloudflare tunnel
- Phân quyền chi tiết cho từng nhân viên
- Cloudflare Quick Tunnel: tạo địa chỉ public tạm thời **không cần tài khoản Cloudflare**

---

## Stack công nghệ

| Thành phần | Công nghệ |
|-----------|-----------|
| Desktop runtime | Electron 41 |
| Frontend | React 18, TypeScript 5, Vite 6 |
| State | Zustand |
| UI | Tailwind CSS 3.4 |
| Workflow UI | React Flow |
| Charts | Recharts |
| Database | SQLite (`better-sqlite3`) |
| Networking | Axios, MQTT, Express, proxy-agent |
| AI | OpenAI SDK, Gemini, Claude, Deepseek... |
| Scheduling | node-cron |
| Encryption | Electron safeStorage, bcryptjs |
| Tunneling | Cloudflare `cloudflared` |
| Build | Electron Builder (Windows .exe, macOS .dmg, Linux AppImage) |
| Obfuscation | vite-plugin-javascript-obfuscator (production only) |

---

## Cấu trúc codebase

```
deplao-builder/
├── electron/           # Main process: khởi động app, IPC handlers (21 channels)
├── src/
│   ├── services/       # Logic nghiệp vụ chính
│   │   ├── zalo/       # Quản lý tài khoản Zalo
│   │   ├── facebook/   # Quản lý tài khoản Facebook
│   │   ├── workflow/   # Engine chạy workflow
│   │   ├── crm/        # Queue gửi tin CRM
│   │   ├── database/   # SQLite schema, queries, migrations
│   │   ├── ai/         # Tích hợp AI providers
│   │   ├── integrations/ # POS, shipping, payment adapters
│   │   ├── erp/        # Task, calendar, employee services
│   │   ├── http/       # HTTP relay server
│   │   └── tunnel/     # Cloudflare tunnel wrapper
│   ├── ui/
│   │   ├── features/   # Chat, CRM, Workflow, ERP, Analytics, Settings
│   │   ├── components/ # Shared UI components
│   │   ├── store/      # Zustand global state
│   │   └── hooks/      # Custom React hooks
│   ├── models/         # TypeScript interfaces
│   ├── configs/        # App config, Vietnam address data
│   └── utils/          # Logger, ConnectionManager, WorkspaceManager
├── landing/            # Trang marketing (React app riêng)
└── resources/          # Icons, assets
```

---

## Schema database (SQLite)

| Domain | Bảng chính |
|--------|-----------|
| **Messaging** | accounts, messages, friends, page_group_member |
| **CRM** | crm_tags, crm_contact_tags, crm_notes, crm_campaigns, crm_send_log |
| **Workflow** | workflows, workflow_run_logs |
| **Integrations** | integrations (credentials mã hóa) |
| **AI** | ai_assistants, ai_assistant_files |
| **Facebook** | fb_accounts, fb_threads, fb_messages |
| **ERP** | erp_projects, erp_tasks, erp_calendar_events, erp_notes, erp_employees |

---

## Điểm đáng chú ý về bảo mật & vận hành

1. **Mã hóa credentials**: API key và mật khẩu mã hóa qua `safeStorage` của Electron (OS keychain)
2. **Obfuscation production**: Code JavaScript bị làm rối (RC4 encoding, đổi tên biến) trong bản build để bảo vệ IP
3. **GPU acceleration bật**: Tắt GPU gây lỗi UI đen/đóng băng nên giữ nguyên bật
4. **Legacy peer deps**: Cài đặt cần `npm install --legacy-peer-deps`
5. **Không cloud**: Toàn bộ dữ liệu local trừ khi nhân viên remote qua Cloudflare tunnel

---

## Phiên bản hiện tại

- **Version**: 26.4.3
- **License**: ISC
- **Author**: [babyvibe](https://github.com/babyvibe)
- **Platforms**: Windows (.exe NSIS), macOS (.dmg), Linux (AppImage/deb)
