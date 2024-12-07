'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  industry: z.string().min(1, 'Industry is required'),
  employeeCount: z.number().min(1, 'Employee count must be at least 1'),
  locations: z.number().min(1, 'Number of locations must be at least 1'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  contacts: z.array(z.object({
    name: z.string().min(1, 'Contact name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    title: z.string().optional(),
  })).min(1, 'At least one contact is required'),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function NewClientPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      contacts: [{ name: '', email: '', phone: '', title: '' }],
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      router.push('/clients');
      router.refresh();
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Add New Client</h1>
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div>
              <label className="block mb-2">
                Company Name*
                <input
                  {...register('name')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </label>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2">
                Industry*
                <input
                  {...register('industry')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </label>
              {errors.industry && (
                <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2">
                Employee Count*
                <input
                  {...register('employeeCount', { valueAsNumber: true })}
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </label>
              {errors.employeeCount && (
                <p className="mt-1 text-sm text-red-600">{errors.employeeCount.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2">
                Number of Locations*
                <input
                  {...register('locations', { valueAsNumber: true })}
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </label>
              {errors.locations && (
                <p className="mt-1 text-sm text-red-600">{errors.locations.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2">
                Risk Level*
                <select
                  {...register('riskLevel')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </label>
              {errors.riskLevel && (
                <p className="mt-1 text-sm text-red-600">{errors.riskLevel.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Primary Contact</h3>
              <div>
                <label className="block mb-2">
                  Contact Name*
                  <input
                    {...register('contacts.0.name')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </label>
              </div>
              <div>
                <label className="block mb-2">
                  Contact Email*
                  <input
                    {...register('contacts.0.email')}
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </label>
              </div>
              <div>
                <label className="block mb-2">
                  Contact Phone
                  <input
                    {...register('contacts.0.phone')}
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </label>
              </div>
              <div>
                <label className="block mb-2">
                  Contact Title
                  <input
                    {...register('contacts.0.title')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Create Client
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}