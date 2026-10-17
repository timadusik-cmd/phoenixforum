// Phoenix RP Forum - Enhanced Rich Post Editor Component
import { ICONS } from '../utils/icons.js';
import { api } from '../api/client.js';
import { formatPostContent } from '../pages/ThreadView.js';

export function renderRichEditor(textareaId = 'editor-content', initialContent = '') {
  return `
    <div class="rich-editor-wrap" id="${textareaId}-wrap">
      <!-- Toolbar -->
      <div class="rich-editor-toolbar" id="${textareaId}-toolbar">
        
        <!-- Group 1: Text Styles -->
        <div class="editor-tool-group">
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="bold" title="Жирный шрифт (Ctrl+B)">
            ${ICONS.bold}
          </button>
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="italic" title="Курсив (Ctrl+I)">
            ${ICONS.italic}
          </button>
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="underline" title="Подчеркнутый (Ctrl+U)">
            ${ICONS.underline}
          </button>
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="strikethrough" title="Зачеркнутый">
            ${ICONS.strikethrough}
          </button>
        </div>

        <div class="editor-toolbar-divider"></div>

        <!-- Group 2: Headings & Color -->
        <div class="editor-tool-group">
          <!-- Heading Dropdown Trigger -->
          <div class="editor-dropdown-wrap">
            <button type="button" class="editor-tool-btn editor-dropdown-toggle" id="${textareaId}-heading-btn" title="Размер заголовка">
              ${ICONS.heading}
              <span class="editor-btn-caret">▾</span>
            </button>
            <div class="editor-dropdown-menu heading-dropdown-menu" id="${textareaId}-heading-menu" style="display: none;">
              <button type="button" class="editor-menu-item" data-editor="${textareaId}" data-heading="h1">
                <span style="font-size: 16px; font-weight: 700;">Заголовок 1 (H1)</span>
              </button>
              <button type="button" class="editor-menu-item" data-editor="${textareaId}" data-heading="h2">
                <span style="font-size: 14px; font-weight: 600;">Заголовок 2 (H2)</span>
              </button>
              <button type="button" class="editor-menu-item" data-editor="${textareaId}" data-heading="h3">
                <span style="font-size: 12.5px; font-weight: 600;">Заголовок 3 (H3)</span>
              </button>
            </div>
          </div>

          <!-- Color Dropdown Trigger -->
          <div class="editor-dropdown-wrap">
            <button type="button" class="editor-tool-btn editor-dropdown-toggle" id="${textareaId}-color-btn" title="Цвет текста">
              ${ICONS.palette}
              <span class="editor-btn-caret">▾</span>
            </button>
            <div class="editor-dropdown-menu color-dropdown-menu" id="${textareaId}-color-menu" style="display: none;">
              <div class="color-dropdown-title">Выберите цвет текста:</div>
              <div class="color-palette-grid">
                <button type="button" class="color-swatch-btn" data-editor="${textareaId}" data-color="#FF1F36" style="background: #FF1F36;" title="Красный Phoenix"></button>
                <button type="button" class="color-swatch-btn" data-editor="${textareaId}" data-color="#FF8A00" style="background: #FF8A00;" title="Оранжевый"></button>
                <button type="button" class="color-swatch-btn" data-editor="${textareaId}" data-color="#F59E0B" style="background: #F59E0B;" title="Золотой"></button>
                <button type="button" class="color-swatch-btn" data-editor="${textareaId}" data-color="#10B981" style="background: #10B981;" title="Изумрудный"></button>
                <button type="button" class="color-swatch-btn" data-editor="${textareaId}" data-color="#0091FF" style="background: #0091FF;" title="Неоновый синий"></button>
                <button type="button" class="color-swatch-btn" data-editor="${textareaId}" data-color="#8B5CF6" style="background: #8B5CF6;" title="Фиолетовый"></button>
                <button type="button" class="color-swatch-btn" data-editor="${textareaId}" data-color="#FFFFFF" style="background: #FFFFFF;" title="Белый"></button>
                <button type="button" class="color-swatch-btn" data-editor="${textareaId}" data-color="#94A3B8" style="background: #94A3B8;" title="Стальной"></button>
              </div>
            </div>
          </div>
        </div>

        <div class="editor-toolbar-divider"></div>

        <!-- Group 3: Alignment & Structure -->
        <div class="editor-tool-group">
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="center" title="По центру">
            ${ICONS.alignCenter}
          </button>
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="right" title="По правому краю">
            ${ICONS.alignRight}
          </button>
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="bulletList" title="Маркированный список">
            ${ICONS.list}
          </button>
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="numberList" title="Нумерованный список">
            ${ICONS.listOrdered}
          </button>
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="quote" title="Цитата">
            ${ICONS.quote}
          </button>
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="spoiler" title="Спойлер (скрытый блок)">
            ${ICONS.spoiler}
          </button>
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="codeBlock" title="Блок кода">
            ${ICONS.code}
          </button>
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="divider" title="Разделительная линия">
            ${ICONS.minus}
          </button>
        </div>

        <div class="editor-toolbar-divider"></div>

        <!-- Group 4: Media, Links & Emojis -->
        <div class="editor-tool-group">
          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="link" title="Вставить ссылку">
            ${ICONS.link}
          </button>

          <!-- Image Upload / Link Trigger -->
          <div class="editor-dropdown-wrap">
            <button type="button" class="editor-tool-btn editor-dropdown-toggle" id="${textareaId}-img-btn" title="Изображения">
              ${ICONS.image}
              <span class="editor-tool-label">Фото</span>
              <span class="editor-btn-caret">▾</span>
            </button>
            <div class="editor-dropdown-menu" id="${textareaId}-img-menu" style="display: none; width: 170px;">
              <button type="button" class="editor-menu-item" id="${textareaId}-btn-upload-file">
                ${ICONS.upload} <span>Загрузить с ПК</span>
              </button>
              <button type="button" class="editor-menu-item" data-editor="${textareaId}" data-action="imgUrl">
                ${ICONS.link} <span>Вставить по URL</span>
              </button>
            </div>
            <input type="file" id="${textareaId}-file-input" accept="image/*" style="display: none;" />
          </div>

          <button type="button" class="editor-tool-btn" data-editor="${textareaId}" data-action="video" title="Вставить видео с YouTube">
            ${ICONS.video}
            <span class="editor-tool-label">Видео</span>
          </button>

          <!-- Emoji Picker Trigger -->
          <div class="editor-dropdown-wrap">
            <button type="button" class="editor-tool-btn editor-dropdown-toggle" id="${textareaId}-emoji-btn" title="Смайлики и эмодзи">
              ${ICONS.smile}
              <span class="editor-btn-caret">▾</span>
            </button>
            <div class="editor-dropdown-menu emoji-dropdown-menu" id="${textareaId}-emoji-menu" style="display: none;">
              <div class="emoji-picker-grid">
                ${['🔥', '👑', '⭐', '👍', '❤️', '🚗', '👮‍♂️', '💼', '💰', '😎', '⚠️', '🚨', '⚖️', '📋', '🔫', '🤝', '🛑', '💎', '⚡', '🎯', '🛡️', '💬', '📌', '🏆', '🎉', '❌', '✅', '🚀'].map(e => `
                  <button type="button" class="emoji-picker-item" data-editor="${textareaId}" data-emoji="${e}">${e}</button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- RP Templates Trigger -->
          <div class="editor-dropdown-wrap">
            <button type="button" class="editor-tool-btn editor-dropdown-toggle btn-tool-templates" id="${textareaId}-templates-btn" title="Быстрые RP-шаблоны и вердикты">
              ${ICONS.zap}
              <span class="editor-tool-label">Шаблоны</span>
              <span class="editor-btn-caret">▾</span>
            </button>
            <div class="editor-dropdown-menu templates-dropdown-menu" id="${textareaId}-templates-menu" style="display: none;">
              <div class="color-dropdown-title">Быстрые RP-шаблоны:</div>
              <button type="button" class="editor-menu-item rp-template-item" data-editor="${textareaId}" data-template="approved">
                <span class="template-dot green"></span>
                <div>
                  <strong>✔ Одобрено</strong>
                  <div class="template-desc">Положительный вердикт администрации</div>
                </div>
              </button>
              <button type="button" class="editor-menu-item rp-template-item" data-editor="${textareaId}" data-template="rejected">
                <span class="template-dot red"></span>
                <div>
                  <strong>✖ Отказано</strong>
                  <div class="template-desc">Отказ по регламенту или не по форме</div>
                </div>
              </button>
              <button type="button" class="editor-menu-item rp-template-item" data-editor="${textareaId}" data-template="pending">
                <span class="template-dot orange"></span>
                <div>
                  <strong>⏳ На рассмотрении</strong>
                  <div class="template-desc">Передано ответственному лицу</div>
                </div>
              </button>
              <button type="button" class="editor-menu-item rp-template-item" data-editor="${textareaId}" data-template="locked">
                <span class="template-dot gray"></span>
                <div>
                  <strong>🔒 Закрыто от оффтопа</strong>
                  <div class="template-desc">Временная блокировка ответов</div>
                </div>
              </button>
              <button type="button" class="editor-menu-item rp-template-item" data-editor="${textareaId}" data-template="rpForm">
                <span class="template-dot blue"></span>
                <div>
                  <strong>📋 Форма ответа RP</strong>
                  <div class="template-desc">Шаблон с пунктами и доказательствами</div>
                </div>
              </button>
            </div>
          </div>

        </div>

        <!-- Right Side: Preview Tabs & Clear -->
        <div class="editor-toolbar-right">
          <div class="editor-view-mode-tabs">
            <button type="button" class="editor-tab-btn active" id="${textareaId}-tab-write" title="Редактирование">
              <span>✏️ Редактор</span>
            </button>
            <button type="button" class="editor-tab-btn" id="${textareaId}-tab-preview" title="Живой предпросмотр">
              <span>👁 Предпросмотр</span>
            </button>
          </div>
          <button type="button" class="editor-tool-btn btn-clear-editor" id="${textareaId}-btn-clear" title="Очистить всё">
            ${ICONS.trash}
          </button>
        </div>

      </div>

      <!-- Editor Content Area -->
      <div class="editor-input-container" id="${textareaId}-container">
        <textarea 
          id="${textareaId}" 
          class="rich-editor-textarea" 
          placeholder="Напишите сообщение... (Поддерживается Markdown, BB-Коды, загрузка картинок перетаскиванием, спойлеры и видео)"
        >${initialContent}</textarea>

        <!-- Live Preview Area -->
        <div id="${textareaId}-preview" class="rich-editor-preview" style="display: none;"></div>

        <!-- Drag & Drop Overlay -->
        <div class="editor-drag-overlay" id="${textareaId}-drag-overlay" style="display: none;">
          ${ICONS.upload}
          <span>Отпустите изображение для моментальной загрузки в ответ</span>
        </div>
      </div>

      <!-- Editor Statusbar -->
      <div class="editor-statusbar">
        <div class="statusbar-tips">
          <span>💡 Markdown & BB-коды</span>
          <span class="statusbar-sep">•</span>
          <span>Перетащите фото в поле</span>
          <span class="statusbar-sep">•</span>
          <span><strong>Ctrl+Enter</strong> для отправки</span>
        </div>
        <div class="statusbar-counter" id="${textareaId}-counter">
          0 символов • 0 слов
        </div>
      </div>

    </div>
  `;
}

export function attachRichEditorEvents(textareaId = 'editor-content') {
  const textarea = document.getElementById(textareaId);
  const container = document.getElementById(`${textareaId}-container`);
  const preview = document.getElementById(`${textareaId}-preview`);
  const wrap = document.getElementById(`${textareaId}-wrap`);
  if (!textarea) return;

  // Insert or wrap text at cursor
  const insertText = (before, after = '', defaultText = '') => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const hasSelection = start !== end;
    const selected = textarea.value.substring(start, end) || defaultText;
    const replacement = before + selected + after;
    textarea.setRangeText(replacement, start, end, 'select');
    if (!hasSelection && defaultText) {
      textarea.setSelectionRange(start + before.length, start + before.length + defaultText.length);
    } else if (!hasSelection && !defaultText) {
      textarea.setSelectionRange(start + before.length, start + before.length);
    }
    textarea.focus();
    updateCounter();
  };

  // Update character and word counter
  const updateCounter = () => {
    const counter = document.getElementById(`${textareaId}-counter`);
    if (!counter) return;
    const val = textarea.value || '';
    const chars = val.length;
    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    counter.textContent = `${chars} ${chars === 1 ? 'символ' : (chars >= 2 && chars <= 4 ? 'символа' : 'символов')} • ${words} ${words === 1 ? 'слово' : (words >= 2 && words <= 4 ? 'слова' : 'слов')}`;
  };

  textarea.addEventListener('input', updateCounter);
  updateCounter();

  // Close all open dropdowns in editor
  const closeAllDropdowns = () => {
    document.querySelectorAll(`#${textareaId}-wrap .editor-dropdown-menu`).forEach(menu => {
      menu.style.display = 'none';
    });
  };

  // Toggle specific dropdown
  const setupDropdown = (btnId, menuId) => {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!btn || !menu) return;
    btn.onclick = (e) => {
      e.stopPropagation();
      const isOpen = menu.style.display === 'block';
      closeAllDropdowns();
      if (!isOpen) menu.style.display = 'block';
    };
  };

  setupDropdown(`${textareaId}-heading-btn`, `${textareaId}-heading-menu`);
  setupDropdown(`${textareaId}-color-btn`, `${textareaId}-color-menu`);
  setupDropdown(`${textareaId}-img-btn`, `${textareaId}-img-menu`);
  setupDropdown(`${textareaId}-emoji-btn`, `${textareaId}-emoji-menu`);
  setupDropdown(`${textareaId}-templates-btn`, `${textareaId}-templates-menu`);

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (wrap && !wrap.contains(e.target)) {
      closeAllDropdowns();
    }
  });

  // Action buttons
  document.querySelectorAll(`.editor-tool-btn[data-editor="${textareaId}"][data-action]`).forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      closeAllDropdowns();
      const action = btn.getAttribute('data-action');

      if (action === 'bold') insertText('**', '**', 'жирный текст');
      else if (action === 'italic') insertText('*', '*', 'курсив');
      else if (action === 'underline') insertText('[u]', '[/u]', 'подчеркнутый текст');
      else if (action === 'strikethrough') insertText('[s]', '[/s]', 'зачеркнутый текст');
      else if (action === 'center') insertText('\n[center]', '[/center]\n', 'Текст по центру');
      else if (action === 'right') insertText('\n[right]', '[/right]\n', 'Текст справа');
      else if (action === 'bulletList') insertText('\n- ', '\n', 'Пункт списка');
      else if (action === 'numberList') insertText('\n1. ', '\n', 'Первый пункт');
      else if (action === 'quote') insertText('\n> ', '\n', 'Текст цитаты');
      else if (action === 'codeBlock') insertText('\n```\n', '\n```\n', '// Вставьте код здесь');
      else if (action === 'divider') insertText('\n---\n', '');
      else if (action === 'spoiler') {
        const title = prompt('Укажите заголовок спойлера (или оставьте пустым):', 'Нажмите, чтобы прочитать');
        if (title !== null) {
          const t = title.trim() || 'Информация под спойлером';
          insertText(`\n[spoiler=${t}]\n`, '\n[/spoiler]\n', 'Скрытое содержимое спойлера (скриншоты, текст, ссылки)');
        }
      }
      else if (action === 'link') {
        const url = prompt('Введите ссылку (URL):', 'https://');
        if (url && url.trim()) {
          insertText('[', `](${url.trim()})`, 'Текст ссылки');
        }
      }
      else if (action === 'imgUrl') {
        const url = prompt('Введите прямую ссылку на изображение:', 'https://i.imgur.com/...');
        if (url && url.trim()) {
          insertText(`\n![Изображение](${url.trim()})\n`);
        }
      }
      else if (action === 'video') {
        const url = prompt('Вставьте ссылку на YouTube видео (например, https://youtube.com/watch?v=...):', 'https://youtu.be/');
        if (url && url.trim()) {
          insertText(`\n[video]${url.trim()}[/video]\n`);
        }
      }
    };
  });

  // Heading dropdown selection
  document.querySelectorAll(`.editor-menu-item[data-editor="${textareaId}"][data-heading]`).forEach(item => {
    item.onclick = (e) => {
      e.preventDefault();
      closeAllDropdowns();
      const h = item.getAttribute('data-heading');
      if (h === 'h1') insertText('\n# ', '\n', 'Заголовок первого уровня');
      else if (h === 'h2') insertText('\n## ', '\n', 'Заголовок второго уровня');
      else if (h === 'h3') insertText('\n### ', '\n', 'Заголовок третьего уровня');
    };
  });

  // Color palette selection
  document.querySelectorAll(`.color-swatch-btn[data-editor="${textareaId}"]`).forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      closeAllDropdowns();
      const color = btn.getAttribute('data-color');
      insertText(`[color=${color}]`, `[/color]`, 'Цветной текст');
    };
  });

  // Emoji picker click
  document.querySelectorAll(`.emoji-picker-item[data-editor="${textareaId}"]`).forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      closeAllDropdowns();
      const emoji = btn.getAttribute('data-emoji');
      insertText(emoji, '');
    };
  });

  // RP Templates selection
  document.querySelectorAll(`.rp-template-item[data-editor="${textareaId}"]`).forEach(item => {
    item.onclick = (e) => {
      e.preventDefault();
      closeAllDropdowns();
      const template = item.getAttribute('data-template');
      if (template === 'approved') {
        insertText(`\n[color=#10B981]**✔ ОДОБРЕНО.**[/color]\nВаше обращение успешно рассмотрено и одобрено руководством проекта Phoenix RP.\n`);
      } else if (template === 'rejected') {
        insertText(`\n[color=#FF1F36]**✖ ОТКАЗАНО.**[/color]\nВ обращении отказано по причине несоответствия установленным правилам подачи заявления.\n`);
      } else if (template === 'pending') {
        insertText(`\n[color=#F59E0B]**⏳ НА РАССМОТРЕНИИ.**[/color]\nОбращение принято в работу и находится на детальном рассмотрении. Ожидайте официального ответа ответственного лица.\n`);
      } else if (template === 'locked') {
        insertText(`\n[color=#94A3B8]**🔒 Тема закрыта от оффтопа до вынесения окончательного вердикта.**[/color]\n`);
      } else if (template === 'rpForm') {
        insertText(`\n**1. Ваш игровой никнейм:** Nick_Name\n**2. Ваша должность / фракция:** Государственные структуры / LSPD\n**3. Суть ответа / обращения:** Описание ситуации...\n**4. Доказательства:**\n[spoiler=Доказательства и скриншоты]\nВставьте ссылки на скриншоты или видео здесь\n[/spoiler]\n`);
      }
    };
  });

  // Image Upload File Button
  const uploadFileBtn = document.getElementById(`${textareaId}-btn-upload-file`);
  const fileInput = document.getElementById(`${textareaId}-file-input`);
  if (uploadFileBtn && fileInput) {
    uploadFileBtn.onclick = (e) => {
      e.preventDefault();
      closeAllDropdowns();
      fileInput.click();
    };

    fileInput.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        uploadFileBtn.disabled = true;
        uploadFileBtn.style.opacity = '0.5';
        const res = await api.upload.image(file);
        insertText(`\n![${file.name}](${res.url})\n`);
      } catch (err) {
        alert(err.message || 'Ошибка загрузки изображения');
      } finally {
        uploadFileBtn.disabled = false;
        uploadFileBtn.style.opacity = '1';
        fileInput.value = '';
      }
    };
  }

  // Drag & Drop Upload directly onto textarea
  const dragOverlay = document.getElementById(`${textareaId}-drag-overlay`);
  if (container && dragOverlay) {
    let dragCounter = 0;

    container.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      dragOverlay.style.display = 'flex';
    });

    container.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragOverlay.style.display = 'none';
        dragCounter = 0;
      }
    });

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    container.addEventListener('drop', async (e) => {
      e.preventDefault();
      dragOverlay.style.display = 'none';
      dragCounter = 0;

      const files = e.dataTransfer && e.dataTransfer.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, перетащите файл изображения (PNG, JPG, WEBP).');
        return;
      }

      try {
        const res = await api.upload.image(file);
        insertText(`\n![${file.name}](${res.url})\n`);
      } catch (err) {
        alert(err.message || 'Ошибка загрузки изображения');
      }
    });
  }

  // Preview Mode Tabs
  const tabWrite = document.getElementById(`${textareaId}-tab-write`);
  const tabPreview = document.getElementById(`${textareaId}-tab-preview`);
  if (tabWrite && tabPreview && preview) {
    tabWrite.onclick = () => {
      tabWrite.classList.add('active');
      tabPreview.classList.remove('active');
      textarea.style.display = 'block';
      preview.style.display = 'none';
      textarea.focus();
    };

    tabPreview.onclick = () => {
      tabPreview.classList.add('active');
      tabWrite.classList.remove('active');
      textarea.style.display = 'none';
      preview.style.display = 'block';
      const content = textarea.value.trim();
      if (!content) {
        preview.innerHTML = '<div class="preview-empty-notice">Текст сообщения пока пуст. Напишите что-нибудь во вкладке «Редактор»!</div>';
      } else {
        preview.innerHTML = formatPostContent(content);
      }
    };
  }

  // Clear Editor Button
  const btnClear = document.getElementById(`${textareaId}-btn-clear`);
  if (btnClear) {
    btnClear.onclick = () => {
      if (!textarea.value.trim()) return;
      if (confirm('Очистить текст сообщения?')) {
        textarea.value = '';
        updateCounter();
        textarea.focus();
      }
    };
  }

  // Keyboard Shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Enter)
  textarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B' || e.key === 'и' || e.key === 'И') {
        e.preventDefault();
        insertText('**', '**', 'жирный текст');
      } else if (e.key === 'i' || e.key === 'I' || e.key === 'ш' || e.key === 'Ш') {
        e.preventDefault();
        insertText('*', '*', 'курсив');
      } else if (e.key === 'u' || e.key === 'U' || e.key === 'г' || e.key === 'Г') {
        e.preventDefault();
        insertText('[u]', '[/u]', 'подчеркнутый текст');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Submit reply or thread
        const submitBtn = document.getElementById('btn-submit-reply') || document.getElementById('btn-submit-create-thread');
        if (submitBtn) submitBtn.click();
      }
    }
  });
}
