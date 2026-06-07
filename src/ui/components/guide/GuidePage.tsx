import React from 'react';
import ipc from '@/lib/ipc';
import { useAppStore } from '@/store/appStore';

const GUIDE_GITHUB_URL = 'https://github.com/babyvibe/deplao-builder';

export default function GuidePage() {
  const { setView } = useAppStore();

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ── Hero ── */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">👋 Chào mừng đến với Deplao</h1>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Deplao là ứng dụng quản lý đa tài khoản Zalo chuyên nghiệp — giúp bạn chat, quản lý khách hàng,
            tự động hoá quy trình và tích hợp hệ sinh thái bán hàng Việt Nam.
          </p>
        </div>

        {/* ── Bắt đầu nhanh ── */}
        <Section title="🚀 Bắt đầu nhanh" color="blue">
          <div className="grid gap-3">
            {[
              { step: '1', title: 'Đăng nhập Zalo', desc: 'Quét QR hoặc nhập mã xác thực để liên kết tài khoản Zalo cá nhân. Hỗ trợ nhiều tài khoản cùng lúc.' },
              { step: '2', title: 'Khám phá Dashboard', desc: 'Xem tổng quan hoạt động: tin nhắn, liên hệ, chiến dịch, thống kê — tất cả tại một nơi.' },
              { step: '3', title: 'Chat & Quản lý', desc: 'Trò chuyện trực tiếp từ Deplao, phân loại khách hàng bằng nhãn, ghi chú nội bộ.' },
              { step: '4', title: 'Tự động hoá', desc: 'Tạo Workflow tự động trả lời, phân loại tin nhắn, gửi chiến dịch — không cần viết code.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                <div className="w-9 h-9 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Các module chính ── */}
        <Section title="📦 Các module chính" color="purple">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: '💬', title: 'Chat',
                desc: 'Trò chuyện đa tài khoản, đa kênh (Zalo + Facebook). Gửi file, ảnh, tạo nhắc hẹn, ghim tin nhắn.',
                view: 'chat' as const,
              },
              {
                icon: '📊', title: 'CRM',
                desc: 'Quản lý liên hệ, phân loại nhãn kép (Zalo + Local), ghi chú, chạy chiến dịch nhắn tin hàng loạt.',
                view: 'crm' as const,
              },
              {
                icon: '⚙️', title: 'Workflow',
                desc: 'Kéo-thả tự động hoá: 8 trigger, 15+ action, logic IF/ELSE, AI chatbot, tích hợp Sheets/Telegram/POS.',
                view: 'workflow' as const,
              },
              {
                icon: '🔗', title: 'Tích hợp',
                desc: 'Kết nối KiotViet, Haravan, Sapo, SePay, GHN... Tra cứu đơn hàng ngay trong khung chat.',
                view: 'integration' as const,
              },
              {
                icon: '📈', title: 'Báo cáo',
                desc: 'Thống kê hiệu suất chat, chiến dịch, tương tác khách hàng — biểu đồ trực quan.',
                view: 'analytics' as const,
              },
              {
                icon: '✅', title: 'Quản lý công việc',
                desc: 'Hệ thống ERP nội bộ: nhân viên, chấm công, phân quyền, thông báo realtime.',
                view: 'erp' as const,
              },
            ].map((mod, i) => (
              <button
                key={i}
                onClick={() => setView(mod.view)}
                className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 text-left hover:bg-gray-700/50 hover:border-blue-500/30 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{mod.icon}</span>
                  <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{mod.title}</p>
                  <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 ml-auto transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{mod.desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* ── Phím tắt ── */}
        <Section title="⌨️ Phím tắt thường dùng" color="amber">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { keys: 'Ctrl + K', desc: 'Mở tìm kiếm nhanh' },
              { keys: 'Ctrl + Shift + L', desc: 'Khoá ứng dụng' },
              { keys: 'Ctrl + N', desc: 'Thêm tài khoản mới' },
              { keys: 'Ctrl + ,', desc: 'Mở cài đặt' },
              { keys: 'Esc', desc: 'Đóng panel / popup' },
              { keys: 'F11', desc: 'Toàn màn hình' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-700/20 rounded-lg border border-gray-700/40">
                <kbd className="bg-gray-700 text-gray-300 text-[11px] font-mono px-2 py-0.5 rounded border border-gray-600 flex-shrink-0">
                  {item.keys}
                </kbd>
                <span className="text-xs text-gray-400">{item.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Mẹo sử dụng ── */}
        <Section title="💡 Mẹo sử dụng" color="green">
          <div className="space-y-2">
            {[
              'Kéo-thả avatar trong sidebar để sắp xếp thứ tự tài khoản.',
              'Nhấn chuột phải vào cuộc trò chuyện để mở menu ngữ cảnh (ẩn, ghim, gắn nhãn...).',
              'Dùng nhãn Zalo kết hợp CRM để phân loại khách hàng tự động.',
              'Tạo Workflow mẫu từ thư viện để bắt đầu tự động hoá nhanh chóng.',
              'Bật Tunnel trong Tích hợp khi cần nhận webhook từ bên ngoài (Casso, SePay...).',
              'Sử dụng nút 🔄 trên thanh công cụ để đồng bộ lại tin nhắn cũ.',
              'Ghim shortcut tra cứu POS/vận chuyển lên thanh chat để tra cứu nhanh.',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 bg-gray-700/20 rounded-lg border border-gray-700/40">
                <span className="text-green-400 text-xs mt-0.5 flex-shrink-0">✓</span>
                <span className="text-xs text-gray-300 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Liên kết hữu ích ── */}
        <Section title="🔗 Liên kết hữu ích" color="cyan">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              onClick={() => ipc.shell?.openExternal(GUIDE_GITHUB_URL)}
              className="flex items-center gap-3 bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 hover:border-yellow-500/30 hover:bg-gray-700/50 transition-colors cursor-pointer no-underline"
            >
              <span className="text-xl">⭐</span>
              <div>
                <p className="text-sm font-semibold text-white">GitHub Repository</p>
                <p className="text-[11px] text-gray-400">Star dự án, báo lỗi, đóng góp tính năng</p>
              </div>
            </a>
            <button
              onClick={() => setView('bugreport')}
              className="flex items-center gap-3 bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 hover:border-red-500/30 hover:bg-gray-700/50 transition-colors text-left"
            >
              <span className="text-xl">🐛</span>
              <div>
                <p className="text-sm font-semibold text-white">Báo lỗi & Hướng dẫn</p>
                <p className="text-[11px] text-gray-400">Hướng dẫn chi tiết cách báo lỗi hiệu quả</p>
              </div>
            </button>
          </div>
        </Section>

        {/* ── Footer ── */}
        <div className="text-center pb-6 pt-2">
          <p className="text-[11px] text-gray-600">
            Deplao — Quản lý Zalo chuyên nghiệp • Mã nguồn mở tại{' '}
            <a
              onClick={() => ipc.shell?.openExternal(GUIDE_GITHUB_URL)}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              github.com/babyvibe/deplao-builder
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable section wrapper ── */
function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const borderColor = {
    blue: 'border-blue-500/20',
    purple: 'border-purple-500/20',
    amber: 'border-amber-500/20',
    green: 'border-green-500/20',
    cyan: 'border-cyan-500/20',
    red: 'border-red-500/20',
  }[color] || 'border-gray-600/30';

  return (
    <div className={`border ${borderColor} rounded-xl bg-gray-800/50 p-5 space-y-4`}>
      <h2 className="text-base font-bold text-white">{title}</h2>
      {children}
    </div>
  );
}
