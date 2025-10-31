const STORAGE_KEY = 'lab2_todos_v1';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}
function formatDateInputValue(value) {
  if (!value) return '';
  return value;
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Не удалось загрузить задачи из localStorage', e);
    return [];
  }
}
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

let tasks = loadTasks();
let currentFilter = 'all'; 
let currentSort = 'none'; 
let currentSearch = '';

function injectStyles() {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.textContent = `
    :root{font-family: Inter, system-ui, sans-serif;color:#111;}
    body{margin:0;padding:16px;background:#f6f7fb}
    .container{max-width:900px;margin:0 auto;background:#fff;padding:18px;border-radius:10px;box-shadow:0 6px 20px rgba(10,10,20,0.06)}
    header{display:flex;flex-direction:column;gap:12px}
    .title{font-size:20px;font-weight:600}
    .controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .input-text{padding:8px 10px;border-radius:6px;border:1px solid #ccd;min-width:200px}
    .input-date{padding:8px;border-radius:6px;border:1px solid #ccd}
    .btn{padding:8px 10px;border-radius:6px;border:0;background:#2b6cb0;color:#fff;cursor:pointer}
    .btn.secondary{background:#718096}
    .btn.ghost{background:transparent;border:1px solid #cbd5e0;color:#1a202c}
    .filters{display:flex;gap:6px}
    .task-list{list-style:none;padding:0;margin-top:14px;display:flex;flex-direction:column;gap:8px}
    .task-item{display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;border:1px solid #eef;background:#fff}
    .task-item.completed{opacity:0.7;text-decoration:line-through}
    .task-content{flex:1;display:flex;flex-direction:column}
    .task-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
    .task-title{font-weight:500}
    .task-date{font-size:12px;color:#556}
    .task-actions{display:flex;gap:6px}
    .drag-handle{cursor:grab;padding:6px;border-radius:6px;border:1px dashed #ccd}
    @media (max-width:600px){ .controls{flex-direction:column;align-items:stretch} .input-text{width:100%} }
  `;
  document.head.appendChild(style);
}

function buildUI() {
  const container = document.createElement('div');
  container.className = 'container';

  const header = document.createElement('header');

  const title = document.createElement('h1');
  title.className = 'title';
  title.textContent = 'Лабораторная 2 — ToDo List (создано через DOM)';

  const controls = document.createElement('div');
  controls.className = 'controls';

  const inputTitle = document.createElement('input');
  inputTitle.className = 'input-text';
  inputTitle.type = 'text';
  inputTitle.placeholder = 'Название задачи';
  inputTitle.id = 'input-title';

  const inputDate = document.createElement('input');
  inputDate.className = 'input-date';
  inputDate.type = 'date';
  inputDate.id = 'input-date';

  const addButton = document.createElement('button');
  addButton.className = 'btn';
  addButton.type = 'button';
  addButton.textContent = 'Добавить задачу';

  const searchInput = document.createElement('input');
  searchInput.className = 'input-text';
  searchInput.type = 'search';
  searchInput.placeholder = 'Поиск по названию';
  searchInput.style.minWidth = '160px';

  const sortButton = document.createElement('button');
  sortButton.className = 'btn secondary';
  sortButton.type = 'button';
  sortButton.textContent = 'Сортировать по дате';

  const filtersWrap = document.createElement('div');
  filtersWrap.className = 'filters';

  const btnAll = document.createElement('button');
  btnAll.className = 'btn ghost';
  btnAll.type = 'button';
  btnAll.textContent = 'Все';

  const btnActive = document.createElement('button');
  btnActive.className = 'btn ghost';
  btnActive.type = 'button';
  btnActive.textContent = 'Активные';

  const btnCompleted = document.createElement('button');
  btnCompleted.className = 'btn ghost';
  btnCompleted.type = 'button';
  btnCompleted.textContent = 'Выполненные';

  const tasksList = document.createElement('ul');
  tasksList.className = 'task-list';
  tasksList.id = 'tasks-list';

  filtersWrap.appendChild(btnAll);
  filtersWrap.appendChild(btnActive);
  filtersWrap.appendChild(btnCompleted);

  controls.appendChild(inputTitle);
  controls.appendChild(inputDate);
  controls.appendChild(addButton);
  controls.appendChild(searchInput);
  controls.appendChild(sortButton);
  controls.appendChild(filtersWrap);

  header.appendChild(title);
  header.appendChild(controls);

  container.appendChild(header);
  container.appendChild(tasksList);

  document.body.appendChild(container);

  return {
    inputTitle,
    inputDate,
    addButton,
    searchInput,
    sortButton,
    btnAll,
    btnActive,
    btnCompleted,
    tasksList
  };
}

