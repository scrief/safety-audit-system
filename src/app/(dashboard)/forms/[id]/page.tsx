'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { Template } from '@/types';

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
        const result = await response.json();
        
        if (result.success) {
          setTemplate(result.data);
        } else {
          console.error('Failed to fetch template:', result.error);
          router.push('/forms');
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        router.push('/forms');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplate();
  }, [id, router]);

  const handleSave = async (updatedTemplate: Template) => {
    try {
      console.log('Saving template:', updatedTemplate);
      
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTemplate),
      });

      // Log the raw response for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Get the response text first
      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      // Try to parse the response as JSON
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!result) {
        throw new Error('Empty response from server');
      }
      
      if (result.success) {
        router.push('/forms');
      } else {
        throw new Error(result.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while saving');
      throw error;
    }
  };

  if (isLoading || !template) {
    return <div>Loading...</div>;
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
