import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDialogProps {
  globalStats: { average: number; count: number; finalized: boolean } | null;
  leadershipStats: { average: number; count: number; finalized: boolean } | null;
  decryptedGlobalTotal: bigint;
  decryptedGlobalCount: bigint;
  decryptedLeadershipTotal: bigint;
  decryptedLeadershipCount: bigint;
}

export const ExportDialog = ({
  globalStats,
  leadershipStats,
  decryptedGlobalTotal,
  decryptedGlobalCount,
  decryptedLeadershipTotal,
  decryptedLeadershipCount
}: ExportDialogProps) => {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [includeGlobal, setIncludeGlobal] = useState(true);
  const [includeLeadership, setIncludeLeadership] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async () => {
    if (!includeGlobal && !includeLeadership) {
      toast.error('Please select at least one data type to export');
      return;
    }

    setIsExporting(true);

    try {
      const exportData: any = {
        timestamp: new Date().toISOString(),
        exportedAt: new Date().toLocaleString(),
        data: {}
      };

      if (includeGlobal) {
        exportData.data.global = {
          total: decryptedGlobalTotal.toString(),
          count: decryptedGlobalCount.toString(),
          average: decryptedGlobalCount > 0n ? Number(decryptedGlobalTotal) / Number(decryptedGlobalCount) : 0,
          finalized: globalStats?.finalized || false
        };
      }

      if (includeLeadership) {
        exportData.data.leadership = {
          total: decryptedLeadershipTotal.toString(),
          count: decryptedLeadershipCount.toString(),
          average: decryptedLeadershipCount > 0n ? Number(decryptedLeadershipTotal) / Number(decryptedLeadershipCount) : 0,
          finalized: leadershipStats?.finalized || false
        };
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(exportData, null, 2);
        filename = `rating-data-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // CSV format
        const headers = ['Category', 'Total', 'Count', 'Average', 'Finalized'];
        const rows = [];

        if (includeGlobal) {
          rows.push([
            'Global',
            exportData.data.global.total,
            exportData.data.global.count,
            exportData.data.global.average.toFixed(2),
            exportData.data.global.finalized ? 'Yes' : 'No'
          ]);
        }

        if (includeLeadership) {
          rows.push([
            'Leadership',
            exportData.data.leadership.total,
            exportData.data.leadership.count,
            exportData.data.leadership.average.toFixed(2),
            exportData.data.leadership.finalized ? 'Yes' : 'No'
          ]);
        }

        content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        filename = `rating-data-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Data exported successfully as ${format.toUpperCase()}`);

    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Rating Data</DialogTitle>
          <DialogDescription>
            Export your rating statistics in JSON or CSV format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Export Format</Label>
            <Select value={format} onValueChange={(value: 'json' | 'csv') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Data to Include</Label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="global"
                checked={includeGlobal}
                onCheckedChange={setIncludeGlobal}
              />
              <Label htmlFor="global" className="text-sm">
                Global Statistics
                {decryptedGlobalCount > 0n && (
                  <span className="text-muted-foreground ml-2">
                    ({decryptedGlobalCount.toString()} ratings)
                  </span>
                )}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="leadership"
                checked={includeLeadership}
                onCheckedChange={setIncludeLeadership}
              />
              <Label htmlFor="leadership" className="text-sm">
                Leadership Statistics
                {decryptedLeadershipCount > 0n && (
                  <span className="text-muted-foreground ml-2">
                    ({decryptedLeadershipCount.toString()} ratings)
                  </span>
                )}
              </Label>
            </div>
          </div>

          <Button
            onClick={exportData}
            disabled={isExporting || (!includeGlobal && !includeLeadership)}
            className="w-full"
          >
            {isExporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
