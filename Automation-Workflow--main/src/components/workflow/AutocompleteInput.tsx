import React, { useState, useRef, useEffect } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { ChevronDown, Variable } from 'lucide-react';
import { useTheme } from '../../utils/themeProvider';

interface Variable {
  nodeId: string;
  field: string;
  label: string;
  description: string;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  multiline = false,
  rows = 3
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Get nodes from the flow store
  const nodes = useFlowStore(state => state.nodes);
  
  // Generate variables from nodes
  const variables: Variable[] = React.useMemo(() => {
    const vars: Variable[] = [];
    
    nodes.forEach(node => {
      // Default fields based on node type
      let fields: string[] = ['output'];
      let description = 'Node output';
      
      // Customize based on node type
      if (node.type === 'input') {
        fields = ['text'];
        description = 'Text input from this node';
      } else if (node.type.includes('openai') || node.type.includes('anthropic') || node.type.includes('gemini')) {
        fields = ['response', 'full_response'];
        description = 'AI model response';
      } else if (node.type === 'transform') {
        fields = ['output', 'transformed_text'];
        description = 'Transformed text output';
      } else if (node.type === 'kb-search') {
        fields = ['results', 'metadata'];
        description = 'Knowledge base search results';
      }
      
      // Use node data for fields if available
      if (node.data?.outputFields) {
        fields = node.data.outputFields;
      }
      
      const nodeId = node.id.includes('_') 
        ? node.id 
        : `${node.type}_${node.id.replace(`${node.type}-`, '')}`;
      
      const nodeLabel = node.data?.label || nodeId;
      
      fields.forEach(field => {
        vars.push({
          nodeId,
          field,
          label: `${nodeLabel} (${field})`,
          description
        });
      });
    });
    
    return vars;
  }, [nodes]);
  
  // Find the current token being typed (for variable suggestion)
  const getCurrentToken = (text: string, position: number): string => {
    // Look for {{ in the text before the cursor
    const textBeforeCursor = text.slice(0, position);
    const openBraceIndex = textBeforeCursor.lastIndexOf('{{');
    
    // If we find {{ and don't find a closing }} between it and the cursor
    if (openBraceIndex !== -1) {
      const closeBraceIndex = textBeforeCursor.indexOf('}}', openBraceIndex);
      if (closeBraceIndex === -1) {
        // Extract what's being typed after {{
        return textBeforeCursor.slice(openBraceIndex + 2).trim();
      }
    }
    
    return '';
  };
  
  // Get filtered suggestions based on what's being typed
  const filteredSuggestions = React.useMemo(() => {
    if (!suggestionFilter) return variables;
    
    // Filter variables that match the current token
    return variables.filter(variable => {
      const searchText = `${variable.nodeId}.${variable.field}`.toLowerCase();
      return searchText.includes(suggestionFilter.toLowerCase());
    });
  }, [variables, suggestionFilter]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Update cursor position
    if (inputRef.current) {
      setCursorPosition(e.target.selectionStart || 0);
    }
    
    // Check if we're in a variable context
    const currentToken = getCurrentToken(newValue, e.target.selectionStart || 0);
    setSuggestionFilter(currentToken);
    
    // Show suggestions if we're typing a variable
    setShowSuggestions(currentToken.length > 0);
    setActiveSuggestion(0);
  };
  
  // Insert a variable at the current cursor position
  const insertVariable = (variable: Variable) => {
    if (!inputRef.current) return;
    
    const varText = `${variable.nodeId}.${variable.field}}`;
    
    // Find the position to insert the variable (after the last {{)
    const textBeforeCursor = value.slice(0, cursorPosition);
    const openBraceIndex = textBeforeCursor.lastIndexOf('{{');
    
    if (openBraceIndex !== -1) {
      // Replace text between {{ and cursor with the variable
      const newValue = 
        value.slice(0, openBraceIndex + 2) + 
        " " + varText + 
        value.slice(cursorPosition);
      
      onChange(newValue);
      
      // Set the cursor position after the inserted variable
      const newPosition = openBraceIndex + varText.length + 3; // +3 for {{ and space
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          (inputRef.current as HTMLInputElement).setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
    
    // Hide suggestions
    setShowSuggestions(false);
  };
  
  // Handle special keys (arrow keys, enter, escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // If no suggestions or suggestions not shown, just return
    if (!showSuggestions || filteredSuggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredSuggestions[activeSuggestion]) {
          insertVariable(filteredSuggestions[activeSuggestion]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case '{':
        // If the user types {, check if they've already typed { before it
        if (value[cursorPosition - 1] === '{') {
          // Open suggestions
          setShowSuggestions(true);
        }
        break;
      default:
        break;
    }
  };
  
  // Close suggestions panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Autofocus on suggestion when it changes
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const activeElement = suggestionsRef.current.querySelector(
        `[data-index="${activeSuggestion}"]`
      );
      
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [activeSuggestion, showSuggestions]);
  
