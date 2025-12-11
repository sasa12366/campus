import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successDetails, setSuccessDetails] = useState<string>('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFiles = files.filter(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (excelFiles.length > 0) {
      handleFileUpload(excelFiles);
    } else {
      setUploadStatus('error');
      setErrorMessage('Пожалуйста, загрузите файлы Excel (.xlsx или .xls)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    setUploadedFiles(files);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');
    setSuccessDetails('');

    try {
      console.log('Загрузка файлов:', files.map(f => f.name));
      
      // Имитируем прогресс загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      // Отправляем файлы на сервер
      const result = await api.importExcel(files);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log('Результат импорта:', result);
      setUploadStatus('success');
      setSuccessDetails(`Успешно обработано ${files.length} файл(ов). Данные импортированы в систему.`);
      
    } catch (error) {
      console.error('Ошибка загрузки Excel:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Ошибка при обработке файла');
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setUploadedFiles([]);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
    setSuccessDetails('');
  };

  return (
    <div className="space-y-6">
      {/* Upload Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p><strong>Формат файла:</strong> Excel (.xlsx или .xls)</p>
            <p><strong>Структура:</strong> Файл должен содержать колонки: Дисциплина, Тип, Преподаватель, Аудитория, День недели, Время начала, Время окончания, Четность недели</p>
            <p><strong>Результат:</strong> Автоматическое создание расписания, групп, преподавателей и предметов</p>
            <p><strong>Поддержка:</strong> Можно загружать несколько файлов одновременно</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Импорт расписания из Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              uploadStatus === 'idle' && "hover:border-primary hover:bg-primary/5 cursor-pointer"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => uploadStatus === 'idle' && document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploadStatus !== 'idle'}
            />

            {uploadStatus === 'idle' && (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Перетащите Excel файлы сюда</p>
                  <p className="text-sm text-muted-foreground">или нажмите для выбора файлов</p>
                  <p className="text-xs text-muted-foreground mt-1">Поддерживается загрузка нескольких файлов</p>
                </div>
                <Button variant="outline">
                  Выбрать файлы
                </Button>
              </div>
            )}

            {uploadStatus === 'uploading' && uploadedFiles.length > 0 && (
              <div className="space-y-4">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-primary animate-pulse" />
                <div>
                  <p className="text-lg font-medium">Обработка файлов...</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadedFiles.map(f => f.name).join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Импорт данных в базу данных
                  </p>
                </div>
                <div className="w-full max-w-xs mx-auto">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center mt-1">{uploadProgress}%</p>
                </div>
              </div>
            )}

            {uploadStatus === 'success' && uploadedFiles.length > 0 && (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <p className="text-lg font-medium text-green-700">Файлы успешно обработаны!</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadedFiles.map(f => f.name).join(', ')}
                  </p>
                  {successDetails && (
                    <p className="text-sm text-green-600 mt-2">
                      {successDetails}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={resetUpload} variant="outline">
                    Загрузить другие файлы
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Обновить страницу
                  </Button>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="space-y-4">
                <XCircle className="h-12 w-12 mx-auto text-destructive" />
                <div>
                  <p className="text-lg font-medium text-destructive">Ошибка обработки</p>
                  <p className="text-sm text-muted-foreground">
                    {errorMessage || 'Проверьте формат файла и структуру данных'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Убедитесь, что файл содержит все необходимые колонки
                  </p>
                </div>
                <Button onClick={resetUpload} variant="outline">
                  Попробовать снова
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-medium text-blue-800">💡 Советы по импорту:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Убедитесь, что все колонки присутствуют и правильно названы</li>
              <li>Время указывайте в формате ЧЧ:ММ (например, 09:40)</li>
              <li>Дни недели на русском языке (ПОНЕДЕЛЬНИК, ВТОРНИК и т.д.)</li>
              <li>Четность: ЧИСЛИТЕЛЬ, ЗНАМЕНАТЕЛЬ или ВСЕГДА</li>
              <li>При ошибках проверьте консоль браузера для подробностей</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}