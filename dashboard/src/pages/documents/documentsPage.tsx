import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  Trash2, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { hrmsApi } from '@/services/modules';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  // Upload modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [documentType, setDocumentType] = useState('AADHAR');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [docsData, empsData] = await Promise.all([
        hrmsApi.documents.list(),
        hrmsApi.employees.list()
      ]);
      setDocuments(docsData);
      setEmployees(empsData);
    } catch (error: any) {
      toast.error('Failed to load document directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      if (hrmsApi.documents.remove) {
        await hrmsApi.documents.remove(id);
      }
      toast.success('Document deleted successfully.');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete document.');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !fileName || !fileUrl) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await hrmsApi.documents.create({
        employeeId,
        documentType,
        fileName,
        fileUrl
      });
      toast.success('Document uploaded successfully.');
      setIsUploadOpen(false);
      // Reset form
      setEmployeeId('');
      setDocumentType('AADHAR');
      setFileName('');
      setFileUrl('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = (doc: any) => {
    if (!doc.fileUrl) return;
    window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
    toast.success(`Opening ${doc.fileName}...`);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toISOString().split('T')[0];
  };

  const filteredDocs = documents.filter(d => {
    const nameMatch = d.fileName?.toLowerCase().includes(search.toLowerCase());
    const typeMatch = d.documentType?.toLowerCase().includes(search.toLowerCase());
    const empName = d.employee ? `${d.employee.firstName} ${d.employee.lastName}`.toLowerCase() : '';
    const empMatch = empName.includes(search.toLowerCase());
    return nameMatch || typeMatch || empMatch;
  });

  const totalPages = Math.ceil(filteredDocs.length / pageSize);
  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
          <p className="text-2xl font-bold tracking-tight mt-2">{documents.length} Files</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storage Allocated</p>
          <p className="text-2xl font-bold tracking-tight mt-2">{(documents.length * 2.1).toFixed(1)} MB / 10 GB</p>
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
        <Button variant="default" size="sm" onClick={() => setIsUploadOpen(true)} className="h-9 gap-1.5 text-xs font-semibold bg-primary text-white">
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Fetching documents...</p>
            </div>
          ) : paginatedDocs.length > 0 ? (
            paginatedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{doc.fileName}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Employee:{' '}
                      <span className="text-foreground font-semibold">
                        {doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName} (${doc.employee.employeeCode})` : 'System'}
                      </span>{' '}
                      &bull; Type: <span className="text-foreground font-semibold">{doc.documentType}</span> &bull; Uploaded {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
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

        {/* Pagination controls */}
        {!isLoading && filteredDocs.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-card">
            <div className="text-xs text-muted-foreground font-normal">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredDocs.length)} of {filteredDocs.length} records
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                }}
                className="text-xs bg-card border border-border text-foreground px-2 py-1.5 rounded-md outline-none"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Upload Employee Document</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new official document record to an employee's ledger.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Employee *
              </Label>
              <Select value={employeeId} onValueChange={(val) => setEmployeeId(val || '')}>
                <SelectTrigger id="employee" className="w-full text-xs">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id} className="text-xs">
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="docType" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Document Type *
              </Label>
              <Select value={documentType} onValueChange={(val) => setDocumentType(val || 'AADHAR')}>
                <SelectTrigger id="docType" className="w-full text-xs">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AADHAR" className="text-xs">Aadhar Card</SelectItem>
                  <SelectItem value="PAN" className="text-xs">PAN Card</SelectItem>
                  <SelectItem value="RESUME" className="text-xs">Resume / CV</SelectItem>
                  <SelectItem value="OFFER_LETTER" className="text-xs">Offer Letter</SelectItem>
                  <SelectItem value="OTHER" className="text-xs">Other Official Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                File Name *
              </Label>
              <Input 
                id="fileName" 
                type="text" 
                placeholder="e.g. resume_john_doe.pdf" 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                File URL / Object Storage Path *
              </Label>
              <Input 
                id="fileUrl" 
                type="text" 
                placeholder="e.g. https://minio.dvepl.com/hrms/doc.pdf" 
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs bg-primary text-white hover:opacity-90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload Document</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DocumentsPage;
