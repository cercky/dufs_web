// ============================================================
// app.js - 主应用逻辑
// ============================================================

// ---------- DOM 引用（在 ready() 中初始化）----------
let $pathsTable, $pathsTableHead, $pathsTableBody, $pathsTableHeadWrap;
let $uploadersTableBody;
let $emptyState, $editor, $notEditable, $previewFrame;
let $loginBtn, $logoutBtn, $userName;
let $fileCount;
let $languageBtn, $languageDropdown;
let $contextMenu;

// ---------- 列表视图多选拖拽状态 ----------
let _isSelecting   = false;   // 鼠标是否处于拖选模式
let _selectValue   = true;    // 拖选时设置的 checked 值
let _lastHoverRow  = null;    // 上一次 mouseover 经过的行
let _checkboxDelegateAttached = false; // tbody change 委托是否已绑定
let _listBulkBound            = false;  // 列表批量操作栏是否已绑定
let _gridSelectionMode        = false; // 网格视图是否处于多选模式

// ---------- 页面状态跟踪 ----------
let _editorOriginalContent = null; // 编辑器原始内容
let _editorHasChanges = false;     // 编辑器内容是否被修改
let _isDownloading = false;        // 是否正在下载文件（批量）
let _isCompressing = false;        // 是否正在压缩打包
let _gridLongPressTimer       = null;  // 长按计时器
let _gridLongPressFired       = false; // 是否已触发长按（抑制后续 click）
let _pageInitialized          = false; // 页面是否已完成初始化（防止重复渲染）

const _maxDownloadSize = 200; // 设置合并下载最大文件大小（MB） 不建议太大，容易导致内存问题


// ============================================================
//  通用模态框：showConfirm / showPrompt / showAlert
// ============================================================

function _openAppModal({ titleHtml, titleClass = '', bodyHtml, footerHtml, onKeydown }) {
  const $modal    = document.getElementById('appModal');
  const $title    = document.getElementById('appModalTitle');
  const $body     = document.getElementById('appModalBody');
  const $footer   = document.getElementById('appModalFooter');
  const $close    = document.getElementById('appModalClose');
  const $backdrop = document.getElementById('appModalBackdrop');

  $title.innerHTML = titleHtml;
  $title.className = 'modal-title' + (titleClass ? ' ' + titleClass : '');
  $body.innerHTML  = bodyHtml;
  $footer.innerHTML= footerHtml;
  $modal.classList.remove('hidden');

  const close = () => {
    $modal.classList.add('hidden');
    document.removeEventListener('keydown', _kh);
  };
  const _kh = (e) => {
    if (e.key === 'Escape') close();
    onKeydown?.(e);
  };
  $close.onclick    = close;
  $backdrop.onclick = close;
  document.addEventListener('keydown', _kh);
  return { close };
}

function showConfirm(title, message, opts = {}) {
  return new Promise((resolve) => {
    const confirmText = opts.confirmText ?? t('confirm');
    const cancelText  = opts.cancelText  ?? t('cancel');
    const titleClass  = opts.danger ? 'modal-title-danger' : '';
    const iconHtml    = opts.danger
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`
      : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    const { close } = _openAppModal({
      titleHtml:  `${iconHtml}<span>${encodedStr(title)}</span>`,
      titleClass,
      bodyHtml:   `<p class="modal-message">${message}</p>`,
      footerHtml: `<button class="btn btn-default" id="_modalCancel">${encodedStr(cancelText)}</button>
                   <button class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" id="_modalConfirm">${encodedStr(confirmText)}</button>`,
      onKeydown: (e) => { if (e.key === 'Enter') { close(); resolve(true); } },
    });
    document.getElementById('_modalCancel').onclick  = () => { close(); resolve(false); };
    document.getElementById('_modalConfirm').onclick = () => { close(); resolve(true); };
    document.getElementById('_modalConfirm').focus();
  });
}

function showPrompt(title, label, defaultValue = '', opts = {}) {
  return new Promise((resolve) => {
    const confirmText = opts.confirmText ?? t('ok');
    const { close } = _openAppModal({
      titleHtml: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>${encodedStr(title)}</span>`,
      bodyHtml: `<label class="modal-input-label" for="_modalInput">${encodedStr(label)}</label>
                 <input id="_modalInput" class="form-control" value="${encodedStr(defaultValue)}" autocomplete="off">`,
      footerHtml: `<button class="btn btn-default" id="_modalCancel">${encodedStr(t('cancel'))}</button>
                   <button class="btn btn-primary"  id="_modalConfirm">${encodedStr(confirmText)}</button>`,
      onKeydown: (e) => {
        if (e.key === 'Enter') {
          const val = document.getElementById('_modalInput')?.value.trim() ?? '';
          close(); resolve(val || null);
        }
      },
    });
    const $inp = document.getElementById('_modalInput');
    $inp.focus(); $inp.select();
    document.getElementById('_modalCancel').onclick  = () => { close(); resolve(null); };
    document.getElementById('_modalConfirm').onclick = () => {
      close(); resolve($inp.value.trim() || null);
    };
  });
}

function showAlert(message, title = '') {
  return new Promise((resolve) => {
    const { close } = _openAppModal({
      titleHtml: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>${encodedStr(title || t('ok'))}</span>`,
      bodyHtml:   `<p class="modal-message">${encodedStr(message)}</p>`,
      footerHtml: `<button class="btn btn-primary" id="_modalOk">${encodedStr(t('ok'))}</button>`,
      onKeydown:  (e) => { if (e.key === 'Enter') { close(); resolve(); } },
    });
    document.getElementById('_modalOk').onclick = () => { close(); resolve(); };
    document.getElementById('_modalOk').focus();
  });
}

// ============================================================
//  语言设置（需要重渲染，故保留在 app.js）
// ============================================================

function setLanguage(lang) {
  CURRENT_LANG = lang;
  localStorage.setItem('dufs_language', lang);
  document.documentElement.lang = lang;
  updateTranslations();

  if (DATA) {
    renderPathsTableHead();
    renderPathsTableBody(); // 异步执行，不等待
    renderGridView(); // 异步执行，不等待
    updateFileCount();
    updateEmptyState();
  }
}

// ============================================================
//  初始化入口
// ============================================================

// 智能滚动条检测和更新
function updateSmartScrollbars() {
  // 检查列表视图表格
  const $pathsTable = document.querySelector('.paths-table');
  if ($pathsTable) {
    const needsScroll = $pathsTable.scrollHeight > $pathsTable.clientHeight;
    $pathsTable.classList.toggle('has-scrollbar', needsScroll);
  }
  
  // 检查网格视图
  const $gridView = document.querySelector('.file-grid-view');
  if ($gridView) {
    const needsScroll = $gridView.scrollHeight > $gridView.clientHeight;
    $gridView.classList.toggle('has-scrollbar', needsScroll);
  }
}

// 处理窗口大小改变
function handleResize() {
  // 确保表头和表格的宽度一致
  const $headerTable = document.querySelector('.paths-table-header-wrap table');
  const $mainTable = document.querySelector('.paths-table');
  if ($headerTable && $mainTable) {
    // 使用 offsetWidth 而不是 clientWidth，因为 offsetWidth 包含滚动条宽度
    // 这样可以确保表头宽度与表体（包括滚动条）宽度一致
    $headerTable.style.width = $mainTable.offsetWidth + 'px';
  }
  
  // 更新智能滚动条状态
  updateSmartScrollbars();
}

window.addEventListener('DOMContentLoaded', async () => {
  const $indexData = document.getElementById('index-data');
  if (!$indexData) { await showAlert(t('noData')); return; }

  DATA           = JSON.parse(decodeBase64($indexData.innerHTML));
  CURRENT_LANG   = loadLanguage();
  DIR_EMPTY_NOTE = PARAMS.get('q')
    ? t('noResults')
    : DATA.dir_exists ? t('emptyFolder') : t('willCreateFolder');

  await ready();
  
  // 初始化调整
  handleResize();
  // 监听窗口大小改变
  window.addEventListener('resize', handleResize);
  // 监听浏览器历史记录变化
  window.addEventListener('popstate', () => {
    PARAMS = new URLSearchParams(window.location.search);
    // 使用 loadDirectory 从历史记录加载
    const currentPath = window.location.pathname;
    if (currentPath && typeof loadDirectory === 'function') {
      loadDirectory(currentPath, true); // skipPushState=true 避免循环
    } else {
      renderPathsTableHead();
      renderPathsTableBody();
      renderGridView();
    }
  });
});

