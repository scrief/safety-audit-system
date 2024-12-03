"use client";

import { FormBuilder } from '@/components/forms/FormBuilder'
import { useState, useEffect } from 'react';
import { Template, Tag } from '@/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import { Dialog } from '@/components/ui/Dialog';
import { TemplateFilters } from '@/components/forms/TemplateFilters';

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

export default function FormsPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [template, setTemplate] = useState<Template>(emptyTemplate);
  const [filters, setFilters] = useState({
    searchTerm: '',
    tags: [] as string[],
    dateRange: {
      start: null as Date | null,
      end: null as Date | null,
    },
    minSections: null as number | null,
    maxSections: null as number | null,
    sortBy: 'updated' as 'name' | 'updated' | 'sections',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  // Use Next.js useSearchParams for better reactivity
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const action = searchParams.get('action');
    const templateId = searchParams.get('templateId');

    if (action === 'edit' && templateId) {
      const templateToEdit = templates.find(t => t.id === templateId);
      if (templateToEdit) {
        setTemplate(templateToEdit);
        setIsCreating(true);
      }
    } else if (action === 'create') {
      setTemplate(emptyTemplate);
      setIsCreating(true);
    } else {
      setIsCreating(false);
      setTemplate(emptyTemplate);
    }
  }, [templates, searchParams]); // Use searchParams instead of window.location.search

  useEffect(() => {
    fetchTemplates();
    fetchTags();
  }, []);

  const handleCancel = () => {
    setIsCreating(false);
    setTemplate(emptyTemplate);
    // Update URL without triggering a page reload
    window.history.pushState({}, '', '/forms');
  };

  const handleSave = async (updatedTemplate: Template) => {
    try {
      const templateData = {
        ...updatedTemplate,
        userId: session?.user?.email,
      };

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsCreating(false);
        await fetchTemplates();
        // Update URL without triggering a page reload
        window.history.pushState({}, '', '/forms');
      } else {
        console.error('Failed to save template:', result.error);
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const startNewTemplate = () => {
    setTemplate(emptyTemplate);
    setIsCreating(true);
    // Update URL without triggering a page reload
    window.history.pushState({}, '', '/forms?action=create');
  };

  const editTemplate = (templateId: string) => {
    const templateToEdit = templates.find(t => t.id === templateId);
    if (templateToEdit) {
      setTemplate(templateToEdit);
      setIsCreating(true);
      // Update URL without triggering a page reload
      window.history.pushState({}, '', `/forms?action=edit&templateId=${templateId}`);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates/list');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data.map((template: Template) => ({
          ...template,
          tags: template.tags || [], // Ensure tags is always an array
          sections: template.sections || [], // Ensure sections is always an array
        })));
      } else {
        console.error('Failed to fetch templates:', result.error);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const result = await response.json();
      
      if (result.success) {
        setAvailableTags(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCreateTag = async (name: string) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchTags();
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      console.log('Attempting to duplicate template:', templateId);
      
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Failed to duplicate template';
      
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            console.error('Error details:', errorData.details);
          }
        } else {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        console.log('Template duplicated successfully:', result.data.id);
        await fetchTemplates();
      } else {
        console.error('Failed to duplicate template:', result.error);
        throw new Error(result.error || 'Failed to duplicate template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw error;
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(`/api/templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchTemplates();
        setShowDeleteDialog(false);
        setTemplateToDelete(null);
      } else {
        console.error('Failed to delete template:', result.error);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const startNewAudit = (templateId: string) => {
    router.push(`/audits/new?template=${templateId}`);
  };

  // Filter and sort templates
  const filteredTemplates = templates.filter(template => {
    // Text search
    const matchesSearch = (template.name?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase()) ||
      (template.description?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase());
    
    // Tags filter
    const matchesTags = filters.tags.length === 0 ||
      filters.tags.every(tagId => template.tags?.some(tag => tag.id === tagId));
    
    // Date range filter
    const matchesDateRange = (!filters.dateRange.start || new Date(template.updatedAt!) >= filters.dateRange.start) &&
      (!filters.dateRange.end || new Date(template.updatedAt!) <= filters.dateRange.end);
    
    // Sections count filter
    const sectionCount = template.sections?.length || 0;
    const matchesSections = (!filters.minSections || sectionCount >= filters.minSections) &&
      (!filters.maxSections || sectionCount <= filters.maxSections);
    
    return matchesSearch && matchesTags && matchesDateRange && matchesSections;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (filters.sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'sections':
        comparison = (a.sections?.length || 0) - (b.sections?.length || 0);
        break;
      case 'updated':
      default:
        comparison = new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    }
    
    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="container mx-auto px-4 py-8">
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
            <button
              onClick={startNewTemplate}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Create Template
            </button>
          </div>

          <TemplateFilters
            filters={filters}
            onFilterChange={setFilters}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
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
                  <div className="flex justify-between items-start mb-4">
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
                    <div className="space-x-2">
                      <button
                        onClick={() => editTemplate(template.id)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template.id)}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-md"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => startNewAudit(template.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                      >
                        Start Audit
                      </button>
                      <button
                        onClick={() => {
                          setTemplateToDelete(template);
                          setShowDeleteDialog(true);
                        }}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && templateToDelete && (
        <Dialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setTemplateToDelete(null);
          }}
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Delete Template</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{templateToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setTemplateToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTemplate}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}