import React, { useState } from 'react';
import { 
  Folder, 
  FileText, 
  Search, 
  Plus, 
  Download, 
  Trash2, 
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

export function DocumentsPage() {
  const [search, setSearch] = useState('');
  
  const mockDocuments = [
    { id: 'doc-1', name: 'GST_Registration_Certificate.pdf', type: 'PDF', size: '2.4 MB', folder: 'Legal', date: '2026-05-12' },
    { id: 'doc-2', name: 'PAN_Card_Corporate.pdf', type: 'PDF', size: '1.1 MB', folder: 'Legal', date: '2026-05-12' },
    { id: 'doc-3', name: 'Employee_Onboarding_Handbook.docx', type: 'DOCX', size: '4.8 MB', folder: 'HRMS', date: '2026-06-20' },
    { id: 'doc-4', name: 'Attendance_Policy_2026.pdf', type: 'PDF', size: '840 KB', folder: 'HRMS', date: '2026-07-01' },
    { id: 'doc-5', name: 'Railway_Bid_Spec_Final.zip', type: 'ZIP', size: '42.6 MB', folder: 'Tenders', date: '2026-07-14' },
    { id: 'doc-6', name: 'Customer_Agreement_Stripe.pdf', type: 'PDF', size: '3.2 MB', folder: 'CRM', date: '2026-06-05' },
  ];

  const filteredDocs = mockDocuments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.folder.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (name: string) => {
    toast.success(`Downloading ${name}...`);
  };

  const handleUpload = () => {
    toast.success('Upload simulation triggered. Select a file from directory.');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold text-muted-foreground/80">Employee & Corporate Ledger</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">Document Repository</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Stored Files</p>
          <p className="text-2xl font-bold tracking-tight mt-2">56 Files</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storage Allocated</p>
          <p className="text-2xl font-bold tracking-tight mt-2">124.5 MB / 10 GB</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Security Encryption</p>
          <p className="text-2xl font-bold tracking-tight mt-2 text-success">AES-256 Enabled</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search document registry..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 border-border text-xs rounded-lg"
          />
        </div>
        <Button variant="default" size="sm" onClick={handleUpload} className="h-9 gap-1.5 text-xs font-semibold bg-primary text-white">
          <Plus className="h-4 w-4" />
          <span>Upload File</span>
        </Button>
      </div>

      {/* Document Grid/Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 font-semibold text-xs text-muted-foreground">
          System File Index
        </div>
        <div className="divide-y divide-border/60">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Folder: <span className="text-foreground font-semibold">{doc.folder}</span> &bull; {doc.size} &bull; Uploaded {doc.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.name)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toast.error('Purging requires Supervisor approval')} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-xs text-muted-foreground font-medium">
              No files matched search filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentsPage;