async function ready() {
  // 缓存 DOM 引用
  $pathsTable         = document.querySelector('.paths-table');
  $pathsTableHead     = document.querySelector('.paths-table-head thead');
  $pathsTableBody     = document.querySelector('.paths-table tbody');
  $pathsTableHeadWrap = document.getElementById('pathsTableHeaderWrap');
  $uploadersTableBody = document.querySelector('.uploaders-table tbody');
  $emptyState         = document.querySelector('.empty-state');
  $editor             = document.querySelector('.editor');
  $notEditable        = document.querySelector('.not-editable');
  $previewFrame       = document.querySelector('#preview-frame');
  $loginBtn           = document.querySelector('.login-btn');
  $logoutBtn          = document.querySelector('.logout-btn');
  $userName           = document.querySelector('.user-name');
  $fileCount          = document.getElementById('fileCount');
  $contextMenu        = document.getElementById('contextMenu');
  $languageBtn        = document.querySelector('.language-btn');
  $languageDropdown   = document.querySelector('.language-dropdown');

  // 初始化应用名称
  initAppName();
  
  updateTranslations();
  addBreadcrumb(DATA.href, DATA.uri_prefix);

  if (DATA.kind === 'Index') {
    const appName = window.APP_NAME;
    document.title = `${DATA.href} - ${appName}`;
    document.querySelector('.index-page').classList.remove('hidden');

    // 移除自动登录功能，每次都需要手动登录

    // 现在 setupIndexPage 会使用正确的认证状态和权限信息
    await setupIndexPage();
    
    // 标记页面已初始化完成
    _pageInitialized = true;

    // 恢复视图偏好
    const savedView = getCookie('view_mode');
    if (savedView && savedView !== 'list') {
      document.querySelector('.view-btn-inline[data-view="grid"]')?.click();
    } else {
      // 初始状态：隐藏排序控件
      const gridSortControls = document.getElementById('gridSortControls');
      if (gridSortControls) {
        gridSortControls.style.display = 'none';
      }
    }
  } else if (DATA.kind === 'Edit' || DATA.kind === 'View') {
    const editTitle = DATA.kind === 'Edit' ? t('edit') : t('view');
    document.title = `${editTitle} ${DATA.href} - Dufs`;
    document.querySelector('.editor-page').classList.remove('hidden');
    await setupEditorPage();
  }

  // 语言切换
  $languageBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    $languageDropdown.classList.toggle('hidden');
  });
  document.querySelectorAll('.language-option').forEach(opt => {
    opt.addEventListener('click', () => {
      if (opt.dataset.lang) {
        setLanguage(opt.dataset.lang);
        $languageDropdown.classList.add('hidden');
      }
    });
  });

  // 监听页面关闭/刷新事件（在有未保存内容或未完成任务时提示）
  window.addEventListener('beforeunload', (e) => {
    const hasUnsavedChanges = _hasUnsavedChanges();
    const hasActiveUploads = _hasActiveUploads();
    
    if (hasUnsavedChanges || hasActiveUploads) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });

  // 点击空白处关闭下拉与上下文菜单（使用 mousedown 更可靠）
  const closeMenus = (e) => {
    // 如果点击的是语言按钮或下拉菜单，不关闭语言菜单
    if ($languageBtn?.contains(e.target) || $languageDropdown?.contains(e.target)) {
    } else {
      $languageDropdown?.classList.add('hidden');
    }
    // 如果点击的是上下文菜单内部，不关闭上下文菜单
    if (!$contextMenu?.contains(e.target)) {
      $contextMenu?.classList.add('hidden');
    }
  };
  document.addEventListener('mousedown', closeMenus);
  // 也监听 contextmenu 事件，确保右键其他位置时也能关闭菜单
  document.addEventListener('contextmenu', (e) => {
    if (!$contextMenu?.contains(e.target)) {
      $contextMenu?.classList.add('hidden');
    }
    if (!$languageBtn?.contains(e.target) && !$languageDropdown?.contains(e.target)) {
      $languageDropdown?.classList.add('hidden');
    }
  });

  // 上下文菜单动作（只绑定一次）
  setupContextMenuActions();

  // 模态框事件
  setupModalEvents();
  
  // 初始化智能滚动条
  setTimeout(updateSmartScrollbars, 50);
}

// ============================================================
//  模态框事件绑定
// ============================================================

function setupModalEvents() {
  // 关闭退出登录模态框
  const hideLogoutModal = () => {
    document.getElementById('logoutModal')?.classList.add('hidden');
  };

  document.getElementById('closeLogoutModal')?.addEventListener('click', hideLogoutModal);
  document.getElementById('cancelLogoutBtn')?.addEventListener('click', hideLogoutModal);
  document.getElementById('confirmLogoutBtn')?.addEventListener('click', doLogout);

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', () => { hideLogoutModal(); });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { hideLogoutModal(); }
  });
}

// ============================================================
//  登录 / 退出
// ============================================================

async function doLogin() {
  try {
    await checkAuth("login");
    location.reload();
  } catch (err) {
    showToast(t('loginFailed'));
  }
}

function doLogout() {
  if (!DATA.auth) return;
  const url = baseUrl();
  const xhr = new XMLHttpRequest();
  xhr.open("LOGOUT", url, true, DATA.user);
  xhr.onload = () => {
    location.href = url;
  }
  xhr.send();
  hideLogoutModal();
}

async function checkAuth(variant) {
  if (!DATA.auth) return;
  const qs = variant ? `?${variant}` : "";
  const res = await fetch(baseUrl() + qs, {
    method: "CHECKAUTH",
  });
  await assertResOK(res);
  $loginBtn.classList.add("hidden");
  $logoutBtn.classList.remove("hidden");
  $userName.textContent = await res.text();
}

// ============================================================
//  Index 页面初始化
// ============================================================

async function setupIndexPage() {
  let hasToolbarItems = false;

  if (DATA.allow_archive) {
    const $links = document.querySelectorAll('.download-zip-btn');
    $links.forEach($link => {
      $link.classList.remove('hidden');
      // 设置 href 属性
      $link.href = baseUrl() + '?zip';
      $link.title = t('downloadAll');
      // 避免重复绑定：克隆替换
      const fresh = $link.cloneNode(true);
      $link.replaceWith(fresh);
      fresh.classList.add('dlwt');
    });
    hasToolbarItems = true;
  }

  if (DATA.allow_upload) {
    setupDropzone();
    setupUploadFile();
    setupNewFolder();
    setupNewFile();
    // 初始化上传系统（仅在有上传权限时）
    if (typeof initUploadSystem === 'function') {
      initUploadSystem();
    }
    hasToolbarItems = true;
  } else {
    // 没有上传权限时，隐藏上传相关元素
    const $indicator = document.getElementById('uploadStatusIndicator');
    const $panel = document.getElementById('uploadFloatingPanel');
    if ($indicator) $indicator.classList.add('hidden');
    if ($panel) $panel.classList.add('hidden');
    // 清除上传面板的 localStorage 状态
    localStorage.removeItem('dufs_upload_panel_visible');
  }

  if (DATA.auth) await setupAuth();
  if (DATA.allow_search) setupSearch();

  // 渲染列表和网格（只调用一次）
  renderPathsTableHead();
  renderPathsTableBody(); // 异步执行，不等待
  renderGridView(); // 异步执行，不等待
  // 视图切换按钮只在此统一绑定一次
  setupViewToggleButtons();

  // 只在用户登录后设置带token的下载功能
  if (DATA.user) {
    setupDownloadWithToken();
  }

  updateFileCount();

  // 显示 header 工具栏（有可操作项时才显示）
  const $headerToolbars = document.querySelectorAll('.toolbar-action-btns');
  $headerToolbars.forEach($toolbar => {
    if (hasToolbarItems) {
      $toolbar.classList.remove('hidden');
    } else {
      $toolbar.classList.add('hidden');
    }
  });
}

async function setupAuth() {
  if (DATA.user) {
    $loginBtn.classList.add('hidden');
    $logoutBtn.classList.remove('hidden');
    $logoutBtn.addEventListener('click', showLogoutModal);
    $userName.textContent = DATA.user;
    
    // 确保登录后设置带 token 的下载功能
    setupDownloadWithToken();
  } else {
    $loginBtn.classList.remove('hidden');
    $loginBtn.addEventListener('click', doLogin);
  }
}

// ============================================================
//  应用名称初始化
// ============================================================

function initAppName() {
  const appName = window.APP_NAME;
  
  // 更新品牌名称
  const $brandName = document.getElementById('brandName');
  if ($brandName) {
    $brandName.textContent = appName;
  }
  
  // 更新页脚文本
  const $footerText = document.getElementById('footerText');
  if ($footerText) {
    $footerText.textContent = appName;
  }
}

// ============================================================
//  渲染：表头
// ============================================================

