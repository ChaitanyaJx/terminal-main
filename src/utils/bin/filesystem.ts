// src/utils/bin/filesystem.ts

interface FileSystem {
  [path: string]: {
    type: 'file' | 'directory';
    content?: string;
    created: Date;
    modified: Date;
  };
}

// Global current path management
const getCurrentPath = (): string => {
  return localStorage.getItem('currentPath') || '/home/guest';
};

const setCurrentPath = (path: string) => {
  localStorage.setItem('currentPath', path);
  // Trigger a custom event to notify PS1 component
  window.dispatchEvent(new CustomEvent('pathChanged', { detail: path }));
};

// Simple in-memory file system
const getFileSystem = (): FileSystem => {
  const stored = localStorage.getItem('filesystem');
  if (stored) {
    const parsed = JSON.parse(stored);
    // Convert date strings back to Date objects
    Object.keys(parsed).forEach(path => {
      parsed[path].created = new Date(parsed[path].created);
      parsed[path].modified = new Date(parsed[path].modified);
    });
    return parsed;
  }
  
  // Initialize default file system
  const defaultFS = {
    '/': { type: 'directory', created: new Date(), modified: new Date() },
    '/home': { type: 'directory', created: new Date(), modified: new Date() },
    '/home/guest': { type: 'directory', created: new Date(), modified: new Date() },
    '/home/guest/README.md': { 
      type: 'file', 
      content: 'Welcome to the terminal!\n\nTry these commands:\n- ls (list files)\n- mkdir (create directory)\n- touch (create file)\n- cat (read file)\n- tree (show directory structure)\n\nType "help" for more commands.',
      created: new Date(), 
      modified: new Date() 
    },
  } as FileSystem;
  
  saveFileSystem(defaultFS);
  return defaultFS;
};

const saveFileSystem = (fs: FileSystem) => {
  localStorage.setItem('filesystem', JSON.stringify(fs));
};

// Export filesystem helper functions for use by other commands
export { getFileSystem, saveFileSystem, normalizePath, pathExists, isDirectory, isFile };

// Utility functions
const normalizePath = (path: string): string => {
  const currentPath = getCurrentPath();
  
  if (path.startsWith('/')) return path;
  if (path === '~') return '/home/guest';
  if (path.startsWith('~/')) return '/home/guest' + path.slice(1);
  if (path === '..') {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/') || '/';
  }
  if (path.startsWith('../')) {
    const parts = currentPath.split('/').filter(Boolean);
    const upLevels = path.split('/').filter(p => p === '..').length;
    for (let i = 0; i < upLevels; i++) parts.pop();
    const remaining = path.split('/').filter(p => p !== '..' && p !== '').join('/');
    return '/' + parts.join('/') + (remaining ? '/' + remaining : '') || '/';
  }
  return currentPath === '/' ? '/' + path : currentPath + '/' + path;
};

const pathExists = (fs: FileSystem, path: string): boolean => {
  return fs.hasOwnProperty(path);
};

const isDirectory = (fs: FileSystem, path: string): boolean => {
  return fs[path]?.type === 'directory';
};

const isFile = (fs: FileSystem, path: string): boolean => {
  return fs[path]?.type === 'file';
};

// Commands

export const pwd = async (_args: string[]): Promise<string> => {
  return getCurrentPath();
};

export const ls = async (args: string[]): Promise<string> => {
  const fs = getFileSystem();
  const targetPath = args.length > 0 ? normalizePath(args[0]) : getCurrentPath();
  
  if (!pathExists(fs, targetPath)) {
    return `ls: ${targetPath}: No such file or directory`;
  }
  
  if (!isDirectory(fs, targetPath)) {
    return `ls: ${targetPath}: Not a directory`;
  }
  
  const items = Object.keys(fs)
    .filter(path => {
      const pathParts = path.split('/').filter(Boolean);
      const targetParts = targetPath.split('/').filter(Boolean);
      return pathParts.length === targetParts.length + 1 && 
             path.startsWith(targetPath === '/' ? '/' : targetPath + '/');
    })
    .map(path => {
      const name = path.split('/').pop();
      const item = fs[path];
      const color = item.type === 'directory' ? '#87CEEB' : '#F0F8FF';
      return `<span style="color: ${color}">${name}${item.type === 'directory' ? '/' : ''}</span>`;
    });
  
  return items.length > 0 ? items.join('  ') : '';
};

