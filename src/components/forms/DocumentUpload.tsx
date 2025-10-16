import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import type { DocumentType } from '@/types/api.types';
import {
  DOCUMENT_TYPE_LABELS,
  MANDATORY_APPLICATION_DOCUMENTS,
  CONDITIONAL_DOCUMENTS,
  getFilenameWithoutExtension,
  isMandatoryDocument,
  isConditionalDocument,
} from '@/utils/documentHelpers';

interface UploadedFile {
  file: File;
  type: DocumentType;
  title: string;
}

interface DocumentUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  onValidationChange: (isValid: boolean) => void;
  initialFiles?: UploadedFile[];
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onFilesChange,
  onValidationChange,
  initialFiles = [],
}) => {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [selectedType, setSelectedType] = useState<DocumentType>('application_for_testing');

  // Синхронизация с родительским компонентом при возврате на шаг
  React.useEffect(() => {
    if (initialFiles.length > 0 && files.length === 0) {
      setFiles(initialFiles);
    }
  }, [initialFiles]);

  // Проверяем, все ли обязательные документы загружены
  const uploadedTypes = files.map((f) => f.type);
  const missingTypes = MANDATORY_APPLICATION_DOCUMENTS.filter(
    (type) => !uploadedTypes.includes(type)
  );
  const isValid = missingTypes.length === 0;

  // Уведомляем родителя об изменениях
  React.useEffect(() => {
    onFilesChange(files);
    onValidationChange(isValid);
  }, [files, isValid, onFilesChange, onValidationChange]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем, не загружен ли уже документ этого типа (кроме "other")
    if (selectedType !== 'other' && uploadedTypes.includes(selectedType)) {
      alert('Документ этого типа уже загружен. Удалите предыдущий, если хотите заменить.');
      event.target.value = ''; // Сбрасываем input
      return;
    }

    // Автоматически добавляем документ после выбора файла
    const title = getFilenameWithoutExtension(file.name);
    
    const newFile: UploadedFile = {
      file: file,
      type: selectedType,
      title: title,
    };

    setFiles([...files, newFile]);
    
    // Сбрасываем input
    event.target.value = '';
    
    // Автоматически переключаемся на следующий обязательный тип
    const nextMissingType = MANDATORY_APPLICATION_DOCUMENTS.find(
      (type) => type !== selectedType && !uploadedTypes.includes(type)
    );
    if (nextMissingType) {
      setSelectedType(nextMissingType);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Загрузка документов
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Загрузите все необходимые документы для заявки
      </Typography>

      {/* Форма загрузки */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            {/* Тип документа */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Тип документа</InputLabel>
                <Select
                  value={selectedType}
                  label="Тип документа"
                  onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                >
                  {/* Обязательные */}
                  <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main', opacity: 1 }}>
                    ⭐ Обязательные документы
                  </MenuItem>
                  {MANDATORY_APPLICATION_DOCUMENTS.map((type) => (
                    <MenuItem key={type} value={type} sx={{ pl: 3 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <span>{DOCUMENT_TYPE_LABELS[type]}</span>
                        {uploadedTypes.includes(type) && (
                          <CheckIcon fontSize="small" color="success" />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                  
                  {/* Условно обязательные */}
                  <MenuItem disabled sx={{ fontWeight: 'bold', color: 'warning.main', mt: 1, opacity: 1 }}>
                    ⚠️ Условно обязательные
                  </MenuItem>
                  {CONDITIONAL_DOCUMENTS.map((type) => (
                    <MenuItem key={type} value={type} sx={{ pl: 3 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <span>{DOCUMENT_TYPE_LABELS[type]}</span>
                        {uploadedTypes.includes(type) && (
                          <CheckIcon fontSize="small" color="success" />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                  
                  {/* Прочие */}
                  <MenuItem disabled sx={{ fontWeight: 'bold', color: 'text.secondary', mt: 1, opacity: 1 }}>
                    📋 Прочие документы
                  </MenuItem>
                  <MenuItem value="other" sx={{ pl: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <span>{DOCUMENT_TYPE_LABELS.other}</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Выбор файла - автоматически добавляется после выбора */}
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                component="label"
                fullWidth
                startIcon={<UploadIcon />}
                sx={{ height: 56 }}
              >
                Выбрать файл
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Список загруженных документов */}
      {files.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom fontWeight={500}>
            Загруженные документы ({files.length})
          </Typography>
          <List>
            {files.map((item, index) => (
              <ListItem
                key={index}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveFile(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <FileIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{item.title}</span>
                      {isMandatoryDocument(item.type) && (
                        <Chip label="Обязательный" size="small" color="primary" />
                      )}
                      {isConditionalDocument(item.type) && (
                        <Chip label="Условный" size="small" color="warning" />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" component="span" display="block">
                        Тип: {DOCUMENT_TYPE_LABELS[item.type]}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="span" display="block">
                        Файл: {item.file.name} ({(item.file.size / 1024).toFixed(1)} КБ)
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Статус загрузки */}
      <Box>
        {missingTypes.length > 0 ? (
          <Alert severity="warning">
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Отсутствуют обязательные документы ({missingTypes.length}):
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              {missingTypes.map((type) => (
                <li key={type}>
                  <Typography variant="body2">
                    {DOCUMENT_TYPE_LABELS[type]}
                  </Typography>
                </li>
              ))}
            </Box>
          </Alert>
        ) : (
          <Alert severity="success" icon={<CheckIcon />}>
            <Typography variant="subtitle2" fontWeight="bold">
              ✅ Все обязательные документы загружены!
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Вы можете перейти к следующему шагу
            </Typography>
          </Alert>
        )}
      </Box>
    </Box>
  );
};

