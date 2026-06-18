import { Router } from 'express';
import { createTask, deleteTask, listTasks, updateTask } from '../storage/taskStore.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

function validateTaskPayload(body) {
  if (!body.title || !body.title.trim()) {
    return 'Title is required.';
  }

  if (body.status && !['todo', 'in-progress', 'done'].includes(body.status)) {
    return 'Invalid status value.';
  }

  if (body.priority && !['low', 'medium', 'high'].includes(body.priority)) {
    return 'Invalid priority value.';
  }

  return '';
}

router.use(requireUser);

router.get('/', async (req, res, next) => {
  try {
    const tasks = await listTasks(req.user.uid, {
      q: req.query.q || '',
      status: req.query.status || 'all',
      sort: req.query.sort || 'recent',
    });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const errorMessage = validateTaskPayload(req.body);

    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const task = await createTask(req.user.uid, req.user.email || '', req.body);
    return res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const errorMessage = validateTaskPayload(req.body);

    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const task = await updateTask(req.user.uid, req.params.id, req.body);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    return res.json({ task });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteTask(req.user.uid, req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;