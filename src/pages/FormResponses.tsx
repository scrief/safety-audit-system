import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponses } from '../contexts/ResponsesContext';
import Navigation from '../components/Navigation';
import { format } from 'date-fns';
import { Download, Edit, Trash2, Search } from 'lucide-react';

type SortOrder = 'newest' | 'oldest' | 'clientAZ' | 'clientZA' | 'status';

const FormResponses = () => {
  const navigate = useNavigate();
  const { audits, deleteAudit } = useResponses();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Filter and sort audits
  const filteredAudits = audits
    .filter(audit => 
      audit.templateName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'clientAZ':
          const clientNameA = a.clientId || '';
          const clientNameB = b.clientId || '';
          return clientNameA.localeCompare(clientNameB);
        case 'clientZA':
          const clientNameC = b.clientId || '';
          const clientNameD = a.clientId || '';
          return clientNameC.localeCompare(clientNameD);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this audit?')) {
      try {
        await deleteAudit(id);
      } catch (error) {
        console.error('Error deleting audit:', error);
      }
    }
  };

  const handleEdit = (auditId: string) => {
    const audit = audits.find(a => a.id === auditId);
    if (audit) {
      navigate(`/audit/${audit.clientId}/${audit.templateId}`, {
        state: { audit, mode: 'edit' }
      });
    }
  };

  const handleDownloadWord = async (auditId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/exports/word/${auditId}`, {
        method: 'GET',
      });
      
      if (!response.ok) throw new Error('Failed to download Word document');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-${auditId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading Word document:', error);
      alert('Error downloading Word document');
    }
  };

  const handleDownloadPDF = async (auditId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/exports/pdf/${auditId}`, {
        method: 'GET',
      });
      
      if (!response.ok) throw new Error('Failed to download PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-${auditId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };

  const handleDownloadCSV = async (auditId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/exports/csv/${auditId}`, {
        method: 'GET',
      });
      
      if (!response.ok) throw new Error('Failed to download CSV');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-${auditId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Error downloading CSV');
    }
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Audit Responses</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search audits..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  style={{ 
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: 'none'
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="clientAZ">Client Name (A-Z)</option>
                  <option value="clientZA">Client Name (Z-A)</option>
                  <option value="status">Status</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {filteredAudits.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No responses found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {audit.templateName}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Created: {format(new Date(audit.createdAt), 'PPpp')}
                      </p>
                      {audit.completedAt && (
                        <p className="text-sm text-gray-500">
                          Completed: {format(new Date(audit.completedAt), 'PPpp')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(audit.id)}
                        className="p-2 text-blue-500 hover:text-blue-700"
                        title="Edit Audit"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(audit.id)}
                        className="p-2 text-red-500 hover:text-red-700"
                        title="Delete Audit"
                      >
                        <Trash2 size={20} />
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadWord(audit.id)}
                          className="p-2 text-blue-500 hover:text-blue-700"
                          title="Download Word"
                        >
                          <Download size={20} />
                          <span className="text-xs">DOCX</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(audit.id)}
                          className="p-2 text-green-500 hover:text-green-700"
                          title="Download PDF"
                        >
                          <Download size={20} />
                          <span className="text-xs">PDF</span>
                        </button>
                        <button
                          onClick={() => handleDownloadCSV(audit.id)}
                          className="p-2 text-yellow-500 hover:text-yellow-700"
                          title="Download CSV"
                        >
                          <Download size={20} />
                          <span className="text-xs">CSV</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormResponses; 