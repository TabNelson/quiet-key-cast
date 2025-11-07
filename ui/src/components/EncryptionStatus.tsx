import { Shield, Lock, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

const EncryptionStatus = () => {
  const statusItems = [
    { icon: Shield, label: "Vault Sealed", status: "Active", color: "text-primary" },
    { icon: Lock, label: "Encryption", status: "AES-256", color: "text-accent" },
    { icon: Check, label: "Files Protected", status: "0", color: "text-primary" },
  ];

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-8">
          {statusItems.map((item, index) => (
            <Card key={index} className="bg-transparent border-none shadow-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.status}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default EncryptionStatus;