function renderPathsTableHead() {
  const headerCols = [
    { name: 'name',  text: t('name') },
    { name: 'mtime', text: t('mtime') },
    { name: 'size',  text: t('size') },
  ];

  $pathsTableHead.innerHTML = `
    <tr>
      <th class="cell-checkbox">
        <input type="checkbox" id="selectAllCheckbox" onclick="event.stopPropagation()">
      </th>
      <th class="cell-icon"></th>
      ${headerCols.map(col => {
        let svg   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m0 0l-5-5m5 5l5-5"/></svg>`;
        let order = 'desc';
        if (PARAMS.get('sort') === col.name) {
          if (PARAMS.get('order') === 'desc') {
            order = 'asc';
            svg   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5m0 0l-5 5m5-5l5 5"/></svg>`;
          }
        }
        const icon = `<span style="margin-left:4px;display:inline-flex;width:12px;height:12px;">${svg}</span>`;
        return `<th class="cell-${col.name}" data-sort="${col.name}" data-order="${order}"><a href="#" onclick="event.preventDefault(); sortAndRender('${col.name}', '${order}')">${col.text}${icon}</a></th>`;
      }).join('\n')}
      <th class="cell-actions">${t('actions')}</th>
    </tr>
  `;

  setupBulkDelete();
}

function sortAndRender(sort, order) {
  const p = new URLSearchParams(window.location.search);
  if (sort) p.set('sort', sort);
  if (order) p.set('order', order);
  PARAMS = new URLSearchParams(p.toString());
  
  setCookie('grid_sort', sort || getCookie('grid_sort') || 'name', 30);
  setCookie('grid_order', order || getCookie('grid_order') || 'asc', 30);

  const newUrl = window.location.pathname + (p.toString() ? '?' + p.toString() : '');
  history.pushState(null, '', newUrl);

  renderPathsTableHead();
  renderPathsTableBody();
  renderGridView();
}

// ============================================================
//  局部刷新：目录加载
// ============================================================

/**
 * 加载目录内容（局部刷新，不刷新整个页面）
 */
async function loadDirectory(path, skipPushState = false) {
  try {
    // 构建 JSON 数据 URL
    let jsonUrl = path;
    if (!jsonUrl.endsWith('?json')) {
      const hasQuery = jsonUrl.includes('?');
      jsonUrl += hasQuery ? '&json' : '?json';
    }
    
    // 添加搜索参数（如果有）
    const q = PARAMS.get('q');
    if (q) {
      jsonUrl += '&q=' + encodeURIComponent(q);
    }
    
    // 加载新的目录数据
    const res = await fetchWithAuth(jsonUrl);
    if (!res.ok) {
      throw new Error(`Failed to load directory: ${res.status}`);
    }
    
    const newData = await res.json();
    
    // 更新 DATA 对象
    Object.assign(DATA, newData);
    
    // 更新 URL 但不刷新页面（除非是 popstate 调用）
    if (!skipPushState) {
      const newPathUrl = newData.href;
      history.pushState(null, '', newPathUrl);
    }
    
    // 更新搜索参数
    PARAMS = new URLSearchParams(window.location.search);
    
    // 更新文档标题
    const appName = window.APP_NAME;
    document.title = `${DATA.href} - ${appName}`;
    
    // 更新面包屑
    addBreadcrumb(DATA.href, DATA.uri_prefix);
    
    // 更新空状态提示
    DIR_EMPTY_NOTE = PARAMS.get('q')
      ? t('noResults')
      : DATA.dir_exists ? t('emptyFolder') : t('willCreateFolder');
    
    // 重新渲染文件列表
    renderPathsTableHead();
    renderPathsTableBody();
    renderGridView();
    updateEmptyState();
    
    // 更新文件计数
    if ($fileCount) {
      $fileCount.textContent = DATA.paths ? `${DATA.paths.length} ${t('items')}` : '';
    }
    
  } catch (error) {
    // 如果加载失败，回退到全局刷新
    location.href = path;
  }
}

// ============================================================
//  渲染：列表表体
// ============================================================

async function renderPathsTableBody() {
  const sortedPaths = getSortedPaths();
  if (sortedPaths.length > 0) {
    $pathsTable.classList.remove('hidden');
    $pathsTableHeadWrap?.classList.remove('hidden');
    $emptyState.classList.add('hidden');
    
    // 使用传统渲染，确保稳定性
    $pathsTableBody.innerHTML = '';
    sortedPaths.forEach((file, _sortedIdx) => {
      if (!file) return;
      const originalIndex = DATA.paths.findIndex(p => p && p.name === file.name);
      const index = originalIndex >= 0 ? originalIndex : _sortedIdx;
      addPathRow(file, index);
    });
    
    // 多选拖拽（渲染后绑定，每次渲染重新绑定）
    setupListMultiSelect();
    // 表格内容加载完成后，调整表头宽度
    handleResize();
    // 更新智能滚动条状态
    setTimeout(updateSmartScrollbars, 10);
    // 为新增的 dlwt 链接设置 token 下载功能
    if (DATA.user) setupDownloadWithToken();
  } else {
    $pathsTable.classList.add('hidden');
    $pathsTableHeadWrap?.classList.add('hidden');
    updateEmptyState();
    $emptyState.classList.remove('hidden');
  }
}

// ============================================================
//  渲染：网格视图
// ============================================================

function renderGridView() {
  const $gridView       = document.querySelector('.file-grid-view');
  if (!$gridView) return;

  const sortedPaths = getSortedPaths();
  
  // 只负责渲染内容，不负责控制视图的显示/隐藏（由 toggleView 负责）
  // 重置选择模式
  _gridSelectionMode = false;
  $gridView.classList.remove('selection-mode');
  
  // 移除所有旧的 grid-item 元素
  $gridView.querySelectorAll('.grid-item').forEach(el => el.remove());
  
  if (sortedPaths && sortedPaths.length > 0) {
    sortedPaths.forEach((file, _sortedIdx) => {
      if (!file) return;
      const originalIndex = DATA.paths.findIndex(p => p && p.name === file.name);
      const index = originalIndex >= 0 ? originalIndex : _sortedIdx;
      addGridItem($gridView, file, index, sortedPaths);
    });

    // 事件委托：grid-checkbox change（只绑定一次）
    if (!$gridView._changeListenerBound) {
      $gridView.addEventListener('change', (e) => {
        if (e.target.classList.contains('grid-checkbox')) {
          _onGridCheckboxToggle($gridView);
        }
      });
      $gridView._changeListenerBound = true;
    }

    setupGridSort();
    _renderGridBulkToolbar(); // 首次绑定事件；后续调用仅重置计数
  }
  
  // 更新智能滚动条状态
  setTimeout(updateSmartScrollbars, 10);
}

function addGridItem($gridView, file, index, sortedPaths) {
  const isDir       = file.path_type.endsWith('Dir');
  const url         = newUrl(file.name) + (isDir ? '/' : '');
  const sizeDisplay = isDir ? formatDirSize(file.size) : formatFileSize(file.size).join(' ');
  const iconSvg     = getFileIcon(file.name, file.path_type);

  const $item = document.createElement('div');
  $item.className = 'grid-item';
  $item.dataset.index = index;
  $item.innerHTML = `
    <div class="grid-item-checkbox">
      <input type="checkbox" class="grid-checkbox" data-index="${index}">
    </div>
    <div class="grid-item-icon">${iconSvg}</div>
    <div class="grid-item-name" title="${file.name}">${encodedStr(file.name)}</div>
    <div class="grid-item-size">${sizeDisplay}</div>
  `;

  _setupGridItemLongPress($item, file, index, url, isDir);

  $item.addEventListener('click', (e) => {
    if (_gridLongPressFired) { _gridLongPressFired = false; return; }
    if (e.target.classList.contains('grid-checkbox')) {
      _onGridCheckboxToggle($gridView);
      return;
    }
    if (_gridSelectionMode) {
      const cb = $item.querySelector('.grid-checkbox');
      if (cb) { cb.checked = !cb.checked; _onGridCheckboxToggle($gridView); }
      return;
    }
    if (isDir) {
      loadDirectory(url);
    } else {
      // 检查文件扩展名，如果是可编辑格式，用编辑器打开
      const ext = extName(file.name).toLowerCase();
      if (EDITOR_FORMATS.includes(ext)) {
        location.href = url + '?edit';
      } else {
        // 使用带 token 的下载方式（如果已登录）
        _downloadFile(url);
      }
    }
  });

  $item.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e, file, index);
  });

  $gridView.appendChild($item);
}

function _setupGridItemLongPress($item, file, index, url, isDir) {
  const $gridView = document.querySelector('.file-grid-view');

  const startPress = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    _gridLongPressFired = false;
    _gridLongPressTimer = setTimeout(() => {
      _gridLongPressFired = true;
      if (!_gridSelectionMode) {
        _gridSelectionMode = true;
        $gridView.classList.add('selection-mode');
      }
      const cb = $item.querySelector('.grid-checkbox');
      if (cb && !cb.checked) {
        cb.checked = true;
        _onGridCheckboxToggle($gridView);
      }
    }, 400);
  };

  const cancelPress = () => {
    if (_gridLongPressTimer) { clearTimeout(_gridLongPressTimer); _gridLongPressTimer = null; }
  };

  $item.addEventListener('pointerdown',   startPress);
  $item.addEventListener('pointerup',     cancelPress);
  $item.addEventListener('pointermove',   cancelPress);
  $item.addEventListener('pointercancel', cancelPress);
  $item.addEventListener('contextmenu',   cancelPress);
}

function _onGridCheckboxToggle($gridView) {
  const checkedCount = $gridView.querySelectorAll('.grid-checkbox:checked').length;
  if (checkedCount === 0 && _gridSelectionMode) {
    _gridSelectionMode = false;
    $gridView.classList.remove('selection-mode');
  }
  updateBulkDeleteButton();
  _updateBulkToolbar(checkedCount);
}

// ============================================================
//  网格批量操作（嵌在 grid-view-header 内）
// ============================================================

/**
 * 绑定 grid-view-header 内批量操作按钮（只绑一次，用标志防重复）
 * 按钮 DOM 在 index.html 中静态声明，无需动态创建
 */
let _gridBulkBound = false;
function _renderGridBulkToolbar() {
  if (_gridBulkBound) { _updateBulkToolbar(0); return; }
  _gridBulkBound = true;

  document.getElementById('gridBulkCancel')?.addEventListener('click', () => {
    const $gv = document.querySelector('.file-grid-view');
    $gv?.querySelectorAll('.grid-checkbox').forEach(cb => (cb.checked = false));
    _gridSelectionMode = false;
    $gv?.classList.remove('selection-mode');
    _updateBulkToolbar(0);
    updateBulkDeleteButton();
  });

  _updateBulkToolbar(0);
}

/** 统一批量操作栏更新（列表视图和网格视图共用同一套 DOM） */
function _updateBulkToolbar(n) {
  const area      = document.getElementById('listBulkActions');
  const floating  = document.getElementById('bulkActionsFloating');
  if (!area || !floating) return;
  if (n > 0) {
    area.classList.add('visible');
    floating.classList.add('visible');
    const label = document.getElementById('listBulkLabel');
    if (label) label.textContent = t('selected', n);
    const dlText = document.getElementById('listBulkDlText');
    if (dlText) dlText.textContent = t('bulkDownload', n);
    const delText = document.getElementById('listBulkDelText');
    if (delText) delText.textContent = `${t('delete')} (${n})`;
    const dlBtn  = document.getElementById('listBulkDownload');
    const delBtn = document.getElementById('listBulkDelete');
    if (dlBtn)  dlBtn.style.display  = DATA.allow_archive ? '' : 'none';
    if (delBtn) delBtn.style.display = DATA.allow_delete  ? '' : 'none';
  } else {
    area.classList.remove('visible');
    floating.classList.remove('visible');
  }
}

function _getGridSelectedIndices() {
  return Array.from(
    document.querySelectorAll('.file-grid-view .grid-checkbox:checked'),
    cb => parseInt(cb.dataset.index)
  );
}

// ============================================================
//  批量下载（JSZip 打包 / 逐个降级）
//  阈值 _maxDownloadSize MB：低于此值打成单个 ZIP；超出或含目录则逐个触发。
// ============================================================

const BULK_ZIP_THRESHOLD = _maxDownloadSize * 1024 * 1024;

let _jszip = null;
async function _loadJSZip() {
  if (_jszip) return _jszip;
  
  // 使用本地 JSZip 文件，避免 CDN 依赖和安全风险
  // 使用全局变量 ASSETS_PREFIX（在 index.html 中定义）
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = (window.ASSETS_PREFIX || '') + 'jszip.min.js';
    s.onload  = resolve;
    s.onerror = () => reject(new Error('无法加载 JSZip 库，请检查 jszip.min.js 文件是否存在'));
    document.head.appendChild(s);
  });
  
  if (!window.JSZip) {
    throw new Error('JSZip 加载失败：window.JSZip 未定义');
  }
  
  _jszip = window.JSZip;
  return _jszip;
}

/**
 * 使用 ReadableStream 流式下载文件，并实时报告进度
 * @param {string} url - 下载 URL
 * @param {function(number, number)} onProgress - 进度回调函数 (loaded, total)
 * @returns {Promise<ArrayBuffer>} - 完整的文件数据
 */
async function fetchWithProgress(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  
  const contentLength = res.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : null;
  let loaded = 0;
  
  const reader = res.body.getReader();
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    chunks.push(value);
    loaded += value.length;
    
    // 报告进度
    if (onProgress && total) {
      onProgress(loaded, total);
    }
  }
  
  // 合并所有 chunk
  const totalLength = loaded;
  const result = new Uint8Array(totalLength);
  let position = 0;
  for (const chunk of chunks) {
    result.set(chunk, position);
    position += chunk.length;
  }
  
  return result.buffer;
}

function _dlProgressOpen(title) {
  document.getElementById('dlProgressTitle').textContent = title;
  document.getElementById('dlProgressMsg').innerHTML = '';
  
  // 重置所有进度区域
  _setDownloadProgress(0, '0%', '');
  _setCompressProgress(0, '0%', '');
  _showDownloadSection();
  
  document.getElementById('dlProgressModal').classList.remove('hidden');
}

/**
 * 显示下载进度区域
 */
function _showDownloadSection() {
  document.getElementById('dlDownloadSection').style.display = 'block';
  document.getElementById('dlCompressSection').style.display = 'none';
}

/**
 * 显示压缩进度区域
 */
function _showCompressSection() {
  document.getElementById('dlDownloadSection').style.display = 'none';
  document.getElementById('dlCompressSection').style.display = 'block';
}

/**
 * 设置下载进度
 */
function _setDownloadProgress(downloaded, total, countText) {
  const $fill = document.getElementById('dlDownloadFill');
  const $count = document.getElementById('dlDownloadCount');
  
  // 使用文件数计算进度百分比
  const pct = total > 0 ? (downloaded / total) * 100 : 0;
  if ($fill) $fill.style.width = pct + '%';
  if ($count) $count.textContent = countText || '';
}

/**
 * 设置压缩进度
 */
function _setCompressProgress(pct, pctText, statusText) {
  const $fill = document.getElementById('dlCompressFill');
  const $pct = document.getElementById('dlCompressPct');
  const $status = document.getElementById('dlCompressStatus');
  
  if ($fill) $fill.style.width = pct + '%';
  if ($pct) $pct.textContent = pctText;
  if ($status) $status.textContent = statusText || '';
}

/**
 * 更新当前下载文件信息
 */
function _updateCurrentFile(fileName, filePct, loadedBytes, totalBytes) {
  const $container = document.getElementById('dlCurrentFileContainer');
  const $name = document.getElementById('dlCurrentFileName');
  const $fileFill = document.getElementById('dlFileProgressFill');
  const $fileText = document.getElementById('dlFileProgressText');
  const $fileBytes = document.getElementById('dlFileProgressBytes');
  const $bytes = document.getElementById('dlDownloadBytes');
  
  if ($name) $name.textContent = fileName;
  if ($fileFill) $fileFill.style.width = filePct + '%';
  if ($fileText) $fileText.textContent = filePct + '%';
  
  // 更新进度条中间的详细进度（如：110K/490K）
  if ($fileBytes && loadedBytes != null && totalBytes != null && totalBytes > 0) {
    const [loadedVal, loadedUnit] = formatFileSize(loadedBytes);
    const [totalVal, totalUnit] = formatFileSize(totalBytes);
    $fileBytes.textContent = `${loadedVal}${loadedUnit}/${totalVal}${totalUnit}`;
    $fileBytes.style.display = 'block';
    // 颜色由 CSS mix-blend-mode 自动处理，进度条接触时自动反色
  }
  
  // 更新总体进度显示
  if (loadedBytes != null && totalBytes != null && totalBytes > 0) {
    const [loadedVal, loadedUnit] = formatFileSize(loadedBytes);
    const [totalVal, totalUnit] = formatFileSize(totalBytes);
    if ($bytes) $bytes.textContent = `${loadedVal} ${loadedUnit} / ${totalVal} ${totalUnit}`;
  }
  
  if ($container) {
    $container.style.display = fileName ? 'block' : 'none';
  }
}

function _dlProgressClose() {
  document.getElementById('dlProgressModal').classList.add('hidden');
  // 清理状态
  _updateCurrentFile('', 0, 0, 0);
}

async function bulkDownload(indices) {
  if (indices.length === 0) return;
  const files = indices.map(i => DATA.paths[i]).filter(Boolean);

  const dirs  = files.filter(f => f.path_type.endsWith('Dir'));
  const plain = files.filter(f => !f.path_type.endsWith('Dir'));

  // ── 情况 1：全是目录 + 服务端支持 archive ─────────────────────────
  // 目录大小无法在前端计算（size 字段是子项数量而非字节数）
  // 直接逐个触发 ?zip，体验与单目录下载一致，无需任何提示
  if (dirs.length === files.length && DATA.allow_archive) {
    for (let i = 0; i < dirs.length; i++) {
      const url   = newUrl(dirs[i].name);
      const dlUrl = await _resolveDownloadUrl(url + '?zip');
      const a = Object.assign(document.createElement('a'), {
        href: dlUrl, download: dirs[i].name + '.zip',
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      if (i < dirs.length - 1) await new Promise(r => setTimeout(r, 500));
    }
    return;
  }

  // ── 情况 2：只有文件，大小完全可知 ───────────────────────────────
  if (dirs.length === 0) {
    const totalBytes = plain.reduce((s, f) => s + (f.size ?? 0), 0);
    if (totalBytes <= BULK_ZIP_THRESHOLD) {
      await _bulkDownloadZip(files);
    } else {
      await _bulkDownloadFallback(files, totalBytes, false);
    }
    return;
  }

  // ── 情况 3：文件 + 目录混选，目录大小未知 ────────────────────────
  // 已知的文件字节数仅供参考，实际更大
  const knownBytes = plain.reduce((s, f) => s + (f.size ?? 0), 0);
  await _bulkDownloadFallback(files, knownBytes, true);
}

async function _bulkDownloadZip(files) {
  let JSZip;
  try { JSZip = await _loadJSZip(); }
  catch (err) { showToast(t('zipError', err.message), 5000); return; }

  // 标记正在下载文件
  _isDownloading = true;

  _dlProgressOpen(t('downloadingTitle'));
  const zip = new JSZip();
  let fetched = 0;
  let totalLoadedBytes = 0;
  const totalBytesToLoad = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
  const totalFiles = files.length;

  try {
    for (let i = 0; i < files.length; i++) {
      const file  = files[i];
      const isDir = file.path_type.endsWith('Dir');
      const url   = newUrl(file.name);
      const expectedSize = file.size ?? 0;

      // 使用流式下载，实时更新进度
      const dlUrl = await _resolveDownloadUrl(isDir ? url + '?zip' : url);
      const fileLoadedBytes = await fetchWithProgress(dlUrl, (loaded, total) => {
        // 更新当前文件进度
        const filePct = total > 0 ? Math.round((loaded / total) * 100) : 0;
        
        // 更新下载进度区域（使用文件数计算进度：已下载数/总文件数）
        _setDownloadProgress(fetched + 1, totalFiles, `${fetched + 1}/${totalFiles}`);
        
        // 更新当前文件信息（传入当前文件的已加载和总大小）
        _updateCurrentFile(file.name, filePct, loaded, total);
      });
      
      totalLoadedBytes += fileLoadedBytes.byteLength;
      zip.file(isDir ? file.name + '.zip' : file.name, fileLoadedBytes);
      fetched++;
    }

    // 下载完成，隐藏下载区域，显示压缩区域
    _isDownloading = false;
    _isCompressing = true;
    _updateCurrentFile('', 0, 0, 0); // 隐藏当前文件信息
    _showCompressSection();
    
    // 更新标题为压缩阶段
    document.getElementById('dlProgressTitle').textContent = t('compressingTitle');

    // 压缩进度
    _setCompressProgress(0, '0%', t('zipCompressing'));
    const blob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } },
      ({ percent }) => {
        const compressPct = Math.round(percent);
        _setCompressProgress(compressPct, compressPct + '%', t('zipCompressing'));
      }
    );

    // 压缩完成
    _isCompressing = false;
    _setCompressProgress(100, '100%', t('zipDone', fetched));

    await new Promise(r => setTimeout(r, 600));
    _dlProgressClose();

    const folderName = baseName(baseUrl()) || 'files';
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: folderName + '_selected.zip',
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);

  } catch (err) {
    _dlProgressClose();
    // 清除所有状态
    _isDownloading = false;
    _isCompressing = false;
    showToast(t('zipError', err.message), 6000);
  }
}

async function _bulkDownloadFallback(files, totalBytes, hasUnknown) {
  // hasUnknown=true：含目录，选用"目录原因"提示；否则用"超限原因"提示
  let body;
  if (hasUnknown) {
    const sizeStr = totalBytes > 0 ? formatFileSize(totalBytes).join(' ') : '';
    body = t('zipFallbackBodyDir', sizeStr, files.length, _maxDownloadSize);
  } else {
    const sizeStr = formatFileSize(totalBytes).join(' ');
    body = t('zipFallbackBodySize', sizeStr, files.length, _maxDownloadSize);
  }
  const go = await showConfirm(
    t('zipFallbackTitle'),
    body,
    { confirmText: t('zipFallbackStart'), cancelText: t('cancel') }
  );
  if (!go) return;

  // 标记正在下载文件（fallback 模式）
  _isDownloading = true;

  try {
    for (let i = 0; i < files.length; i++) {
      const file  = files[i];
      const isDir = file.path_type.endsWith('Dir');
      const url   = newUrl(file.name);

      showToast(t('zipFallbackDoing', i + 1, files.length, file.name), 2500);

      if (isDir) {
        const dlUrl = await _resolveDownloadUrl(url + '?zip');
        const a = Object.assign(document.createElement('a'), {
          href: dlUrl, download: file.name + '.zip',
        });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else {
        await _downloadFile(url);
      }
      if (i < files.length - 1) await new Promise(r => setTimeout(r, 500));
    }
    showToast(t('zipFallbackDone', files.length), 4000);
  } finally {
    // 清除下载标志
    _isDownloading = false;
  }
}

async function _resolveDownloadUrl(fileUrl) {
  if (!DATA.user) return fileUrl;
  try {
    const tUrl = new URL(fileUrl, location.origin);
    tUrl.searchParams.set('tokengen', '');
    const res = await fetchWithAuth(tUrl);
    if (!res.ok) return fileUrl;
    const token = await res.text();
    const dUrl  = new URL(fileUrl, location.origin);
    dUrl.searchParams.set('token', token);
    return dUrl.toString();
  } catch (err) {
    return fileUrl;
  }
}

// ============================================================
//  渲染：单行（列表视图）
// ============================================================

function addPathRow(file, index) {
  const encodedName = encodedStr(file.name);
  const isDir       = file.path_type.endsWith('Dir');
  let   url         = newUrl(file.name) + (isDir ? '/' : '');
  
  const iconSvg = getFileIcon(file.name, file.path_type);

  let actionDownload = '';
  let actionMove     = '';
  let actionDelete   = '';
  let actionEdit     = '';

  if (isDir) {
    if (DATA.allow_archive) {
      actionDownload = `
      <div class="action-btn">
        <a class="dlwt" href="${url}?zip" title="${t('downloadZipAction')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </a>
      </div>`;
    }
  } else {
    actionDownload = `
    <div class="action-btn" >
      <a class="dlwt" href="${url}" title="${t('download')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </a>
    </div>`;
  }

  if (DATA.allow_delete) {
    actionDelete = `<div class="action-btn" title="${t('delete')}" onclick="event.stopPropagation();deletePath(${index})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </div>`;
  }

  if (DATA.allow_upload) {
    if (DATA.allow_delete) {
      actionMove = `<div class="action-btn" title="${t('move')}" onclick="event.stopPropagation();movePath(${index})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 15 22 12 19 9"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
      </div>`;
    }
    if (!isDir) {
      actionEdit = `<a class="action-btn" title="${t('edit')}" href="${url}?edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </a>`;
    }
  }

  const sizeDisplay = isDir ? formatDirSize(file.size) : formatFileSize(file.size).join(' ');

  const nameLinkClass = isDir ? '' : 'dlwt';
  const nameLinkAttrs = nameLinkClass ? `class="${nameLinkClass}" href="${url}"` : `href="${url}"`;

  $pathsTableBody.insertAdjacentHTML('beforeend', `
    <tr id="pathRow${index}">
      <td class="cell-checkbox">
        <input type="checkbox" class="path-checkbox" data-index="${index}" onclick="event.stopPropagation()">
      </td>
      <td class="cell-icon">${iconSvg}</td>
      <td class="cell-name"><a ${nameLinkAttrs}>${encodedName}</a></td>
      <td class="cell-mtime">${formatMtime(file.mtime)}</td>
      <td class="cell-size">${sizeDisplay}</td>
      <td class="cell-actions"><div class="cell-actions-inner">${actionDownload}${actionEdit}${actionMove}${actionDelete}</div></td>
    </tr>
  `);
  
  // 为行添加右键菜单事件
  const row = document.getElementById(`pathRow${index}`);
  row.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e, file, index);
  });
}

