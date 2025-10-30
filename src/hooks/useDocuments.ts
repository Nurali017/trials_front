import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsService } from '@/api/documents';
import type { Document, DocumentType } from '@/types/api.types';

interface UploadDocumentParams {
  documentType: DocumentType;
  file: File;
  applicationId?: number;
  trialId?: number;
  customTitle?: string;
  onUploadProgress?: (progressEvent: any) => void;
}

export function useDocuments() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Загрузка документа (название = имя файла)
  const uploadDocument = useMutation({
    mutationFn: async (params: UploadDocumentParams) => {
      setUploadProgress(0);
      const result = await documentsService.uploadFromFile(
        params.documentType,
        params.file,
        {
          applicationId: params.applicationId,
          trialId: params.trialId,
        },
        params.customTitle,
        params.onUploadProgress
      );
      setUploadProgress(100);
      return result;
    },
    onSuccess: (_, variables) => {
      // Инвалидируем кеш для списка документов
      if (variables.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ['documents', 'application', variables.applicationId],
        });
        queryClient.invalidateQueries({
          queryKey: ['applications', variables.applicationId],
        });
      }
      if (variables.trialId) {
        queryClient.invalidateQueries({
          queryKey: ['documents', 'trial', variables.trialId],
        });
      }
    },
    onError: () => {
      setUploadProgress(0);
    },
  });

  // Удаление документа
  const deleteDocument = useMutation({
    mutationFn: (id: number) => documentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['trials'] });
    },
  });

  // Скачивание документа
  const downloadDocument = async (doc: Document) => {
    try {
      const blob = await documentsService.download(doc.id);
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Извлекаем имя файла из пути
      const filename = doc.file.split('/').pop() || 'document';
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем память
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
      throw error;
    }
  };

  return {
    uploadDocument: uploadDocument.mutate,
    uploadDocumentAsync: uploadDocument.mutateAsync,
    isUploading: uploadDocument.isPending,
    uploadProgress,
    deleteDocument: deleteDocument.mutate,
    deleteDocumentAsync: deleteDocument.mutateAsync,
    isDeleting: deleteDocument.isPending,
    downloadDocument,
  };
}

// Хук для получения документов заявки
export function useApplicationDocuments(applicationId: number | undefined) {
  return useQuery({
    queryKey: ['documents', 'application', applicationId],
    queryFn: () => documentsService.getApplicationDocuments(applicationId!),
    enabled: !!applicationId,
  });
}

// Хук для получения документов испытания
export function useTrialDocuments(trialId: number | undefined) {
  return useQuery({
    queryKey: ['documents', 'trial', trialId],
    queryFn: () => documentsService.getTrialDocuments(trialId!),
    enabled: !!trialId,
  });
}
