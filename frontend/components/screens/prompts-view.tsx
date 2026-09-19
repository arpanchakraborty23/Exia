'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  Loader2,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PromptItem } from '@/lib/types';

export function PromptsView() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'system' | 'quick'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'system' | 'quick'>('system');
  const [promptText, setPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.prompts.list();
      setPrompts(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load prompts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleOpenAdd = () => {
    setEditingPrompt(null);
    setTitle('');
    setType('system');
    setPromptText('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PromptItem) => {
    setEditingPrompt(item);
    setTitle(item.title);
    setType(item.type);
    setPromptText(item.prompt_text);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
      await api.prompts.delete(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete prompt');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !promptText.trim()) {
      setModalError('Please provide both a title and prompt text');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingPrompt) {
        const updated = await api.prompts.update(editingPrompt.id, {
          title: title.trim(),
          type,
          prompt_text: promptText.trim(),
        });
        setPrompts((prev) =>
          prev.map((p) => (p.id === editingPrompt.id ? { ...p, ...updated } : p))
        );
      } else {
        const created = await api.prompts.create({
          title: title.trim(),
          type,
          prompt_text: promptText.trim(),
        });
        setPrompts((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to save prompt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPrompts =
    filterType === 'all' ? prompts : prompts.filter((p) => p.type === filterType);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Prompts & Commands
          </h1>
          <p className="text-sm text-muted-foreground">
            Define system personas and quick conversational action triggers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPrompts}
            disabled={isLoading}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-all"
            title="Refresh prompts"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:opacity-90 transition-all shadow-sm shadow-primary/20"
          >
            <Plus className="size-4" />
            <span>Create Prompt</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border/80 pb-2">
        {(['all', 'system', 'quick'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filterType === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab === 'all'
              ? `All (${prompts.length})`
              : tab === 'system'
              ? 'System Prompts'
              : 'Quick Commands'}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchPrompts} className="ml-auto underline font-medium text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 rounded-2xl bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <FileText className="size-6" />
          </div>
          <h3 className="font-semibold text-foreground">No prompts found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Save system instructions or quick voice shortcuts for daily routines and queries.
          </p>
        </div>
      ) : (
        /* Prompts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrompts.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-xs transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                        item.type === 'system'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {item.type === 'system' ? (
                        <Sparkles className="size-4" />
                      ) : (
                        <Terminal className="size-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider ${
                          item.type === 'system' ? 'text-blue-500' : 'text-emerald-500'
                        }`}
                      >
                        {item.type === 'system' ? 'System Persona' : 'Quick Command'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(item.prompt_text, item.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy prompt text"
                  >
                    {copiedId === item.id ? (
                      <Check className="size-4 text-emerald-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 bg-muted/40 p-3 rounded-xl border border-border/60">
                  {item.prompt_text}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                <span className="text-[11px] text-muted-foreground">ID: {item.id}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground">
                {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Concierge Companion or Morning Briefing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Prompt Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('system')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                      type === 'system'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    <Sparkles className="size-3.5" />
                    <span>System Persona</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('quick')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                      type === 'quick'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    <Terminal className="size-3.5" />
                    <span>Quick Command</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground/80">Prompt Instructions</label>
                  <span className="text-[11px] text-muted-foreground">{promptText.length} chars</span>
                </div>
                <textarea
                  required
                  rows={5}
                  placeholder={
                    type === 'system'
                      ? 'You are an intelligent, friendly AI assistant that helps manage...'
                      : 'Trigger routine: check calendar, weather, and summarize...'
                  }
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-medium hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                  <span>{editingPrompt ? 'Save Changes' : 'Create Prompt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
