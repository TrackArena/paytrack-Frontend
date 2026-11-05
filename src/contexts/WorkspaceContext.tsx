import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  currency: string;
  email?: string;
  logoUrl?: string;
}

interface WorkspaceContextValue {
  workspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  switchWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setWorkspace(null);
      setWorkspaces([]);
      setIsLoading(false);
      return;
    }

    api.get('/auth/me').then(({ data }) => {
      const wsList: Workspace[] = data.data.workspaces || [];
      setWorkspaces(wsList);

      const savedId = localStorage.getItem('workspace_id');
      const active = wsList.find((w) => w.id === savedId) || wsList[0] || null;
      if (active) {
        setWorkspace(active);
        localStorage.setItem('workspace_id', active.id);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [isAuthenticated, user]);

  const switchWorkspace = (id: string) => {
    const ws = workspaces.find((w) => w.id === id);
    if (ws) {
      setWorkspace(ws);
      localStorage.setItem('workspace_id', ws.id);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ workspace, workspaces, isLoading, switchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
