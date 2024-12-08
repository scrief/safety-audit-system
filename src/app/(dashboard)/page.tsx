'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Template, Audit } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export default function DashboardPage() {
  const { data: session } = useSession({ required: true });
  const [recentForms, setRecentForms] = useState<Template[]>([]);
  const [recentAudits, setRecentAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching forms...');
      const formsRes = await fetch('/api/templates/list?limit=5');
      console.log('Forms response status:', formsRes.status);
      const formsText = await formsRes.text();
      console.log('Forms response text:', formsText);
      const formsData = formsText ? JSON.parse(formsText) : null;

      console.log('Fetching audits...');
      const auditsRes = await fetch('/api/audits');  // Changed from /api/audits/list
      console.log('Audits response status:', auditsRes.status);
      const auditsText = await auditsRes.text();
      console.log('Audits response text:', auditsText);
      const auditsData = auditsText ? JSON.parse(auditsText) : null;

      if (!formsRes.ok || !formsData?.success) {
        throw new Error(formsData?.error || 'Failed to fetch forms');
      }

      if (!auditsRes.ok || !auditsData?.success) {
        throw new Error(auditsData?.error || 'Failed to fetch audits');
      }

      setRecentForms(formsData.data || []);
      // Take only the 5 most recent audits
      setRecentAudits((auditsData.data || []).slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Recent Forms</h3>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : recentForms.length === 0 ? (
              <p className="text-gray-600">No forms created yet</p>
            ) : (
              <ul className="space-y-3">
                {recentForms.map((form) => (
                  <li key={form.id} className="flex justify-between items-center">
                    <Link 
                      href={`/forms/${form.id}`}
                      className="text-blue-600 hover:text-blue-800 truncate flex-1"
                    >
                      {form.name}
                    </Link>
                    <span className="text-sm text-gray-500">
                      {formatDate(form.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Recent Audits</h3>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : recentAudits.length === 0 ? (
              <p className="text-gray-600">No audits completed yet</p>
            ) : (
              <ul className="space-y-3">
                {recentAudits.map((audit) => (
                  <li key={audit.id} className="flex justify-between items-center">
                    <Link 
                      href={`/audits/${audit.id}`}
                      className="text-blue-600 hover:text-blue-800 truncate flex-1"
                    >
                      {audit.template?.name || 'Unnamed Audit'}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(audit.createdAt)}
                      </span>
                      <span className={`text-sm ${getStatusColor(audit.status)}`}>
                        {audit.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Statistics</h3>
            <div className="space-y-3">
              <p className="flex justify-between">
                <span className="text-gray-600">Total Forms:</span>
                <span className="font-medium">{recentForms.length}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Total Audits:</span>
                <span className="font-medium">{recentAudits.length}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Draft Audits:</span>
                <span className="font-medium">
                  {recentAudits.filter(a => a.status.toLowerCase() === 'draft').length}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Completed Audits:</span>
                <span className="font-medium">
                  {recentAudits.filter(a => a.status.toLowerCase() === 'completed').length}
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}