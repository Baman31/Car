import { Button } from "@/components/ui/button";
import { Eye, Download, FileText, ExternalLink } from "lucide-react";

interface PdfViewerProps {
  notes: any[]; // MongoDB note structure
}

export default function PdfViewer({ notes }: PdfViewerProps) {
  const handleView = (note: any) => {
    // Open PDF in new tab for viewing
    window.open(note.pdfUrl, '_blank');
  };

  const handleDownload = (note: any) => {
    // Create a temporary link to download the PDF
    const link = document.createElement('a');
    link.href = note.pdfUrl;
    link.download = `${note.title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="space-y-3">
        {notes.map((note, index) => (
          <div key={note._id || index} className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-gray-900">{note.title}</p>
                <p className="text-sm text-gray-500">
                  PDF Document • {note.fileSize || 'Unknown size'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleView(note)}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload(note)}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open(note.pdfUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No PDF notes available for this course</p>
            <p className="text-xs mt-1">PDF resources will appear here when added by the instructor</p>
          </div>
        )}
      </div>
    </div>
  );
}
