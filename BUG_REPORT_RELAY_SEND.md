# Bug Report: Nhân viên remote không gửi được tin nhắn Zalo

**Ngày:** 2026-06-04  
**Phiên bản:** v26.4.3  
**Mức độ:** Critical — ảnh hưởng trực tiếp đến chức năng cốt lõi

---

## Mô tả

Khi nhân viên kết nối qua **Remote Workspace** (Boss-Employee mode), gửi tin nhắn Zalo từ máy nhân viên **không đến được khách hàng**.

Tin nhắn xuất hiện trên giao diện nhân viên nhưng:
- Không có **avatar nhân viên** đính kèm (dấu hiệu gửi qua proxy thất bại)
- Khách hàng **không nhận được** tin nhắn
- Không hiện bất kỳ thông báo lỗi nào trên UI

---

## Môi trường

| Thành phần | Chi tiết |
|-----------|----------|
| Máy Boss | Windows, kết nối LAN, app chạy 24/7 |
| Máy nhân viên | macOS, kết nối qua Tailscale (100.x.x.x:9900) |
| Kết nối | Tailscale VPN, relay server port 9900 |
| Tài khoản | Boss assign 1 tài khoản Zalo cho nhân viên |

---

## Cách tái hiện

1. Boss bật relay server, nhân viên kết nối remote workspace
2. Nhân viên gửi tin nhắn Zalo từ máy của mình
3. **Kết quả:** Tin hiện trên UI nhưng không có avatar, khách không nhận được

---

## Root Cause (Phân tích kỹ thuật)

### Luồng proxy action

Khi nhân viên gửi tin, luồng xử lý là:

```
[Máy nhân viên]
ipc.zalo.sendMessage({ auth: { cookies: '', imei: '', userAgent: '' }, threadId, type, message })
  │
  ▼ (zaloIpc.ts — phát hiện remote workspace)
HttpConnectionManager.proxyAction(wsId, 'zalo:sendMessage', params)
  │
  ▼ (HTTP POST → Boss)
HttpRelayService.executeProxyAction(employee, channel, params)
  │
  ├─ resolveRealAuth(zaloId, params.auth)  ← lấy auth thật từ ConnectionManager/DB
  │    → trả về plain object: { cookies: realCookies, imei, user_agent }
  │
  ├─ params.auth = realAuth  ← replace auth
  │
  ▼ (gọi ipcHandlerRegistry handler)
zaloIpc.wrap → getService(auth) → ZaloService.getInstance(auth)
  │
  ├─ JSON.stringify(plainObject) = '{"cookies":"...","imei":"...","user_agent":"..."}'
  ├─ key = base64(cookies)
  │
  ├─ Nếu key KHỚP instance cũ → reuse → OK
  └─ Nếu key KHÔNG KHỚP → tạo instance MỚI → gọi loginZalo() → Zalo trả về
                                                "Tham số không hợp lệ" ❌
```

### Vấn đề cụ thể

`ZaloService.instances` được keyed bằng `base64(cookies)`. Khi `resolveRealAuth` lấy cookies từ `ConnectionManager.conn.auth`, cookies này có thể có format **khác** với cookies dùng khi tạo instance ban đầu (do quá trình parse/stringify qua nhiều lớp).

Kết quả: `getInstance` không tìm thấy instance cũ → tạo instance mới → `loginZalo()` với cookies → Zalo từ chối vì tham số không hợp lệ.

### Tại sao không có thông báo lỗi?

`sendMessage` trong `MessageInput.tsx` không check kết quả:

```typescript
// TRƯỚC (bug):
await ipc.zalo?.sendMessage({ auth, threadId, ... });
// Kết quả { success: false, error: '...' } bị bỏ qua hoàn toàn
```

---

## Những gì đã thử

### Fix 1 — Push `initialState` khi SSE reconnect
**Mục đích:** Cập nhật `assignedAccounts` trên client sau khi Mac ngủ/thức  
**Kết quả:** Giảm thời gian reconnect, nhưng lỗi vẫn còn

### Fix 2 — Thêm error notification khi gửi thất bại
**Mục đích:** Hiển thị lỗi thật thay vì im lặng  
**Kết quả:** Xác nhận lỗi là "Tham số không hợp lệ" từ Zalo API

**File:** `src/ui/components/chat/MessageInput.tsx`
```typescript
// SAU (fix):
const sendResult = await ipc.zalo?.sendMessage({ auth, threadId, ... });
if (sendResult && sendResult.success === false) {
    showNotification('Gửi thất bại: ' + (sendResult.error || 'Lỗi không xác định'), 'error');
}
```

### Fix 3 — Bypass auth lookup bằng `getByZaloId`
**Mục đích:** Relay path dùng thẳng ZaloService instance đang chạy, không qua cookie lookup  
**Kết quả:** Chưa xác nhận — lỗi vẫn còn

**Files đã sửa:**
- `src/services/zalo/ZaloService.ts` — thêm `getByZaloId(zaloId)`
- `electron/ipc/zaloIpc.ts` — relay path dùng `getByZaloId`
- `src/services/http/HttpRelayService.ts` — truyền `_relayZaloId` trong params

---

## Nghi vấn còn lại

Lỗi "Tham số không hợp lệ" vẫn xảy ra sau Fix 3. Có thể do một trong hai nguyên nhân:

1. **`ZaloService.getByZaloId` trả về null** — instance chưa được tạo trên Boss vì một lý do nào đó (cần thêm log để xác nhận)

2. **Params gửi đến Zalo API sai** — `threadId`, `type`, hoặc `message` format sai khi đi qua relay

---

## Đề xuất cho nhà phát triển

### Cần xác nhận ngay

Thêm log ở `executeProxyAction` để xem:
```typescript
Logger.log(`[Relay] zaloId=${zaloId}, assigned=${employee.assigned_accounts}, instance=${!!ZaloService.getByZaloId(zaloId)}`);
```

Và trong `wrap`:
```typescript
if (_fromRelay && _relayZaloId) {
    const relayService = ZaloService.getByZaloId(_relayZaloId);
    Logger.log(`[Relay] getByZaloId(${_relayZaloId}) = ${!!relayService}`);
    ...
}
```

### Fix đề xuất

Nếu `getByZaloId` trả về null, vấn đề là ZaloService instance chưa được tạo. Cần đảm bảo khi account đăng nhập, instance được giữ trong `ZaloService.instances` và không bị cleanup.

Nếu instance tồn tại nhưng vẫn lỗi, cần kiểm tra `rest` params (threadId, type) được truyền đúng không.

---

## Files đã thay đổi (trên branch `personal/main`)

```
src/services/zalo/ZaloService.ts          — thêm getByZaloId()
src/services/http/HttpRelayService.ts     — truyền _relayZaloId, push initialState khi SSE reconnect
electron/ipc/zaloIpc.ts                   — relay path dùng getByZaloId
src/ui/components/chat/MessageInput.tsx   — hiển thị lỗi khi sendMessage thất bại
src/__tests__/HttpRelayService.sleep-wake.test.ts
src/__tests__/ZaloService.relay-proxy.test.ts
```

---

## Tác động

Toàn bộ tính năng **Boss-Employee remote workspace** bị ảnh hưởng. Nhân viên remote không thể gửi tin nhắn Zalo, làm mất đi giá trị cốt lõi của chế độ làm việc từ xa.
