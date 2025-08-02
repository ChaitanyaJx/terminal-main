// src/components/input/Input.tsx
import React, { useEffect, useState } from 'react';
import { commandExists } from '../../utils/commandExists';
import { useShell } from '../../utils/shellProvider';
import { handleTabCompletion } from '../../utils/tabCompletion';
import { useTheme } from '../../utils/themeProvider';
import { Ps1 } from '../ps1';

export const Input = ({ inputRef, containerRef }) => {
  const { theme } = useTheme();
  const [value, setValue] = useState('');
  const {
    setCommand,
    history,
    lastCommandIndex,
    setHistory,
    setLastCommandIndex,
    clearHistory,
    catMode,
    handleCatInput,
    exitCatMode,
    isExecuting,
    currentCommand,
  } = useShell();

  useEffect(() => {
    containerRef.current.scrollTo(0, containerRef.current.scrollHeight);
  }, [history, containerRef]);

  const onSubmit = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    const commands: string[] = history
      .map(({ command }) => command)
      .filter((value: string) => value);

    // Prevent ALL input if command is executing (except for cat mode)
    if (isExecuting && !catMode.active) {
      event.preventDefault();
      return;
    }

    // Handle cat mode
    if (catMode.active) {
      if ((event.key === 'c' && event.ctrlKey) || (event.key === 'd' && event.ctrlKey)) {
        event.preventDefault();
        await exitCatMode();
        setValue('');
        return;
      }

      if (event.key === 'Enter' || event.code === '13') {
        event.preventDefault();
        handleCatInput(value);
        setValue('');
        return;
      }

      // Allow normal typing in cat mode
      return;
    }

    // Normal shell mode - only allow if NOT executing
    if (event.key === 'c' && event.ctrlKey) {
      event.preventDefault();
      setValue('');
      setHistory('');
      setLastCommandIndex(0);
    }

    if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      clearHistory();
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      handleTabCompletion(value, setValue);
    }

    if (event.key === 'Enter' || event.code === '13') {
      event.preventDefault();
      setLastCommandIndex(0);
      setCommand(value);
      setValue('');
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (!commands.length) {
        return;
      }

      const index: number = lastCommandIndex + 1;

      if (index <= commands.length) {
        setLastCommandIndex(index);
        setValue(commands[commands.length - index]);
      }
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (!commands.length) {
        return;
      }

      const index: number = lastCommandIndex - 1;

      if (index > 0) {
        setLastCommandIndex(index);
        setValue(commands[commands.length - index]);
      } else {
        setLastCommandIndex(0);
        setValue('');
      }
    }
  };

  const getPromptColor = () => {
    if (catMode.active) {
      return theme.cyan; // Different color for cat mode
    }
    if (isExecuting) {
      return theme.yellow; // Yellow when executing
    }
    return commandExists(value) || value === '' ? theme.green : theme.red;
  };

  const getInputValue = () => {
    if (isExecuting) {
      return ''; // Clear input when executing
    }
    return value;
  };

  const getPlaceholder = () => {
    if (catMode.active) {
      return 'Enter content... (Ctrl+C or Ctrl+D to save)';
    }
    if (isExecuting) {
      return 'Executing command...';
    }
    return '';
  };

  // Show PS1 with disabled input during execution
  if (isExecuting && !catMode.active) {
    return (
      <div className="flex flex-row space-x-2">
        <label htmlFor="prompt" className="flex-shrink">
          <Ps1 />
        </label>
        <span 
          className="flex-grow"
          style={{
            color: theme.yellow,
            fontStyle: 'italic'
          }}
        >
          Executing...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-row space-x-2">
      <label htmlFor="prompt" className="flex-shrink">
        {catMode.active ? (
          <span style={{ color: theme.cyan }}>cat&gt;</span>
        ) : (
          <Ps1 />
        )}
      </label>

      <input
        ref={inputRef}
        id="prompt"
        type="text"
        className="focus:outline-none flex-grow"
        aria-label="prompt"
        style={{
          backgroundColor: theme.background,
          color: getPromptColor(),
        }}
        value={getInputValue()}
        onChange={(event) => {
          // Only allow changes if not executing
          if (!isExecuting || catMode.active) {
            setValue(event.target.value);
          }
        }}
        autoFocus
        onKeyDown={onSubmit}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder={getPlaceholder()}
        disabled={isExecuting && !catMode.active}
        readOnly={isExecuting && !catMode.active}
      />
    </div>
  );
};

export default Input;