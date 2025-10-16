import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  Description as FileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useDocuments, useApplicationDocuments } from '@/hooks/useDocuments';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { DocumentType } from '@/types/api.types';
import {
  DOCUMENT_TYPE_LABELS,
  MANDATORY_APPLICATION_DOCUMENTS,
  CONDITIONAL_DOCUMENTS,
  getFilenameWithoutExtension,
} from '@/utils/documentHelpers';

interface ApplicationDocumentsProps {
  applicationId: number;
  missingMandatoryDocuments: string[];
}

export const ApplicationDocuments: React.FC<ApplicationDocumentsProps> = ({
  applicationId,
  missingMandatoryDocuments,
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  
  // Form state
  const [customTitle, setCustomTitle] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('application_for_testing');
  const [file, setFile] = useState<File | null>(null);

  const { data: documents, isLoading } = useApplicationDocuments(applicationId);
  const {
    uploadDocument,
    isUploading,
    deleteDocument,
    isDeleting,
    downloadDocument,
  } = useDocuments();

  // Название из файла (без расширения)
  const fileBasedTitle = file ? getFilenameWithoutExtension(file.name) : '';

  const handleUploadOpen = () => {
    setDocumentType('application_for_testing');
    setCustomTitle('');
    setFile(null);
    setUploadDialogOpen(true);
  };

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    // Сбрасываем кастомное название, чтобы использовать имя файла
    setCustomTitle('');
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    try {
      await uploadDocument({
        documentType,
        file,
        applicationId,
        customTitle: customTitle || undefined,
      });
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleDelete = (documentId: number) => {
    setSelectedDocumentId(documentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedDocumentId) {
      try {
        await deleteDocument(selectedDocumentId);
        setDeleteDialogOpen(false);
        setSelectedDocumentId(null);
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      await downloadDocument(doc);
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  const hasMissingMandatory = missingMandatoryDocuments.length > 0;

  return (
    <Box>
      {/* Missing Mandatory Documents Alert */}
      {hasMissingMandatory && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Отсутствуют обязательные документы ({missingMandatoryDocuments.length}):
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
            {missingMandatoryDocuments.map((docType) => (
              <li key={docType}>
                <Typography variant="body2">
                  {DOCUMENT_TYPE_LABELS[docType as DocumentType] || docType}
                </Typography>
              </li>
            ))}
          </Box>
        </Alert>
      )}

      {/* Upload Button */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          startIcon={<UploadIcon />}
          variant="contained"
          onClick={handleUploadOpen}
        >
          Загрузить документ
        </Button>
      </Box>

      {/* Documents List */}
      {!documents || !Array.isArray(documents) || documents.length === 0 ? (
        <Alert severity="info">
          Документы еще не загружены. Нажмите кнопку "Загрузить документ" для добавления.
        </Alert>
      ) : (
        <List>
          {documents.map((document) => (
            <ListItem
              key={document.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
              }}
              secondaryAction={
                <Box display="flex" gap={1}>
                  <IconButton
                    edge="end"
                    onClick={() => handleDownload(document)}
                    title="Скачать"
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDelete(document.id)}
                    title="Удалить"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemIcon>
                <FileIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box component="span" display="flex" alignItems="center" gap={1}>
                    <Typography component="span" variant="subtitle1">{document.title}</Typography>
                    {document.is_mandatory && (
                      <Chip
                        label="Обязательный"
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: 'text.secondary', color: 'text.secondary' }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box component="span">
                    <Typography component="span" variant="body2" color="text.secondary" display="block">
                      Тип: {DOCUMENT_TYPE_LABELS[document.document_type]}
                    </Typography>
                    <Typography component="span" variant="caption" color="text.secondary" display="block">
                      Загружен: {new Date(document.uploaded_at).toLocaleString('ru-RU')} • 
                      {document.uploaded_by_name && ` ${document.uploaded_by_name}`}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Загрузить документ</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Тип документа */}
            <TextField
              select
              label="Тип документа"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              fullWidth
              required
            >
              {/* Обязательные */}
              <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                ⭐ Обязательные документы
              </MenuItem>
              {MANDATORY_APPLICATION_DOCUMENTS.map((type) => (
                <MenuItem key={type} value={type} sx={{ pl: 3 }}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </MenuItem>
              ))}
              
              {/* Условно обязательные */}
              <MenuItem disabled sx={{ fontWeight: 'bold', color: 'warning.main', mt: 1 }}>
                ⚠️ Условно обязательные
              </MenuItem>
              {CONDITIONAL_DOCUMENTS.map((type) => (
                <MenuItem key={type} value={type} sx={{ pl: 3 }}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </MenuItem>
              ))}
              
              {/* Прочие */}
              <MenuItem disabled sx={{ fontWeight: 'bold', color: 'text.secondary', mt: 1 }}>
                📋 Прочие
              </MenuItem>
              <MenuItem value="other" sx={{ pl: 3 }}>
                {DOCUMENT_TYPE_LABELS.other}
              </MenuItem>
            </TextField>

            {/* Выбор файла */}
            <Box>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<UploadIcon />}
              >
                {file ? file.name : 'Выбрать файл'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tif,.tiff"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileChange(selectedFile);
                  }}
                />
              </Button>
              {file && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Размер: {(file.size / 1024).toFixed(2)} КБ
                </Typography>
              )}
            </Box>

            {/* Название документа (из файла или custom) */}
            {file && (
              <TextField
                label="Название документа"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                fullWidth
                placeholder={fileBasedTitle}
                helperText={`По умолчанию: "${fileBasedTitle}"`}
              />
            )}

            {/* Информация о статусе документа */}
            {MANDATORY_APPLICATION_DOCUMENTS.includes(documentType) && (
              <Alert severity="error" icon={<WarningIcon />}>
                ⭐ <strong>Обязательный документ</strong> - требуется для подачи заявки
              </Alert>
            )}
            {CONDITIONAL_DOCUMENTS.includes(documentType) && (
              <Alert severity="warning" icon={<WarningIcon />}>
                ⚠️ <strong>Условно обязательный</strong> - требуется в определенных случаях
                {documentType === 'right_to_submit' && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    Нужен если заявитель - посредник или правопреемник
                  </Typography>
                )}
                {documentType === 'gmo_free' && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    Нужен если сорт иностранной селекции
                  </Typography>
                )}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            disabled={!file || isUploading}
          >
            {isUploading ? <CircularProgress size={24} /> : 'Загрузить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Удалить документ?"
        message="Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить."
        confirmColor="error"
        confirmText={isDeleting ? 'Удаление...' : 'Удалить'}
      />
    </Box>
  );
};

