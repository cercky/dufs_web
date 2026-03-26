// ============================================================
// utils.js - 常量、全局状态与工具函数
// ============================================================

// ---------- 常量 ----------
const DUFS_MAX_UPLOADINGS = 3;
const MAX_SUBPATHS_COUNT  = 1000;
const IFRAME_FORMATS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
  '.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm',
  '.mp3', '.ogg', '.wav', '.m4a',
];
const EDITOR_FORMATS = [
  '.txt', '.md', '.markdown', '.json', '.yaml', '.yml', '.xml', '.html', '.htm',
  '.css', '.scss', '.less', '.js', '.jsx', '.ts', '.tsx', '.vue', '.py', '.rb',
  '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.go', '.rs', '.swift',
  '.kt', '.sh', '.bat', '.ps1', '.sql', '.ini', '.conf', '.cfg', '.env',
  '.log', '.csv', '.toml', '.gitignore', '.dockerignore'
];

// ── 文件类型图标系统 ────────────────────────────────────────
// 极简扁平风格：目录用蓝色文件夹，文件统一灰白底 + 折角 + 扩展名标签。

/** 目录 SVG */
const _SVG_DIR = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="#7DB8F5" stroke="#4A90E2" stroke-width="1.2" stroke-linejoin="round"/></svg>';
/** 符号链接目录 SVG */
const _SVG_SYMLINK_DIR = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="#B8D9F0" stroke="#7FB3D3" stroke-width="1.2" stroke-linejoin="round"/></svg>';
/** 通用文件底板（无标签） */
const _SVG_FILE_BASE = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#F0F4F8" stroke="#B0BEC5" stroke-width="1.2" stroke-linejoin="round"/><path d="M14 2L14 8L20 8" fill="#D8E4EC" stroke="#B0BEC5" stroke-width="1.2" stroke-linejoin="round"/></svg>';

// 扩展名 → 标签映射
const _EXT_LABEL = {
  '.jpg':'JPG','.jpeg':'JPG','.png':'PNG','.gif':'GIF','.bmp':'BMP',
  '.webp':'WEBP','.svg':'SVG','.ico':'ICO','.tif':'TIF','.tiff':'TIF','.heic':'HEIC',
  '.mp4':'MP4','.mov':'MOV','.avi':'AVI','.wmv':'WMV','.flv':'FLV',
  '.webm':'WEBM','.mkv':'MKV','.m4v':'M4V','.rmvb':'RMVB',
  '.mp3':'MP3','.ogg':'OGG','.wav':'WAV','.m4a':'M4A',
  '.flac':'FLAC','.aac':'AAC','.wma':'WMA','.opus':'OPUS',
  '.pdf':'PDF',
  '.doc':'DOC','.docx':'DOCX','.odt':'ODT','.rtf':'RTF',
  '.xls':'XLS','.xlsx':'XLSX','.ods':'ODS','.csv':'CSV',
  '.ppt':'PPT','.pptx':'PPTX','.odp':'ODP','.key':'KEY',
  '.zip':'ZIP','.rar':'RAR','.7z':'7Z','.tar':'TAR',
  '.gz':'GZ','.bz2':'BZ2','.xz':'XZ','.tgz':'TGZ','.zst':'ZST',
  '.js':'JS','.ts':'TS','.jsx':'JSX','.tsx':'TSX',
  '.py':'PY','.java':'JAVA','.c':'C','.cpp':'C++','.cs':'C#',
  '.go':'GO','.rs':'RS','.swift':'SWIFT','.kt':'KT',
  '.rb':'RB','.php':'PHP','.sh':'SH','.ps1':'PS1','.bat':'BAT','.lua':'LUA',
  '.html':'HTML','.htm':'HTML','.css':'CSS','.scss':'SCSS','.xml':'XML','.vue':'VUE',
  '.json':'JSON','.yaml':'YAML','.yml':'YAML','.toml':'TOML',
  '.ini':'INI','.cfg':'CFG','.conf':'CONF','.env':'ENV','.sql':'SQL',
  '.txt':'TXT','.md':'MD','.log':'LOG','.rst':'RST',
  '.exe':'EXE','.msi':'MSI','.apk':'APK','.dmg':'DMG',
  '.deb':'DEB','.rpm':'RPM','.bin':'BIN','.iso':'ISO','.img':'IMG',
  '.ttf':'TTF','.otf':'OTF','.woff':'WOFF','.woff2':'WOFF2',
};

