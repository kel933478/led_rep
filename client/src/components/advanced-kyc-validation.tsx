import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileCheck, 
  FileX, 
  Upload, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface KYCValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
  };
}

export default function AdvancedKYCValidation({ onFileValidated }: { onFileValidated: (file: File, validation: KYCValidationResult) => void }) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<KYCValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MIN_FILE_SIZE = 50 * 1024; // 50KB

  const validateFile = async (file: File): Promise<KYCValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`Type de fichier non autorisé. Types acceptés: PDF, JPEG, PNG`);
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`Fichier trop volumineux. Taille maximale: 10MB`);
    }

    if (file.size < MIN_FILE_SIZE) {
      errors.push(`Fichier trop petit. Taille minimale: 50KB`);
    }

    // File name validation
    if (file.name.length > 255) {
      errors.push(`Nom de fichier trop long (max 255 caractères)`);
    }

    // Warning for very large files
    if (file.size > 5 * 1024 * 1024) {
      warnings.push(`Fichier volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB). Temps d'upload potentiellement long.`);
    }

    // PDF specific validation
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const header = uint8Array.slice(0, 4);
        const pdfSignature = Array.from(header).map(byte => String.fromCharCode(byte)).join('');
        
        if (!pdfSignature.startsWith('%PDF')) {
          errors.push(`Fichier PDF corrompu ou invalide`);
        }
      } catch (error) {
        errors.push(`Erreur lors de la validation du PDF`);
      }
    }

    // Image specific validation
    if (file.type.startsWith('image/')) {
      try {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            // Check minimum dimensions
            if (img.width < 300 || img.height < 300) {
              warnings.push(`Image de faible résolution (${img.width}x${img.height}). Recommandé: 300x300 minimum`);
            }
            
            // Check aspect ratio
            const aspectRatio = img.width / img.height;
            if (aspectRatio < 0.5 || aspectRatio > 2) {
              warnings.push(`Ratio d'aspect inhabituel. Vérifiez que le document est bien cadré.`);
            }
            
            resolve(img);
          };
          img.onerror = () => reject(new Error('Image invalide'));
          img.src = URL.createObjectURL(file);
        });
      } catch (error) {
        errors.push(`Image corrompue ou invalide`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    };
  };

  const handleFile = async (file: File) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const validation = await validateFile(file);
      setValidationResult(validation);

      if (validation.isValid) {
        onFileValidated(file, validation);
        toast({
          title: "Fichier validé",
          description: "Le document KYC a été validé avec succès",
        });
      } else {
        toast({
          title: "Validation échouée",
          description: "Le fichier ne respecte pas les critères requis",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de validation",
        description: "Erreur lors de la validation du fichier",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Glissez votre document KYC ici
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          ou cliquez pour sélectionner un fichier
        </p>
        <input
          type="file"
          onChange={handleFileInput}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          id="kyc-file-input"
        />
        <Button asChild variant="outline">
          <label htmlFor="kyc-file-input" className="cursor-pointer">
            Sélectionner un fichier
          </label>
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          PDF, JPEG, PNG - Max 10MB
        </p>
      </div>

      {/* Validation Progress */}
      {isValidating && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <FileCheck className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Validation en cours...</span>
          </div>
          <Progress value={75} className="w-full" />
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-3">
          {/* File Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">{validationResult.fileInfo.name}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Taille: {formatFileSize(validationResult.fileInfo.size)}</p>
              <p>Type: {validationResult.fileInfo.type}</p>
            </div>
          </div>

          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <div key={index}>• {warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {validationResult.isValid && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Document validé avec succès. Toutes les vérifications sont passées.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}