  // Show tooltip when input is focused and hide after 3 seconds
  useEffect(() => {
    if (isFocused && !showSuggestions) {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFocused, showSuggestions]);
  
  // Render the input (textarea or input based on multiline prop)
  const renderInput = () => {
    const inputProps = {
      ref: inputRef as any,
      value,
      onChange: handleInputChange,
      onKeyDown: handleKeyDown,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      placeholder,
      className: `w-full rounded-md px-3 py-2 ${
        isLight 
          ? 'bg-white border-gray-300 text-gray-900 focus:border-blue-500' 
          : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500'
      } border focus:ring-1 focus:ring-blue-500 outline-none ${className}`
    };
    
    return multiline ? (
      <textarea 
        {...inputProps}
        rows={rows}
      />
    ) : (
      <input
        type="text"
        {...inputProps}
      />
    );
  };
  
  return (
    <div className="relative w-full">
      {renderInput()}
      
      {/* Type indicator tooltip */}
      {showTooltip && (
        <div className={`absolute left-0 -top-8 z-10 p-2 rounded-md shadow-md text-xs animate-pulse ${
          isLight 
            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
            : 'bg-blue-900/30 text-blue-300 border border-blue-800/30'
        }`}>
          <div className="flex items-center">
            <Variable className="h-3 w-3 mr-1" />
            Type <code className="mx-1 px-1 bg-blue-50 dark:bg-blue-900/50 rounded">{'{{'}</code> 
            to insert variables
          </div>
        </div>
      )}
      
      {/* Variable suggestion button - with improved styling */}
      <button
        type="button"
        onClick={() => {
          // When clicking this button, insert {{ to trigger suggestion
          const newValue = value.slice(0, cursorPosition) + '{{ ' + value.slice(cursorPosition);
          onChange(newValue);
          setShowSuggestions(true);
          
          // Focus the input and place cursor after {{ 
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              const newCursorPos = cursorPosition + 3; // +3 for {{ and space
              (inputRef.current as HTMLInputElement).setSelectionRange(newCursorPos, newCursorPos);
              setCursorPosition(newCursorPos);
            }
          }, 0);
        }}
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md ${
          isLight 
            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200' 
            : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 border border-blue-800/30'
        } flex items-center group`}
        title="Insert variable"
      >
        <Variable className="h-4 w-4 mr-1" />
        <span className="text-xs">Variables</span>
        <ChevronDown className="h-3 w-3 ml-1 group-hover:animate-bounce" />
      </button>
      
      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md py-1 ${
            isLight 
              ? 'bg-white text-gray-900 shadow-lg border border-gray-200' 
              : 'bg-slate-900 text-slate-100 shadow-lg border border-slate-700'
          }`}
        >
          <div className={`px-3 py-2 text-xs font-medium ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            Available variables {filteredSuggestions.length > 0 && `(${filteredSuggestions.length})`}
          </div>
          
          {filteredSuggestions.map((variable, index) => (
            <div
              key={`${variable.nodeId}.${variable.field}`}
              data-index={index}
              className={`px-3 py-2 cursor-pointer ${
                index === activeSuggestion 
                  ? (isLight ? 'bg-blue-100' : 'bg-blue-900/30') 
                  : 'hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
              onClick={() => insertVariable(variable)}
            >
              <div className="font-medium">
                {variable.nodeId}.{variable.field}
              </div>
              <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                {variable.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput; 