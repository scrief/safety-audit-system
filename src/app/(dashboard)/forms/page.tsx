'use client';

import { useState, useEffect } from 'react';
import { Template, Tag } from '@/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { TemplateFilters } from '@/components/forms/TemplateFilters';
import { Pencil, Copy, Trash, Play } from 'lucide-react';

const emptyTemplate: Template = {
  id: crypto.randomUUID(),
  name: '',
  description: '',
  sections: [],
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: '',
};

export default function FormsPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [isCreating, setIsCreating] = useState(false);
  const [template, setTemplate] = useState<Template>(emptyTemplate);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    tags: [] as Tag[],
    dateRange: {
      start: null,
      end: null
    }
  });
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchTemplates();
      fetchTags();
    }
  }, [session]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates/list');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags/list');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      const data = await response.json();
      setAvailableTags(data.data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSave = async (updatedTemplate: Template) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTemplate),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsCreating(false);
        fetchTemplates();
      } else {
        throw new Error(result.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setTemplate(emptyTemplate);
  };

  const startNewTemplate = () => {
    setTemplate(emptyTemplate);
    setIsCreating(true);
  };

  const editTemplate = async (templateId: string) => {
    router.push(`/forms/${templateId}`);
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate template');
      }

      const result = await response.json();
      if (result.success) {
        await fetchTemplates();
      } else {
        throw new Error(result.error || 'Failed to duplicate template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      setError(error instanceof Error ? error.message : 'Failed to duplicate template');
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      const result = await response.json();
      if (result.success) {
        setShowDeleteDialog(false);
        setTemplateToDelete(null);
        await fetchTemplates();
      } else {
        throw new Error(result.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  const startNewAudit = (templateId: string) => {
    router.push(`/audits/new?templateId=${templateId}`);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesTags = filters.tags.length === 0 ||
      filters.tags.every(tag => template.tags?.some(t => t.id === tag.id));

    const matchesDateRange = (!filters.dateRange.start || new Date(template.createdAt) >= new Date(filters.dateRange.start)) &&
      (!filters.dateRange.end || new Date(template.createdAt) <= new Date(filters.dateRange.end));

    return matchesSearch && matchesTags && matchesDateRange;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {isCreating ? (
        <FormBuilder 
          template={template} 
          onSave={handleSave} 
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Audit Templates</h1>
            <Button onClick={startNewTemplate}>
              Create Template
            </Button>
          </div>

          <TemplateFilters
            filters={filters}
            onFilterChange={setFilters}
            availableTags={availableTags}
          />

          <div className="grid gap-6 mt-6">
            {filteredTemplates.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">
                  {filters.searchTerm || filters.tags.length > 0 || filters.dateRange.start || filters.dateRange.end
                    ? 'No templates found matching your filters.'
                    : 'No templates found. Create your first template to get started.'}
                </p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{template.name}</h2>
                      <p className="text-gray-600 mt-1">{template.description}</p>
                      <div className="text-sm text-gray-500 mt-2">
                        Sections: {template.sections?.length || 0} | 
                        Fields: {template.sections?.reduce((acc, section) => acc + (section.fields?.length || 0), 0) || 0} |
                        Last Updated: {new Date(template.updatedAt || Date.now()).toLocaleDateString()}
                      </div>
                      {template.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {template.tags.map(tag => (
                            <span
                              key={tag.id}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editTemplate(template.id)}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateTemplate(template.id)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </Button>
                      <Button
                        onClick={() => startNewAudit(template.id)}
                        className="flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Start Audit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setTemplateToDelete(template);
                          setShowDeleteDialog(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Trash className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteDialog(false);
          setTemplateToDelete(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </p>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setTemplateToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => templateToDelete && handleDeleteTemplate(templateToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}