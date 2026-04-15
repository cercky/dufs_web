// ============================================================
// uploader.js - 独立上传管理模块
// ============================================================

/** LocalStorage 键名 */
const LS_UPLOAD_MANAGER = 'dufs_upload_manager_v2';

/** 最大重试次数 */
const MAX_RETRY_COUNT = 5;

/** 重试延迟（毫秒） */
const RETRY_DELAY = 1000;

/** 最大并发上传数 */
const MAX_CONCURRENT_UPLOADS = 3;

/**
 * 上传任务状态枚举
 */
const UploadStatus = {
  WAITING: 'waiting',
  UPLOADING: 'uploading',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * 独立上传管理器 - 单例模式
 * 管理所有上传任务，不受页面切换影响
 */
class UploadManager {
  static instance = null;

  constructor() {
    if (UploadManager.instance) {
      return UploadManager.instance;
    }

    this.tasks = new Map(); // key: taskId, value: task object
    this.runningCount = 0;
    this.isInitialized = false;
    this.listeners = new Set();

    UploadManager.instance = this;
    this._init();
  }

  static getInstance() {
    if (!UploadManager.instance) {
      new UploadManager();
    }
    return UploadManager.instance;
  }

  /**
   * 初始化管理器
   */
  _init() {
    this._loadFromStorage();
    this.isInitialized = true;
    this._notifyListeners();
  }

  /**
   * 从 localStorage 加载状态
   */
  _loadFromStorage() {
    try {
      const data = localStorage.getItem(LS_UPLOAD_MANAGER);
      if (!data) return;

      const saved = JSON.parse(data);
      
      // 检查是否过期（超过24小时清除）
      if (saved.timestamp && Date.now() - saved.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(LS_UPLOAD_MANAGER);
        return;
      }

      // 恢复任务
      if (saved.tasks) {
        saved.tasks.forEach(taskData => {
          // 重置进行中的任务为等待状态（因为 XHR 无法跨页面保持）
          if (taskData.status === UploadStatus.UPLOADING) {
            taskData.status = UploadStatus.WAITING;
          }
          this.tasks.set(taskData.id, taskData);
        });
      }
    } catch (e) {
      console.warn('Failed to load upload manager state:', e);
    }
  }

  /**
   * 保存状态到 localStorage
   */
  _saveToStorage() {
    try {
      const tasksArray = Array.from(this.tasks.values()).map(task => {
        // 创建任务保存时移除 file 对象，因为它无法被序列化
        const { file, ...taskWithoutFile } = task;
        return taskWithoutFile;
      });
      const data = {
        tasks: tasksArray,
        timestamp: Date.now()
      };
      localStorage.setItem(LS_UPLOAD_MANAGER, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save upload manager state:', e);
    }
  }

  /**
   * 通知监听器
   */
  _notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
    this._saveToStorage();
  }

  /**
   * 添加状态变化监听器
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * 移除监听器
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * 获取当前状态
   */
  getState() {
    const tasks = Array.from(this.tasks.values());
    const totalFiles = tasks.length;
    const completedFiles = tasks.filter(t => t.status === UploadStatus.COMPLETED).length;
    const totalSize = tasks.reduce((sum, t) => sum + t.fileSize, 0);
    const uploadedSize = tasks.reduce((sum, t) => sum + t.uploadedSize, 0);

    return {
      tasks,
      totalFiles,
      completedFiles,
      totalSize,
      uploadedSize,
      hasActiveTasks: tasks.some(t => 
        t.status === UploadStatus.UPLOADING || 
        t.status === UploadStatus.WAITING
      )
    };
  }

  /**
   * 创建新的上传任务
   */
  createTask(file, pathParts) {
    // 验证文件名安全性
    if (!validateFileName(file.name)) {
      console.warn(`跳过不安全的文件名：${file.name}`);
      showToast(`跳过不安全的文件：${file.name}（文件名包含非法字符）`);
      return null;
    }
    
    const taskId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const name = [...pathParts, file.name].join('/');
    const url = newUrl(name);

    const task = {
      id: taskId,
      fileName: file.name,
      filePath: name,
      url: url,
      fileSize: file.size,
      uploadedSize: 0,
      uploadOffset: 0,
      status: UploadStatus.WAITING,
      retryCount: 0,
      createdAt: Date.now(),
      uploadStartedAt: null, // 上传开始时间
      lastProgressAt: null, // 上次进度更新时间
      lastUploadedSize: 0, // 上次上传大小
      currentSpeed: 0, // 当前上传速度（字节/秒）
      file: file // 保存 File 对象（注意：不能持久化）
    };

    this.tasks.set(taskId, task);
    this._notifyListeners();
    this._processQueue();

    return taskId;
  }

  /**
   * 处理上传队列
   */
  _processQueue() {
    if (this.runningCount >= MAX_CONCURRENT_UPLOADS) return;

    const waitingTasks = Array.from(this.tasks.values())
      .filter(t => t.status === UploadStatus.WAITING);

    if (waitingTasks.length === 0) return;

    this.runningCount++;
    const task = waitingTasks[0];
    this._startTask(task);
  }

  /**
   * 开始上传任务
   */
  async _startTask(task) {
    // 如果任务已被取消，直接返回
    if (task.status === UploadStatus.FAILED || task.status === UploadStatus.COMPLETED) {
      this.runningCount--;
      return;
    }
    
    // 检查是否有有效的 file 对象
    if (!task.file || typeof task.file.slice !== 'function') {
      // 不直接失败，保持等待状态，让用户通过恢复模态框选择文件
      task.status = UploadStatus.WAITING;
      this.runningCount--;
      // 显示恢复模态框
      setTimeout(() => showRestoreFileModal(), 100);
      this._notifyListeners();
      return;
    }
    
    task.status = UploadStatus.UPLOADING;
    task.uploadStartedAt = Date.now();
    task.lastProgressAt = Date.now();
    task.lastUploadedSize = task.uploadedSize;
    task.currentSpeed = 0;
    this._notifyListeners();

    try {
      // 先检查是否有已上传的部分
      await this._checkExistingFile(task);
      
      // 再次检查任务状态，防止在检查期间被取消
      if (task.status !== UploadStatus.UPLOADING) {
        this.runningCount--;
        return;
      }
      
      // 执行上传
      await this._uploadTask(task);
      
      // 上传成功
      task.status = UploadStatus.COMPLETED;
      task.uploadedSize = task.fileSize;
      
      // 刷新文件列表，显示新上传的文件
      if (typeof loadDirectory === 'function') {
        const currentPath = window.location.pathname;
        loadDirectory(currentPath, true);
      }
    } catch (error) {
      // 如果是用户取消的，不打印错误
      if (task.status === UploadStatus.FAILED && error.message === 'Aborted') {
        return;
        // 已经在 cancelTask 中处理了
      } else {
        // 上传失败
        task.retryCount++;
        
        if (task.retryCount <= MAX_RETRY_COUNT) {
          // 等待后重试
          task.status = UploadStatus.WAITING;
          setTimeout(() => this._processQueue(), RETRY_DELAY);
        } else {
          // 超过最大重试次数
          task.status = UploadStatus.FAILED;
        }
      }
    }

    this.runningCount--;
    this._notifyListeners();
    this._processQueue();
  }

  /**
   * 检查服务器上是否已有文件
   */
  async _checkExistingFile(task) {
    // 不再需要检查文件大小，因为我们总是使用 PUT 请求覆盖整个文件
    task.uploadOffset = 0;
    task.uploadedSize = 0;
  }

  /**
   * 执行上传
   */
  _uploadTask(task) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 保存 XHR 引用以便取消
      task.xhr = xhr;
      
      xhr.upload.addEventListener('progress', (e) => {
        const totalUploaded = e.loaded;
        const now = Date.now();
        
        // 计算上传速度
        if (task.lastProgressAt && now > task.lastProgressAt) {
          const timeDiff = (now - task.lastProgressAt) / 1000; // 秒
          const sizeDiff = totalUploaded - task.lastUploadedSize; // 字节
          if (timeDiff > 0 && sizeDiff >= 0) {
            task.currentSpeed = sizeDiff / timeDiff;
          }
        }
        
        task.uploadedSize = totalUploaded;
        task.lastProgressAt = now;
        task.lastUploadedSize = totalUploaded;
        
        this._notifyListeners();
      });

      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState !== 4) return;
        // 清除 XHR 引用
        task.xhr = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else if (xhr.status !== 0) {
          reject(new Error(`${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        task.xhr = null;
        reject(new Error('Network error'));
      });
      xhr.addEventListener('abort', () => {
        task.xhr = null;
        reject(new Error('Aborted'));
      });

      // 总是使用 PUT 请求覆盖文件，而不是 PATCH 请求追加内容
      xhr.open('PUT', task.url);
      this._applyAuthHeader(xhr);
      xhr.send(task.file);
    });
  }
  
  /**
   * 取消上传任务
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    // 如果有正在进行的 XHR，取消它
    if (task.xhr && typeof task.xhr.abort === 'function') {
      try {
        task.xhr.abort();
      } catch (e) {
        return;
        
      }
    }
    
    task.status = UploadStatus.FAILED;
    this._notifyListeners();
  }
  
  /**
   * 删除上传任务
   */
  deleteTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    // 如果有正在进行的 XHR，取消它
    if (task.xhr && typeof task.xhr.abort === 'function') {
      try {
        task.xhr.abort();
      } catch (e) {
        console.warn('Failed to abort XHR:', e);
      }
      this.runningCount--;
    }
    
    this.tasks.delete(taskId);
    this._notifyListeners();
    this._processQueue();
  }
  
  /**
   * 重试失败的任务
   */
  retryTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== UploadStatus.FAILED) return;
    
    task.status = UploadStatus.WAITING;
    task.retryCount = 0;
    this._notifyListeners();
    this._processQueue();
  }

  /**
   * 应用认证头
   */
  _applyAuthHeader(xhr) {
    const auth = getStoredAuth();
    if (auth) {
      xhr.setRequestHeader('Authorization', `Basic ${btoaUnicode(`${auth.user}:${auth.pass}`)}`);
    }
  }

  /**
   * 清除已完成的任务
   */
  clearCompleted() {
    const toDelete = [];
    this.tasks.forEach((task, id) => {
      if (task.status === UploadStatus.COMPLETED || task.status === UploadStatus.FAILED) {
        toDelete.push(id);
      }
    });
    toDelete.forEach(id => this.tasks.delete(id));
    this._notifyListeners();
  }

  /**
   * 重新开始失败的任务
   */
  retryFailed() {
    this.tasks.forEach((task) => {
      if (task.status === UploadStatus.FAILED) {
        task.status = UploadStatus.WAITING;
        task.retryCount = 0;
      }
    });
    this._notifyListeners();
    this._processQueue();
  }
}

/**
 * 上传任务列表 UI 渲染
 */
const GlobalUploadProgress = {
  // 保存上一次的任务状态，用于比较
  _lastTasksState: new Map(),
  
  render(state) {
    // 检查是否需要局部更新
    const needsFullRender = this._checkNeedsFullRender(state.tasks);
    
    if (needsFullRender) {
      // 完整渲染整个列表
      this._renderFileList(state.tasks);
    } else {
      // 只局部更新进度条和速度
      this._updateProgressOnly(state.tasks);
    }
    
    // 检查任务数量，如果没有任务则隐藏面板
    if (state.tasks.length === 0) {
      FloatingUploadPanel.hide();
    }
  },
  
  /**
   * 检查是否需要完整渲染（状态变化或任务数量变化）
   */
  _checkNeedsFullRender(tasks) {
    // 如果任务数量变化，需要完整渲染
    if (this._lastTasksState.size !== tasks.length) {
      this._updateLastTasksState(tasks);
      return true;
    }
    
    // 检查任务状态是否变化
    for (const task of tasks) {
      const lastState = this._lastTasksState.get(task.id);
      if (!lastState || lastState.status !== task.status) {
        this._updateLastTasksState(tasks);
        return true;
      }
    }
    
    // 只有进度和速度变化，不需要完整渲染
    return false;
  },
  
  /**
   * 更新上一次的任务状态
   */
  _updateLastTasksState(tasks) {
    this._lastTasksState.clear();
    for (const task of tasks) {
      this._lastTasksState.set(task.id, { status: task.status });
    }
  },
  
  /**
   * 只局部更新进度条和速度
   */
  _updateProgressOnly(tasks) {
    const $fileList = document.getElementById('uploadFileList');
    if (!$fileList) return;
    
    for (const task of tasks) {
      if (task.status !== UploadStatus.UPLOADING) continue;
      
      const $taskItem = document.getElementById(`upload-task-${task.id}`);
      if (!$taskItem) continue;
      
      // 计算进度
      const progressPercent = task.fileSize > 0 
        ? Math.min(100, Math.round((task.uploadedSize / task.fileSize) * 100))
        : 0;
      
      // 更新进度条
      const $progressFill = $taskItem.querySelector('.file-progress-fill');
      if ($progressFill) {
        $progressFill.style.width = `${progressPercent}%`;
      }
      
      // 更新进度文本
      const [uploadedSize, uploadedUnit] = formatFileSize(task.uploadedSize);
      const [totalSize, totalUnit] = formatFileSize(task.fileSize);
      const $progressText = $taskItem.querySelector('.file-progress-text');
      if ($progressText) {
        $progressText.textContent = `${uploadedSize} ${uploadedUnit} / ${totalSize} ${totalUnit}`;
      }
      
      // 更新速度文本
      const speedDisplayText = task.status === UploadStatus.UPLOADING ? formatSpeed(task.currentSpeed) : '';
      const $speedText = $taskItem.querySelector('.file-speed-text');
      if ($speedText) {
        if (speedDisplayText) {
          $speedText.textContent = speedDisplayText;
          $speedText.classList.remove('hidden');
        } else {
          $speedText.classList.add('hidden');
        }
      }
      
      // 更新状态文本（百分比）
      const $statusText = $taskItem.querySelector('.file-status');
      if ($statusText && task.status === UploadStatus.UPLOADING) {
        $statusText.textContent = `${progressPercent}%`;
      }
    }
  },

  _renderFileList(tasks) {
    const $fileList = document.getElementById('uploadFileList');
    if (!$fileList) return;

    $fileList.innerHTML = tasks.map((task, index) => {
      const encodedName = encodedStr(task.fileName);
      let statusText = '';
      let statusClass = '';
      let itemClass = '';
      let actionButtons = '';
      
      const progressPercent = task.fileSize > 0 
        ? Math.min(100, Math.round((task.uploadedSize / task.fileSize) * 100))
        : 0;

      switch (task.status) {
        case UploadStatus.WAITING:
          statusText = t('waiting');
          itemClass = 'status-waiting';
          actionButtons = `
            <button class="upload-action-btn" data-action="delete" data-task-id="${task.id}" title="${t('deleteAction')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          `;
          break;
        case UploadStatus.UPLOADING:
          statusText = `${progressPercent}%`;
          itemClass = 'status-uploading';
          actionButtons = `
            <button class="upload-action-btn" data-action="cancel" data-task-id="${task.id}" title="${t('cancelAction')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          `;
          break;
        case UploadStatus.COMPLETED:
          statusText = t('complete');
          statusClass = 'status-success';
          itemClass = 'status-completed';
          actionButtons = `
            <button class="upload-action-btn" data-action="delete" data-task-id="${task.id}" title="${t('deleteAction')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          `;
          break;
        case UploadStatus.FAILED:
          statusText = t('failed');
          statusClass = 'status-error';
          itemClass = 'status-failed';
          actionButtons = `
            <button class="upload-action-btn" data-action="retry" data-task-id="${task.id}" title="${t('retryAction')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            </button>
            <button class="upload-action-btn" data-action="delete" data-task-id="${task.id}" title="${t('deleteAction')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          `;
          break;
      }

      const [uploadedSize, uploadedUnit] = formatFileSize(task.uploadedSize);
      const [totalSize, totalUnit] = formatFileSize(task.fileSize);
      const speedText = task.status === UploadStatus.UPLOADING ? formatSpeed(task.currentSpeed) : '';

      return `
        <div class="upload-file-item ${itemClass}" id="upload-task-${task.id}">
          <span class="file-icon">📄</span>
          <div class="file-info">
            <span class="file-name">${encodedName}</span>
            <div class="file-progress-container">
              <div class="file-progress-bar">
                <div class="file-progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <div class="file-progress-text-container">
                <span class="file-progress-text">${uploadedSize} ${uploadedUnit} / ${totalSize} ${totalUnit}</span>
                ${speedText ? `<span class="file-speed-text">${speedText}</span>` : ''}
              </div>
            </div>
          </div>
          <span class="file-status ${statusClass}">${statusText}</span>
          <div class="file-actions">
            ${actionButtons}
          </div>
        </div>
      `;
    }).join('');
    
    // 绑定操作按钮事件
    this._bindActionButtons();
  },
  
  _bindActionButtons() {
    const $fileList = document.getElementById('uploadFileList');
    if (!$fileList) return;
    
    $fileList.querySelectorAll('.upload-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const taskId = e.currentTarget.dataset.taskId;
        const manager = UploadManager.getInstance();
        
        switch (action) {
          case 'cancel':
            manager.cancelTask(taskId);
            break;
          case 'delete':
            manager.deleteTask(taskId);
            break;
          case 'retry':
            manager.retryTask(taskId);
            break;
        }
      });
    });
  }
};

