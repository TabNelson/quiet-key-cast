import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, History, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';
import { toast } from 'sonner';

// Import contract utilities
import {
  getContractAddress,
  isContractDeployed,
  getEntryCount,
  getEntry
} from '@/lib/contract';
import { BrowserProvider } from 'ethers';

interface RatingEntry {
  id: number;
  subject: string;
  timestamp: number;
  submitter: string;
  isActive: boolean;
}

export const RatingHistory = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [entries, setEntries] = useState<RatingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalEntries, setTotalEntries] = useState<number>(0);

  const contractDeployed = isContractDeployed(chainId);
  const contractAddress = getContractAddress(chainId);

  const loadRatingHistory = useCallback(async () => {
    if (!isConnected || !contractDeployed || !contractAddress) {
      return;
    }

    setLoading(true);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const entryCount = await getEntryCount(provider, Number(chainId));
      setTotalEntries(entryCount);

      // Load last 20 entries (or all if less than 20)
      const entriesToLoad = Math.min(entryCount, 20);
      const loadedEntries: RatingEntry[] = [];

      for (let i = Math.max(0, entryCount - entriesToLoad); i < entryCount; i++) {
        try {
          const entry = await getEntry(provider, i, Number(chainId));
          loadedEntries.push({
            id: i,
            subject: entry.subject,
            timestamp: Number(entry.timestamp),
            submitter: entry.submitter,
            isActive: entry.isActive
          });
        } catch (entryError) {
          console.warn(`Failed to load entry ${i}:`, entryError);
          // Continue loading other entries
        }
      }

      // Sort by timestamp (newest first)
      loadedEntries.sort((a, b) => b.timestamp - a.timestamp);
      setEntries(loadedEntries);

    } catch (error: any) {
      console.error('Error loading rating history:', error);
      toast.error('Failed to load rating history');
    } finally {
      setLoading(false);
    }
  }, [isConnected, contractDeployed, contractAddress, chainId]);

  useEffect(() => {
    if (isConnected && contractDeployed) {
      loadRatingHistory();
    } else {
      setEntries([]);
      setTotalEntries(0);
    }
  }, [isConnected, chainId, contractDeployed]);

  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  }, []);

  const getTrendIcon = useCallback((index: number) => {
    if (index === 0) return <Minus className="h-4 w-4 text-gray-400" />;
    // This is a simplified trend - in real implementation you'd compare with previous entries
    return Math.random() > 0.5 ?
      <TrendingUp className="h-4 w-4 text-green-500" /> :
      <TrendingDown className="h-4 w-4 text-red-500" />;
  }, []);

  const truncateAddress = useCallback((addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  const displayedEntriesText = useMemo(() => {
    return `Showing last ${Math.min(entries.length, 20)} of ${totalEntries} total entries`;
  }, [entries.length, totalEntries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Rating History
        </CardTitle>
        <CardDescription>
          Recent rating submissions across all subjects
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected && (
          <Alert>
            <AlertDescription>
              Please connect your wallet to view rating history.
            </AlertDescription>
          </Alert>
        )}

        {isConnected && !contractDeployed && (
          <Alert variant="destructive">
            <AlertDescription>
              Contract not deployed on this network. Rating history is unavailable.
            </AlertDescription>
          </Alert>
        )}

        {isConnected && contractDeployed && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {displayedEntriesText}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRatingHistory}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {loading && entries.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading rating history...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No ratings submitted yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Be the first to submit a rating and see it appear here!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getTrendIcon(index)}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{entry.subject}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:flex-shrink-0">
                      <Badge variant={entry.isActive ? "default" : "secondary"} className="text-xs">
                        {entry.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[80px] sm:max-w-none">
                        {truncateAddress(entry.submitter)}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RatingHistory;
