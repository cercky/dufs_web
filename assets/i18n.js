// ============================================================
// i18n.js - 多语言翻译配置与语言切换
// ============================================================

const I18N = {
  'zh-CN': {
    searchPlaceholder: '搜索文件或文件夹...',
    switchLanguage: '切换语言',
    openUploadPanel: '打开上传面板',
    clearCompletedTasks: '清理已完成/失败的任务',
    close: '关闭',
    login: '登录',
    logout: '退出',
    upload: '上传',
    newFolder: '新建文件夹',
    newFile: '新建文件',
    downloadZip: '下载 ZIP',
    downloadAll: '下载全部',
    listView: '列表视图',
    gridView: '网格视图',
    sortOrder: '切换排序顺序',
    sortByName: '文件名',
    sortByMtime: '修改时间',
    sortBySize: '大小',
    rootDirectory: '根目录',
    deleteAction: '删除',
    cancelAction: '取消',
    retryAction: '重试',
    restoreUploadTasks: '恢复上传任务',
    pendingUploadTasks: '检测到有未完成的上传任务，请重新选择文件以继续上传：',
    skip: '跳过',
    restoreUpload: '恢复上传',
    uploaded: '已上传',
    selectFile: '选择文件',
    fileSelected: '✓ 已选择',
    fileMismatch: '选择的文件与原文件不匹配！请选择相同名称和大小的文件。',
    upload: '上传',
    loginTitle: '用户登录',
    usernameLabel: '用户名',
    passwordLabel: '密码',
    rememberMe: '记住我（7 天）',
    cancel: '取消',
    loginBtn: '登录',
    logoutTitle: '退出登录',
    logoutConfirm: '确定要退出登录吗？',
    logoutBtn: '退出',
    uploadTasks: '上传任务',
    fileName: '文件名',
    progress: '进度',
    status: '状态',
    waiting: '等待中...',
    uploading: '上传中...',
    complete: '✓ 完成',
    failed: '✗ 失败',
    retry: '↻',
    name: '文件名',
    mtime: '修改时间',
    size: '大小',
    actions: '操作',
    noResults: '没有搜索结果',
    emptyFolder: '空文件夹',
    willCreateFolder: '上传文件时将自动创建文件夹',
    download: '下载',
    downloadZipAction: '下载 ZIP',
    move: '移动/重命名',
    delete: '删除',
    edit: '编辑',
    save: '保存',
    back: '返回',
    notEditable: '文件太大或为二进制文件，无法编辑',
    deleteConfirm: (name) => `确定要删除 \`${name}\` 吗？`,
    deleteSuccess: '删除成功',
    deleteFailed: (name) => `无法删除 \`${name}\`：`,
    moveSuccess: '移动成功',
    moveFailed: (oldPath, newPath) => `无法移动 \`${oldPath}\` 到 \`${newPath}\`：`,
    overwriteConfirm: '目标文件已存在，是否覆盖？',
    saveSuccess: '保存成功',
    saveFailed: '保存失败：',
    folderCreated: '文件夹创建成功',
    folderCreateFailed: (name) => `无法创建文件夹 \`${name}\`：`,
    fileCreated: '文件创建成功',
    fileCreateFailed: (name) => `无法创建文件 \`${name}\`：`,
    getTokenFailed: '获取 token 失败',
    downloadFailed: '下载失败：',
    getFileFailed: '获取文件失败：',
    newFolderPrompt: '请输入文件夹名称',
    newFilePrompt: '请输入文件名称',
    movePathPrompt: '请输入新路径',
    footerText: typeof window !== 'undefined' ? (window.APP_NAME) : '',
    items: (count) => count === 1 ? '个项目' : '个项目',
    ctxDownload: '下载',
    ctxMove: '移动/重命名',
    ctxDelete: '删除',
    ctxEdit: '编辑',
    language: '语言',
    chinese: '中文',
    english: 'English',
    // 批量操作
    selectFirst: '请先选择要删除的项目',
    bulkDeleteConfirm: (count) => `确定要删除选中的 ${count} 个项目吗？`,
    bulkDeleteSuccess: (count) => `成功删除 ${count} 个项目`,
    bulkDeletePartial: (ok, fail) => `成功删除 ${ok} 个，失败 ${fail} 个`,
    bulkDeleteFailed: '删除失败',
    bulkDownload: (n) => `下载 ${n} 项`,
    bulkDownloading: (cur, total) => `下载中 ${cur}/${total}...`,
    // 批量下载
    downloadingTitle: '正在下载，请稍候…',
    compressingTitle: '正在打包，请稍候…',
    downloadSectionLabel: '下载文件',
    compressSectionLabel: '压缩打包',
    zipBuilding: '正在打包，请稍候…',
    zipFetching: (name, cur, total) => `正在获取 ${name}（${cur}/${total}）`,
    zipCompressing: '正在压缩并生成 ZIP…',
    zipDone: (n) => `已打包 ${n} 个项目，开始下载`,
    zipFallbackTitle: '将逐个下载',
    zipFallbackBodySize: (size, count, limitMB) => {
      const limitDisplay = limitMB >= 1024 ? `${(limitMB / 1024).toFixed(2)} GB` : `${limitMB} MB`;
      return `选中AAAA的 ${count} 个项目总计约 <strong>${size}</strong>，超过单次打包限制（${limitDisplay}）。<br>将依次触发 ${count} 个独立下载，请不要关闭此页面。`;
    },
    zipFallbackBodyDir: (size, count, limitMB) => {
      const limitDisplay = limitMB >= 1024 ? `${(limitMB / 1024).toFixed(2)} GB` : `${limitMB} MB`;
      return `选中内容包含目录，目录大小无法预先计算${size ? `（已知文件部分约 <strong>${size}</strong>）` : ''}。<br>将依次触发 ${count} 个独立下载，请不要关闭此页面。`;
    },
    zipFallbackStart: '开始逐个下载',
    zipFallbackDoing: (cur, total, name) => `正在下载 ${cur}/${total}：${name}`,
    zipFallbackDone: (n) => `${n} 个文件已全部发送至下载队列`,
    zipError: (msg) => `打包下载失败：${msg}`,
    file: '文件',
    overallProgress: '总进度',
    sizeUnknown: '未知（含目录）',
    sizeUnknownSuffix: '（不含目录）',
    exitSelection: '退出选择',
    selected: (n) => `已选 ${n} 项`,
    loginSuccess: '登录成功',
    loginFailed: '认证失败：用户名或密码错误',
    loginError: (msg) => `登录失败：${msg}`,
    // 通用模态框
    confirm: '确认',
    ok: '确定',
    cancel: '取消',
    deleteTitle: '删除确认',
    overwriteTitle: '文件已存在',
    newFolderTitle: '新建文件夹',
    newFileTitle: '新建文件',
    moveTitle: '移动 / 重命名',
    newFolderLabel: '文件夹名称',
    newFileLabel: '文件名',
    moveLabel: '新路径',
    noData: '没有数据',
    uploadComplete: '上传完成',
  },
  'en-US': {
    searchPlaceholder: 'Search files or folders...',
    switchLanguage: 'Switch Language',
    openUploadPanel: 'Open Upload Panel',
    clearCompletedTasks: 'Clear Completed/Failed Tasks',
    close: 'Close',
    login: 'Login',
    logout: 'Logout',
    upload: 'Upload',
    newFolder: 'New Folder',
    newFile: 'New File',
    downloadZip: 'Download ZIP',
    downloadAll: 'Download All',
    listView: 'List View',
    gridView: 'Grid View',
    sortOrder: 'Toggle Sort Order',
    sortByName: 'Name',
    sortByMtime: 'Modified',
    sortBySize: 'Size',
    rootDirectory: 'Root Directory',
    deleteAction: 'Delete',
    cancelAction: 'Cancel',
    retryAction: 'Retry',
    restoreUploadTasks: 'Restore Upload Tasks',
    pendingUploadTasks: 'Unfinished upload tasks detected. Please reselect files to continue:',
    skip: 'Skip',
    restoreUpload: 'Restore Upload',
    uploaded: 'Uploaded',
    selectFile: 'Select File',
    fileSelected: '✓ Selected',
    fileMismatch: 'Selected file does not match! Please select a file with the same name and size.',
    loginTitle: 'User Login',
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    rememberMe: 'Remember me (7 days)',
    cancel: 'Cancel',
    loginBtn: 'Login',
    logoutTitle: 'Logout',
    logoutConfirm: 'Are you sure you want to logout?',
    logoutBtn: 'Logout',
    uploadTasks: 'Upload Tasks',
    fileName: 'File Name',
    progress: 'Progress',
    status: 'Status',
    waiting: 'Waiting...',
    uploading: 'Uploading...',
    complete: '✓ Done',
    failed: '✗ Failed',
    retry: '↻',
    name: 'Name',
    mtime: 'Modified',
    size: 'Size',
    actions: 'Actions',
    noResults: 'No results found',
    emptyFolder: 'Empty folder',
    willCreateFolder: 'Folder will be created when uploading files',
    download: 'Download',
    downloadZipAction: 'Download ZIP',
    move: 'Move/Rename',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    back: 'Back',
    notEditable: 'File is too large or binary, cannot edit',
    deleteConfirm: (name) => `Are you sure you want to delete \`${name}\`?`,
    deleteSuccess: 'Deleted successfully',
    deleteFailed: (name) => `Failed to delete \`${name}\`: `,
    moveSuccess: 'Moved successfully',
    moveFailed: (oldPath, newPath) => `Failed to move \`${oldPath}\` to \`${newPath}\`: `,
    overwriteConfirm: 'Target file already exists, overwrite?',
    saveSuccess: 'Saved successfully',
    saveFailed: 'Failed to save: ',
    folderCreated: 'Folder created successfully',
    folderCreateFailed: (name) => `Failed to create folder \`${name}\`: `,
    fileCreated: 'File created successfully',
    fileCreateFailed: (name) => `Failed to create file \`${name}\`: `,
    getTokenFailed: 'Failed to get token',
    downloadFailed: 'Download failed: ',
    getFileFailed: 'Failed to get file: ',
    newFolderPrompt: 'Enter folder name',
    newFilePrompt: 'Enter file name',
    movePathPrompt: 'Enter new path',
    footerText: typeof window !== 'undefined' ? (window.APP_NAME) : '',
    items: (count) => count === 1 ? 'item' : 'items',
    ctxDownload: 'Download',
    ctxMove: 'Move/Rename',
    ctxDelete: 'Delete',
    ctxEdit: 'Edit',
    language: 'Language',
    chinese: '中文',
    english: 'English',
    // Bulk actions
    selectFirst: 'Please select items to delete first',
    bulkDeleteConfirm: (count) => `Are you sure you want to delete ${count} selected items?`,
    bulkDeleteSuccess: (count) => `Successfully deleted ${count} items`,
    bulkDeletePartial: (ok, fail) => `Deleted ${ok} items, ${fail} failed`,
    bulkDeleteFailed: 'Delete failed',
    bulkDownload: (n) => `Download ${n} items`,
    bulkDownloading: (cur, total) => `Downloading ${cur}/${total}...`,
    // Bulk download
    downloadingTitle: 'Downloading, please wait…',
    compressingTitle: 'Compressing, please wait…',
    downloadSectionLabel: 'Downloading files',
    compressSectionLabel: 'Compressing',
    zipBuilding: 'Preparing package, please wait…',
    zipFetching: (name, cur, total) => `Fetching ${name} (${cur}/${total})`,
    zipCompressing: 'Compressing and generating ZIP…',
    zipDone: (n) => `Packaged ${n} items, download starting`,
    zipFallbackTitle: 'Downloading separately',
    zipFallbackBodySize: (size, count, limitMB) => {
      const limitDisplay = limitMB >= 1024 ? `${(limitMB / 1024).toFixed(2)} GB` : `${limitMB} MB`;
      return `The ${count} selected items total approximately <strong>${size}</strong>, which exceeds the single-package limit (${limitDisplay}).<br>The browser will trigger ${count} individual downloads. Please keep this page open.`;
    },
    zipFallbackBodyDir: (size, count, limitMB) => {
      const limitDisplay = limitMB >= 1024 ? `${(limitMB / 1024).toFixed(2)} GB` : `${limitMB} MB`;
      return `The selection contains folders whose sizes cannot be pre-calculated${size ? ` (known file portion: approx. <strong>${size}</strong>)` : ''}.<br>The browser will trigger ${count} individual downloads. Please keep this page open.`;
    },
    zipFallbackStart: 'Start individual downloads',
    zipFallbackDoing: (cur, total, name) => `Downloading ${cur}/${total}: ${name}`,
    zipFallbackDone: (n) => `${n} files sent to download queue`,
    zipError: (msg) => `Package download failed: ${msg}`,
    file: 'File',
    overallProgress: 'Overall Progress',
    sizeUnknown: 'Unknown (contains folders)',
    sizeUnknownSuffix: ' (files only)',
    exitSelection: 'Exit Selection',
    selected: (n) => `${n} selected`,
    loginSuccess: 'Login successful',
    loginFailed: 'Authentication failed: Invalid username or password',
    loginError: (msg) => `Login failed: ${msg}`,
    // Generic modal
    confirm: 'Confirm',
    ok: 'OK',
    cancel: 'Cancel',
    deleteTitle: 'Confirm Delete',
    overwriteTitle: 'File Already Exists',
    newFolderTitle: 'New Folder',
    newFileTitle: 'New File',
    moveTitle: 'Move / Rename',
    newFolderLabel: 'Folder name',
    newFileLabel: 'File name',
    moveLabel: 'New path',
    noData: 'No data',
    uploadComplete: 'Upload complete',
  }
};

