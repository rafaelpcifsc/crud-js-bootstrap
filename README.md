# Controle de Tarefas

Um CRUD de tarefas escolares feito com **HTML, Bootstrap 4, JavaScript puro** e **json-server** como API simulada.

## Funcionalidades (CRUD)

* **[C]reate:** formulário para cadastrar uma tarefa com título, matéria, data de entrega e descrição (`POST`).
* **[R]ead:** lista das tarefas, com as pendentes primeiro e ordenadas pela data de entrega (`GET`).
* **[U]pdate:** marcar como concluída pelo botão "Concluir" e editar a tarefa dentro do próprio card (`PATCH`).
* **[D]elete:** excluir com confirmação; o card só sai da tela depois que o servidor confirma (`DELETE`).

### Extras
* Destaque em vermelho para tarefas atrasadas
* Proteção contra XSS (o texto digitado é "escapado" antes de ir para o HTML)
* Mensagem de erro amigável quando a API está fora do ar

## Como executar

Pré-requisito: [Node.js](https://nodejs.org/).

**1. Suba a API** (porta 2350), com o terminal aberto na pasta do projeto:

```bash
npm run api
```

Teste acessando `http://localhost:2350/tasks` no navegador.

**2. Abra o front-end:** dê dois cliques no `index.html` ou use a extensão *Live Server* do VS Code.

> Os dados ficam salvos no arquivo `db.json`.
