(() => {
  'use strict';

  let isLoading = false;
  let btn = null;

  // 找到 sidebar 裡的歷史滾動容器
  function findHistoryContainer() {
    // 策略 1: 找 nav 或 aside 裡的可滾動元素
    const candidates = [
      ...document.querySelectorAll('nav, aside, [role="navigation"]')
    ];
    for (const el of candidates) {
      if (el.scrollHeight > el.clientHeight) return el;
    }
    // 策略 2: 找頁面左側所有可滾動的 div（sidebar 通常 x < 400px）
    const divs = document.querySelectorAll('div');
    for (const div of divs) {
      const rect = div.getBoundingClientRect();
      if (rect.width > 0 && rect.left < 400 && div.scrollHeight > div.clientHeight + 10) {
        const style = window.getComputedStyle(div);
        const overflow = style.overflowY;
        if (overflow === 'scroll' || overflow === 'auto') return div;
      }
    }
    return null;
  }

  // 等待新內容載入
  function waitForNewContent(container, prevHeight, timeout = 3000) {
    return new Promise(resolve => {
      const start = Date.now();
      const check = () => {
        if (container.scrollHeight > prevHeight) return resolve(true);
        if (Date.now() - start > timeout) return resolve(false);
        requestAnimationFrame(check);
      };
      check();
    });
  }

  async function loadAllHistory() {
    if (isLoading) return;
    isLoading = true;
    updateBtn('⏳ 載入中...');

    let container = findHistoryContainer();
    if (!container) {
      updateBtn('❌ 找不到列表');
      isLoading = false;
      return;
    }

    let loadedCount = 0;
    let noNewContent = 0;

    while (noNewContent < 3) {
      const prevHeight = container.scrollHeight;
      container.scrollTop = container.scrollHeight;

      const newContent = await waitForNewContent(container, prevHeight, 2500);
      if (newContent) {
        loadedCount++;
        noNewContent = 0;
        updateBtn(`⏳ 已載入 ${loadedCount} 批...`);
      } else {
        noNewContent++;
      }

      // 短暫等待讓 React 渲染
      await new Promise(r => setTimeout(r, 500));
    }

    isLoading = false;
    updateBtn(`✅ 完成（共 ${loadedCount} 批）`);
    setTimeout(() => updateBtn('📜 載入所有歷史'), 3000);
  }

  function updateBtn(text) {
    if (btn) btn.textContent = text;
  }

  function createBtn() {
    btn = document.createElement('button');
    btn.textContent = '📜 載入所有歷史';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      zIndex: '99999',
      background: '#1a1a2e',
      color: '#e0e0ff',
      border: '1px solid #4444aa',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '13px',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
      transition: 'opacity 0.2s',
    });
    btn.addEventListener('click', loadAllHistory);
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '0.8'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '1'; });
    document.body.appendChild(btn);
  }

  // 等 body ready 再插入按鈕
  if (document.body) {
    createBtn();
  } else {
    document.addEventListener('DOMContentLoaded', createBtn);
  }

  // 頁面 SPA 跳轉時保持按鈕存在
  const observer = new MutationObserver(() => {
    if (!document.body.contains(btn)) createBtn();
  });
  observer.observe(document.body, { childList: true, subtree: false });
})();
