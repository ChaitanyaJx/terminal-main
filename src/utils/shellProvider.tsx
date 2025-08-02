// src/utils/shellProvider.tsx
import React, { useCallback, useEffect } from 'react';
import { History } from '../interfaces/history';
import * as bin from './bin';
import { useTheme } from './themeProvider';

const isTrackingEnabled = process.env.NEXT_PUBLIC_ENABLE_TRACKING === 'true';

declare global {
  interface Window {
    umami: {
      track: (event: string, data?: Record<string, unknown>) => Promise<void>;
    };
  }
}

interface ShellContextType {
  history: History[];
  command: string;
  lastCommandIndex: number;
  catMode: { active: boolean; mode: 'append' | 'write' | null; filePath: string; content: string[] };
  isExecuting: boolean;
  currentCommand: string;

  setHistory: (output: string) => void;
  setCommand: (command: string) => void;
  setLastCommandIndex: (index: number) => void;
  execute: (command: string) => Promise<void>;
  clearHistory: () => void;
  handleCatInput: (input: string) => void;
  exitCatMode: () => void;
}

const ShellContext = React.createContext<ShellContextType>(null);

interface ShellProviderProps {
  children: React.ReactNode;
}

export const useShell = () => React.useContext(ShellContext);

export const ShellProvider: React.FC<ShellProviderProps> = ({ children }) => {
  const [init, setInit] = React.useState(true);
  const [history, _setHistory] = React.useState<History[]>([]);
  const [command, _setCommand] = React.useState<string>('');
  const [lastCommandIndex, _setLastCommandIndex] = React.useState<number>(0);
  const [isExecuting, setIsExecuting] = React.useState<boolean>(false);
  const [currentCommand, setCurrentCommand] = React.useState<string>('');
  const [catMode, setCatMode] = React.useState<{
    active: boolean;
    mode: 'append' | 'write' | null;
    filePath: string;
    content: string[];
  }>({
    active: false,
    mode: null,
    filePath: '',
    content: []
  });
  const { setTheme } = useTheme();

  const setHistory = useCallback(
    (output: string) => {
      _setHistory((h) => [
        ...h,
        {
          id: h.length,
          date: new Date(),
          command: command.split(' ').slice(1).join(' '),
          output,
        },
      ]);
    },
    [command],
  );

  const setCommand = useCallback((command: string) => {
    const commandText = command;
    setCurrentCommand(commandText);
    _setCommand([Date.now(), command].join(' '));
    setInit(false);
  }, []);

  const clearHistory = useCallback(() => {
    _setHistory([]);
  }, []);

  const setLastCommandIndex = useCallback((index: number) => {
    _setLastCommandIndex(index);
  }, []);

  const handleCatInput = useCallback((input: string) => {
    if (!catMode.active) return;

    setCatMode(prev => ({
      ...prev,
      content: [...prev.content, input]
    }));
  }, [catMode.active]);

  const exitCatMode = useCallback(async () => {
    if (!catMode.active) return;

    const content = catMode.content.join('\n');
    let result = '';

    try {
      if (catMode.mode === 'append') {
        const { catAppendToFile } = await import('./bin/filesystem');
        result = catAppendToFile(catMode.filePath, content);
      } else if (catMode.mode === 'write') {
        const { catWriteToFile } = await import('./bin/filesystem');
        result = catWriteToFile(catMode.filePath, content);
      }

      if (result) {
        setHistory(result);
      }
    } catch (error) {
      setHistory(`Error: ${error.message}`);
    }

    setCatMode({
      active: false,
      mode: null,
      filePath: '',
      content: []
    });
  }, [catMode, setHistory]);

  const execute = useCallback(async () => {
    const [cmd, ...args] = command.split(' ').slice(1);
    
    // Set executing state
    setIsExecuting(true);

    if (isTrackingEnabled) {
      window.umami.track(`command - ${cmd}`, {
        args: args.join(' '),
      });
    }

    try {
      switch (cmd) {
        case 'theme': {
          const output = await bin.theme(args, setTheme);
          setHistory(output);
          break;
        }

        case 'clear':
          clearHistory();
          break;
        case '':
          setHistory('');
          break;
        default: {
          if (Object.keys(bin).indexOf(cmd) === -1) {
            setHistory(`Command not found: ${cmd}. Try 'help' to get started.`);
          } else {
            try {
              const output = await bin[cmd](args);

              // Check for cat interactive mode
              if (output.startsWith('__CAT_APPEND_MODE__:')) {
                const filePath = output.replace('__CAT_APPEND_MODE__:', '');
                setCatMode({
                  active: true,
                  mode: 'append',
                  filePath,
                  content: []
                });
                setHistory('Enter content (press Ctrl+D or Ctrl+C to save and exit):');
              } else if (output.startsWith('__CAT_WRITE_MODE__:')) {
                const filePath = output.replace('__CAT_WRITE_MODE__:', '');
                setCatMode({
                  active: true,
                  mode: 'write',
                  filePath,
                  content: []
                });
                setHistory('Enter content (press Ctrl+D or Ctrl+C to save and exit):');
              } else {
                setHistory(output);
              }
            } catch (error) {
              setHistory(error.message);
            }
          }
        }
      }
    } finally {
      // Reset executing state and current command
      setIsExecuting(false);
      setCurrentCommand('');
    }
  }, [command, setTheme, setHistory, clearHistory]);

  useEffect(() => {
    setCommand('banner');
  }, [setCommand]);

  useEffect(() => {
    if (!init) {
      execute();
    }
  }, [command, init, execute]);

  return (
    <ShellContext.Provider
      value={{
        history,
        command,
        lastCommandIndex,
        catMode,
        isExecuting,
        currentCommand,
        setHistory,
        setCommand,
        setLastCommandIndex,
        execute,
        clearHistory,
        handleCatInput,
        exitCatMode,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
};