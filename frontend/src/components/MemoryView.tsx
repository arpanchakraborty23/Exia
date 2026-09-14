import React, { useState } from 'react';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Sliders,
  Shield,
  BookOpen,
  Sparkles,
  Info,
} from 'lucide-react';
import { MemoryItem, MemoryCategory } from '../types';

interface MemoryViewProps {
  memories: MemoryItem[];
  onAddMemory: (item: Omit<MemoryItem, 'id' | 'createdAt'>) => void;
  onDeleteMemory: (id: string) => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('fact');
  const [newImportance, setNewImportance] = useState(0.8);

  const filteredMemories = memories.filter((mem) => {
    const matchesCategory =
      selectedCategory === 'all' || mem.category === selectedCategory;
    const matchesSearch =
      mem.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newContent.trim()) return;

    onAddMemory({
      subject: newSubject.trim(),
      content: newContent.trim(),
      category: newCategory,
      importance: newImportance,
      source: 'manual',
    });

    setNewSubject('');
    setNewContent('');
    setIsAdding(false);
  };

  const getCategoryBadge = (cat: MemoryCategory) => {
    switch (cat) {
      case 'preference':
        return { color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', icon: Sliders };
      case 'rule':
        return { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Shield };
      case 'routine':
        return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Sparkles };
      case 'context':
        return { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: BookOpen };
      default:
        return { color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: Brain };
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              Long-Term Memory Management
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 font-mono">
              Mem0 Powered
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Hybrid local memory powered by <strong>Mem0</strong> and SQLite. Dynamically extracts facts, preferences, and entity context on each conversational turn.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Memory</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-300">
        <Info className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-zinc-100">How Mem0 Memory Works: </span>
          When you speak, the agent searches Mem0's local vector index for relevant past context and injects it into the prompt. It then updates user preferences automatically with semantic deduplication. All Mem0 settings (user ID and vector store) are passed with the LiveKit connection token!
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory records by keyword or subject..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'preference', 'fact', 'context', 'routine', 'rule'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Add Memory Modal / Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-2xl bg-zinc-900/90 border border-indigo-500/30 shadow-xl space-y-3"
        >
          <div className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
            Teach Assistant New Memory / Fact
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Subject (e.g., Morning Coffee, Standup Time)"
              className="sm:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />

            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="fact">Fact</option>
              <option value="preference">Preference</option>
              <option value="context">Context</option>
              <option value="routine">Routine</option>
              <option value="rule">Rule / Boundary</option>
            </select>
          </div>

          <textarea
            required
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Details or knowledge description..."
            rows={3}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Importance Weight: {newImportance * 100}%</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={newImportance}
                onChange={(e) => setNewImportance(parseFloat(e.target.value))}
                className="w-28 accent-indigo-500"
              />
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
                Save to SQLite
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Memories Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredMemories.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-zinc-500 text-xs">
            No memories match your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredMemories.map((mem) => {
              const badge = getCategoryBadge(mem.category);
              const Icon = badge.icon;
              return (
                <div
                  key={mem.id}
                  className="group relative p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${badge.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          {mem.category}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {(mem.importance * 100).toFixed(0)}% weight
                        </span>
                      </div>

                      <button
                        onClick={() => onDeleteMemory(mem.id)}
                        title="Delete memory"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-200">{mem.subject}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{mem.content}</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Source: {mem.source}</span>
                    <span>{new Date(mem.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