export const cd = async (args: string[]): Promise<string> => {
  const fs = getFileSystem();
  
  if (args.length === 0) {
    setCurrentPath('/home/guest');
    return '';
  }
  
  const targetPath = normalizePath(args[0]);
  
  if (!pathExists(fs, targetPath)) {
    return `cd: ${args[0]}: No such file or directory`;
  }
  
  if (!isDirectory(fs, targetPath)) {
    return `cd: ${args[0]}: Not a directory`;
  }
  
  setCurrentPath(targetPath);
  return '';
};

export const mkdir = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return 'mkdir: missing operand';
  }
  
  const fs = getFileSystem();
  const results: string[] = [];
  
  args.forEach(dirName => {
    const targetPath = normalizePath(dirName);
    
    if (pathExists(fs, targetPath)) {
      results.push(`mkdir: cannot create directory '${dirName}': File exists`);
      return;
    }
    
    // Check if parent directory exists
    const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
    if (!pathExists(fs, parentPath)) {
      results.push(`mkdir: cannot create directory '${dirName}': No such file or directory`);
      return;
    }
    
    fs[targetPath] = {
      type: 'directory',
      created: new Date(),
      modified: new Date()
    };
  });
  
  saveFileSystem(fs);
  return results.join('\n');
};

export const touch = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return 'touch: missing file operand';
  }
  
  const fs = getFileSystem();
  const results: string[] = [];
  
  args.forEach(fileName => {
    const targetPath = normalizePath(fileName);
    
    if (pathExists(fs, targetPath)) {
      if (isDirectory(fs, targetPath)) {
        results.push(`touch: cannot touch '${fileName}': Is a directory`);
        return;
      }
      // Update modification time
      fs[targetPath].modified = new Date();
    } else {
      // Check if parent directory exists
      const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
      if (!pathExists(fs, parentPath)) {
        results.push(`touch: cannot touch '${fileName}': No such file or directory`);
        return;
      }
      
      fs[targetPath] = {
        type: 'file',
        content: '',
        created: new Date(),
        modified: new Date()
      };
    }
  });
  
  saveFileSystem(fs);
  return results.join('\n');
};

export const cat = async (args: string[]): Promise<string> => {
  const fs = getFileSystem();
  const fullCommand = args.join(' ');
  
  // Check for append redirection (cat >> filename)
  const appendMatch = fullCommand.match(/^>>\s*(.+)$/);
  if (appendMatch) {
    const fileName = appendMatch[1].trim();
    const targetPath = normalizePath(fileName);
    
    // Check if parent directory exists
    const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
    if (!pathExists(fs, parentPath)) {
      return `cat: ${fileName}: No such file or directory`;
    }
    
    if (pathExists(fs, targetPath) && isDirectory(fs, targetPath)) {
      return `cat: ${fileName}: Is a directory`;
    }
    
    // Return a special marker that the shell can detect to enter interactive mode
    return `__CAT_APPEND_MODE__:${targetPath}`;
  }
  
  // Check for write redirection (cat > filename)  
  const writeMatch = fullCommand.match(/^>\s*(.+)$/);
  if (writeMatch) {
    const fileName = writeMatch[1].trim();
    const targetPath = normalizePath(fileName);
    
    // Check if parent directory exists
    const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
    if (!pathExists(fs, parentPath)) {
      return `cat: ${fileName}: No such file or directory`;
    }
    
    if (pathExists(fs, targetPath) && isDirectory(fs, targetPath)) {
      return `cat: ${fileName}: Is a directory`;
    }
    
    // Return a special marker that the shell can detect to enter interactive mode
    return `__CAT_WRITE_MODE__:${targetPath}`;
  }
  
  // Regular cat - display file contents
  if (args.length === 0) {
    return 'cat: missing file operand';
  }
  
  const results: string[] = [];
  
  args.forEach(fileName => {
    const targetPath = normalizePath(fileName);
    
    if (!pathExists(fs, targetPath)) {
      results.push(`cat: ${fileName}: No such file or directory`);
      return;
    }
    
    if (isDirectory(fs, targetPath)) {
      results.push(`cat: ${fileName}: Is a directory`);
      return;
    }
    
    results.push(fs[targetPath].content || '');
  });
  
  return results.join('\n');
};

