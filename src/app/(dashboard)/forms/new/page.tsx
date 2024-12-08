'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { Template } from '@/types';
import { toast } from '@/components/ui/use-toast';

const emptyTemplate: Template = {
  id: crypto.randomUUID(),
  name: '',
  description: '',
  sections: [],
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: '', // Will be set when saving
};

export default function NewFormPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const handleSave = async (template: Template) => {
    try {
      console.log('Saving template:', template); // Debug log

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }

      const result = await response.json();
      console.log('Response data:', result); // Debug log

      if (result.success) {
        toast({
          title: "Success",
          description: "Template saved successfully",
        });
        router.push('/forms');
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: "destructive",
      });
      
      throw error;
    }
  };

  return (
    <FormBuilder
      template={emptyTemplate}
      onSave={handleSave}
      onCancel={() => router.push('/forms')}
    />
  );
}