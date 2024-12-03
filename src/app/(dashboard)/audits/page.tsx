'use client';

import React from 'react';

export default function AuditsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Safety Audits</h1>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          onClick={() => console.log('New Audit clicked')}
        >
          New Audit
        </button>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Audits</h2>
            <p className="text-gray-600">No audits found. Create your first audit to get started.</p>
          </div>
        </div>
      </div>
    </div>
  );
}