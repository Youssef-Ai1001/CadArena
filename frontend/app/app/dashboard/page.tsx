'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { projectsAPI, authAPI, Project } from '@/lib/api';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Plus, FolderOpen, Calendar, LogOut, Sparkles, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const data = await projectsAPI.list();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Check for token in cookies or localStorage
    const getToken = (): string | null => {
      if (typeof document === 'undefined') return null;
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token' || name === 'cadarena_access') {
          return decodeURIComponent(value);
        }
      }
      return localStorage.getItem('access_token');
    };

    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadProjects();
  }, [router, loadProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    setCreating(true);
    try {
      const newProject = await projectsAPI.create(newProjectTitle);
      setProjects([newProject, ...projects]);
      setNewProjectTitle('');
      router.push(`/app/chat/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0066FF] animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-700 hover:text-[#0066FF] px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Projects</h1>
          <p className="text-slate-600">Create and manage your CAD designs</p>
        </div>

        {/* Create Project Form */}
        <div className="card p-6 mb-8">
          <form onSubmit={handleCreateProject} className="flex gap-4">
            <div className="flex-1 relative">
              <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="Enter project name..."
                className="input-field pl-10"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newProjectTitle.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  New Project
                </>
              )}
            </button>
          </form>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#0066FF] to-[#7C3AED] rounded-2xl flex items-center justify-center opacity-20">
              <FolderOpen className="w-12 h-12 text-[#0066FF]" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-600 mb-6">Create your first project to start designing with AI</p>
            <button
              onClick={() => document.querySelector('input')?.focus()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/app/chat/${project.id}`}
                className="card p-6 hover:scale-105 transition-transform duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0066FF] to-[#7C3AED] rounded-xl flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-[#0066FF] rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#0066FF] transition-colors">
                  {project.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
