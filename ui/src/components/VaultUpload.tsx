import { Upload, Lock, FileText, Download, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { encryptFile, decryptFile as decryptFileUtil } from "@/lib/encryption";
import PasswordDialog from "./PasswordDialog";
import { useToast } from "@/hooks/use-toast";

interface EncryptedFile {
  id: string;
  name: string;
  size: number;
  encryptedBlob: Blob;
  timestamp: number;
}

const VaultUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<EncryptedFile[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [decryptFile, setDecryptFile] = useState<EncryptedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles && selectedFiles[0]) {
      setPendingFile(selectedFiles[0]);
      setShowPasswordDialog(true);
    }
  };

  const handleEncrypt = async (password: string) => {
    if (!pendingFile) return;

    try {
      const encrypted = await encryptFile(pendingFile, password);
      const newFile: EncryptedFile = {
        id: Date.now().toString(),
        name: pendingFile.name,
        size: pendingFile.size,
        encryptedBlob: encrypted,
        timestamp: Date.now(),
      };

      setFiles([...files, newFile]);
      toast({
        title: "File Encrypted",
        description: `${pendingFile.name} has been encrypted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Encryption Failed",
        description: "Failed to encrypt the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPendingFile(null);
      setShowPasswordDialog(false);
    }
  };

  const handleDecrypt = async (password: string) => {
    if (!decryptFile) return;

    try {
      const decrypted = await decryptFileUtil(decryptFile.encryptedBlob, password);
      const blob = new Blob([decrypted]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = decryptFile.name;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "File Decrypted",
        description: `${decryptFile.name} has been decrypted and downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Decryption Failed",
        description: "Invalid password or corrupted file.",
        variant: "destructive",
      });
    } finally {
      setDecryptFile(null);
      setShowPasswordDialog(false);
    }
  };

  const handleDelete = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
    toast({
      title: "File Deleted",
      description: "Encrypted file has been removed.",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary mb-4">
            <Lock className="h-8 w-8 text-primary animate-glow-pulse" />
          </div>
          <h3 className="text-3xl font-bold mb-2">Secure Document Vault</h3>
          <p className="text-muted-foreground">Upload and encrypt your sensitive files</p>
        </div>

        <Card 
          className={`p-12 border-2 transition-all duration-300 ${
            isDragging 
              ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(59,217,227,0.3)]' 
              : 'border-dashed border-border hover:border-primary/50'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileSelect(e.dataTransfer.files);
          }}
        >
          <div className="text-center">
            <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-xl font-semibold mb-2">Drop files to upload</h4>
            <p className="text-muted-foreground mb-6">or click to browse from your device</p>
            <Button
              variant="hero"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Files
            </Button>
          </div>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h5 className="font-semibold mb-1">Multi-Format Support</h5>
                <p className="text-sm text-muted-foreground">PDF, DOC, XLS, images and more</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h5 className="font-semibold mb-1">Military-Grade Encryption</h5>
                <p className="text-sm text-muted-foreground">AES-256 encryption standard</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h5 className="font-semibold mb-1">Instant Processing</h5>
                <p className="text-sm text-muted-foreground">Upload and encrypt in seconds</p>
              </div>
            </div>
          </Card>
        </div>

        {files.length > 0 && (
          <div className="mt-12">
            <h4 className="text-2xl font-bold mb-6">Encrypted Files</h4>
            <div className="space-y-4">
              {files.map((file) => (
                <Card
                  key={file.id}
                  className="p-6 bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Lock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-lg">{file.name}</h5>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • Encrypted on{" "}
                          {new Date(file.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => {
                          setDecryptFile(file);
                          setShowPasswordDialog(true);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Decrypt
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          setShowPasswordDialog(open);
          if (!open) {
            setPendingFile(null);
            setDecryptFile(null);
          }
        }}
        onSubmit={decryptFile ? handleDecrypt : handleEncrypt}
        title={decryptFile ? "Decrypt File" : "Encrypt File"}
        description={
          decryptFile
            ? "Enter the password to decrypt and download this file."
            : "Enter a password to encrypt this file. Remember it for decryption."
        }
      />
    </div>
  );
};

export default VaultUpload;