// ============================================================
//  列表视图：行点击 & 鼠标拖选多选
// ============================================================

// 列表视图导航由 <a href> 驱动，行空白区域点击实现多选

/**
 * 列表视图鼠标按下拖拽多选
 * - mousedown 在行体（非链接、非操作按钮、非复选框）→ 开启选择模式，切换该行
 * - mouseover 到其他行时 → 同步设置相同的 checked 状态
 * - mouseup → 结束选择模式
 */
function setupListMultiSelect() {
  // 移除旧监听（通过替换 tbody 实现，tbody 在每次渲染时被清空重建，故此处仅需绑定）
  _isSelecting  = false;
  _selectValue  = true;
  _lastHoverRow = null;

  // 重新获取 tbody 元素，避免重复绑定事件
  $pathsTableBody = document.querySelector('.paths-table tbody');
  if (!$pathsTableBody) return;

  // 移除所有旧的事件监听器（通过克隆元素实现）
  // 先保存所有子节点
  const children = Array.from($pathsTableBody.children);
  // 克隆空的 tbody 元素
  const newTbody = $pathsTableBody.cloneNode(false);
  // 替换 tbody 元素
  $pathsTableBody.parentNode.replaceChild(newTbody, $pathsTableBody);
  $pathsTableBody = newTbody;
  // 将子节点添加回新的 tbody 元素
  children.forEach(child => $pathsTableBody.appendChild(child));
  
  // 重新绑定复选框 change 事件委托
  $pathsTableBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('path-checkbox')) {
      updateBulkDeleteButton();
      updateSelectAllCheckbox();
    }
  });

  // 拦截目录链接点击，使用局部刷新
  $pathsTableBody.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link && !link.target) { // 没有 target="_blank" 的链接
      let href = link.getAttribute('href');
      // 检查是否是编辑链接，如果是就让浏览器正常处理
      if (href && href.includes('?edit')) {
        return; // 不拦截，让编辑链接在当前窗口打开
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // 检查是否是目录（以 / 结尾）
      if (href && href.endsWith('/')) {
        loadDirectory(href);
      } else {
        // 检查文件扩展名，如果是可编辑格式，用编辑器打开
        const fileName = decodeURIComponent(href.split('/').pop() || '');
        const ext = extName(fileName).toLowerCase();
        if (EDITOR_FORMATS.includes(ext)) {
          location.href = href + '?edit';
        } else {
          // 其他文件直接在当前窗口打开
          location.href = href;
        }
      }
    }
  });

  $pathsTableBody.addEventListener('mousedown', (e) => {
    const row = e.target.closest('tr[id^="pathRow"]');
    if (!row) return;
    // 仅响应行体区域，排除链接、操作按钮、复选框单元格
    if (e.target.closest('a') || e.target.closest('.action-btn') || e.target.closest('.cell-checkbox')) return;
    // Ctrl/Meta/Shift 留给 click 事件处理（多选逻辑），mousedown 不介入
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;

    const checkbox = row.querySelector('.path-checkbox');
    if (!checkbox) return;

    _isSelecting  = true;
    _lastHoverRow = row;
    _selectValue  = !checkbox.checked;

    // 只设置状态，不立即改变复选框状态，避免单击时直接选中
    // 复选框状态会在mouseover时根据拖动行为改变

    e.preventDefault(); // 阻止文本选中
  });

  $pathsTableBody.addEventListener('mouseover', (e) => {
    if (!_isSelecting) return;
    const row = e.target.closest('tr[id^="pathRow"]');
    if (!row || row === _lastHoverRow) return;

    _lastHoverRow  = row;

    const checkbox = row.querySelector('.path-checkbox');
    if (checkbox && checkbox.checked !== _selectValue) {
      checkbox.checked = _selectValue;
      updateBulkDeleteButton();
      updateSelectAllCheckbox();
    }
  });

  document.addEventListener('mouseup', () => {
    _isSelecting  = false;
    _lastHoverRow = null;
  }, { once: false });
  
  // 为行空白区域添加点击事件，实现单选、Ctrl+连续单选、Shift+连续多选
  $pathsTableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr[id^="pathRow"]');
    if (!row) return;
    
    // 检查是否点击了链接、操作按钮或复选框
    const isLink = e.target.closest('a');
    const isActionBtn = e.target.closest('.action-btn');
    const isCheckbox = e.target.closest('.cell-checkbox');
    
    // 仅响应行体空白区域
    if (!isLink && !isActionBtn && !isCheckbox) {
      const checkbox = row.querySelector('.path-checkbox');
      if (checkbox) {
        // 阻止事件冒泡，避免触发其他行为
        e.stopPropagation();
        
        // 获取当前行的索引
        const currentIndex = parseInt(row.id.replace('pathRow', ''));
        
        if (e.ctrlKey || e.metaKey) { // 同时支持Ctrl和Command键
          // Ctrl+点击：切换当前行的选中状态，不影响其他行
          checkbox.checked = !checkbox.checked;
          updateBulkDeleteButton();
          updateSelectAllCheckbox();
        } else if (e.shiftKey) {
          // Shift+点击：选择从上次选中行到当前行的所有行
          const checkboxes = Array.from(document.querySelectorAll('.path-checkbox'));
          let lastCheckedIndex = checkboxes.findIndex(cb => cb.checked);
          
          if (lastCheckedIndex === -1) {
            // 如果没有任何行被选中，将当前行作为起点
            lastCheckedIndex = currentIndex;
          }
          
          const startIndex = Math.min(lastCheckedIndex, currentIndex);
          const endIndex = Math.max(lastCheckedIndex, currentIndex);
          
          checkboxes.forEach((cb, index) => {
            if (index >= startIndex && index <= endIndex) {
              cb.checked = true;
            }
          });
          updateBulkDeleteButton();
          updateSelectAllCheckbox();
        }
        // 普通点击：不做任何选择操作，给Ctrl+鼠标点击让路
      }
    }
  });
}