// 当前语言
let CURRENT_LANG = 'zh-CN';

/**
 * 翻译函数
 * @param {string} key
 * @param {...any} args
 * @returns {string}
 */
function t(key, ...args) {
  const value = I18N[CURRENT_LANG][key];
  if (typeof value === 'function') return value(...args);
  return value !== undefined ? value : key;
}

/** 检测系统语言 */
function detectSystemLanguage() {
  const userLang = navigator.language || navigator.userLanguage;
  return userLang.startsWith('zh') ? 'zh-CN' : 'en-US';
}

/** 读取保存的语言设置 */
function loadLanguage() {
  const saved = localStorage.getItem('dufs_language');
  if (saved === 'zh-CN' || saved === 'en-US') return saved;
  return detectSystemLanguage();
}

/**
 * 更新页面上所有静态文本翻译（不涉及重新渲染数据列表）
 */
function updateTranslations() {
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => document.querySelectorAll(sel);

  const set = (sel, key) => { const el = qs(sel); if (el) el.textContent = t(key); };

  const $search = document.getElementById('search');
  if ($search) $search.placeholder = t('searchPlaceholder');

  // 更新所有带有 data-i18n 属性的元素
  qsa('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  set('.login-text',            'login');
  // 工具栏按钮 title（tooltip）
  const setTitle = (sel, key) => {
    document.querySelectorAll(sel).forEach(el => el.title = t(key));
  };
  setTitle('.upload-btn',      'upload');
  setTitle('.new-folder-btn',  'newFolder');
  setTitle('.new-file-btn',    'newFile');
  setTitle('.download-zip-btn','downloadAll');
  setTitle('.language-btn',    'switchLanguage');
  setTitle('.upload-status-indicator', 'openUploadPanel');
  setTitle('.upload-clear-btn', 'clearCompletedTasks');
  setTitle('.upload-close-btn', 'close');
  setTitle('.login-btn',       'login');
  setTitle('.logout-btn',      'logout');
  setTitle('.sort-order-btn',  'sortOrder');
  setTitle('.view-btn-inline[data-view="list"]', 'listView');
  setTitle('.view-btn-inline[data-view="grid"]', 'gridView');
  setTitle('.save-btn',        'save');
  setTitle('.move-file-btn',   'move');
  setTitle('.delete-file-btn', 'delete');
  setTitle('.btn-gba-cancel',  'exitSelection');
  set('.upload-title',          'uploadTasks');
  set('.footer-text',           'footerText');
  set('.ctx-download',          'ctxDownload');
  set('.ctx-move',              'ctxMove');
  set('.ctx-delete',            'ctxDelete');
  set('.ctx-edit',              'ctxEdit');
  set('.login-title-text',      'loginTitle');
  set('.username-label',        'usernameLabel');
  set('.password-label',        'passwordLabel');
  set('.remember-me-text',      'rememberMe');
  set('.login-btn-text',        'loginBtn');
  set('.logout-title-text',     'logoutTitle');
  set('.logout-confirm-text',   'logoutConfirm');
  set('.logout-btn-text',       'logoutBtn');

  qsa('.cancel-text').forEach(el => (el.textContent = t('cancel')));

  // 上传表格表头
  const uploadHeaders = qsa('.uploaders-table th');
  if (uploadHeaders.length >= 3) {
    uploadHeaders[0].textContent = t('fileName');
    uploadHeaders[1].textContent = t('progress');
    uploadHeaders[2].textContent = t('status');
  }

  // 网格视图排序选项
  const sortOpts = qsa('#gridSortSelect option');
  if (sortOpts.length >= 3) {
    sortOpts[0].textContent = t('sortByName');
    sortOpts[1].textContent = t('sortByMtime');
    sortOpts[2].textContent = t('sortBySize');
  }

  // 工具栏按钮文本
  qsa('.toolbar-action-btns .upload-btn span').forEach(el => el.textContent = t('upload'));
  qsa('.toolbar-action-btns .new-folder-btn span').forEach(el => el.textContent = t('newFolder'));
  qsa('.toolbar-action-btns .new-file-btn span').forEach(el => el.textContent = t('newFile'));
  qsa('.toolbar-action-btns .download-zip-btn span').forEach(el => el.textContent = t('downloadAll'));

  // 恢复上传模态框
  const $restoreTitle = qs('#restoreFileModal .modal-title span');
  if ($restoreTitle) $restoreTitle.textContent = t('restoreUploadTasks');
  const $restoreMsg = qs('#restoreFileModal .modal-message');
  if ($restoreMsg) $restoreMsg.textContent = t('pendingUploadTasks');
  const $restoreSkipBtn = qs('#restoreSkipBtn');
  if ($restoreSkipBtn) $restoreSkipBtn.textContent = t('skip');
  const $restoreConfirmBtn = qs('#restoreConfirmBtn');
  if ($restoreConfirmBtn) $restoreConfirmBtn.textContent = t('restoreUpload');

  // 上传面板标题
  const $uploadPanelTitle = qs('.upload-panel-title');
  if ($uploadPanelTitle) $uploadPanelTitle.textContent = t('upload');

  // 语言按钮当前语言文本
  const $currentLang = qs('.current-lang');
  if ($currentLang) {
    $currentLang.textContent = CURRENT_LANG === 'zh-CN' ? t('chinese') : t('english');
  }
}
