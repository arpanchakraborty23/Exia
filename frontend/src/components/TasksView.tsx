import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Tag,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onToggleStatus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAskAIPlan: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onToggleStatus,
  onDeleteTask,
  onAskAIPlan,
}) => {
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState<'work' | 'personal' | 'home' | 'health'>('home');
  const [newDueDate, setNewDueDate] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      priority: newPriority,
      status: 'todo',
      dueDate: newDueDate || 'Today',
      category: newCategory,
      tags: [newCategory],
    });

    setNewTitle('');
    setNewDescription('');
    setNewDueDate('');
    setIsAdding(false);
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'low':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            Daily Tasks & Routines
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Synced directly to local SQLite database table (`tasks`). Your assistant references these when you ask for agenda summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAskAIPlan}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Plan My Day</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
        {(['all', 'todo', 'in_progress', 'completed'] as const).map((tab) => {
          const count = tasks.filter((t) => (tab === 'all' ? true : t.status === tab)).length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === tab
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.replace('_', ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* Add Task Modal / Collapse Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-2xl bg-zinc-900/90 border border-indigo-500/30 shadow-xl space-y-3"
        >
          <div className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
            Create New Daily Task
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title (e.g. Call plumber, Buy groceries...)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              placeholder="Due date / time (e.g. Today 4:00 PM)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description or notes..."
            rows={2}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              {/* Priority */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>Priority:</span>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Category */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>Category:</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow"
              >
                Save Task
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredTasks.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-zinc-500 text-xs">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`group flex items-start justify-between p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-zinc-950/40 border-zinc-900 opacity-60'
                    : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-zinc-800/80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => onToggleStatus(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-zinc-700 hover:border-indigo-400 bg-zinc-950'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div className="space-y-1">
                    <div
                      className={`text-xs font-medium ${
                        isDone ? 'line-through text-zinc-500' : 'text-zinc-100'
                      }`}
                    >
                      {task.title}
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-zinc-400 leading-normal">{task.description}</p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>

                      {task.dueDate && (
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      )}

                      <span className="text-[10px] text-zinc-500 flex items-center gap-1 capitalize">
                        <Tag className="w-3 h-3" />
                        {task.category}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteTask(task.id)}
                  title="Delete task"
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
