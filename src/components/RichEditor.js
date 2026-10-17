// Phoenix RP Forum - Rich Post Editor Component
import { ICONS } from '../utils/icons.js';
import { api } from '../api/client.js';

export function renderRichEditor(textareaId = 'editor-content', initialContent = '') {
  return `
    <div class="rich-editor-wrap">
      <div class="rich-editor-toolbar">
        <button type="button" class="editor-tool-btn" data-action="bold" title="Жирный (**текст**)">
          ${ICONS.bold}
        </button>
        <button type="button" class="editor-tool-btn" data-action="italic" title="Курсив (*текст*)">
          ${ICONS.italic}
        </button>
        <button type="button" class="editor-tool-btn" data-action="link" title="Ссылка ([текст](url))">
          ${ICONS.link}
        </button>
        <button type="button" class="editor-tool-btn" data-action="quote" title="Цитата (> цитата)">
          ${ICONS.quote}
        </button>
        <button type="button" class="editor-tool-btn" data-action="code" title="Код (\`\`\`код\`\`\`)">
          ${ICONS.code}
        </button>

        <div class="editor-toolbar-divider"></div>

        <button type="button" class="editor-tool-btn" id="btn-editor-upload-img" title="Загрузить изображение">
          ${ICONS.image}
          <span style="font-size: 11px; margin-left: 4px;">Фото</span>
        </button>
        <input type="file" id="editor-file-input" accept="image/*" style="display: none;" />
      </div>

      <textarea 
        id="${textareaId}" 
        class="rich-editor-textarea" 
        placeholder="Напишите сообщение... (Поддерживается Markdown: **жирный**, *курсив*, [ссылки](url), > цитаты, списки)"
      >${initialContent}</textarea>
    </div>
  `;
}

export function attachRichEditorEvents(textareaId = 'editor-content') {
  const textarea = document.getElementById(textareaId);
  if (!textarea) return;

  const insertText = (before, after = '') => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || 'текст';
    const replacement = before + selected + after;
    textarea.setRangeText(replacement, start, end, 'select');
    textarea.focus();
  };

  document.querySelectorAll('.editor-tool-btn[data-action]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const action = btn.getAttribute('data-action');
      if (action === 'bold') insertText('**', '**');
      else if (action === 'italic') insertText('*', '*');
      else if (action === 'link') {
        const url = prompt('Введите ссылку (URL):', 'https://');
        if (url) insertText('[', `](${url})`);
      }
      else if (action === 'quote') insertText('\n> ', '\n');
      else if (action === 'code') insertText('\n```\n', '\n```\n');
    };
  });

  // Image Upload Button
  const uploadBtn = document.getElementById('btn-editor-upload-img');
  const fileInput = document.getElementById('editor-file-input');
  if (uploadBtn && fileInput) {
    uploadBtn.onclick = (e) => {
      e.preventDefault();
      fileInput.click();
    };

    fileInput.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        uploadBtn.disabled = true;
        uploadBtn.style.opacity = '0.5';
        const res = await api.upload.image(file);
        insertText(`\n![${file.name}](${res.url})\n`);
      } catch (err) {
        alert(err.message || 'Ошибка загрузки изображения');
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.style.opacity = '1';
        fileInput.value = '';
      }
    };
  }
}