// ============================================================
//  视图切换
// ============================================================

function toggleView(view) {
  const listView = document.querySelector('.file-list-view');
  const gridView = document.querySelector('.file-grid-view');
  const gridSortControls = document.getElementById('gridSortControls');
  
  // 获取当前显示视图的选中项索引
  let selectedIndices = [];
  if (!listView.classList.contains('hidden')) {
    // 当前是列表视图
    selectedIndices = Array.from(document.querySelectorAll('.path-checkbox:checked'), cb => parseInt(cb.dataset.index));
  } else if (!gridView.classList.contains('hidden')) {
    // 当前是网格视图
    selectedIndices = Array.from(document.querySelectorAll('.grid-checkbox:checked'), cb => parseInt(cb.dataset.index));
  }
  
  // 隐藏所有视图
  listView.classList.add('hidden');
  gridView.classList.add('hidden');
  
  // 控制排序控件的显示和隐藏
  if (gridSortControls) {
    gridSortControls.style.display = view === 'grid' ? 'block' : 'none';
  }
  
  // 显示选中的视图
  if (view === 'list') {
    listView.classList.remove('hidden');
    // 确保列表视图的表头和表格显示
    if (DATA.paths && DATA.paths.length > 0) {
      $pathsTable?.classList.remove('hidden');
      $pathsTableHeadWrap?.classList.remove('hidden');
      $emptyState?.classList.add('hidden');
      // 调整表头宽度
      handleResize();
      
      // 清除列表视图中所有复选框的选中状态
      document.querySelectorAll('.path-checkbox').forEach(cb => {
        cb.checked = false;
      });
      
      // 更新列表视图中的复选框状态
      selectedIndices.forEach(idx => {
        const cb = document.querySelector(`.path-checkbox[data-index="${idx}"]`);
        if (cb) cb.checked = true;
      });
      
      // 更新全选按钮状态
      updateSelectAllCheckbox();
    }
  } else if (view === 'grid') {
    gridView.classList.remove('hidden');
    
    // 清除网格视图中所有复选框的选中状态
    document.querySelectorAll('.grid-checkbox').forEach(cb => {
      cb.checked = false;
    });
    
    // 更新网格视图中的复选框状态
    selectedIndices.forEach(idx => {
      const cb = document.querySelector(`.grid-checkbox[data-index="${idx}"]`);
      if (cb) cb.checked = true;
    });
    
    // 更新网格视图的选择模式
    if (selectedIndices.length > 0) {
      _gridSelectionMode = true;
      gridView.classList.add('selection-mode');
    } else {
      _gridSelectionMode = false;
      gridView.classList.remove('selection-mode');
    }
  }
  
  // 更新视图切换按钮状态
  document.querySelectorAll('.view-btn-inline').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  // 保存视图偏好
  setCookie('view_mode', view, 30);
  
  // 切换视图后，更新悬浮框状态
  if (view === 'list') {
    // 检查列表视图中是否有选中的文件
    const n = document.querySelectorAll('.path-checkbox:checked').length;
    _updateBulkToolbar(n);
  } else if (view === 'grid') {
    // 检查网格视图中是否有选中的文件
    const $gv = document.querySelector('.file-grid-view');
    const checkedCount = $gv?.querySelectorAll('.grid-checkbox:checked').length || 0;
    _updateBulkToolbar(checkedCount);
  }
}