// 扩展名 → 颜色映射（基于文件类型）
const _EXT_COLOR = {
  // 图片
  '.jpg':'#FF6B6B','.jpeg':'#FF6B6B','.png':'#4ECDC4','.gif':'#FFD166','.bmp':'#06D6A0',
  '.webp':'#118AB2','.svg':'#073B4C','.ico':'#7209B7','.tif':'#F72585','.tiff':'#F72585','.heic':'#4CC9F0',
  // 视频
  '.mp4':'#4361EE','.mov':'#3A0CA3','.avi':'#7209B7','.wmv':'#F72585','.flv':'#4CC9F0',
  '.webm':'#4ECDC4','.mkv':'#4361EE','.m4v':'#3A0CA3','.rmvb':'#7209B7',
  // 音频
  '.mp3':'#FF9F1C','.ogg':'#2EC4B6','.wav':'#E76F51','.m4a':'#1A535C',
  '.flac':'#4ECDC4','.aac':'#FF9F1C','.wma':'#2EC4B6','.opus':'#E76F51',
  // 文档
  '.pdf':'#E63946','.doc':'#2563EB','.docx':'#2563EB','.odt':'#3B82F6','.rtf':'#64748B',
  '.xls':'#10B981','.xlsx':'#10B981','.ods':'#10B981','.csv':'#64748B',
  '.ppt':'#F59E0B','.pptx':'#F59E0B','.odp':'#F59E0B','.key':'#F59E0B',
  // 压缩包
  '.zip':'#8B5CF6','.rar':'#EC4899','.7z':'#8B5CF6','.tar':'#6366F1',
  '.gz':'#6366F1','.bz2':'#6366F1','.xz':'#6366F1','.tgz':'#6366F1','.zst':'#6366F1',
  // 代码
  '.js':'#F59E0B','.ts':'#3B82F6','.jsx':'#10B981','.tsx':'#3B82F6',
  '.py':'#3B82F6','.java':'#EF4444','.c':'#64748B','.cpp':'#64748B','.cs':'#2563EB',
  '.go':'#10B981','.rs':'#EF4444','.swift':'#FF6B6B','.kt':'#7C3AED',
  '.rb':'#F59E0B','.php':'#8B5CF6','.sh':'#64748B','.ps1':'#10B981','.bat':'#64748B','.lua':'#2563EB',
  '.html':'#F59E0B','.htm':'#F59E0B','.css':'#3B82F6','.scss':'#EC4899','.xml':'#64748B','.vue':'#10B981',
  '.json':'#F59E0B','.yaml':'#64748B','.yml':'#64748B','.toml':'#64748B',
  '.ini':'#64748B','.cfg':'#64748B','.conf':'#64748B','.env':'#10B981','.sql':'#3B82F6',
  // 文本
  '.txt':'#64748B','.md':'#FF6B6B','.log':'#64748B','.rst':'#64748B',
  // 可执行文件
  '.exe':'#EF4444','.msi':'#EF4444','.apk':'#F59E0B','.dmg':'#3B82F6',
  '.deb':'#10B981','.rpm':'#F59E0B','.bin':'#64748B','.iso':'#8B5CF6','.img':'#8B5CF6',
  // 字体
  '.ttf':'#7C3AED','.otf':'#7C3AED','.woff':'#7C3AED','.woff2':'#7C3AED',
};

/**
 * 根据文件名和 path_type 返回对应 SVG 字符串。
 * 纯函数，无副作用，确保任何情况下都返回字符串。
 */
