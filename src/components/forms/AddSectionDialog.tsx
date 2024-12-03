"use client";

import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Section } from '@/types';

interface AddSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (section: Omit<Section, 'id' | 'order'>) => void;
}

export function AddSectionDialog({ isOpen, onClose, onAdd }: AddSectionDialogProps) {
  const [title, setTitle] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      title,
      fields: [],
    });
    setTitle('');
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add New Section">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Section Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-06 py-2 px-2 placeholder:pl-0"
            placeholder="Enter section title"
            required
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add Section</Button>
        </div>
      </form>
    </Dialog>
  );
}