/**
 * 上传状态指示器控制
 */
const UploadStatusIndicator = {
  update(state) {
    const $indicator = document.getElementById('uploadStatusIndicator');
    const $text = document.getElementById('uploadIndicatorText');
    
    if (!$indicator) return;

    if (state.hasActiveTasks || state.totalFiles > 0) {
      $indicator.classList.remove('hidden');
      
      // 清除之前的状态类
      $indicator.classList.remove('status-waiting', 'status-uploading', 'status-completed', 'status-error');
      
      // 根据任务状态添加样式类
      const hasUploading = state.tasks.some(t => t.status === UploadStatus.UPLOADING);
      const hasFailed = state.tasks.some(t => t.status === UploadStatus.FAILED);
      const hasWaiting = state.tasks.some(t => t.status === UploadStatus.WAITING);
      
      if (hasFailed) {
        $indicator.classList.add('status-error');
      } else if (hasUploading) {
        $indicator.classList.add('status-uploading');
      } else if (hasWaiting) {
        $indicator.classList.add('status-waiting');
      } else {
        $indicator.classList.add('status-completed');
      }
    } else {
      $indicator.classList.add('hidden');
      $indicator.classList.remove('status-waiting', 'status-uploading', 'status-completed', 'status-error');
    }
  }
};

