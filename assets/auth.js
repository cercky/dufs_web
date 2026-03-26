// ============================================================
// auth.js - Cookie 存储与认证工具函数
// ============================================================

function btoaUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
}

// ---------- Cookie 工具 ----------

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 86400_000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const prefix = name + '=';
  for (let part of document.cookie.split(';')) {
    part = part.trim();
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return null;
}

// ---------- 认证存储 ----------

/**
 * 读取已保存的认证信息
 * @returns {null} 不存储密码，始终返回 null
 */
function getStoredAuth() {
  // 移除密码存储功能，每次都需要重新登录
  return null;
}

// ---------- 带认证的 fetch ----------

/**
 * 包装 fetch，使用浏览器的基本认证机制
 * @param {string} url
 * @param {RequestInit} [options]
 */
async function fetchWithAuth(url, options = {}) {
  // 让浏览器处理基本认证
  // 浏览器会自动存储和携带认证信息
  // 需要设置 credentials: 'include' 来确保认证信息被发送
  return fetch(url, {
    ...options,
    credentials: 'include'
  });
}

// ---------- 模态框（退出） ----------

function showLogoutModal() {
  const $modal = document.getElementById('logoutModal');
  const $username = $modal?.querySelector('.logout-username');
  if ($username) $username.textContent = document.querySelector('.user-name')?.textContent ?? '';
  $modal?.classList.remove('hidden');
}

function hideLogoutModal() {
  document.getElementById('logoutModal')?.classList.add('hidden');
}