export const echo = async (args: string[]): Promise<string> => {
  const text = args.join(' ');
  
  // Check for redirection
  const redirectMatch = text.match(/^(.+?)\s*>\s*(.+)$/);
  if (redirectMatch) {
    const [, content, fileName] = redirectMatch;
    const fs = getFileSystem();
    const targetPath = normalizePath(fileName.trim());
    
    // Check if parent directory exists
    const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
    if (!pathExists(fs, parentPath)) {
      return `echo: ${fileName}: No such file or directory`;
    }
    
    if (pathExists(fs, targetPath) && isDirectory(fs, targetPath)) {
      return `echo: ${fileName}: Is a directory`;
    }
    
    fs[targetPath] = {
      type: 'file',
      content: content.trim(),
      created: fs[targetPath]?.created || new Date(),
      modified: new Date()
    };
    
    saveFileSystem(fs);
    return '';
  }
  
  return text;
};

export const rm = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return 'rm: missing operand';
  }
  
  const fs = getFileSystem();
  const results: string[] = [];
  const recursive = args.includes('-r') || args.includes('-rf');
  const force = args.includes('-f') || args.includes('-rf');
  
  const filesToRemove = args.filter(arg => !arg.startsWith('-'));
  
  filesToRemove.forEach(fileName => {
    const targetPath = normalizePath(fileName);
    
    if (!pathExists(fs, targetPath)) {
      if (!force) {
        results.push(`rm: cannot remove '${fileName}': No such file or directory`);
      }
      return;
    }
    
    if (isDirectory(fs, targetPath)) {
      if (!recursive) {
        results.push(`rm: cannot remove '${fileName}': Is a directory`);
        return;
      }
      
      // Remove directory and all its contents
      const toRemove = Object.keys(fs).filter(path => 
        path === targetPath || path.startsWith(targetPath + '/')
      );
      toRemove.forEach(path => delete fs[path]);
    } else {
      delete fs[targetPath];
    }
  });
  
  saveFileSystem(fs);
  return results.join('\n');
};

export const tree = async (args: string[]): Promise<string> => {
  const fs = getFileSystem();
  const targetPath = args.length > 0 ? normalizePath(args[0]) : getCurrentPath();
  
  if (!pathExists(fs, targetPath)) {
    return `tree: ${args[0] || '.'}: No such file or directory`;
  }
  
  if (!isDirectory(fs, targetPath)) {
    return `tree: ${args[0] || '.'}: Not a directory`;
  }
  
  const buildTree = (path: string, prefix: string = '', isLast: boolean = true): string[] => {
    const items = Object.keys(fs)
      .filter(p => {
        const pathParts = p.split('/').filter(Boolean);
        const targetParts = path.split('/').filter(Boolean);
        return pathParts.length === targetParts.length + 1 && 
               p.startsWith(path === '/' ? '/' : path + '/');
      })
      .sort();
    
    const result: string[] = [];
    
    items.forEach((itemPath, index) => {
      const isLastItem = index === items.length - 1;
      const name = itemPath.split('/').pop();
      const connector = isLastItem ? '└── ' : '├── ';
      const nextPrefix = prefix + (isLastItem ? '    ' : '│   ');
      
      if (isDirectory(fs, itemPath)) {
        result.push(`${prefix}${connector}<span style="color: #87CEEB">${name}/</span>`);
        result.push(...buildTree(itemPath, nextPrefix, isLastItem));
      } else {
        result.push(`${prefix}${connector}${name}`);
      }
    });
    
    return result;
  };
  
  const tree = [targetPath === '/' ? '/' : targetPath.split('/').pop(), ...buildTree(targetPath)];
  return tree.join('\n');
};

export const find = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return 'find: missing operand';
  }
  
  const fs = getFileSystem();
  const searchTerm = args[0];
  const currentDir = getCurrentPath();
  
  const results = Object.keys(fs)
    .filter(path => path.startsWith(currentDir))
    .filter(path => path.includes(searchTerm))
    .map(path => path.replace(currentDir === '/' ? '' : currentDir, '.'))
    .filter(path => path !== '.');
  
  return results.join('\n');
};

export const wc = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return 'wc: missing file operand';
  }
  
  const fs = getFileSystem();
  const results: string[] = [];
  
  args.forEach(fileName => {
    const targetPath = normalizePath(fileName);
    
    if (!pathExists(fs, targetPath)) {
      results.push(`wc: ${fileName}: No such file or directory`);
      return;
    }
    
    if (isDirectory(fs, targetPath)) {
      results.push(`wc: ${fileName}: Is a directory`);
      return;
    }
    
    const content = fs[targetPath].content || '';
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    
    results.push(`${lines.toString().padStart(8)} ${words.toString().padStart(7)} ${chars.toString().padStart(7)} ${fileName}`);
  });
  
  return results.join('\n');
};