/**
 * 上传面板控制
 */
const FloatingUploadPanel = {
  STORAGE_KEY: 'dufs_upload_panel_visible',

  show() {
    const $panel = document.getElementById('uploadFloatingPanel');
    if ($panel) {
      $panel.classList.remove('hidden');
      localStorage.setItem(this.STORAGE_KEY, 'true');
    }
  },

  hide() {
    const $panel = document.getElementById('uploadFloatingPanel');
    if ($panel) {
      $panel.classList.add('hidden');
      localStorage.setItem(this.STORAGE_KEY, 'false');
    }
  },

  toggle() {
    const $panel = document.getElementById('uploadFloatingPanel');
    if ($panel) {
      const isHidden = $panel.classList.toggle('hidden');
      localStorage.setItem(this.STORAGE_KEY, isHidden ? 'false' : 'true');
    }
  },

  restoreState() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'true') {
      this.show();
    } else {
      this.hide();
    }
  }
};



/**
 * 绑定 UI 事件
 */
function bindUploadUIEvents() {
  // 关闭按钮
  const $closeBtn = document.getElementById('uploadCloseBtn');
  if ($closeBtn) {
    $closeBtn.addEventListener('click', () => FloatingUploadPanel.hide());
  }

  // 清理按钮
  const $clearBtn = document.getElementById('uploadClearBtn');
  if ($clearBtn) {
    $clearBtn.addEventListener('click', () => {
      const manager = UploadManager.getInstance();
      manager.clearCompleted();
    });
  }

  // 状态指示器点击 - 切换打开/关闭
  const $indicator = document.getElementById('uploadStatusIndicator');
  const $wrapper = document.querySelector('.upload-button-wrapper');
  if ($indicator) {
    $indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      FloatingUploadPanel.toggle();
    });
  }

  // 点击面板内部不关闭
  const $panel = document.getElementById('uploadFloatingPanel');
  if ($panel) {
    $panel.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // 点击页面其他区域关闭面板
  document.addEventListener('click', () => {
    FloatingUploadPanel.hide();
  });
}

