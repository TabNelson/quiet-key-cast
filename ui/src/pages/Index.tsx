import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Footer } from '@/components/Footer';
import { ElectionCard } from '@/components/ElectionCard';
import { CreateElectionDialog } from '@/components/CreateElectionDialog';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useElectionContract, Election } from '@/hooks/useElectionContract';

// Main page component - displays elections and handles wallet connection
const Index = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { getElectionCount, getElection, contractDeployed } = useElectionContract();
  // Store list of elections with their IDs
  const [elections, setElections] = useState<{ id: number; data: Election }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Check if user is on wrong network
  const isWrongNetwork = isConnected && chainId !== 31337 && !contractDeployed;

  // Debug: Log network info
  useEffect(() => {
    if (isConnected) {
      console.log('[Index] Connected - ChainId:', chainId, 'ContractDeployed:', contractDeployed);
    } else {
      console.log('[Index] Not connected - Please connect wallet');
    }
  }, [isConnected, chainId, contractDeployed]);

  const loadElections = async () => {
    if (!contractDeployed) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const count = await getElectionCount();
      const loadedElections: { id: number; data: Election }[] = [];

      for (let i = 0; i < count; i++) {
        const election = await getElection(i);
        loadedElections.push({ id: i, data: election });
      }

      setElections(loadedElections);
    } catch (error) {
        toast.error("Failed to load elections");
      console.error('Error loading elections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && contractDeployed) {
      loadElections();
    } else {
      setElections([]);
      setLoading(false);
    }
  }, [isConnected, contractDeployed]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Hero />
        
        <Features />

        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Elections</h2>
                <p className="text-muted-foreground">
                  {isConnected 
                    ? 'Participate in anonymous elections powered by FHE'
                    : 'Connect your wallet to view and participate in elections'}
                </p>
              </div>
              {isConnected && contractDeployed && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Election
                </Button>
              )}
            </div>

            {!isConnected ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Please connect your wallet to view elections
                </p>
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-4">
                  <strong>Note:</strong> This app uses Fully Homomorphic Encryption (FHE) for secure,
                  anonymous voting. All votes are encrypted before submission and remain private.
                </div>
              </div>
            ) : !contractDeployed ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isWrongNetwork ? 'Wrong Network' : 'Contract Not Deployed'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isWrongNetwork 
                    ? `You're connected to Chain ID ${chainId}, but the contract is deployed on localhost (Chain ID: 31337).`
                    : 'The election contract is not deployed on this network.'}
                </p>
                <div className="text-sm text-muted-foreground space-y-2">
                  {isWrongNetwork ? (
                    <>
                      <p><strong>Current Network:</strong> Chain ID {chainId}</p>
                      <p><strong>Required Network:</strong> Localhost (Chain ID: 31337)</p>
                      <div className="mt-4">
                        <Button 
                          onClick={() => switchChain({ chainId: 31337 })}
                          className="mb-4"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Switch to Localhost Network
                        </Button>
                      </div>
                      <p className="text-xs mt-4">
                        <strong>Don't have localhost network?</strong> Add it to MetaMask:
                      </p>
                      <code className="block bg-muted p-2 rounded mt-2 text-left text-xs">
                        Network Name: Localhost 8545<br />
                        RPC URL: http://localhost:8545<br />
                        Chain ID: 31337<br />
                        Currency Symbol: ETH
                      </code>
                    </>
                  ) : (
                    <>
                      <p><strong>Current Network:</strong> Chain ID {chainId}</p>
                      <p className="mt-4">To deploy the contract:</p>
                      <code className="block bg-muted p-2 rounded mt-2 text-left">
                        # Terminal 1: Start Hardhat node<br />
                        npx hardhat node<br />
                        <br />
                        # Terminal 2: Deploy contract<br />
                        npx hardhat deploy --network localhost
                      </code>
                      <p className="mt-4 text-xs">
                        <strong>Note:</strong> Make sure you're connected to the localhost network (Chain ID: 31337) in your wallet.
                      </p>
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-4">
                  <strong>Note:</strong> This app uses Fully Homomorphic Encryption (FHE) for secure,
                  anonymous voting. All votes are encrypted before submission and remain private.
                </div>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : elections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No elections found. Create the first one!
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Election
                </Button>
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-4">
                  <strong>Note:</strong> This app uses Fully Homomorphic Encryption (FHE) for secure,
                  anonymous voting. All votes are encrypted before submission and remain private.
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {elections.map((election) => (
                  <ElectionCard
                    key={election.id}
                    electionId={election.id}
                    election={election.data}
                    onUpdate={loadElections}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </section>
      </main>

      <Footer />

      <CreateElectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadElections}
      />
    </div>
  );
};

export default Index;
