
import React from 'react';

interface LoaderProps {
  totalFiles?: number;
  processedFiles?: number;
  statusMessage?: string;
}

const Loader: React.FC<LoaderProps> = ({ totalFiles, processedFiles, statusMessage }) => {
  const showProgress = typeof totalFiles === 'number' && typeof processedFiles === 'number';
  const progressPercentage = showProgress && totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 w-full">
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent border-solid rounded-full animate-spin"></div>
      <p className="text-lg text-gray-300 font-medium text-center">
        {statusMessage || 'Analyzing statement...'}
      </p>
      
      {showProgress && (
        <div className="w-full max-w-md">
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            {`Completed ${processedFiles} of ${totalFiles} files.`}
          </p>
        </div>
      )}

      {!showProgress && (
        <p className="text-sm text-gray-500">
          This may take a moment, especially for multi-page PDFs.
        </p>
      )}
    </div>
  );
};

export default Loader;
