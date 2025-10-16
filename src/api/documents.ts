import apiClient from './client';
import type { Document, CreateDocumentRequest, DocumentType } from '@/types/api.types';

export const documentsService = {
  // Get all documents with optional filters
  getAll: async (params?: Record<string, any>): Promise<Document[]> => {
    const { data } = await apiClient.get<{ count: number; results: Document[] }>('/documents/', { params });
    return data.results;
  },

  // Get a single document by ID
  getById: async (id: number): Promise<Document> => {
    const { data } = await apiClient.get<Document>(`/documents/${id}/`);
    return data;
  },

  // Upload a new document
  upload: async (payload: CreateDocumentRequest): Promise<Document> => {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('document_type', payload.document_type);
    formData.append('is_mandatory', String(payload.is_mandatory));
    
    if (payload.application) {
      formData.append('application', String(payload.application));
    }
    if (payload.trial) {
      formData.append('trial', String(payload.trial));
    }
    if (payload.file) {
      formData.append('file', payload.file);
    }

    const { data } = await apiClient.post<Document>('/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // Delete a document
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/documents/${id}/`);
  },

  // Download a document
  download: async (id: number): Promise<Blob> => {
    const { data } = await apiClient.get(`/documents/${id}/download/`, {
      responseType: 'blob',
    });
    return data;
  },

  /**
   * Загрузить документ (название берется из имени файла)
   */
  uploadFromFile: async (
    documentType: DocumentType,
    file: File,
    context: {
      applicationId?: number;
      trialId?: number;
    },
    customTitle?: string
  ): Promise<Document> => {
    // Используем имя файла без расширения как название по умолчанию
    const defaultTitle = customTitle || file.name.replace(/\.[^/.]+$/, '');

    const payload: CreateDocumentRequest = {
      title: defaultTitle,
      document_type: documentType,
      file,
      is_mandatory: ['application_for_testing', 'breeding_questionnaire', 'variety_description', 'plant_photo_with_ruler'].includes(documentType),
      application: context.applicationId,
      trial: context.trialId,
    };

    return documentsService.upload(payload);
  },

  /**
   * Получить документы заявки
   */
  getApplicationDocuments: async (applicationId: number): Promise<Document[]> => {
    return documentsService.getAll({ application: applicationId });
  },

  /**
   * Получить документы испытания
   */
  getTrialDocuments: async (trialId: number): Promise<Document[]> => {
    return documentsService.getAll({ trial: trialId });
  },
};
