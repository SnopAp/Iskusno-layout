/**
 * Unified data model for Multi-Canvas Progress Document — Vertical Layout.
 */

export type CanvasObjectType = 'text' | 'image' | 'shape' | 'line';

export interface BaseCanvasObject {
  id: string;
  type: CanvasObjectType;
  locked?: boolean;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number; // in px
  color: string;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface TextCanvasObject extends BaseCanvasObject, TextStyle {
  type: 'text';
  markdown: string;
  // Map of checkboxId -> boolean for editor mode
  editorCheckboxState?: Record<string, boolean>;
}

export interface ImageCanvasObject extends BaseCanvasObject {
  type: 'image';
  storageId: string; // IndexedDB key
  dataUrl?: string; // Loaded blob / data url for fast rendering
  alt?: string;

  // Image Settings (Section 8)
  widthPercent: number; // 20 to 100% of container width (default 100)
  customHeight?: number; // optional custom height override in px
  rotation: number; // 0, 90, 180, 270 or custom angle in degrees
  flipHorizontal: boolean;
  flipVertical: boolean;
  objectFit: 'contain' | 'cover';
  allowDownload: boolean; // Section 8.4: default false
}

export type CanvasObject = TextCanvasObject | ImageCanvasObject;

export interface CanvasModel {
  id: string;
  title: string;
  completed?: boolean;
  objects: CanvasObject[];
}

export interface DocumentModel {
  id: string;
  canvasOrder: string[];
  globalTextStyle: TextStyle;
  canvases: Record<string, CanvasModel>;
}

/**
 * Separate Viewer Progress state (Section 5, 7, 13, 14)
 * Stores user completion states independently from editor states.
 */
export interface ViewerProgress {
  documentId: string;
  canvasCompletion: Record<string, boolean>; // canvasId -> completed
  checkboxStates: Record<string, boolean>; // checkboxKey (`${canvasId}:${objectId}:${boxIndex}`) -> checked
  collapsedCanvases: Record<string, boolean>; // canvasId -> collapsed
}

export type AppMode = 'edit' | 'preview';

// A4 Portrait logical dimension (210 × 297 mm, aspect ratio 1 : 1.414)
export const CANVAS_PORTRAIT_WIDTH = 800; // logical px
export const CANVAS_PORTRAIT_HEIGHT = 1131; // 800 * 1.4142

export const FONT_OPTIONS = [
  { label: 'Plus Jakarta Sans (Sans)', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Manrope (Modern Sans)', value: "'Manrope', sans-serif" },
  { label: 'Playfair Display (Editorial Serif)', value: "'Playfair Display', serif" },
  { label: 'Source Serif 4 (Classic Serif)', value: "'Source Serif 4', serif" },
  { label: 'JetBrains Mono (Monospace)', value: "'JetBrains Mono', monospace" },
  { label: 'System Sans', value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
];

export const DEFAULT_GLOBAL_TEXT_STYLE: TextStyle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 15,
  color: '#1e293b',
  fontWeight: 400,
  fontStyle: 'normal',
  lineHeight: 1.5,
  textAlign: 'left',
};

/** Demo SVG images to seed into IndexedDB */
export const DEMO_ARCH_SVG_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="700" height="400" viewBox="0 0 700 400"><defs><linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230f172a"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><rect width="700" height="400" rx="14" fill="url(%23bg1)"/><text x="40" y="48" fill="%23f8fafc" font-family="sans-serif" font-weight="700" font-size="18">Вертикальная архитектура A4 Portrait</text><text x="40" y="74" fill="%2394a3b8" font-family="sans-serif" font-size="12">Последовательная колонка · Мобильная адаптация · Вложенные чекбоксы</text><rect x="40" y="105" width="290" height="250" rx="10" fill="%231e293b" stroke="%2338bdf8" stroke-width="1.5"/><text x="60" y="135" fill="%2338bdf8" font-family="monospace" font-weight="700" font-size="13">Страница (A4 Portrait)</text><rect x="60" y="150" width="250" height="45" rx="6" fill="%23334155"/><text x="75" y="177" fill="%23f1f5f9" font-family="sans-serif" font-size="12">1. Текстовый блок (Markdown)</text><rect x="60" y="205" width="250" height="75" rx="6" fill="%230284c7" fill-opacity="0.25" stroke="%2338bdf8" stroke-dasharray="3 3"/><text x="75" y="247" fill="%23bae6fd" font-family="sans-serif" font-size="12">2. Изображение (Ширина, поворот)</text><rect x="60" y="290" width="250" height="45" rx="6" fill="%23334155"/><text x="75" y="317" fill="%23f1f5f9" font-family="sans-serif" font-size="12">3. Список задач (Task List)</text><rect x="360" y="105" width="300" height="250" rx="10" fill="%231e293b" stroke="%2334d399" stroke-width="1.5"/><text x="380" y="135" fill="%2334d399" font-family="monospace" font-weight="700" font-size="13">Логика выполнения</text><text x="380" y="170" fill="%23e2e8f0" font-family="sans-serif" font-size="12">✓ Чекбоксы внутри блока: последовательно</text><text x="380" y="205" fill="%23e2e8f0" font-family="sans-serif" font-size="12">✓ Все чекбоксы страницы отмечены:</text><text x="400" y="230" fill="%2334d399" font-family="sans-serif" font-weight="600" font-size="12">→ Страница выполнена и сворачивается</text><text x="380" y="270" fill="%23e2e8f0" font-family="sans-serif" font-size="12">✓ Независимое состояние: Редактор / Просмотр</text><text x="380" y="305" fill="%23e2e8f0" font-family="sans-serif" font-size="12">✓ Скачивание фото: контролируется автором</text></svg>`;

export const DEMO_CHART_SVG_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%2338bdf8"/><stop offset="100%" stop-color="%230284c7"/></linearGradient></defs><rect width="600" height="360" rx="14" fill="url(%23grad)"/><text x="40" y="50" fill="%23f8fafc" font-family="sans-serif" font-weight="700" font-size="18">Показатели многостраничного документа</text><text x="40" y="76" fill="%2394a3b8" font-family="sans-serif" font-size="12">Сравнение форматов компоновки и выполнения задач</text><line x1="40" y1="290" x2="560" y2="290" stroke="%23334155" stroke-width="1.5"/><rect x="80" y="140" width="48" height="150" rx="4" fill="url(%23barGrad)"/><text x="94" y="125" fill="%2338bdf8" font-family="monospace" font-size="12">84%</text><text x="82" y="315" fill="%2394a3b8" font-family="sans-serif" font-size="12">Чтение</text><rect x="175" y="105" width="48" height="185" rx="4" fill="url(%23barGrad)"/><text x="189" y="90" fill="%2338bdf8" font-family="monospace" font-size="12">95%</text><text x="168" y="315" fill="%2394a3b8" font-family="sans-serif" font-size="12">Mobile UX</text><rect x="270" y="150" width="48" height="140" rx="4" fill="url(%23barGrad)"/><text x="284" y="135" fill="%2338bdf8" font-family="monospace" font-size="12">78%</text><text x="268" y="315" fill="%2394a3b8" font-family="sans-serif" font-size="12">Порядок</text><rect x="365" y="120" width="48" height="170" rx="4" fill="url(%23barGrad)"/><text x="379" y="105" fill="%2338bdf8" font-family="monospace" font-size="12">91%</text><text x="365" y="315" fill="%2394a3b8" font-family="sans-serif" font-size="12">Прогресс</text><rect x="460" y="80" width="48" height="210" rx="4" fill="%2310b981"/><text x="474" y="65" fill="%2334d399" font-family="monospace" font-size="12">100%</text><text x="464" y="315" fill="%2394a3b8" font-family="sans-serif" font-size="12">Финал</text></svg>`;

export const DEMO_WORKFLOW_SVG_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" rx="14" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="2"/><text x="32" y="44" fill="%230f172a" font-family="sans-serif" font-weight="700" font-size="16">Последовательное выполнение задач внутри блока</text><text x="32" y="68" fill="%2364748b" font-family="sans-serif" font-size="12">Отметка строки 3 автоматически завершает строки 1 и 2</text><rect x="32" y="95" width="536" height="42" rx="6" fill="%23ecfdf5" stroke="%2310b981"/><text x="48" y="121" fill="%23065f46" font-family="sans-serif" font-weight="600" font-size="13">[x] 1. Подготовить материалы и структуру</text><rect x="32" y="145" width="536" height="42" rx="6" fill="%23ecfdf5" stroke="%2310b981"/><text x="48" y="171" fill="%23065f46" font-family="sans-serif" font-weight="600" font-size="13">[x] 2. Настроить параметры изображений (поворот, отражение)</text><rect x="32" y="195" width="536" height="42" rx="6" fill="%23eff6ff" stroke="%232563eb"/><text x="48" y="221" fill="%231e40af" font-family="sans-serif" font-weight="600" font-size="13">[x] 3. Проверить работу мобильной адаптации (клик тут)</text><rect x="32" y="245" width="536" height="42" rx="6" fill="%23ffffff" stroke="%23cbd5e1"/><text x="48" y="271" fill="%2364748b" font-family="sans-serif" font-size="13">[ ] 4. Завершить оформление и протестировать скачивание</text></svg>`;

export function createInitialDemoDocument(): DocumentModel {
  const c1 = 'canvas-demo-1';
  const c2 = 'canvas-demo-2';
  const c3 = 'canvas-demo-3';
  const c4 = 'canvas-demo-4';

  return {
    id: 'doc-multi-canvas-demo',
    canvasOrder: [c1, c2, c3, c4],
    globalTextStyle: { ...DEFAULT_GLOBAL_TEXT_STYLE },
    canvases: {
      [c1]: {
        id: c1,
        title: 'Введение',
        completed: false,
        objects: [
          {
            id: 'c1-text-1',
            type: 'text',
            markdown: `# Multi-Canvas Progress Document\nДокумент формата **A4 Portrait (210 × 297 мм)** с последовательной вертикальной компоновкой элементов, интерактивными чекбоксами и разделением режимов.`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            fontStyle: 'normal',
            color: '#0f172a',
            lineHeight: 1.35,
            textAlign: 'left',
          },
          {
            id: 'c1-img-1',
            type: 'image',
            storageId: 'demo-arch-img-1',
            dataUrl: DEMO_ARCH_SVG_DATA_URL,
            alt: 'Вертикальная архитектура документа',
            widthPercent: 100,
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
            objectFit: 'cover',
            allowDownload: true, // Продемонстрируем разрешенное скачивание
          },
          {
            id: 'c1-text-tasks',
            type: 'text',
            markdown: `### Задачи начального этапа\n\nОтметьте чекбоксы в списке ниже. Обратите внимание: чекбоксы выполняются строго последовательно сверху вниз!\n\n- [ ] Изучить вертикальную компоновку элементов\n- [ ] Проверить пропорции страницы A4 Portrait\n- [ ] Убедиться в отсутствии горизонтальной прокрутки`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 15,
            fontWeight: 400,
            fontStyle: 'normal',
            color: '#1e293b',
            lineHeight: 1.55,
            textAlign: 'left',
            editorCheckboxState: {
              box_0: true, // В редакторе может быть отмечено, но в просмотре начнется с неотмеченного!
            },
          },
          {
            id: 'c1-text-quote',
            type: 'text',
            markdown: `> «Вертикальная компоновка делает чтение удобным на любых экранах, исключая горизонтальную прокрутку и хаос свободных координат.»`,
            fontFamily: "'Source Serif 4', serif",
            fontSize: 15,
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#475569',
            lineHeight: 1.5,
            textAlign: 'left',
          },
        ],
      },
      [c2]: {
        id: c2,
        title: 'Основная информация',
        completed: false,
        objects: [
          {
            id: 'c2-text-title',
            type: 'text',
            markdown: `## Таблица возможностей и настройки изображений\nВсе элементы страницы располагаются в одну вертикальную колонку сверху вниз.`,
            fontFamily: "'Manrope', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            fontStyle: 'normal',
            color: '#0f172a',
            lineHeight: 1.3,
            textAlign: 'left',
          },
          {
            id: 'c2-img-chart',
            type: 'image',
            storageId: 'demo-chart-img-1',
            dataUrl: DEMO_CHART_SVG_DATA_URL,
            alt: 'График показателей',
            widthPercent: 90,
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
            objectFit: 'contain',
            allowDownload: false, // Запрещено скачивание
          },
          {
            id: 'c2-text-table',
            type: 'text',
            markdown: `### Сравнение режимов редактора и просмотра\n\n| Свойство | Режим редактора | Режим просмотра |\n| :--- | :--- | :--- |\n| **Чекбокс страницы** | Скрыт как активный чекбокс | Индикатор выполнения и сворачивания |\n| **Чекбоксы задач** | Авторское наполнение | Независимый пользовательский прогресс |\n| **Сворачивание** | Полный доступ к блокам | Авто-сворачивание выполненных страниц |\n| **Скачивание фото** | Доступно автору | Доступно только при разрешении автором |\n\n*Таблицы полностью поддерживаются Markdown GFM.*`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            fontStyle: 'normal',
            color: '#1e293b',
            lineHeight: 1.5,
            textAlign: 'left',
          },
          {
            id: 'c2-text-tasks',
            type: 'text',
            markdown: `### Чек-лист проверки страницы №2\n\n- [ ] Протестировать изменение порядка элементов через список свойств\n- [ ] Проверить поворот изображения на 90 градусов\n- [ ] Проверить отражение по горизонтали и вертикали`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            fontStyle: 'normal',
            color: '#1e293b',
            lineHeight: 1.5,
            textAlign: 'left',
          },
        ],
      },
      [c3]: {
        id: c3,
        title: 'Детализация',
        completed: false,
        objects: [
          {
            id: 'c3-text-title',
            type: 'text',
            markdown: `## Последовательное выполнение и авто-сворачивание\nКак чекбоксы задач управляют состоянием страницы и документа.`,
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            fontWeight: 700,
            fontStyle: 'normal',
            color: '#0f172a',
            lineHeight: 1.3,
            textAlign: 'left',
          },
          {
            id: 'c3-img-workflow',
            type: 'image',
            storageId: 'demo-workflow-img-1',
            dataUrl: DEMO_WORKFLOW_SVG_DATA_URL,
            alt: 'Схема последовательного контроля',
            widthPercent: 100,
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
            objectFit: 'contain',
            allowDownload: true, // Разрешено скачивание
          },
          {
            id: 'c3-text-tasks',
            type: 'text',
            markdown: `### Задачи детальной настройки\n\nВыполните все пункты списка ниже в режиме просмотра:\n\n- [ ] Отметить пункт 1 в текущем списке\n- [ ] Отметить пункт 2 в текущем списке\n- [ ] Отметить пункт 3 и увидеть автоматическое сворачивание страницы`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            fontStyle: 'normal',
            color: '#1e293b',
            lineHeight: 1.55,
            textAlign: 'left',
          },
          {
            id: 'c3-text-expl',
            type: 'text',
            markdown: `Когда все задачи страницы отмечены:\n- Заголовок страницы становится серым и зачёркнутым.\n- Чекбокс страницы автоматически отмечается.\n- Страница автоматически сворачивается в компактный заголовочный блок. При необходимости её можно развернуть вручную!`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            fontStyle: 'normal',
            color: '#475569',
            lineHeight: 1.5,
            textAlign: 'left',
          },
        ],
      },
      [c4]: {
        id: c4,
        title: 'Завершение',
        completed: false,
        objects: [
          {
            id: 'c4-text-title',
            type: 'text',
            markdown: `# Итоговая проверка документа\nВсе требования технического задания по вертикальной структуре и интерактивности.`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            fontStyle: 'normal',
            color: '#0f172a',
            lineHeight: 1.35,
            textAlign: 'left',
          },
          {
            id: 'c4-text-tasks',
            type: 'text',
            markdown: `### Финальный чек-лист готовности документа\n\n- [ ] Страницы отображаются в книжной ориентации A4 Portrait\n- [ ] На смартфонах и планшетах отсутствует горизонтальная прокрутка\n- [ ] Состояния чекбоксов редактора не влияют на режим просмотра\n- [ ] Изображения поддерживают масштабирование, поворот и защиту от скачивания\n- [ ] Порядок элементов страницы легко меняется через список в боковой панели`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            fontStyle: 'normal',
            color: '#1e293b',
            lineHeight: 1.55,
            textAlign: 'left',
          },
          {
            id: 'c4-text-footer',
            type: 'text',
            markdown: `Все изменения сохраняются в локальном хранилище браузера (метаданные — в \`localStorage\`, а изображения — в \`IndexedDB\`). Вы можете обновить страницу в любой момент без потери данных.`,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 400,
            fontStyle: 'normal',
            color: '#64748b',
            lineHeight: 1.5,
            textAlign: 'left',
          },
        ],
      },
    },
  };
}
