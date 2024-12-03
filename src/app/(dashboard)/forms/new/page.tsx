'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { Template } from '@/types';

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
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      const result = await response.json();
      
      if (result.success) {
        router.push('/forms');
      } else {
        throw new Error(result.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
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
