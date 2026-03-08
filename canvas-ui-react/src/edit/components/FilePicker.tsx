/**
 * File Picker Component
 * Input field with browse button that opens FileManager in selection mode
 */

import { FolderOpen } from '@mui/icons-material';
import { Box, Button, TextField } from '@mui/material';
import React, { useState } from 'react';
import { FileManager } from './FileManager';

interface FilePickerProps {
  label: string;
  value: string;
  onChange: (filePath: string) => void;
  description?: string;
}

export const FilePicker: React.FC<FilePickerProps> = ({ 
  label, 
  value, 
  onChange,
  description 
}) => {
  const [fileManagerOpen, setFileManagerOpen] = useState(false);

  const handleFileSelect = (filePath: string) => {
    onChange(filePath);
    setFileManagerOpen(false);
  };

  // Extract directory from current path for initialPath
  const initialPath = value 
    ? value.substring(0, value.lastIndexOf('/')) || '/config/www'
    : '/config/www';

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
        <TextField
          fullWidth
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          helperText={description}
        />
        <Button 
          variant="outlined" 
          onClick={() => setFileManagerOpen(true)}
          sx={{ minWidth: 100, height: 40 }}
          startIcon={<FolderOpen />}
        >
          Browse
        </Button>
      </Box>
      
      <FileManager
        open={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        mode="select"
        onFileSelect={handleFileSelect}
        initialPath={initialPath}
      />
    </>
  );
};
