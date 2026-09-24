document.addEventListener('DOMContentLoaded', function() {

  const API_URL = 'http://localhost:2350/tasks';

  const taskForm = document.querySelector('#task-form');
  const taskList = document.querySelector('#task-list');
  const alertBox = document.querySelector('#alert-box');

  let allTasks = [];
  let editingId = null;

  function escapeHTML(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function todayISO() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
  }

  function formatDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  function isOverdue(task) {
    return !task.done && task.dueDate < todayISO();
  }

  function showAlert(message, type = 'danger') {
    alertBox.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${escapeHTML(message)}
        <button type="button" class="close" data-dismiss="alert">&times;</button>
      </div>
    `;
  }

  function handleError(error) {
    console.error(error);
    if (error instanceof TypeError) {
      showAlert('Não foi possível conectar à API. Ela está rodando? Use "npm run api" (porta 2350).');
    } else {
      showAlert(`Algo deu errado: ${error.message}`);
    }
  }

  function request(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json' }
    }).then(response => {
      if (!response.ok) {
        throw new Error(`O servidor respondeu com erro ${response.status}`);
      }
      return response.json();
    });
  }

  function renderTaskCard(task, isEditing) {
    const id = escapeHTML(task.id);
    const overdue = isOverdue(task);
    const cardClass = task.done ? 'done' : (overdue ? 'overdue' : '');

    return `
      <div class="col-sm-6 col-xl-4 mb-4">
        <div class="card task-card h-100 shadow-sm ${cardClass}">
          <div class="card-body">
            <span class="badge badge-primary mb-2">${escapeHTML(task.subject)}</span>
            <h5 class="card-title task-title font-weight-bold text-dark">${escapeHTML(task.title)}</h5>
            <p class="card-text text-muted small">${escapeHTML(task.description || '')}</p>
            <p class="card-text text-muted small mb-0">Entrega: ${formatDate(task.dueDate)}</p>
          </div>
          <div class="card-footer bg-transparent border-top-0 d-flex flex-wrap justify-content-end align-items-center px-3 pb-3">
            <button class="btn btn-sm ${task.done ? 'btn-success' : 'btn-outline-success'} mr-1" data-action="toggle" data-id="${id}"
              title="${task.done ? 'Marcar como pendente' : 'Marcar como concluída'}">${task.done ? 'Concluída' : 'Concluir'}</button>
            <button class="btn btn-sm btn-outline-secondary mr-1" data-action="edit" data-id="${id}" ${isEditing ? 'disabled' : ''}>Editar</button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${id}">Excluir</button>
          </div>
          ${isEditing ? renderEditForm(task) : ''}
        </div>
      </div>
    `;
  }

  function renderEditForm(task) {
    return `
      <form class="edit-form border-top pt-3 mx-3 mb-3" data-id="${escapeHTML(task.id)}">
        <div class="form-group mb-2">
          <input required class="form-control form-control-sm" name="title" value="${escapeHTML(task.title)}" placeholder="Tarefa">
        </div>
        <div class="form-group mb-2">
          <input required class="form-control form-control-sm" name="subject" value="${escapeHTML(task.subject)}" placeholder="Matéria">
        </div>
        <div class="form-group mb-2">
          <input required type="date" class="form-control form-control-sm" name="dueDate" value="${escapeHTML(task.dueDate)}">
        </div>
        <div class="form-group mb-2">
          <textarea required class="form-control form-control-sm" name="description" rows="2" placeholder="Descrição">${escapeHTML(task.description || '')}</textarea>
        </div>
        <button type="submit" class="btn btn-sm btn-success btn-block">Salvar Alterações</button>
        <button type="button" class="btn btn-sm btn-light btn-block" data-action="cancel">Cancelar</button>
      </form>
    `;
  }

  function render() {
    const sortedTasks = [...allTasks]
      .sort((a, b) => (a.done - b.done) || a.dueDate.localeCompare(b.dueDate));

    if (allTasks.length === 0) {
      taskList.innerHTML = '<p class="col-12 text-center text-muted py-5">Nenhuma tarefa ainda. Adicione a primeira!</p>';
      return;
    }

    taskList.innerHTML = sortedTasks
      .map(task => renderTaskCard(task, String(task.id) === editingId))
      .join('');
  }

  function findTask(id) {
    return allTasks.find(task => String(task.id) === id);
  }

  request(API_URL)
    .then(tasks => {
      allTasks = tasks;
      render();
    })
    .catch(error => {
      taskList.innerHTML = '<p class="col-12 text-center text-muted py-5">Não foi possível carregar as tarefas.</p>';
      handleError(error);
    });

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitButton = taskForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    request(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        title: taskForm.elements.title.value.trim(),
        subject: taskForm.elements.subject.value.trim(),
        dueDate: taskForm.elements.dueDate.value,
        description: taskForm.elements.description.value.trim(),
        done: false
      })
    })
      .then(newTask => {
        allTasks.push(newTask);
        taskForm.reset();
        render();
      })
      .catch(handleError)
      .finally(() => { submitButton.disabled = false; });
  });

  taskList.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;

    if (action === 'toggle') {
      const task = findTask(id);
      request(`${API_URL}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ done: !task.done })
      })
        .then(updatedTask => {
          Object.assign(task, updatedTask);
          render();
        })
        .catch(error => {
          render();
          handleError(error);
        });

    } else if (action === 'edit') {
      editingId = id;
      render();

    } else if (action === 'cancel') {
      editingId = null;
      render();

    } else if (action === 'delete') {
      const task = findTask(id);
      if (!confirm(`Excluir a tarefa "${task.title}"?`)) return;

      request(`${API_URL}/${id}`, { method: 'DELETE' })
        .then(() => {
          allTasks = allTasks.filter(t => String(t.id) !== id);
          render();
        })
        .catch(handleError);
    }
  });

  taskList.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const id = form.dataset.id;

    request(`${API_URL}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: form.elements.title.value.trim(),
        subject: form.elements.subject.value.trim(),
        dueDate: form.elements.dueDate.value,
        description: form.elements.description.value.trim()
      })
    })
      .then(updatedTask => {
        Object.assign(findTask(id), updatedTask);
        editingId = null;
        render();
      })
      .catch(handleError);
  });

});
