import crypto from 'crypto';
import { isMongoReady } from '../db.js';
import { Task } from '../models/Task.js';

const memoryTasks = [];

function toClientTask(task) {
  return {
    id: String(task._id || task.id),
    ownerId: task.ownerId,
    ownerEmail: task.ownerEmail || '',
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    tags: Array.isArray(task.tags) ? task.tags : [],
    createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
    updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null,
  };
}

function normalizeText(value) {
  return (value || '').trim().toLowerCase();
}

function sortTasks(tasks, sort) {
  const priorityRank = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const sorted = [...tasks];

  sorted.sort((left, right) => {
    if (sort === 'oldest') {
      return new Date(left.createdAt) - new Date(right.createdAt);
    }

    if (sort === 'due') {
      const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;

      if (leftDue !== rightDue) {
        return leftDue - rightDue;
      }

      return new Date(right.createdAt) - new Date(left.createdAt);
    }

    if (sort === 'priority') {
      const priorityDelta = priorityRank[left.priority] - priorityRank[right.priority];

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return new Date(right.createdAt) - new Date(left.createdAt);
    }

    return new Date(right.createdAt) - new Date(left.createdAt);
  });

  return sorted;
}

function filterTasks(tasks, filters) {
  const search = normalizeText(filters.q);

  return tasks.filter((task) => {
    const matchesStatus = !filters.status || filters.status === 'all' || task.status === filters.status;
    const matchesSearch =
      !search ||
      normalizeText(task.title).includes(search) ||
      normalizeText(task.description).includes(search) ||
      (task.tags || []).some((tag) => normalizeText(tag).includes(search));

    return matchesStatus && matchesSearch;
  });
}

async function readTasks(ownerId) {
  if (isMongoReady()) {
    const records = await Task.find({ ownerId }).lean();
    return records.map(toClientTask);
  }

  return memoryTasks.filter((task) => task.ownerId === ownerId).map(toClientTask);
}

export async function listTasks(ownerId, filters = {}) {
  const tasks = await readTasks(ownerId);
  return sortTasks(filterTasks(tasks, filters), filters.sort || 'recent');
}

export async function createTask(ownerId, ownerEmail, data) {
  const payload = {
    ownerId,
    ownerEmail,
    title: data.title.trim(),
    description: (data.description || '').trim(),
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    tags: Array.isArray(data.tags) ? data.tags : [],
  };

  if (isMongoReady()) {
    const record = await Task.create(payload);
    return toClientTask(record.toObject());
  }

  const record = {
    _id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryTasks.push(record);
  return toClientTask(record);
}

export async function updateTask(ownerId, taskId, data) {
  if (isMongoReady()) {
    const record = await Task.findOne({ _id: taskId, ownerId });

    if (!record) {
      return null;
    }

    record.title = data.title.trim();
    record.description = (data.description || '').trim();
    record.status = data.status || record.status;
    record.priority = data.priority || record.priority;
    record.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    record.tags = Array.isArray(data.tags) ? data.tags : [];

    await record.save();
    return toClientTask(record.toObject());
  }

  const index = memoryTasks.findIndex((task) => task._id === taskId && task.ownerId === ownerId);

  if (index === -1) {
    return null;
  }

  const existing = memoryTasks[index];
  const updated = {
    ...existing,
    title: data.title.trim(),
    description: (data.description || '').trim(),
    status: data.status || existing.status,
    priority: data.priority || existing.priority,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    updatedAt: new Date().toISOString(),
  };

  memoryTasks[index] = updated;
  return toClientTask(updated);
}

export async function deleteTask(ownerId, taskId) {
  if (isMongoReady()) {
    const result = await Task.deleteOne({ _id: taskId, ownerId });
    return result.deletedCount > 0;
  }

  const index = memoryTasks.findIndex((task) => task._id === taskId && task.ownerId === ownerId);

  if (index === -1) {
    return false;
  }

  memoryTasks.splice(index, 1);
  return true;
}