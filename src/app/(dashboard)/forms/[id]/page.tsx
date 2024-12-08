'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { Template } from '@/types';
import { toast } from '@/components/ui/use-toast';

export default function EditFormPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const response = await fetch(`/api/templates/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setTemplate(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch template');
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to fetch template',
          variant: "destructive",
        });
        router.push('/forms');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchTemplate();
    }
  }, [id, router]);

  const handleSave = async (updatedTemplate: Template) => {
    try {
      // Log the template being sent
      console.log('Sending template data:', JSON.stringify(updatedTemplate, null, 2));
      
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTemplate),
      });

      // Log response details for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to get error details from response
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Server error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result) {
        throw new Error('Empty response from server');
      }
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Template saved successfully",
        });
        router.push('/forms');
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: "destructive",
      });
      
      throw error;
    }
  };

  if (isLoading || !template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      <FormBuilder
        template={template}
        onSave={handleSave}
        onCancel={() => router.push('/forms')}
      />
    </div>
  );
}