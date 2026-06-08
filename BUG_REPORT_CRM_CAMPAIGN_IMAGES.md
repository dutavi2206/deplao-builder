# Bug Report: Employee khong gui duoc anh trong CRM Campaign

## Mo ta

Khi nhan vien (remote workspace) tao va chay CRM Campaign co anh, khach hang khong nhan duoc anh.
Chi co may Boss moi gui duoc anh thanh cong.

## Buoc tai hien

1. May Mac (employee) dang nhap remote workspace ket noi vao Boss
2. Tao CRM Campaign voi noi dung co anh (chon anh tu may Mac)
3. Bat campaign, chay thu
4. Khach hang chi nhan duoc text, khong co anh

## Nguyen nhan

Campaign luon chay tren may **Boss** (vi Boss moi co ket noi Zalo that).
Khi employee tao campaign, duong dan file anh duoc luu theo format may Mac:

```
/Users/dutavi/Downloads/xidau1.jpg  ← Mac path
```

Campaign sync sang Boss qua `proxyToBoss('crm:saveCampaign', ...)` — chi truyen **path**, khong truyen **binary data** cua file anh.

Khi Boss chay `CRMQueueService` va doc file:
```typescript
const buffer = fs.readFileSync(filePath);
// filePath = "/Users/dutavi/Downloads/xidau1.jpg"
// File nay khong ton tai tren Windows → loi
```

## File lien quan

- `electron/ipc/crmIpc.ts` — proxyToBoss chi truyen campaign object (co path), khong truyen file
- `src/services/crm/CRMQueueService.ts` — doc file bang `fs.readFileSync(filePath)` tren may Boss

## Hanh vi mong doi

Employee tao campaign co anh tren may Mac → anh phai duoc gui thanh cong den khach hang.

## Fix de xuat

Khi employee save campaign co anh, upload binary data cua file anh len Boss qua relay truoc khi luu campaign. Boss luu file vao thu muc local cua minh, sau do cap nhat duong dan trong campaign thanh duong dan cua Boss.

Vi du flow:
```
Employee chon anh (/Users/.../xidau1.jpg)
  → Doc binary tren Mac
  → Upload len Boss qua relay API (POST /api/media/upload)
  → Boss luu file vao local storage, tra ve Boss path
  → Campaign duoc luu voi Boss path
  → CRMQueueService tren Boss doc duoc file → OK
```

## Moi truong

- Boss: Windows
- Employee: macOS
- Ket noi: Tailscale (100.x.x.x:9900)
- Phien ban: v26.4.8
