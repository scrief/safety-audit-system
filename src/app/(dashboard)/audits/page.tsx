'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'; 
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell 
} from '@/components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Audit } from '@/types';
import { endpoints, fetchData, deleteData } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { PencilSquareIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<Audit | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAudits();
  }, []);

  async function fetchAudits() {
    try {
      console.log('Fetching audits from:', endpoints.audits.base);
      const response = await fetchData<Audit[]>(endpoints.audits.base);
      console.log('API Response:', response);

      if (response.success && Array.isArray(response.data)) {
        console.log('Setting audits:', response.data);
        setAudits(response.data);
        setError(null);
      } else {
        console.error('Invalid API Response:', response);
        setError('Failed to load audits. Please try again.');
        setAudits([]);
      }
    } catch (error) {
      console.error('Error fetching audits:', error);
      setError('An error occurred while loading audits.');
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }

  const handleEditAudit = (audit: Audit) => {
    router.push(`/audits/${audit.id}/edit`);
  };

  const handleDeleteClick = (audit: Audit) => {
    setAuditToDelete(audit);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!auditToDelete?.id) return;

    try {
      const response = await deleteData(endpoints.audits.single(auditToDelete.id));
      if (response.success) {
        await fetchAudits(); // Refresh the list
        setDeleteDialogOpen(false);
        setAuditToDelete(null);
      } else {
        setError('Failed to delete audit. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting audit:', error);
      setError('An error occurred while deleting the audit.');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Audits</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              Create New Audit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Audit</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Link href="/audits/new" className="w-full">
                <Button className="w-full">
                  Start New Audit
                </Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this audit? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading audits...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits && audits.length > 0 ? (
                    audits.map((audit) => (
                      <TableRow key={audit.id}>
                        <TableCell>{audit.template?.name || 'Unknown Template'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={audit.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {audit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {audit.createdAt ? new Date(audit.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {audit.score ? `${audit.score}%` : '-'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="secondary"
                            size="iconSm"
                            onClick={() => handleEditAudit(audit)}
                            title="Edit Audit"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="iconSm"
                            onClick={() => handleDeleteClick(audit)}
                            title="Delete Audit"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No audits found. Create your first audit to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}