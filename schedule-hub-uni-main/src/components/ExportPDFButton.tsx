import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExportPDFButtonProps {
  groupNumber: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportPDFButton({ groupNumber, variant = "outline", size = "default" }: ExportPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await api.downloadSchedulePDF(groupNumber);
      toast.success(`Расписание группы ${groupNumber} успешно экспортировано`);
    } catch (error) {
      console.error('Ошибка экспорта PDF:', error);
      toast.error('Не удалось экспортировать расписание в PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isLoading || !groupNumber}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Экспорт...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Экспорт в PDF
        </>
      )}
    </Button>
  );
}