// 存储待恢复的任务文件映射
const pendingRestoreFiles = new Map();

/**
 * 显示文件恢复模态框
 */
async function showRestoreFileModal() {
  const manager = UploadManager.getInstance();
  const state = manager.getState();
  
  // 找出需要恢复的任务（没有 file 对象的任务）
  const tasksToRestore = state.tasks.filter(task => !task.file && 
    (task.status === UploadStatus.WAITING || task.status === UploadStatus.UPLOADING));
  
  if (tasksToRestore.length === 0) {
    return;
  }
  
  const $modal = document.getElementById('restoreFileModal');
  const $fileList = document.getElementById('restoreFileList');
  const $skipBtn = document.getElementById('restoreSkipBtn');
  const $confirmBtn = document.getElementById('restoreConfirmBtn');
  
  if (!$modal || !$fileList) return;
  
  // 渲染待恢复的任务列表
  $fileList.innerHTML = tasksToRestore.map(task => {
    const progressPercent = task.fileSize > 0 
      ? Math.min(100, Math.round((task.uploadedSize / task.fileSize) * 100))
      : 0;
    const [uploadedSize, uploadedUnit] = formatFileSize(task.uploadedSize);
    const [totalSize, totalUnit] = formatFileSize(task.fileSize);
    
    return `
      <div class="restore-file-item" data-task-id="${task.id}">
        <span class="file-icon">📄</span>
        <div class="file-info">
          <span class="file-name">${encodedStr(task.fileName)}</span>
          <span class="file-progress">${t('uploaded')} ${uploadedSize} ${uploadedUnit} / ${totalSize} ${totalUnit} (${progressPercent}%)</span>
        </div>
        <input type="file" class="restore-file-input" data-task-id="${task.id}" style="display: none;">
        <button class="select-file-btn" data-task-id="${task.id}">${t('selectFile')}</button>
        <span class="file-selected hidden" data-task-id="${task.id}">${t('fileSelected')}</span>
      </div>
    `;
  }).join('');
  
  // 绑定选择文件按钮事件
  $fileList.querySelectorAll('.select-file-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = e.target.dataset.taskId;
      const $input = $fileList.querySelector(`.restore-file-input[data-task-id="${taskId}"]`);
      if ($input) {
        $input.click();
      }
    });
  });
  
  // 绑定文件选择事件
  $fileList.querySelectorAll('.restore-file-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const taskId = e.target.dataset.taskId;
      const file = e.target.files[0];
      
      if (file) {
        const task = tasksToRestore.find(t => t.id === taskId);
        if (task) {
          // 验证文件名和大小是否匹配
          if (file.name !== task.fileName || file.size !== task.fileSize) {
            alert(t('fileMismatch'));
            e.target.value = '';
            return;
          }
          
          // 存储选择的文件
          pendingRestoreFiles.set(taskId, file);
          
          // 更新UI
          const $item = $fileList.querySelector(`.restore-file-item[data-task-id="${taskId}"]`);
          const $btn = $fileList.querySelector(`.select-file-btn[data-task-id="${taskId}"]`);
          const $selected = $fileList.querySelector(`.file-selected[data-task-id="${taskId}"]`);
          
          if ($item) $item.classList.add('selected');
          if ($btn) $btn.classList.add('hidden');
          if ($selected) $selected.classList.remove('hidden');
        }
      }
    });
  });
  
  // 克隆并替换按钮以清除旧事件
  const newSkipBtn = $skipBtn.cloneNode(true);
  const newConfirmBtn = $confirmBtn.cloneNode(true);
  $skipBtn.parentNode.replaceChild(newSkipBtn, $skipBtn);
  $confirmBtn.parentNode.replaceChild(newConfirmBtn, $confirmBtn);
  
  // 跳过按钮
  newSkipBtn.onclick = () => {
    $modal.classList.add('hidden');
    pendingRestoreFiles.clear();
    // 标记未恢复的任务为失败
    tasksToRestore.forEach(task => {
      if (!pendingRestoreFiles.has(task.id)) {
        const t = manager.tasks.get(task.id);
        if (t) {
          t.status = UploadStatus.FAILED;
        }
      }
    });
    manager._notifyListeners();
  };
  
  // 确认恢复按钮
  newConfirmBtn.onclick = () => {
    // 应用选择的文件到任务
    pendingRestoreFiles.forEach((file, taskId) => {
      const task = manager.tasks.get(taskId);
      if (task) {
        task.file = file;
        task.status = UploadStatus.WAITING;
      }
    });
    
    $modal.classList.add('hidden');
    pendingRestoreFiles.clear();
    manager._notifyListeners();
    
    // 显示上传面板
    FloatingUploadPanel.show();
    
    // 启动上传队列处理
    manager._processQueue();
  };
  
  $modal.classList.remove('hidden');
}

/**
 * 初始化上传系统
 */
function initUploadSystem() {
  const manager = UploadManager.getInstance();

  // 状态变化监听器
  manager.addListener((state) => {
    GlobalUploadProgress.render(state);
    UploadStatusIndicator.update(state);
  });

  // 初始渲染
  const initialState = manager.getState();
  
  // 检查是否有待恢复的任务
  const hasTasksToRestore = initialState.tasks.some(task => !task.file && 
    (task.status === UploadStatus.WAITING || task.status === UploadStatus.UPLOADING));
  
  if (hasTasksToRestore) {
    // 显示恢复模态框
    showRestoreFileModal();
  } else {
    // 如果有任务，只启动上传队列，但不自动打开面板
    if (initialState.hasActiveTasks || initialState.totalFiles > 0) {
      GlobalUploadProgress.render(initialState);
      UploadStatusIndicator.update(initialState);
      // 启动上传队列处理
      manager._processQueue();
    }
    // 总是恢复用户之前的面板状态（默认关闭）
    FloatingUploadPanel.restoreState();
  }

  // 绑定 UI 事件
  bindUploadUIEvents();
}

// initUploadSystem 函数将在 app.js 中根据权限条件调用
