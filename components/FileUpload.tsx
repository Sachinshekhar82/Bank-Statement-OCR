
import React, { useState, useCallback } from 'react';
import { UploadIcon, FileIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
      onFileSelect(fileArray);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [onFileSelect]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragging) setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  return (
    <div
      className={`relative w-full p-8 border-2 border-dashed rounded-lg transition-colors duration-300 ${
        dragging ? 'border-blue-400 bg-gray-800' : 'border-gray-600 hover:border-gray-500'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDrop={!disabled ? handleDrop : undefined}
      onDragOver={!disabled ? handleDragOver : undefined}
      onDragLeave={!disabled ? handleDragLeave : undefined}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        disabled={disabled}
        multiple
      />
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
        {selectedFiles.length > 0 ? (
            <>
                <FileIcon className="w-12 h-12 text-blue-400" />
                <p className="text-lg font-medium text-gray-200">{selectedFiles.length} file(s) selected</p>
                <div className="w-full max-w-sm max-h-24 overflow-y-auto text-sm text-gray-400 bg-gray-900/50 p-2 rounded-md">
                    <ul className="list-disc list-inside">
                        {selectedFiles.map((file) => (
                            <li key={file.name} className="truncate">{file.name}</li>
                        ))}
                    </ul>
                </div>
            </>
        ) : (
            <>
                <UploadIcon className="w-12 h-12 text-gray-500" />
                <p className="text-lg font-medium text-gray-300">
                    <span className="text-blue-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-500">PDFs or Images (PNG, JPG)</p>
            </>
        )}
      </label>
    </div>
  );
};

export default FileUpload;