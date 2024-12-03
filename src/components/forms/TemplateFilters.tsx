import React from 'react';
import { Tag } from '@/types';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface FilterOptions {
  searchTerm: string;
  tags: string[];
  dateRange: DateRange;
  minSections: number | null;
  maxSections: number | null;
  sortBy: 'name' | 'updated' | 'sections';
  sortOrder: 'asc' | 'desc';
}

interface TemplateFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  availableTags: Tag[];
  onCreateTag: (name: string) => Promise<void>;
}

export function TemplateFilters({
  filters,
  onFilterChange,
  availableTags,
  onCreateTag,
}: TemplateFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [newTagName, setNewTagName] = React.useState('');

  const handleFilterChange = (updates: Partial<FilterOptions>) => {
    onFilterChange({ ...filters, ...updates });
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      await onCreateTag(newTagName.trim());
      setNewTagName('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
          className="flex-1 px-4 py-2 border rounded-md"
        />
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange({ 
            sortBy: e.target.value as FilterOptions['sortBy']
          })}
          className="px-4 py-2 border rounded-md bg-white"
        >
          <option value="updated">Sort by Last Updated</option>
          <option value="name">Sort by Name</option>
          <option value="sections">Sort by Sections</option>
        </select>
        <select
          value={filters.sortOrder}
          onChange={(e) => handleFilterChange({ 
            sortOrder: e.target.value as FilterOptions['sortOrder']
          })}
          className="px-4 py-2 border rounded-md bg-white"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-blue-500 hover:text-blue-600"
      >
        {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
      </button>

      {showAdvanced && (
        <div className="p-4 border rounded-md space-y-4">
          <div>
            <h3 className="font-medium mb-2">Date Range</h3>
            <div className="flex gap-4">
              <input
                type="date"
                value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleFilterChange({
                  dateRange: {
                    ...filters.dateRange,
                    start: e.target.value ? new Date(e.target.value) : null,
                  },
                })}
                className="px-4 py-2 border rounded-md"
              />
              <span className="self-center">to</span>
              <input
                type="date"
                value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleFilterChange({
                  dateRange: {
                    ...filters.dateRange,
                    end: e.target.value ? new Date(e.target.value) : null,
                  },
                })}
                className="px-4 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Number of Sections</h3>
            <div className="flex gap-4">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={filters.minSections || ''}
                onChange={(e) => handleFilterChange({
                  minSections: e.target.value ? parseInt(e.target.value) : null,
                })}
                className="px-4 py-2 border rounded-md w-32"
              />
              <span className="self-center">to</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={filters.maxSections || ''}
                onChange={(e) => handleFilterChange({
                  maxSections: e.target.value ? parseInt(e.target.value) : null,
                })}
                className="px-4 py-2 border rounded-md w-32"
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableTags.map((tag) => (
                <label
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200"
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={filters.tags.includes(tag.id)}
                    onChange={(e) => {
                      const newTags = e.target.checked
                        ? [...filters.tags, tag.id]
                        : filters.tags.filter(id => id !== tag.id);
                      handleFilterChange({ tags: newTags });
                    }}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
            <form onSubmit={handleCreateTag} className="flex gap-2">
              <input
                type="text"
                placeholder="New tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-md"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Tag
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
