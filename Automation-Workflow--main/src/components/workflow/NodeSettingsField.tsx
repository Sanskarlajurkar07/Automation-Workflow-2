import React from 'react';
import { Copy, PlusCircle, Trash } from 'lucide-react';
import { useTheme } from '../../utils/themeProvider';
import AutocompleteInput from './AutocompleteInput';

interface NodeSettingsFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  description?: string;
  placeholder?: string;
  required?: boolean;
  variableSupport?: boolean;
  copyButton?: boolean;
  onCopy?: () => void;
  className?: string;
}

export const NodeSettingsField: React.FC<NodeSettingsFieldProps> = ({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  description,
  placeholder,
  required = false,
  variableSupport = false,
  copyButton = false,
  onCopy,
  className = ''
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
        
        {copyButton && (
          <button
            type="button"
            onClick={onCopy}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {variableSupport ? (
        <AutocompleteInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          multiline={multiline}
          rows={rows}
          className={`${isLight ? 'bg-white' : 'bg-slate-900'}`}
        />
      ) : (
        <>
          {multiline ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={rows}
              className={`w-full px-3 py-2 border ${
                isLight 
                  ? 'bg-white border-gray-300 text-gray-900' 
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder={placeholder}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full px-3 py-2 border ${
                isLight 
                  ? 'bg-white border-gray-300 text-gray-900' 
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder={placeholder}
            />
          )}
        </>
      )}
    </div>
  );
};

export default NodeSettingsField; 