function setupViewToggleButtons() {
  document.querySelectorAll('.view-btn-inline').forEach(btn => {
    btn.addEventListener('click', () => toggleView(btn.dataset.view));
  });
}

// ============================================================
//  文件计数 / 空状态
// ============================================================

function updateFileCount() {
  if (!DATA.paths) return;
  const valid     = DATA.paths.filter(Boolean);
  const dirCount  = valid.filter(p => p.path_type.endsWith('Dir')).length;
  const fileCount = valid.length - dirCount;
  $fileCount.textContent = `${dirCount} ${t('items', dirCount)}，${fileCount} ${t('items', fileCount)}`;
}

function updateEmptyState() {
  if ($emptyState) $emptyState.querySelector('.empty-text').textContent = DIR_EMPTY_NOTE;
}

// ============================================================
//  批量删除
// ============================================================

/**
 * 设置批量删除功能。
 *
 * 说明：此函数在 renderPathsTableHead() 内调用，此时 tbody 行尚未渲染，
 * 因此不能对 .path-checkbox 做直接绑定。改用事件委托，监听 tbody 上冒泡
 * 上来的 change 事件，以捕获任何时刻创建的 checkbox。
 *
 * 为避免多次调用（如语言切换重新渲染表头）产生重复绑定，委托监听器
 * 绑定在模块级 _checkboxDelegateAttached 标志上，保证只绑定一次。
 */
function setupBulkDelete() {
  // 全选复选框（克隆替换避免重复绑定）
  const selectAll = document.getElementById('selectAllCheckbox');
  if (selectAll) {
    const fresh = selectAll.cloneNode(true);
    selectAll.replaceWith(fresh);
    fresh.addEventListener('change', (e) => {
      document.querySelectorAll('.path-checkbox').forEach(cb => (cb.checked = e.target.checked));
      updateBulkDeleteButton();
      updateSelectAllCheckbox();
    });
  }

  // 事件委托：tbody change（只绑一次）
  if (!_checkboxDelegateAttached && $pathsTableBody) {
    $pathsTableBody.addEventListener('change', (e) => {
      if (e.target.classList.contains('path-checkbox')) {
        updateBulkDeleteButton();
        updateSelectAllCheckbox();
      }
    });
    _checkboxDelegateAttached = true;
  }

  // 列表批量操作栏（只绑一次）
  if (!_listBulkBound) {
    _setupListBulkBar();
    _listBulkBound = true;
  }
}

function _setupListBulkBar() {
  document.getElementById('listBulkCancel')?.addEventListener('click', () => {
    // 清除列表视图复选框
    document.querySelectorAll('.path-checkbox').forEach(cb => (cb.checked = false));
    const all = document.getElementById('selectAllCheckbox');
    if (all) { all.checked = false; all.indeterminate = false; }
    // 同时退出网格视图选择模式
    const $gv = document.querySelector('.file-grid-view');
    if ($gv) {
      $gv.querySelectorAll('.grid-checkbox').forEach(cb => (cb.checked = false));
      _gridSelectionMode = false;
      $gv.classList.remove('selection-mode');
    }
    _updateBulkToolbar(0);
  });

  document.getElementById('listBulkDownload')?.addEventListener('click', () => {
    // 列表视图或网格视图的选中项合并
    const indices = getSelectedIndices();
    if (indices.length > 0) bulkDownload(indices);
  });

  document.getElementById('listBulkDelete')?.addEventListener('click', () => {
    const indices = getSelectedIndices();
    if (indices.length > 0) bulkDelete(indices);
  });
}

function _getListSelectedIndices() {
  return Array.from(document.querySelectorAll('.path-checkbox:checked'), cb => parseInt(cb.dataset.index));
}

function updateBulkDeleteButton() {
  const n = document.querySelectorAll('.path-checkbox:checked').length;
  _updateBulkToolbar(n);
}



function updateSelectAllCheckbox() {
  const all     = document.getElementById('selectAllCheckbox');
  if (!all) return;
  const total   = document.querySelectorAll('.path-checkbox').length;
  const checked = document.querySelectorAll('.path-checkbox:checked').length;
  if (total > 0 && checked === total) {
    all.checked       = true;
    all.indeterminate = false;
  } else if (checked > 0) {
    all.checked       = false;
    all.indeterminate = true;
  } else {
    all.checked       = false;
    all.indeterminate = false;
  }
}

function getSelectedIndices() {
  const seen    = new Set();
  const indices = [];
  document.querySelectorAll('.path-checkbox:checked, .grid-checkbox:checked').forEach(cb => {
    const idx = parseInt(cb.dataset.index);
    if (!seen.has(idx)) { seen.add(idx); indices.push(idx); }
  });
  return indices;
}

