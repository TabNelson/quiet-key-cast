import { ConnectButton } from '@rainbow-me/rainbowkit';
import logo from "/rating-system-logo.svg";
import DarkModeToggle from './DarkModeToggle';

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Encrypted Rating System Logo" className="h-12 w-12 animate-glow-pulse" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Encrypted Rating</h1>
            <p className="text-xs text-muted-foreground">Privacy-Preserving System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