export const head = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return 'head: missing file operand';
  }
  
  const fs = getFileSystem();
  const lines = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
  const fileName = args.filter(arg => !arg.startsWith('-') && arg !== args[args.indexOf('-n') + 1])[0];
  
  if (!fileName) {
    return 'head: missing file operand';
  }
  
  const targetPath = normalizePath(fileName);
  
  if (!pathExists(fs, targetPath)) {
    return `head: ${fileName}: No such file or directory`;
  }
  
  if (isDirectory(fs, targetPath)) {
    return `head: ${fileName}: Is a directory`;
  }
  
  const content = fs[targetPath].content || '';
  return content.split('\n').slice(0, lines).join('\n');
};

export const tail = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return 'tail: missing file operand';
  }
  
  const fs = getFileSystem();
  const lines = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
  const fileName = args.filter(arg => !arg.startsWith('-') && arg !== args[args.indexOf('-n') + 1])[0];
  
  if (!fileName) {
    return 'tail: missing file operand';
  }
  
  const targetPath = normalizePath(fileName);
  
  if (!pathExists(fs, targetPath)) {
    return `tail: ${fileName}: No such file or directory`;
  }
  
  if (isDirectory(fs, targetPath)) {
    return `tail: ${fileName}: Is a directory`;
  }
  
  const content = fs[targetPath].content || '';
  const contentLines = content.split('\n');
  return contentLines.slice(-lines).join('\n');
};

export const cp = async (args: string[]): Promise<string> => {
  if (args.length < 2) {
    return 'cp: missing file operand';
  }
  
  const fs = getFileSystem();
  const [source, dest] = args;
  const sourcePath = normalizePath(source);
  const destPath = normalizePath(dest);
  
  if (!pathExists(fs, sourcePath)) {
    return `cp: ${source}: No such file or directory`;
  }
  
  if (isDirectory(fs, sourcePath)) {
    return `cp: ${source}: Is a directory (use -r for recursive copy)`;
  }
  
  // Check if destination parent exists
  const destParent = destPath.substring(0, destPath.lastIndexOf('/')) || '/';
  if (!pathExists(fs, destParent)) {
    return `cp: ${dest}: No such file or directory`;
  }
  
  fs[destPath] = {
    type: 'file',
    content: fs[sourcePath].content,
    created: new Date(),
    modified: new Date()
  };
  
  saveFileSystem(fs);
  return '';
};

export const mv = async (args: string[]): Promise<string> => {
  if (args.length < 2) {
    return 'mv: missing file operand';
  }
  
  const fs = getFileSystem();
  const [source, dest] = args;
  const sourcePath = normalizePath(source);
  const destPath = normalizePath(dest);
  
  if (!pathExists(fs, sourcePath)) {
    return `mv: ${source}: No such file or directory`;
  }
  
  // Check if destination parent exists
  const destParent = destPath.substring(0, destPath.lastIndexOf('/')) || '/';
  if (!pathExists(fs, destParent)) {
    return `mv: ${dest}: No such file or directory`;
  }
  
  // Copy the file/directory
  fs[destPath] = { ...fs[sourcePath], modified: new Date() };
  
  // Remove the original
  delete fs[sourcePath];
  
  saveFileSystem(fs);
  return '';
};

// Initialize filesystem - call this when the app starts
export const initializeFileSystem = (): void => {
  // This will create the default filesystem if it doesn't exist
  getFileSystem();
  
  // Ensure current path is set
  if (!localStorage.getItem('currentPath')) {
    setCurrentPath('/home/guest');
  }
};

// Helper functions for cat redirection
export const catAppendToFile = (filePath: string, content: string): string => {
  const fs = getFileSystem();
  
  if (pathExists(fs, filePath)) {
    if (isDirectory(fs, filePath)) {
      return `cat: ${filePath}: Is a directory`;
    }
    // Append to existing content
    fs[filePath].content = (fs[filePath].content || '') + content + '\n';
    fs[filePath].modified = new Date();
  } else {
    // Create new file
    fs[filePath] = {
      type: 'file',
      content: content + '\n',
      created: new Date(),
      modified: new Date()
    };
  }
  
  saveFileSystem(fs);
  return '';
};

export const catWriteToFile = (filePath: string, content: string): string => {
  const fs = getFileSystem();
  
  if (pathExists(fs, filePath) && isDirectory(fs, filePath)) {
    return `cat: ${filePath}: Is a directory`;
  }
  
  // Overwrite or create file
  fs[filePath] = {
    type: 'file',
    content: content + '\n',
    created: fs[filePath]?.created || new Date(),
    modified: new Date()
  };
  
  saveFileSystem(fs);
  return '';
};