/**
 * 批量删除
 * 修复：只将 **成功** 删除的条目从 DATA.paths 中移除
 */
async function bulkDelete(indices) {
  if (indices.length === 0) return;

  const _delMsg = indices.length === 1
    ? encodedStr(t('deleteConfirm', DATA.paths[indices[0]]?.name ?? ''))
    : t('bulkDeleteConfirm', indices.length);
  const _confirmed = await showConfirm(t('deleteTitle'), _delMsg, { danger: true });
  if (!_confirmed) return;

  const successIndices = [];
  let failCount = 0;

  for (const index of indices) {
    const file = DATA.paths[index];
    if (!file) continue;
    try {
      const res = await fetchWithAuth(newUrl(file.name), { method: 'DELETE' });
      if (res.status === 204 || res.status === 200) {
        document.getElementById(`pathRow${index}`)?.remove();
        document.querySelector(`.file-grid-view .grid-item[data-index="${index}"]`)?.remove();
        successIndices.push(index);
      } else {
        const text = await res.text().catch(() => '');
        failCount++;
      }
    } catch (err) {
      failCount++;
    }
  }

  // 仅移除成功删除的条目（从后往前，防止索引偏移）
  successIndices.sort((a, b) => b - a).forEach(idx => DATA.paths.splice(idx, 1));

  if (DATA.paths.length === 0) {
    $pathsTable.classList.add('hidden');
    $pathsTableHeadWrap?.classList.add('hidden');
    updateEmptyState();
    $emptyState.classList.remove('hidden');
  }
  updateFileCount();

  // ── 重置所有选中状态 ──────────────────────────────────────
  // 1. 清除列表视图中残留的复选框勾选 & 批量操作栏
  document.querySelectorAll('.path-checkbox').forEach(cb => (cb.checked = false));
  updateSelectAllCheckbox();
  _updateBulkToolbar(0);

  // 2. 清除网格视图选择模式 & 批量操作栏
  const $gv = document.querySelector('.file-grid-view');
  if ($gv) {
    $gv.querySelectorAll('.grid-checkbox').forEach(cb => (cb.checked = false));
    _gridSelectionMode = false;
    $gv.classList.remove('selection-mode');
  }
  _updateBulkToolbar(0);

  const ok = successIndices.length;
  if (ok > 0 && failCount === 0) {
    showToast(t('bulkDeleteSuccess', ok));
  } else if (ok > 0) {
    showToast(t('bulkDeletePartial', ok, failCount));
  } else {
    showToast(t('bulkDeleteFailed'));
  }
}

// ============================================================
//  单项删除
// ============================================================

async function deletePath(index) {
  const file = DATA.paths[index];
  if (!file) return;
  await doDeletePath(file.name, newUrl(file.name), () => {
    document.getElementById(`pathRow${index}`)?.remove();
    document.querySelector(`.file-grid-view .grid-item[data-index="${index}"]`)?.remove();
    DATA.paths[index] = null;
    const remaining = DATA.paths.filter(Boolean);
    if (remaining.length === 0) {
      $pathsTable.classList.add('hidden');
      $pathsTableHeadWrap?.classList.add('hidden');
      updateEmptyState();
      $emptyState.classList.remove('hidden');
    }
    updateFileCount();
  });
}

async function doDeletePath(name, url, cb) {
  const _okDel = await showConfirm(t('deleteTitle'), encodedStr(t('deleteConfirm', name)), { danger: true });
  if (!_okDel) return;
  try {
    const res = await fetchWithAuth(url, { method: 'DELETE' });
    if (res.status === 204 || res.status === 200) {
      cb();
      showToast(t('deleteSuccess'));
    } else {
      const text = await res.text().catch(() => '');
      throw new Error(`${res.status} ${res.statusText}${text ? ': ' + text : ''}`);
    }
  } catch (err) {
    showToast(`${t('deleteFailed', name)}${err.message}`);
  }
}

// ============================================================
//  移动 / 重命名
// ============================================================

async function downloadPath(index) {
  const file = DATA.paths[index];
  if (!file) return;
  const isDir = file.path_type.endsWith('Dir');
  let url = newUrl(file.name) + (isDir ? '/?zip' : '');
  
  // 如果需要认证，获取下载令牌
  if (DATA.user) {
    try {
      url = await _resolveDownloadUrl(url);
    } catch (err) {
      return;
    }
  }
  
  // 使用临时a标签实现直接下载，不弹出新窗口
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function movePath(index) {
  const file = DATA.paths[index];
  if (!file) return;
  const newFileUrl = await doMovePath(newUrl(file.name));
  if (newFileUrl) location.href = newFileUrl.split('/').slice(0, -1).join('/');
}

async function doMovePath(fileUrl) {
  const obj    = new URL(fileUrl);
  const prefix = DATA.uri_prefix.slice(0, -1);
  const filePath = decodeURIComponent(obj.pathname.slice(prefix.length));

  let newPath = await showPrompt(t('moveTitle'), t('moveLabel'), filePath);
  if (!newPath) return;
  if (!newPath.startsWith('/')) newPath = '/' + newPath;
  if (filePath === newPath) return;

  const newFileUrl = obj.origin + prefix + newPath.split('/').map(encodeURIComponent).join('/');
  try {
    const headRes = await fetchWithAuth(newFileUrl, { method: 'HEAD' });
    if (headRes.status === 200) {
      const _ow = await showConfirm(t('overwriteTitle'), encodedStr(t('overwriteConfirm')));
      if (!_ow) return;
    }

    const moveRes = await fetchWithAuth(fileUrl, {
      method:  'MOVE',
      headers: { 'Destination': newFileUrl },
    });
    await assertResOK(moveRes);
    showToast(t('moveSuccess'));
    return newFileUrl;
  } catch (err) {
    showToast(`${t('moveFailed', filePath, newPath)}${err.message}`);
  }
}

// ============================================================
//  排序
// ============================================================

function getSortedPaths() {
  const sort  = PARAMS.get('sort') || 'name';
  const order = PARAMS.get('order') || 'asc';

  return [...DATA.paths].filter(Boolean).sort((a, b) => {
    const aIsDir = a.path_type.endsWith('Dir');
    const bIsDir = b.path_type.endsWith('Dir');

    // 文件夹始终排在前面
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;

    // 在同一类型（都是文件夹或都是文件）中进行排序
    let cmp = 0;
    if (sort === 'name')  cmp = a.name.localeCompare(b.name);
    else if (sort === 'mtime') cmp = a.mtime - b.mtime;
    else if (sort === 'size')  cmp = a.size  - b.size;
    return order === 'asc' ? cmp : -cmp;
  });
}

function setupGridSort() {
  const $sel = document.getElementById('gridSortSelect');
  const $btn = document.getElementById('gridSortOrderBtn');
  if (!$sel || !$btn) return;

  const curSort  = PARAMS.get('sort')  || getCookie('grid_sort')  || 'name';
  const curOrder = PARAMS.get('order') || getCookie('grid_order') || 'asc';

  $sel.value = curSort;
  $btn.classList.toggle('asc', curOrder === 'desc');

  // 只在首次绑定时设置事件监听器
  if (!$sel._setupGridSortBound) {
    $sel.addEventListener('change', (e) => {
      const currentOrder = PARAMS.get('order') || getCookie('grid_order') || 'asc';
      sortAndRender(e.target.value, currentOrder);
    });

    $btn.addEventListener('click', () => {
      const currentSort = PARAMS.get('sort') || getCookie('grid_sort') || 'name';
      const currentOrder = PARAMS.get('order') || getCookie('grid_order') || 'asc';
      const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      sortAndRender(currentSort, newOrder);
    });

    $sel._setupGridSortBound = true;
  }
}

// ============================================================
//  上传
// ============================================================

function setupDropzone() {
  ['drag','dragstart','dragend','dragover','dragenter','dragleave','drop'].forEach(name => {
    document.addEventListener(name, e => { e.preventDefault(); e.stopPropagation(); });
  });
  document.addEventListener('drop', async e => {
    if (!e.dataTransfer.items[0]?.webkitGetAsEntry) {
      Array.from(e.dataTransfer.files).filter(f => f.size > 0).forEach(f => {
        const manager = UploadManager.getInstance();
        FloatingUploadPanel.show();
        manager.createTask(f, []);
      });
    } else {
      const entries = Array.from({ length: e.dataTransfer.items.length }, (_, i) =>
        e.dataTransfer.items[i].webkitGetAsEntry()
      );
      addFileEntries(entries, []);
    }
  });
}

function setupUploadFile() {
  const $btns  = document.querySelectorAll('.upload-btn');
  const $input = document.getElementById('fileInput');
  $btns.forEach($btn => {
    $btn.classList.remove('hidden');
    $btn.addEventListener('click', () => $input.click());
  });
  $input.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const manager = UploadManager.getInstance();
      FloatingUploadPanel.show();
      files.forEach(f => manager.createTask(f, []));
    }
    $input.value = '';
  });
}

function setupNewFolder() {
  const $btns = document.querySelectorAll('.new-folder-btn');
  $btns.forEach($btn => {
    $btn.classList.remove('hidden');
    $btn.addEventListener('click', async () => {
      const name = await showPrompt(t('newFolderTitle'), t('newFolderLabel'));
      if (name) {
        // 验证文件名安全性
        if (!validateFileName(name)) {
          showToast('无效的文件夹名称：不能包含路径分隔符、控制字符或保留名称');
          return;
        }
        createFolder(name);
      }
    });
  });
}

