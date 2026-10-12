
/* Busca tarefas do arquivo público db.json */
fetch('db.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Não foi possível carregar as tarefas.');
    }
    return response.json();
  })
  .then(data => {
    document.getElementById('db-status').textContent = data.status;

    const list = document.getElementById('task-list');
    list.replaceChildren();

    data.itens.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.task;
      list.appendChild(li);
    });
  })
  .catch(() => {
    document.getElementById('db-status').textContent =
      'Não foi possível carregar as tarefas.';
  });

/* Adiciona uma nova tarefa à tela */
function addTask() {
  const input = document.getElementById('new-task');
  const output = document.getElementById('task-list');
  const task = input.value.trim();

  if (!task) {
    return;
  }

  const li = document.createElement('li');
  li.textContent = task;

  output.appendChild(li);

  console.log('Tarefa adicionada:', task);

  input.value = '';
}
