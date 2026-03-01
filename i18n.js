// Translations for Vietnamese (vi) and English (en).
// All values are strings or functions returning strings.
// No DOM or browser API dependencies.

export const STRINGS = {
  vi: {
    // Page / header
    title: 'Đồng Hồ Đếm Ngược',

    // Status labels
    statusSelect:  'Chọn thời gian',
    statusRunning: 'Đang chạy',
    statusPaused:  'Tạm dừng',
    statusReady:   'Sẵn sàng',

    // Primary button
    btnStart:  'Bắt đầu',
    btnPause:  'Tạm dừng',
    btnResume: 'Tiếp tục',

    // Icon buttons / labels
    resetLabel:   'Đặt lại',
    voiceLabel:   'Giọng nói',

    // History panel
    historyTitle:          'Lịch sử',
    historyClear:          'Xóa tất cả',
    historyEmpty:          'Chưa có lịch sử',
    historyAriaLabel:      'Lịch sử hẹn giờ',
    historyListAriaLabel:  'Chọn thời gian từ lịch sử',
    historyCloseLabel:     'Đóng',
    historyToggleLabel:    'Lịch sử',

    // Finish overlay
    finishTitle:    'Hết giờ!',
    finishSub:      'Phiên làm việc đã kết thúc',
    finishDismiss:  'Đặt lại',
    finishAriaLabel: 'Hết giờ',

    // Presets / custom input
    unitMin:          'phút',
    presetsAriaLabel: 'Chọn thời gian',
    customPlaceholder: 'Khác',
    customAriaLabel:  'Số phút tùy chỉnh',

    // Voice warning (may contain HTML)
    voiceWarning: 'Không tìm thấy giọng tiếng Việt trên thiết bị này. '
      + 'Hãy cài <strong>Vietnamese (Vietnam)</strong> trong cài đặt ngôn ngữ của hệ điều hành.',

    // Speech synthesis
    speechLang: 'vi-VN',

    // Spoken announcements
    announceStart:   (min) => `Bắt đầu tính thời gian cho ${min} phút`,
    announceFinish:  'Hết giờ!',
    announceElapsed: (elapsed, left) => `Đã qua ${elapsed} phút, còn ${left} phút`,
    announceMinLeft: (n) => `Còn ${n} phút`,
    announce1MinLeft: 'Còn 1 phút',
  },

  en: {
    // Page / header
    title: 'Countdown Timer',

    // Status labels
    statusSelect:  'Select time',
    statusRunning: 'Running',
    statusPaused:  'Paused',
    statusReady:   'Ready',

    // Primary button
    btnStart:  'Start',
    btnPause:  'Pause',
    btnResume: 'Resume',

    // Icon buttons / labels
    resetLabel:  'Reset',
    voiceLabel:  'Voice',

    // History panel
    historyTitle:         'History',
    historyClear:         'Clear all',
    historyEmpty:         'No history yet',
    historyAriaLabel:     'Timer history',
    historyListAriaLabel: 'Select time from history',
    historyCloseLabel:    'Close',
    historyToggleLabel:   'History',

    // Finish overlay
    finishTitle:    "Time's up!",
    finishSub:      'Session has ended',
    finishDismiss:  'Reset',
    finishAriaLabel: "Time's up",

    // Presets / custom input
    unitMin:          'min',
    presetsAriaLabel: 'Select time',
    customPlaceholder: 'Other',
    customAriaLabel:  'Custom minutes',

    // Voice warning (may contain HTML)
    voiceWarning: 'No English voice found on this device. '
      + 'Install <strong>English</strong> in your OS language settings.',

    // Speech synthesis
    speechLang: 'en-US',

    // Spoken announcements
    announceStart:   (min) => `Starting ${min} minute timer`,
    announceFinish:  "Time's up!",
    announceElapsed: (elapsed, left) => `${elapsed} minutes elapsed, ${left} left`,
    announceMinLeft: (n) => `${n} minutes left`,
    announce1MinLeft: '1 minute left',
  },
};
