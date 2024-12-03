'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { Template } from '@/types';

export default function EditFormPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const response = await fetch(`/api/templates/${params.id}`);
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
  }, [params.id, router]);

  const handleSave = async (updatedTemplate: Template) => {
    try {
      const response = await fetch(`/api/templates/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTemplate),
      });

      const result = await response.json();
      
      if (result.success) {
        router.push('/forms');
      } else {
        throw new Error(result.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  if (isLoading || !template) {
    return <div>Loading...</div>;
  }

  return (
    <FormBuilder
      template={template}
      onSave={handleSave}
      onCancel={() => router.push('/forms')}
    />
  );
}