function createTaskElement(task, index) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.draggable = true;
  li.dataset.id = task.id;
  li.dataset.index = index;

  if (task.completed) li.classList.add('completed');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', 'Отметить как выполненное');

  const content = document.createElement('div');
  content.className = 'task-content';

  const top = document.createElement('div');
  top.className = 'task-top';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'task-title';
  titleSpan.textContent = task.title || '(без названия)';

  const dateSpan = document.createElement('span');
  dateSpan.className = 'task-date';
  dateSpan.textContent = task.date ? task.date : '';

  top.appendChild(titleSpan);
  top.appendChild(dateSpan);

  content.appendChild(top);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn ghost';
  editBtn.type = 'button';
  editBtn.textContent = 'Редактировать';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn ghost';
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Удалить';

  const dragHandle = document.createElement('div');
  dragHandle.className = 'drag-handle';
  dragHandle.textContent = '☰';
  dragHandle.title = 'Перетащите для изменения порядка';

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  actions.appendChild(dragHandle);

  li.appendChild(checkbox);
  li.appendChild(content);
  li.appendChild(actions);

  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    if (task.completed) li.classList.add('completed'); else li.classList.remove('completed');
    persistAndRerender();
  });

  deleteBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => t.id !== task.id);
    persistAndRerender();
  });

  editBtn.addEventListener('click', () => {
    openEditMode(li, task);
  });

  li.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    li.classList.add('dragging');
  });
  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
  });

  return li;
}


function openEditMode(liElement, task) {
  const content = liElement.querySelector('.task-content');
  while (content.firstChild) content.removeChild(content.firstChild);

  const inputTitleEdit = document.createElement('input');
  inputTitleEdit.type = 'text';
  inputTitleEdit.className = 'input-text';
  inputTitleEdit.value = task.title || '';

  const inputDateEdit = document.createElement('input');
  inputDateEdit.type = 'date';
  inputDateEdit.className = 'input-date';
  inputDateEdit.value = task.date || '';

  const actionsRow = document.createElement('div');
  actionsRow.style.marginTop = '8px';
  actionsRow.style.display = 'flex';
  actionsRow.style.gap = '8px';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.type = 'button';
  saveBtn.textContent = 'Сохранить';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn ghost';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Отмена';

  actionsRow.appendChild(saveBtn);
  actionsRow.appendChild(cancelBtn);

  content.appendChild(inputTitleEdit);
  content.appendChild(inputDateEdit);
  content.appendChild(actionsRow);

  saveBtn.addEventListener('click', () => {
    task.title = inputTitleEdit.value.trim();
    task.date = inputDateEdit.value || '';
    persistAndRerender();
  });

  cancelBtn.addEventListener('click', () => {
    renderTasks();
  });
}

function enableDragAndDrop(listElement) {
  listElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = listElement.querySelector('.dragging');
    const afterElement = getDragAfterElement(listElement, e.clientY);
    if (afterElement == null) {
      listElement.appendChild(dragging);
    } else {
      listElement.insertBefore(dragging, afterElement);
    }
  });

  listElement.addEventListener('drop', (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const newOrder = Array.from(listElement.children).map(li => li.dataset.id);
    tasks = newOrder.map(id => tasks.find(t => t.id === id)).filter(Boolean);
    persistAndRerender();
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > (closest.offset || -Infinity)) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: -Infinity }).element;
}

function applySearchFilterSort(items) {
  let copy = items.slice();

  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    copy = copy.filter(t => (t.title || '').toLowerCase().includes(q));
  }

  if (currentFilter === 'active') copy = copy.filter(t => !t.completed);
  if (currentFilter === 'completed') copy = copy.filter(t => t.completed);

  if (currentSort === 'asc') {
    copy.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  } else if (currentSort === 'desc') {
    copy.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  }

  return copy;
}

function renderTasks() {
  const listElement = document.getElementById('tasks-list');
  while (listElement.firstChild) listElement.removeChild(listElement.firstChild);

  const visibleTasks = applySearchFilterSort(tasks);

  visibleTasks.forEach((task, idx) => {
    const li = createTaskElement(task, idx);
    listElement.appendChild(li);
  });
}

function persistAndRerender() {
  saveTasks(tasks);
  renderTasks();
}

function initApp() {
  injectStyles();
  const ui = buildUI();

  renderTasks();
  enableDragAndDrop(ui.tasksList);

  ui.addButton.addEventListener('click', () => {
    const title = ui.inputTitle.value.trim();
    const date = ui.inputDate.value || '';
    if (!title && !date) {
    }
    const newTask = { id: uid(), title, date, completed: false };
    tasks.push(newTask);
    ui.inputTitle.value = '';
    ui.inputDate.value = '';
    persistAndRerender();
  });

  ui.searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value || '';
    renderTasks();
  });

  ui.sortButton.addEventListener('click', () => {
    if (currentSort === 'none') currentSort = 'asc';
    else if (currentSort === 'asc') currentSort = 'desc';
    else currentSort = 'none';

    ui.sortButton.textContent = currentSort === 'none' ? 'Сортировать по дате' : (currentSort === 'asc' ? 'Сортировка: по возр.' : 'Сортировка: по убыв.');
    renderTasks();
  });

  ui.btnAll.addEventListener('click', () => {
    currentFilter = 'all';
    renderTasks();
  });
  ui.btnActive.addEventListener('click', () => {
    currentFilter = 'active';
    renderTasks();
  });
  ui.btnCompleted.addEventListener('click', () => {
    currentFilter = 'completed';
    renderTasks();
  });

  ui.inputTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ui.addButton.click();
  });

  ui.sortButton.textContent = 'Сортировать по дате';
}

document.addEventListener('DOMContentLoaded', initApp);
