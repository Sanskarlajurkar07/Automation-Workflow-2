import { useState, useEffect, useRef, useCallback } from 'react';
import { useFlowStore } from '../store/flowStore';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const useVariableInput = ({ value, onChange }: VariableInputProps) => {
  const [showVarBuilder, setShowVarBuilder] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { nodes, edges } = useFlowStore();
  
  // Check if the user typed '{{' to trigger the variable builder
  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const input = e.currentTarget;
    const curPos = input.selectionStart;
    const text = input.value;
    
    // Check if the last two characters are '{{'
    if (curPos >= 2 && text.substring(curPos - 2, curPos) === '{{') {
      setCursorPosition(curPos);
      setShowVarBuilder(true);
    }
  }, []);
  
  // Function to insert the variable at cursor position
  const insertVariable = useCallback((variable: string) => {
    if (cursorPosition === null || !inputRef.current) return;
    
    // Remove the {{ that triggered the variable builder
    const newValue = value.substring(0, cursorPosition - 2) + variable + value.substring(cursorPosition);
    onChange(newValue);
    setShowVarBuilder(false);
    
    // Set focus back to the input after inserting the variable
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = cursorPosition - 2 + variable.length;
        inputRef.current.selectionEnd = cursorPosition - 2 + variable.length;
      }
    }, 0);
  }, [cursorPosition, value, onChange]);
  
  // Function to get connected nodes
  const getConnectedNodes = useCallback((nodeId: string) => {
    // Find incoming edges to this node
    return edges
      .filter(edge => edge.target === nodeId)
      .map(edge => edge.source)
      .map(sourceId => nodes.find(node => node.id === sourceId))
      .filter(node => node !== undefined);
  }, [nodes, edges]);
  
  // Close variable builder when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showVarBuilder && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowVarBuilder(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVarBuilder]);
  
  return {
    inputRef,
    showVarBuilder,
    setShowVarBuilder,
    handleKeyUp,
    insertVariable,
    getConnectedNodes
  };
}; 