function getFileIcon(filename, path_type) {
  if (!path_type || path_type === 'Dir')         return _SVG_DIR;
  if (path_type === 'SymlinkDir')                return _SVG_SYMLINK_DIR;

  // 取扩展名并查表
  var dotIdx = String(filename || '').lastIndexOf('.');
  var ext    = (dotIdx > 0 && dotIdx < filename.length - 1)
                 ? filename.substring(dotIdx).toLowerCase()
                 : '';
  var label  = _EXT_LABEL[ext] || (ext ? ext.slice(1, 5).toUpperCase() : '');
  var color  = _EXT_COLOR[ext] || '#5A6A7A'; // 默认颜色

  if (!label) return _SVG_FILE_BASE;

  // 动态生成带标签的 SVG
  var fs = label.length <= 3 ? '5.2' : '4.4';
  return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#F0F4F8" stroke="#B0BEC5" stroke-width="1.2" stroke-linejoin="round"/>'
    + '<path d="M14 2L14 8L20 8" fill="#D8E4EC" stroke="#B0BEC5" stroke-width="1.2" stroke-linejoin="round"/>'
    + '<text x="12" y="17.5" text-anchor="middle" font-size="' + fs + '" font-weight="600"'
    + ' font-family="Arial,sans-serif" fill="' + color + '" letter-spacing="0.3">' + label + '</text>'
    + '</svg>';
}


// 当前页面 URL 查询参数
let PARAMS = new URLSearchParams(window.location.search);

// ---------- 全局可变状态 ----------
/** @type {import('./index.js').IndexData|null} */
let DATA = null;
let DIR_EMPTY_NOTE = '';

// ---------- URL 工具 ----------

function baseUrl() {
  return location.href.split(/[?#]/)[0];
}

function newUrl(name) {
  let url = baseUrl();
  if (!url.endsWith('/')) url += '/';
  return url + name.split('/').map(encodeURIComponent).join('/');
}

function baseName(url) {
  return decodeURIComponent(
    url.split('/').filter(v => v.length > 0).slice(-1)[0]
  );
}

function extName(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot === -1 || dot === 0 || dot === filename.length - 1) return '';
  return filename.substring(dot);
}

// ---------- 格式化工具 ----------

function padZero(value, size) {
  return ('0'.repeat(size) + value).slice(-size);
}

function formatMtime(mtime) {
  if (!mtime) return '';
  const d = new Date(mtime);
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1, 2)}-${padZero(d.getDate(), 2)} ${padZero(d.getHours(), 2)}:${padZero(d.getMinutes(), 2)}`;
}

function formatDirSize(size) {
  const num  = size >= MAX_SUBPATHS_COUNT ? `>${MAX_SUBPATHS_COUNT - 1}` : `${size}`;
  const unit = t('items', size);
  return ` ${num} ${unit}`;
}

/**
 * @param {number} size  bytes
 * @returns {[number, string]}
 */
function formatFileSize(size) {
  if (size == null) return [0, 'B'];
  if (size === 0)   return [0, 'B'];
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const ratio = i >= 3 ? 100 : 1;
  return [Math.round(size * ratio / Math.pow(1024, i)) / ratio, units[i]];
}

function formatDuration(seconds) {
  seconds = Math.ceil(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${padZero(h, 2)}:${padZero(m, 2)}:${padZero(s, 2)}`;
}

function formatPercent(percent) {
  return percent > 10 ? percent.toFixed(1) + '%' : percent.toFixed(2) + '%';
}

function formatSpeed(speed) {
  if (speed == null || speed <= 0) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
  const i = Math.min(Math.floor(Math.log(speed) / Math.log(1024)), units.length - 1);
  const value = Math.round(speed / Math.pow(1024, i) * 10) / 10;
  return `${value} ${units[i]}`;
}

// ---------- 字符串工具 ----------

/**
 * HTML 实体编码 - 基础版本（保持向后兼容）
 */
