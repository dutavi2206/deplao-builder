import React from 'react';
import ipc from '@/lib/ipc';

const ISSUES_URL = 'https://github.com/babyvibe/deplao-builder/issues';
const ISSUES_NEW_URL = 'https://github.com/babyvibe/deplao-builder/issues/new';

export default function BugReportPage() {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ── Hero ── */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">🐛 Báo lỗi & Hướng dẫn</h1>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Tìm thấy lỗi? Chúng tôi rất mong nhận được phản hồi từ bạn! Báo cáo chi tiết giúp nhóm phát triển
            xác định và sửa lỗi nhanh hơn.
          </p>
        </div>

        {/* ── Nút tạo Issue nhanh ── */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => ipc.shell?.openExternal(ISSUES_NEW_URL)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Tạo Issue mới trên GitHub
          </button>
          <button
            onClick={() => ipc.shell?.openExternal(ISSUES_URL)}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Xem danh sách Issues
          </button>
        </div>

        {/* ── Tại sao cần báo cáo chi tiết? ── */}
        <div className="border border-amber-500/20 rounded-xl bg-amber-900/10 p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>⚠️</span> Lưu ý quan trọng
          </h2>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="text-amber-400 text-xs mt-0.5 flex-shrink-0">⚡</span>
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-white">Báo cáo có chứng minh rõ ràng sẽ được ưu tiên xử lý trước.</strong>{' '}
                Các issue chỉ ghi "không hoạt động" hoặc "bị lỗi" mà không có mô tả chi tiết, screenshot, hoặc
                bước tái hiện sẽ mất nhiều thời gian hơn để xử lý — hoặc có thể bị bỏ qua nếu không thể tái hiện.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-amber-400 text-xs mt-0.5 flex-shrink-0">📋</span>
              <p className="text-xs text-gray-300 leading-relaxed">
                Issue chất lượng cao = sửa nhanh hơn. Mỗi phút bạn bỏ ra mô tả chi tiết giúp tiết kiệm hàng giờ cho đội ngũ phát triển.
              </p>
            </div>
          </div>
        </div>

        {/* ── Quy trình báo lỗi — 5 bước ── */}
        <div className="border border-blue-500/20 rounded-xl bg-gray-800/50 p-5 space-y-5">
          <h2 className="text-base font-bold text-white">📝 Quy trình báo lỗi — 5 bước</h2>

          {/* Bước 1 */}
          <Step number={1} title="Tái hiện lỗi" accent="blue">
            <p className="text-xs text-gray-400 mb-2">Trước khi báo lỗi, hãy thử tái hiện lại vấn đề:</p>
            <ul className="space-y-1.5">
              <Li>Lặp lại thao tác bạn vừa thực hiện khi gặp lỗi</Li>
              <Li>Ghi nhận <strong className="text-white">từng bước cụ thể</strong> (ví dụ: "Mở CRM → Nhấn tab Chiến dịch → Nhấn Tạo mới → Lỗi xuất hiện")</Li>
              <Li>Xác nhận lỗi có xảy ra <strong className="text-white">mỗi lần</strong> hay chỉ thỉnh thoảng</Li>
              <Li>Thử trên phiên bản Deplao mới nhất (xem phiên bản ở thanh trên cùng bên trái)</Li>
            </ul>
          </Step>

          {/* Bước 2 */}
          <Step number={2} title="Chụp ảnh / quay video minh hoạ" accent="purple">
            <p className="text-xs text-gray-400 mb-2">Hình ảnh giúp nhóm phát triển hiểu lỗi nhanh hơn 10 lần so với文字:</p>
            <ul className="space-y-1.5">
              <Li><strong className="text-white">Screenshot màn hình</strong> — chụp khi lỗi xuất hiện (phím <kbd className="bg-gray-700 text-gray-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-gray-600">PrtScn</kbd> hoặc dùng Snipping Tool)</Li>
              <Li><strong className="text-white">Quay video ngắn</strong> (10-30 giây) nếu lỗi liên quan đến thao tác nhiều bước — dùng Xbox Game Bar (<kbd className="bg-gray-700 text-gray-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-gray-600">Win + G</kbd>)</Li>
              <Li><strong className="text-white">Chụp Developer Tools</strong> — nhấn <kbd className="bg-gray-700 text-gray-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-gray-600">Ctrl + Shift + I</kbd>, chọn tab Console, chụp lại các dòng lỗi đỏ</Li>
              <Li>Dùng mũi tên hoặc đánh dấu <span className="text-red-400">viền đỏ</span> để chỉ rõ vị trí lỗi trên ảnh</Li>
            </ul>
          </Step>

          {/* Bước 3 */}
          <Step number={3} title="Thu thập thông tin kỹ thuật" accent="green">
            <p className="text-xs text-gray-400 mb-2">Cung cấp thêm bối cảnh giúp xác định nguyên nhân gốc:</p>
            <ul className="space-y-1.5">
              <Li><strong className="text-white">Phiên bản Deplao</strong> — hiển thị ở thanh trên cùng (VD: v26.4.7)</Li>
              <Li><strong className="text-white">Hệ điều hành</strong> — Windows 10/11, macOS (Intel/Apple Silicon)</Li>
              <Li><strong className="text-white">Tài khoản nào gặp lỗi</strong> — Zalo cá nhân, Zalo Business, hay Facebook</Li>
              <Li><strong className="text-white">Tính năng liên quan</strong> — Chat, CRM, Workflow, Tích hợp...</Li>
              <Li>Nếu có <strong className="text-white">lỗi hiển thị trong Console</strong> (<kbd className="bg-gray-700 text-gray-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-gray-600">Ctrl+Shift+I</kbd> → Console) — copy-paste nội dung lỗi</Li>
            </ul>
          </Step>

          {/* Bước 4 */}
          <Step number={4} title="Viết mô tả Issue trên GitHub" accent="orange">
            <p className="text-xs text-gray-400 mb-2">Sử dụng cấu trúc sau để viết báo cáo:</p>
            <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700/50 text-xs font-mono text-gray-300 space-y-2 overflow-x-auto">
              <p className="text-gray-500"># Tiêu đề: Mô tả ngắn gọn lỗi</p>
              <p><span className="text-blue-400">## Mô tả lỗi</span></p>
              <p className="text-gray-400">Mô tả ngắn gọn điều gì đã xảy ra (1-2 câu)</p>
              <p><span className="text-blue-400">## Bước tái hiện</span></p>
              <p className="text-gray-400">1. Mở Deplao, đăng nhập tài khoản Zalo</p>
              <p className="text-gray-400">2. Vào mục CRM → tab Chiến dịch</p>
              <p className="text-gray-400">3. Nhấn nút "Tạo chiến dịch mới"</p>
              <p className="text-gray-400">4. → Lỗi: popup trắng, không thể soạn tin</p>
              <p><span className="text-blue-400">## Kết quả mong đợi</span></p>
              <p className="text-gray-400">Popup hiện form soạn tin nhắn chiến dịch</p>
              <p><span className="text-blue-400">## Kết quả thực tế</span></p>
              <p className="text-gray-400">Popup trắng hoàn toàn, console hiện lỗi TypeError</p>
              <p><span className="text-blue-400">## Ảnh/Video đính kèm</span></p>
              <p className="text-gray-400">[Kéo-thả ảnh vào đây hoặc paste link]</p>
              <p><span className="text-blue-400">## Thông tin môi trường</span></p>
              <p className="text-gray-400">- Deplao: v26.4.7</p>
              <p className="text-gray-400">- OS: Windows 11 23H2</p>
              <p className="text-gray-400">- Tài khoản: Zalo cá nhân</p>
            </div>
          </Step>

          {/* Bước 5 */}
          <Step number={5} title="Gửi Issue và theo dõi" accent="cyan">
            <ul className="space-y-1.5">
              <Li>Nhấn <strong className="text-white">"Submit new issue"</strong> trên GitHub</Li>
              <Li>Theo dõi email thông báo từ GitHub khi có phản hồi</Li>
              <Li>Nếu nhóm phát triển yêu cầu thêm thông tin, hãy phản hồi càng sớm càng tốt</Li>
              <Li>Khi lỗi đã sửa, cập nhật Deplao và xác nhận lại</Li>
            </ul>
          </Step>
        </div>

        {/* ── Ví dụ cụ thể ── */}
        <div className="border border-green-500/20 rounded-xl bg-gray-800/50 p-5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>📖</span> Ví dụ: Báo cáo lỗi cụ thể
          </h2>
          <p className="text-xs text-gray-400">Dưới đây là ví dụ mẫu về một báo cáo lỗi chất lượng cao:</p>

          <div className="bg-gray-900/60 rounded-xl border border-gray-700/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-red-900/40 text-red-300 text-[10px] px-2 py-0.5 rounded-full font-medium">bug</span>
              <h3 className="text-sm font-bold text-white">Chiến dịch CRM: Không gửi được tin khi chọn hơn 100 liên hệ</h3>
            </div>
            <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
              <p><strong className="text-gray-200">Mô tả:</strong> Khi tạo chiến dịch gửi tin hàng loạt với hơn 100 người nhận, nút "Bắt đầu gửi" không phản hồi. Console hiện lỗi timeout.</p>
              <p><strong className="text-gray-200">Bước tái hiện:</strong></p>
              <ol className="list-decimal pl-5 space-y-0.5">
                <li>Mở CRM → Chiến dịch → Tạo chiến dịch mới</li>
                <li>Chọn đối tượng: tất cả liên hệ có nhãn "Khách hàng" (~150 người)</li>
                <li>Nhập nội dung tin nhắn → Nhấn "Bắt đầu gửi"</li>
                <li>→ Không có phản hồi, nút chuyển thành disabled nhưng không gửi</li>
              </ol>
              <p><strong className="text-gray-200">Kết quả mong đợi:</strong> Chiến dịch bắt đầu gửi, hiển thị tiến trình "Đang gửi 0/150"</p>
              <p><strong className="text-gray-200">Ảnh đính kèm:</strong> [Screenshot popup chiến dịch] + [Screenshot Console lỗi timeout]</p>
              <p><strong className="text-gray-200">Môi trường:</strong> Deplao v26.4.5, Windows 11, Zalo cá nhân, đã test với 50 người (bình thường), 100 người (bình thường), 150 người (lỗi)</p>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
            <p className="text-xs text-green-300 flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>
                Báo cáo trên có đầy đủ: <strong className="text-white">bước tái hiện chính xác</strong>,{' '}
                <strong className="text-white">ảnh/video minh hoạ</strong>,{' '}
                <strong className="text-white">so sánh kết quả mong đợi vs thực tế</strong>, và{' '}
                <strong className="text-white">thông tin môi trường</strong>. Đây là mẫu báo cáo giúp nhóm phát triển
                xác định và sửa lỗi trong thời gian ngắn nhất.
              </span>
            </p>
          </div>
        </div>

        {/* ── Các loại lỗi hay gặp ── */}
        <div className="border border-purple-500/20 rounded-xl bg-gray-800/50 p-5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🔍</span> Các loại lỗi thường gặp & cách mô tả
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: '🔴', type: 'Lỗi crash / treo app',
                tips: 'Mô tả thao tác cuối trước khi crash. Chụp screenshot màn hình lỗi nếu có. Kiểm tra Console (Ctrl+Shift+I).',
              },
              {
                icon: '🟡', type: 'Lỗi giao diện / hiển thị',
                tips: 'Chụp screenshot so sánh: hiện tại vs mong đợi. Ghi rõ trình điều khiển (Windows/macOS), độ phân giải màn hình.',
              },
              {
                icon: '🔵', type: 'Lỗi kết nối / đồng bộ',
                tips: 'Ghi thời điểm gặp lỗi. Kiểm tra mạng internet. Thử đăng nhập lại. Gửi screenshot trạng thái kết nối.',
              },
              {
                icon: '🟣', type: 'Lỗi tích hợp bên thứ 3',
                tips: 'Ghi rõ tích hợp nào (KiotViet, SePay...). Kiểm tra API key còn hợp lệ. Mô tả expected vs actual response.',
              },
              {
                icon: '🟠', type: 'Lỗi Workflow không chạy',
                tips: 'Screenshot flow designer. Ghi trigger và action đang dùng. Kiểm tra log Workflow trong tab "Chạy gần đây".',
              },
              {
                icon: '⚪', type: 'Hiệu năng chậm / lag',
                tips: 'Ghi quy mô dữ liệu (số tài khoản, số liên hệ, số workflow). Mô tả thao tác nào bị chậm. So sánh với phiên bản trước nếu có.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <p className="text-xs font-bold text-white">{item.type}</p>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{item.tips}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Không nên làm ── */}
        <div className="border border-red-500/20 rounded-xl bg-red-900/10 p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🚫</span> Những điều KHÔNG nên làm
          </h2>
          <div className="space-y-2">
            {[
              'Gửi issue chỉ ghi "app bị lỗi" mà không có mô tả chi tiết',
              'Gửi nhiều issue trùng lặp — hãy kiểm tra issue đã tồn tại chưa trước khi tạo mới',
              'Đính kèm ảnh chụp thông tin nhạy cảm (mã OTP, mật khẩu, SĐT khách hàng...)',
              'Dùng issue để hỏi cách sử dụng — hãy đọc trang Hướng dẫn sử dụng trước',
              'Gửi yêu cầu tính năng mới qua mục báo lỗi — hãy tạo issue riêng với nhãn "enhancement"',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-red-400 text-xs mt-0.5 flex-shrink-0">✕</span>
                <span className="text-xs text-gray-300 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center space-y-3 pb-6 pt-2">
          <p className="text-xs text-gray-400">
            Cảm ơn bạn đã đóng góp cải thiện Deplao! 💙
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => ipc.shell?.openExternal(ISSUES_NEW_URL)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Tạo Issue ngay →
            </button>
            <button
              onClick={() => ipc.shell?.openExternal(ISSUES_URL)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded-lg transition-colors"
            >
              Xem Issues hiện có
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step component ── */
function Step({ number, title, accent, children }: { number: number; title: string; accent: string; children: React.ReactNode }) {
  const dotBg = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    cyan: 'bg-cyan-600',
  }[accent] || 'bg-gray-600';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-8 h-8 rounded-full ${dotBg} text-white flex items-center justify-center text-xs font-bold`}>
          {number}
        </div>
        {number < 5 && <div className="w-px flex-1 bg-gray-700 mt-1" />}
      </div>
      <div className="flex-1 pb-3">
        <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* ── List item ── */
function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-xs text-gray-400">
      <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
