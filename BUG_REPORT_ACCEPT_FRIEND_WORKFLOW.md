# Bug Report: Workflow "Chap nhan ket ban" khong hoat dong

**Ngay:** 2026-06-07
**Phien ban:** v26.4.7
**Muc do:** Medium — tinh nang workflow bi hong, khong anh huong chuc nang chinh

---

## Mo ta

Workflow voi trigger **"Khi co loi moi ket ban"** + action **"Chap nhan ket ban"** khong hoat dong.
Khi co nguoi gui loi moi ket ban, workflow trigger thanh cong nhung action "Chap nhan ket ban" luon tra ve loi.

---

## Loi hien thi

```
Node "Chap nhan ket ban" loi: Tham so khong hop le
```

---

## Log chi tiet

```json
{
  "nodeType": "zalo.acceptFriendRequest",
  "status": "error",
  "error": "Tham so khong hop le [userId=9171910790880911947 pageId=625381484730020271]"
}
```

Trigger hoat dong dung — nhan duoc userId cua nguoi gui:
```json
{
  "nodeType": "trigger.friendRequest",
  "status": "success",
  "output": {
    "userId": "9171910790880911947",
    "displayName": "...",
    "zaloId": "625381484730020271"
  }
}
```

---

## Nguyen nhan nghi ngo

### Bug 1 — Truyen sai kieu tham so vao zca-js API

zca-js `acceptFriendRequest(friendId)` nhan **string** truc tiep:

```javascript
// zca-js source:
return async function acceptFriendRequest(friendId) {
    const params = { fid: friendId, language: ctx.language };
    ...
}
```

Nhung `WorkflowEngineService.ts` dang truyen **object**:

```typescript
// WorkflowEngineService.ts (sai):
await api.acceptFriendRequest({ userId: cfg.userId } as any);
//                             ^^^^^^^^^^^^^^^^^^^ object, khong phai string
```

Zalo nhan duoc `fid = { userId: "..." }` thay vi `fid = "..."` → reject.

### Bug 2 — "Chay thu" tao sai du lieu test

Khi bam **"Chay thu"** tren workflow `trigger.friendRequest`, he thong dung mock data cua `trigger.message` (co `threadId`, `fromId`, `content`) thay vi du lieu friend request (can co `userId`).

Ket qua: `{{ $trigger.userId }}` = `""` (rong) → `acceptFriendRequest("")` → Zalo reject.

---

## Cach tai hien

1. Tao workflow: Trigger = "Khi co loi moi ket ban" → Action = "Chap nhan ket ban" voi `{{ $trigger.userId }}`
2. Bat workflow
3. Gui loi moi ket ban tu tai khoan Zalo khac
4. Xem workflow_run_logs → node "Chap nhan ket ban" luon co `status: error`

---

## Fix de xuat

**File:** `src/services/workflow/WorkflowEngineService.ts`

```typescript
// Sua:
case 'zalo.acceptFriendRequest': {
    const api = this.getApi(ctx.pageId);
    await api.acceptFriendRequest(cfg.userId);  // truyen string, khong phai object
    return { success: true };
}

case 'zalo.rejectFriendRequest': {
    const api = this.getApi(ctx.pageId);
    await (api as any).rejectFriendRequest(cfg.userId);  // tuong tu
    return { success: true };
}
```

**Luu y:** Sau khi sua Bug 1, van con can kiem tra xem Zalo API tra ve loi gi voi userId dung.
Co the Zalo API `acceptFriendRequest` can them tham so hoac format khac.

**File:** `src/ui/components/workflow/WorkflowEngineService.ts` hoac noi xu ly "Chay thu"

Fix mock data cho `trigger.friendRequest` phai co cau truc:
```json
{
  "userId": "mock_user_id",
  "displayName": "Test User",
  "phone": "",
  "message": "",
  "zaloId": "owner_zalo_id"
}
```

---

## Trang thai hien tai

- Bug 1 da duoc fix (string thay vi object) nhung van con loi
- Nguyen nhan sau chua xac dinh ro: co the Zalo API `acceptFriendRequest` can format khac
- Can developer co the debug voi dev mode de xem error code chinh xac tu Zalo
