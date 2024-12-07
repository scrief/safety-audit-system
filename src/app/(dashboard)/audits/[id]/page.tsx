'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Template, Audit } from '@/types';
import { AuditForm } from '@/components/forms/AuditForm';
import { Spinner } from '@/components/ui/spinner';

export default function AuditPage() {
  const params = useParams();
  const auditId = params?.id as string;
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [audit, setAudit] = useState<Audit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    async function fetchAudit() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/audits/${auditId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load audit');
        }

        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load audit data');
        }

        setAudit(result.data);
      } catch (error) {
        console.error('Error fetching audit:', error);
        setError(error instanceof Error ? error.message : 'Failed to load audit');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAudit();
  }, [auditId, status]);

  const handleSave = async (data: Partial<Audit>) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/audits/${auditId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save audit');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update audit');
      }

      setAudit(result.data);
    } catch (error) {
      console.error('Error saving audit:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (data: Audit) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/audits/${auditId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete audit');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete audit');
      }

      router.push('/audits');
    } catch (error) {
      console.error('Error completing audit:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full text-center">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Audit</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/audits')}
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
          >
            Back to Audits
          </button>
        </div>
      </div>
    );
  }

  if (!audit?.template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md w-full text-center">
          <h2 className="text-yellow-800 text-lg font-semibold mb-2">Audit Not Found</h2>
          <p className="text-yellow-600">The requested audit could not be found.</p>
          <button
            onClick={() => router.push('/audits')}
            className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
          >
            Back to Audits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            {audit.template.name}
          </h1>
          <button
            onClick={() => router.push('/audits')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Back to Audits
          </button>
        </div>
        <p className="text-gray-600 mt-2">
          Client: {audit.client.name}
        </p>
      </div>

      <AuditForm
        template={audit.template}
        initialData={audit}
        onSave={handleSave}
        onComplete={handleComplete}
      />
    </div>
  );
}