function setupNewFile() {
  const $btns = document.querySelectorAll('.new-file-btn');
  $btns.forEach($btn => {
    $btn.classList.remove('hidden');
    $btn.addEventListener('click', async () => {
      const name = await showPrompt(t('newFileTitle'), t('newFileLabel'));
      if (name) {
        // 验证文件名安全性
        if (!validateFileName(name)) {
          showToast('无效的文件名称：不能包含路径分隔符、控制字符或保留名称');
          return;
        }
        createFile(name);
      }
    });
  });
}

async function addFileEntries(entries, dirs) {
  const manager = UploadManager.getInstance();
  FloatingUploadPanel.show();
  
  for (const entry of entries) {
    if (entry.isFile) {
      entry.file(file => manager.createTask(file, dirs));
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const readAll = (cb) => {
        reader.readEntries(items => {
          if (items.length > 0) {
            addFileEntries(items, [...dirs, entry.name]);
            readAll(cb);
          }
        });
      };
      readAll();
    }
  }
}

function setupDownloadWithToken() {
  document.querySelectorAll(".dlwt").forEach(link => {
    // 先移除之前的事件监听器，避免重复绑定
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);
    
    // 绑定新的事件监听器
    newLink.addEventListener("click", async e => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const originalHref = newLink.getAttribute("href");
        if (!originalHref) return;
        
        const tokengenUrl = new URL(originalHref, location.origin);
        tokengenUrl.searchParams.set("tokengen", "");
        const res = await fetchWithAuth(tokengenUrl);
        if (!res.ok) throw new Error("Failed to fetch token");
        const token = await res.text();
        const downloadUrl = new URL(originalHref, location.origin);
        downloadUrl.searchParams.set("token", token);
        const tempA = document.createElement("a");
        tempA.href = downloadUrl.toString();
        tempA.download = "";
        document.body.appendChild(tempA);
        tempA.click();
        document.body.removeChild(tempA);
      } catch (err) {
        showToast(t('downloadFailed', err.message));
      }
    });
  });
}

// ============================================================
//  搜索
// ============================================================

function setupSearch() {
  const $bar = document.querySelector('.searchbar');
  $bar.classList.remove('hidden');
  $bar.addEventListener('submit', e => {
    e.preventDefault();
    const q = new FormData($bar).get('q');
    location.href = q ? `${baseUrl()}?q=${encodeURIComponent(q)}` : baseUrl();
  });
  const q = PARAMS.get('q');
  if (q) document.getElementById('search').value = q;
}

// ============================================================
//  编辑器页面
// ============================================================

async function setupEditorPage() {
  const url = baseUrl();

  if (DATA.kind === 'Edit') {
    const $moveBtn = document.querySelector('.move-file-btn');
    $moveBtn.classList.remove('hidden');
    $moveBtn.addEventListener('click', async () => {
      const query      = location.href.slice(url.length);
      const newFileUrl = await doMovePath(url);
      if (newFileUrl) location.href = newFileUrl + query;
    });

    const $delBtn = document.querySelector('.delete-file-btn');
    $delBtn.classList.remove('hidden');
    $delBtn.addEventListener('click', async () => {
      await doDeletePath(baseName(url), url, () => {
        location.href = location.href.split('/').slice(0, -1).join('/');
      });
    });

    if (DATA.editable) {
      const $saveBtn = document.querySelector('.save-btn');
      $saveBtn.classList.remove('hidden');
      $saveBtn.addEventListener('click', saveChange);
    }
  } else if (DATA.kind === 'View') {
    $editor.readOnly = true;
  }

  if (!DATA.editable) {
    const ext = extName(baseName(url));
    if (IFRAME_FORMATS.includes(ext)) {
      $notEditable.classList.add('hidden');
      $previewFrame.classList.remove('hidden');
      $previewFrame.src = url;
    } else {
      $notEditable.classList.remove('hidden');
      $notEditable.querySelector('.not-editable-text').textContent = t('notEditable');
    }
    return;
  }

  $editor.classList.remove('hidden');
  try {
    const res = await fetchWithAuth(url);
    await assertResOK(res);
    const encoding = getEncoding(res.headers.get('content-type'));
    if (encoding === 'utf-8') {
      $editor.value = await res.text();
    } else {
      const bytes = await res.arrayBuffer();
      $editor.value = new TextDecoder(encoding).decode(new DataView(bytes));
    }
    
    // 保存原始内容用于后续比较
    _editorOriginalContent = $editor.value;
    _editorHasChanges = false;
    
    // 监听编辑器变化
    $editor.addEventListener('input', () => {
      _editorHasChanges = $editor.value !== _editorOriginalContent;
    });
  } catch (err) {
    showToast(`${t('getFileFailed')}${err.message}`);
  }
}

async function saveChange() {
  try {
    await fetchWithAuth(baseUrl(), { method: 'PUT', body: $editor.value });
    // 清除未保存标记
    _editorHasChanges = false;
    showToast(t('saveSuccess'));
    setTimeout(() => location.reload(), 500);
  } catch (err) {
    showToast(`${t('saveFailed')}${err.message}`);
  }
}

// ============================================================
//  创建文件 / 文件夹
// ============================================================

async function createFolder(name) {
  try {
    const res = await fetchWithAuth(newUrl(name), { method: 'MKCOL' });
    await assertResOK(res);
    showToast(t('folderCreated'));
    location.href = newUrl(name);
  } catch (err) {
    showToast(`${t('folderCreateFailed', name)}${err.message}`);
  }
}

async function createFile(name) {
  try {
    const res = await fetchWithAuth(newUrl(name), { method: 'PUT', body: '' });
    await assertResOK(res);
    showToast(t('fileCreated'));
    location.href = newUrl(name) + '?edit';
  } catch (err) {
    showToast(`${t('fileCreateFailed', name)}${err.message}`);
  }
}

// ============================================================
//  上下文菜单
// ============================================================

function showContextMenu(event, file, index) {
  event.preventDefault();
  event.stopPropagation();

  const isDir = file.path_type.endsWith('Dir');
  $contextMenu.dataset.index = index;
  $contextMenu.dataset.name  = file.name;
  $contextMenu.dataset.isDir = isDir;
  $contextMenu.classList.remove('hidden');

  // 权限控制：各菜单项可见性
  const show = (action, visible) => {
    const el = $contextMenu.querySelector(`[data-action="${action}"]`);
    if (el) el.style.display = visible ? 'flex' : 'none';
  };
  show('download', isDir ? !!DATA.allow_archive : true);
  show('move',     !!(DATA.allow_upload && DATA.allow_delete));
  show('delete',   !!DATA.allow_delete);
  show('edit',     !isDir && !!DATA.allow_upload);

  // 边界检测：菜单不超出视窗
  const menuW = 200, menuH = 180;
  const left  = (event.clientX + menuW > window.innerWidth)  ? event.clientX - menuW : event.clientX;
  const top   = (event.clientY + menuH > window.innerHeight) ? event.clientY - menuH : event.clientY;
  $contextMenu.style.left = left + 'px';
  $contextMenu.style.top  = top  + 'px';
}

/** 上下文菜单动作：只绑定一次 */
function setupContextMenuActions() {
  $contextMenu.addEventListener('click', async (e) => {
    const item = e.target.closest('.context-menu-item');
    if (!item) return;
    e.stopPropagation();

    const action = item.dataset.action;
    const index  = parseInt($contextMenu.dataset.index);
    const isDir  = $contextMenu.dataset.isDir === 'true';
    $contextMenu.classList.add('hidden');

    const file = DATA.paths[index];
    if (!file) return;

    switch (action) {
      case 'download':
        if (isDir) {
          const url = newUrl(file.name) + '?zip';
          const dlUrl = await _resolveDownloadUrl(url);
          const tempA = document.createElement('a');
          tempA.href = dlUrl;
          tempA.download = '';
          document.body.appendChild(tempA);
          tempA.click();
          document.body.removeChild(tempA);
        } else {
          await _downloadFile(newUrl(file.name));
        }
        break;
      case 'move':
        await movePath(index);
        break;
      case 'delete':
        await deletePath(index);
        break;
      case 'edit':
        location.href = newUrl(file.name) + '?edit';
        break;
    }
  });
}

/** 触发单文件下载（复用 _resolveDownloadUrl 处理 token） */
async function _downloadFile(fileUrl) {
  try {
    const dlUrl = await _resolveDownloadUrl(fileUrl);
    const a = Object.assign(document.createElement('a'), { href: dlUrl, download: '' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  } catch (err) {
    showToast(`${t('downloadFailed')}${err.message}`);
  }
}

// ============================================================
//  页面关闭/刷新警告
// ============================================================

/**
 * 检查是否有未保存的编辑内容
 * @returns {boolean}
 */
function _hasUnsavedChanges() {
  // 只在编辑页面且内容有修改时返回 true
  if (DATA && DATA.kind === 'Edit' && DATA.editable && $editor) {
    // 使用标记变量判断是否有修改
    return _editorHasChanges === true;
  }
  return false;
}

/**
 * 检查是否有活跃的上传或下载任务
 * @returns {boolean}
 */
function _hasActiveUploads() {
  // 检查是否正在下载或压缩
  if (_isDownloading || _isCompressing) {
    return true;
  }
  
  // 检查上传管理器是否存在且有活跃任务
  if (typeof UploadManager !== 'undefined') {
    try {
      const manager = UploadManager.getInstance();
      const state = manager.getState();
      // 检查是否有正在上传或等待中的任务
      return state.hasActiveTasks === true;
    } catch (e) {
      // 如果上传管理器未初始化或出错，返回 false
      return false;
    }
  }
  return false;
}

