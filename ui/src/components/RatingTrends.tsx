import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
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

interface RatingData {
  timestamp: number;
  rating: number;
  subject: string;
}

export const RatingTrends = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [entries, setEntries] = useState<RatingData[]>([]);
  const [loading, setLoading] = useState(false);

  const contractDeployed = isContractDeployed(chainId);
  const contractAddress = getContractAddress(chainId);

  const loadRatingTrends = async () => {
    if (!isConnected || !contractDeployed || !contractAddress) {
      return;
    }

    setLoading(true);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const entryCount = await getEntryCount(provider, Number(chainId));
      const maxEntries = Math.min(entryCount, 50); // Limit to last 50 entries for performance

      const loadedEntries: RatingData[] = [];

      for (let i = Math.max(0, entryCount - maxEntries); i < entryCount; i++) {
        try {
          const entry = await getEntry(provider, i, Number(chainId));
          if (entry.isActive) {
            loadedEntries.push({
              timestamp: Number(entry.timestamp),
              rating: 0, // We can't decrypt individual ratings, but we can show trends
              subject: entry.subject
            });
          }
        } catch (entryError) {
          console.warn(`Failed to load entry ${i}:`, entryError);
        }
      }

      setEntries(loadedEntries);

    } catch (error: any) {
      console.error('Error loading rating trends:', error);
      toast.error('Failed to load rating trends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && contractDeployed) {
      loadRatingTrends();
    } else {
      setEntries([]);
    }
  }, [isConnected, chainId, contractDeployed]);

  const chartData = useMemo(() => {
    // Group entries by date
    const groupedByDate: { [key: string]: { date: string; count: number; subjects: string[] } } = {};

    entries.forEach(entry => {
      const date = new Date(entry.timestamp * 1000).toLocaleDateString();
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date, count: 0, subjects: [] };
      }
      groupedByDate[date].count++;
      if (!groupedByDate[date].subjects.includes(entry.subject)) {
        groupedByDate[date].subjects.push(entry.subject);
      }
    });

    return Object.values(groupedByDate).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [entries]);

  const subjectDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    entries.forEach(entry => {
      distribution[entry.subject] = (distribution[entry.subject] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 subjects
  }, [entries]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Date: ${label}`}</p>
          <p className="text-primary">
            {`Ratings: ${payload[0].value}`}
          </p>
          {payload[0].payload.subjects && (
            <p className="text-sm text-muted-foreground">
              {`Subjects: ${payload[0].payload.subjects.join(', ')}`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Rating Activity Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Rating Activity Timeline
          </CardTitle>
          <CardDescription>
            Daily rating submissions over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected && (
            <Alert>
              <AlertDescription>
                Please connect your wallet to view rating trends.
              </AlertDescription>
            </Alert>
          )}

          {isConnected && !contractDeployed && (
            <Alert variant="destructive">
              <AlertDescription>
                Contract not deployed on this network. Rating trends are unavailable.
              </AlertDescription>
            </Alert>
          )}

          {isConnected && contractDeployed && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading rating trends...</p>
                </div>
              ) : chartData.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No rating data available yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Submit some ratings to see trends appear here!
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Subject Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Subject Distribution
          </CardTitle>
          <CardDescription>
            Most rated subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected && contractDeployed && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading subject distribution...</p>
                </div>
              ) : subjectDistribution.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No subject data available.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectDistribution} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey="subject"
                      type="category"
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} ratings`, 'Count']}
                      labelFormatter={(label) => `Subject: ${label}`}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RatingTrends;
