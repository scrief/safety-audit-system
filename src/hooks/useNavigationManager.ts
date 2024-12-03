'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface NavigationState {
  hasUnsavedChanges: boolean;
  isNavigating: boolean;
  targetPath: string | null;
}

export function useNavigationManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<NavigationState>({
    hasUnsavedChanges: false,
    isNavigating: false,
    targetPath: null,
  });

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges]);

  const setUnsavedChanges = useCallback((hasUnsavedChanges: boolean) => {
    setState(prev => ({ ...prev, hasUnsavedChanges }));
  }, []);

  const navigate = useCallback(async (path: string, force: boolean = false) => {
    if (!force && state.hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) {
        return false;
      }
    }

    setState(prev => ({ ...prev, isNavigating: true, targetPath: path }));
    router.push(path);
    return true;
  }, [router, state.hasUnsavedChanges]);

  const handleFormsNavigation = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault();

    // Check for unsaved changes
    if (state.hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) {
        return;
      }
    }

    // Use router.replace instead of history.pushState to ensure immediate navigation
    router.replace('/forms');
    
  }, [state.hasUnsavedChanges, router]);

  return {
    navigate,
    handleFormsNavigation,
    setUnsavedChanges,
    isNavigating: state.isNavigating,
    hasUnsavedChanges: state.hasUnsavedChanges,
    currentPath: pathname,
  };
}
