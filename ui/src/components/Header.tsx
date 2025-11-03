import { ConnectButton } from '@rainbow-me/rainbowkit';
import logo from "/rating-system-logo.svg";
import DarkModeToggle from './DarkModeToggle';

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="responsive-container py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={logo}
              alt="Encrypted Rating System Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-glow-pulse"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                Encrypted Rating
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Privacy-Preserving System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <DarkModeToggle />
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
            <div className="sm:hidden">
              <ConnectButton.Custom>
                {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                  if (!mounted) return null;
                  return (
                    <button
                      onClick={account ? openAccountModal : openConnectModal}
                      className="btn-responsive text-xs"
                    >
                      {account ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Connect'}
                    </button>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
