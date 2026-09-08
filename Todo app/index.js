const express = require('express');

const app = express();
app.use(express.json());

let todos = [];
let nextId = 1;

// Add a todo
app.post('/todos', (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const todo = {
    id: nextId++,
    title,
    done: false,
    createdAt: new Date()
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// Mark a todo as done
app.patch('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todo.done = true;
  res.json(todo);
});

// Remove a todo
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const removed = todos.splice(index, 1);
  res.json(removed[0]);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Todo server running on http://localhost:${PORT}`);
});