function encodedStr(rawStr) {
  return rawStr.replace(/[\u00A0-\u9999<>&]/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * 文件名安全验证 - 防御路径遍历攻击
 * 禁止以下字符：
 * - 路径分隔符：/ \
 * - 路径遍历：..
 * - 控制字符：\u0000-\u001F
 * - Windows 保留名称：CON, PRN, AUX 等
 */
function validateFileName(filename) {
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  
  // 禁止路径分隔符
  if (filename.includes('/') || filename.includes('\\')) {
    return false;
  }
  
  // 禁止路径遍历
  if (filename.includes('..')) {
    return false;
  }
  
  // 禁止控制字符
  if (/[\u0000-\u001F]/.test(filename)) {
    return false;
  }
  
  // 禁止 Windows 保留名称（不区分大小写）
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];
  const upperName = filename.toUpperCase();
  // 检查是否为保留名称（允许带扩展名，如 CON.txt）
  const baseName = upperName.split('.')[0];
  if (reservedNames.includes(baseName)) {
    return false;
  }
  
  // 禁止空文件名或仅空白字符
  if (filename.trim() === '') {
    return false;
  }
  
  return true;
}

async function assertResOK(res) {
  if (!(res.status >= 200 && res.status < 300)) {
    throw new Error(await res.text() || `无效的状态码 ${res.status}`);
  }
}

function getEncoding(contentType) {
  const charset = contentType?.split(';')[1];
  if (/charset/i.test(charset)) {
    const enc = charset.split('=')[1];
    if (enc) return enc.toLowerCase();
  }
  return 'utf-8';
}

function decodeBase64(base64String) {
  const binString = atob(base64String);
  const len  = binString.length;
  const bytes = new Uint8Array(len);
  const arr   = new Uint32Array(bytes.buffer, 0, Math.floor(len / 4));
  let i = 0;
  for (; i < arr.length; i++) {
    arr[i] = binString.charCodeAt(i * 4)
           | (binString.charCodeAt(i * 4 + 1) << 8)
           | (binString.charCodeAt(i * 4 + 2) << 16)
           | (binString.charCodeAt(i * 4 + 3) << 24);
  }
  for (i = i * 4; i < len; i++) bytes[i] = binString.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ---------- UI 工具 ----------

function showToast(message, duration = 3000) {
  const $toast = document.getElementById('toast');
  if (!$toast) return;
  const $msg = $toast.querySelector('.toast-message');
  $msg.textContent = message;
  $toast.classList.remove('hidden');
  setTimeout(() => $toast.classList.add('show'), 10);
  setTimeout(() => {
    $toast.classList.remove('show');
    setTimeout(() => $toast.classList.add('hidden'), 300);
  }, duration);
}

function addBreadcrumb(href, uri_prefix) {
  const $breadcrumb = document.querySelector('.breadcrumb');
  if (!$breadcrumb) return;
  $breadcrumb.innerHTML = '';
  const parts = href === '/' ? [''] : href.split('/');
  const len   = parts.length;
  let path    = uri_prefix;

  for (let i = 0; i < len; i++) {
    const name = parts[i];
    if (i > 0) {
      if (!path.endsWith('/')) path += '/';
      path += encodeURIComponent(name);
    }
    const enc = encodedStr(name);
    if (i === 0) {
      $breadcrumb.insertAdjacentHTML('beforeend',
        `<a href="${path}" title="${t('rootDirectory')}" data-breadcrumb="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </a>`
      );
    } else if (i === len - 1) {
      $breadcrumb.insertAdjacentHTML('beforeend', `<b>${enc}</b>`);
    } else {
      $breadcrumb.insertAdjacentHTML('beforeend', `<a href="${path}" data-breadcrumb="true">${enc}</a>`);
    }
    if (i !== len - 1) {
      $breadcrumb.insertAdjacentHTML('beforeend', `<span class="separator">/</span>`);
    }
  }
}

// 为面包屑添加事件委托，支持局部刷新
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-breadcrumb="true"]');
  if (link) {
    e.preventDefault();
    e.stopPropagation();
    const href = link.getAttribute('href');
    if (href && typeof loadDirectory === 'function') {
      loadDirectory(href);
    } else {
      location.href = href;
    }
  }
});
