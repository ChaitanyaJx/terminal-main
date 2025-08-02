// src/utils/bin/textProcessing.ts

import { getFileSystem, normalizePath, pathExists, isFile, isDirectory } from './filesystem';

// Helper function to escape HTML for safe display
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Helper function to highlight search patterns
const highlightPattern = (text: string, pattern: string, flags: string = ''): string => {
  if (!pattern) return escapeHtml(text);
  
  try {
    const regex = new RegExp(pattern, flags + 'g');
    const escaped = escapeHtml(text);
    return escaped.replace(regex, (match) => `<span style="color: #ffff00; background-color: #800000">${match}</span>`);
  } catch {
    // If regex is invalid, do literal string matching
    const escaped = escapeHtml(text);
    const escapedPattern = escapeHtml(pattern);
    return escaped.replace(new RegExp(escapedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
      (match) => `<span style="color: #ffff00; background-color: #800000">${match}</span>`);
  }
};

export const grep = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return `grep: missing pattern
Usage: grep [options] <pattern> <file>...

Options:
  -i    Ignore case
  -n    Show line numbers
  -v    Invert match (show non-matching lines)
  -r    Recursive search
  -c    Count matches only
  -l    List files with matches

Examples:
  grep "hello" file.txt
  grep -i "error" log.txt
  grep -n "function" *.js`;
  }

  const fs = getFileSystem();
  let pattern = '';
  let files: string[] = [];
  let ignoreCase = false;
  let showLineNumbers = false;
  let invertMatch = false;
  let recursive = false;
  let countOnly = false;
  let listFiles = false;

  // Parse arguments
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg.startsWith('-')) {
      // Handle options
      for (const flag of arg.slice(1)) {
        switch (flag) {
          case 'i': ignoreCase = true; break;
          case 'n': showLineNumbers = true; break;
          case 'v': invertMatch = true; break;
          case 'r': recursive = true; break;
          case 'c': countOnly = true; break;
          case 'l': listFiles = true; break;
        }
      }
    } else if (!pattern) {
      pattern = arg;
    } else {
      files.push(arg);
    }
    i++;
  }

  if (!pattern) {
    return 'grep: missing pattern';
  }

  if (files.length === 0) {
    return 'grep: missing file operand';
  }

  const results: string[] = [];

  for (const fileName of files) {
    const targetPath = normalizePath(fileName);
    
    if (!pathExists(fs, targetPath)) {
      results.push(`grep: ${fileName}: No such file or directory`);
      continue;
    }

    if (isDirectory(fs, targetPath)) {
      if (recursive) {
        // Find all files in directory recursively
        const allFiles = Object.keys(fs)
          .filter(path => path.startsWith(targetPath + '/') && isFile(fs, path));
        
        for (const filePath of allFiles) {
          const content = fs[filePath].content || '';
          const lines = content.split('\n');
          let fileMatches = 0;
          const fileResults: string[] = [];

          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const flags = ignoreCase ? 'i' : '';
            let matches = false;
            
            try {
              const regex = new RegExp(pattern, flags);
              matches = regex.test(line);
            } catch {
              matches = ignoreCase ? 
                line.toLowerCase().includes(pattern.toLowerCase()) :
                line.includes(pattern);
            }

            if (invertMatch) matches = !matches;

            if (matches) {
              fileMatches++;
              
              if (!countOnly && !listFiles) {
                const prefix = files.length > 1 ? `${filePath.replace(targetPath + '/', '')}:` : '';
                const lineNum = showLineNumbers ? `${lineIndex + 1}:` : '';
                const highlightedLine = highlightPattern(line, pattern, flags);
                fileResults.push(`${prefix}${lineNum}${highlightedLine}`);
              }
            }
          }

          if (fileMatches > 0) {
            if (listFiles) {
              results.push(filePath.replace(targetPath + '/', ''));
            } else if (countOnly) {
              const prefix = files.length > 1 ? `${filePath.replace(targetPath + '/', '')}:` : '';
              results.push(`${prefix}${fileMatches}`);
            } else {
              results.push(...fileResults);
            }
          }
        }
      } else {
        results.push(`grep: ${fileName}: Is a directory`);
      }
      continue;
    }

    const content = fs[targetPath].content || '';
    const lines = content.split('\n');
    let fileMatches = 0;
    const fileResults: string[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const flags = ignoreCase ? 'i' : '';
      let matches = false;
      
      try {
        const regex = new RegExp(pattern, flags);
        matches = regex.test(line);
      } catch {
        matches = ignoreCase ? 
          line.toLowerCase().includes(pattern.toLowerCase()) :
          line.includes(pattern);
      }

      if (invertMatch) matches = !matches;

      if (matches) {
        fileMatches++;
        
        if (!countOnly && !listFiles) {
          const prefix = files.length > 1 ? `${fileName}:` : '';
          const lineNum = showLineNumbers ? `${lineIndex + 1}:` : '';
          const highlightedLine = highlightPattern(line, pattern, flags);
          fileResults.push(`${prefix}${lineNum}${highlightedLine}`);
        }
      }
    }

    if (fileMatches > 0) {
      if (listFiles) {
        results.push(fileName);
      } else if (countOnly) {
        const prefix = files.length > 1 ? `${fileName}:` : '';
        results.push(`${prefix}${fileMatches}`);
      } else {
        results.push(...fileResults);
      }
    }
  }

  return results.length > 0 ? results.join('\n') : '';
};

export const sort = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return `sort: missing file operand
Usage: sort [options] <file>...

Options:
  -r    Reverse sort order
  -n    Numeric sort
  -u    Remove duplicates
  -k N  Sort by field N (1-indexed)

Examples:
  sort file.txt
  sort -r file.txt
  sort -n numbers.txt`;
  }

  const fs = getFileSystem();
  let reverse = false;
  let numeric = false;
  let unique = false;
  let keyField = 0;
  const files: string[] = [];

  // Parse arguments
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg.startsWith('-')) {
      for (const flag of arg.slice(1)) {
        switch (flag) {
          case 'r': reverse = true; break;
          case 'n': numeric = true; break;
          case 'u': unique = true; break;
          case 'k': 
            if (i + 1 < args.length) {
              keyField = parseInt(args[i + 1]) - 1; // Convert to 0-indexed
              i++; // Skip next arg
            }
            break;
        }
      }
    } else {
      files.push(arg);
    }
    i++;
  }

  if (files.length === 0) {
    return 'sort: missing file operand';
  }

  const allLines: string[] = [];

  for (const fileName of files) {
    const targetPath = normalizePath(fileName);
    
    if (!pathExists(fs, targetPath)) {
      return `sort: ${fileName}: No such file or directory`;
    }

    if (isDirectory(fs, targetPath)) {
      return `sort: ${fileName}: Is a directory`;
    }

    const content = fs[targetPath].content || '';
    const lines = content.split('\n').filter(line => line.length > 0);
    allLines.push(...lines);
  }

  // Sort lines
  allLines.sort((a, b) => {
    let valueA = a;
    let valueB = b;

    // Extract field if specified
    if (keyField > 0) {
      const fieldsA = a.split(/\s+/);
      const fieldsB = b.split(/\s+/);
      valueA = fieldsA[keyField] || '';
      valueB = fieldsB[keyField] || '';
    }

    let comparison: number;
    
    if (numeric) {
      const numA = parseFloat(valueA) || 0;
      const numB = parseFloat(valueB) || 0;
      comparison = numA - numB;
    } else {
      comparison = valueA.localeCompare(valueB);
    }

    return reverse ? -comparison : comparison;
  });

  // Remove duplicates if requested
  const finalLines = unique ? Array.from(new Set(allLines)) : allLines;

  return finalLines.join('\n');
};

export const uniq = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return `uniq: missing file operand
Usage: uniq [options] <file>

Options:
  -c    Count occurrences
  -d    Only show duplicate lines
  -u    Only show unique lines
  -i    Ignore case

Examples:
  uniq file.txt
  uniq -c file.txt
  uniq -d file.txt`;
  }

  const fs = getFileSystem();
  let countOccurrences = false;
  let duplicatesOnly = false;
  let uniqueOnly = false;
  let ignoreCase = false;
  let fileName = '';

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('-')) {
      for (const flag of arg.slice(1)) {
        switch (flag) {
          case 'c': countOccurrences = true; break;
          case 'd': duplicatesOnly = true; break;
          case 'u': uniqueOnly = true; break;
          case 'i': ignoreCase = true; break;
        }
      }
    } else {
      fileName = arg;
    }
  }

  if (!fileName) {
    return 'uniq: missing file operand';
  }

  const targetPath = normalizePath(fileName);
  
  if (!pathExists(fs, targetPath)) {
    return `uniq: ${fileName}: No such file or directory`;
  }

  if (isDirectory(fs, targetPath)) {
    return `uniq: ${fileName}: Is a directory`;
  }

  const content = fs[targetPath].content || '';
  const lines = content.split('\n').filter(line => line.length > 0);
  
  const counts = new Map<string, { original: string; count: number }>();
  
  // Count occurrences
  for (const line of lines) {
    const key = ignoreCase ? line.toLowerCase() : line;
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, { original: line, count: 1 });
    }
  }

  const results: string[] = [];
  
  // Convert Map to array for iteration
  const countEntries = Array.from(counts.entries());
  for (let i = 0; i < countEntries.length; i++) {
    const [, { original, count }] = countEntries[i];
    const isDuplicate = count > 1;
    const isUnique = count === 1;

    if (duplicatesOnly && !isDuplicate) continue;
    if (uniqueOnly && !isUnique) continue;

    if (countOccurrences) {
      results.push(`${count.toString().padStart(7)} ${original}`);
    } else {
      results.push(original);
    }
  }

  return results.join('\n');
};

export const sed = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return `sed: missing script
Usage: sed 's/old/new/[flags]' <file>

Flags:
  g    Global replace (all occurrences)
  i    Case insensitive
  
Examples:
  sed 's/hello/world/' file.txt
  sed 's/hello/world/g' file.txt
  sed 's/hello/world/gi' file.txt`;
  }

  if (args.length < 2) {
    return 'sed: missing file operand';
  }

  const script = args[0];
  const fileName = args[1];
  
  // Parse sed script (simplified - only supports s/old/new/flags)
  const sedMatch = script.match(/^s\/(.+?)\/(.+?)\/([gim]*)$/);
  if (!sedMatch) {
    return 'sed: invalid command (only s/old/new/flags supported)';
  }

  const [, oldPattern, newText, flags] = sedMatch;
  const global = flags.includes('g');
  const ignoreCase = flags.includes('i');

  const fs = getFileSystem();
  const targetPath = normalizePath(fileName);
  
  if (!pathExists(fs, targetPath)) {
    return `sed: ${fileName}: No such file or directory`;
  }

  if (isDirectory(fs, targetPath)) {
    return `sed: ${fileName}: Is a directory`;
  }

  const content = fs[targetPath].content || '';
  
  try {
    const regexFlags = (global ? 'g' : '') + (ignoreCase ? 'i' : '');
    const regex = new RegExp(oldPattern, regexFlags);
    const result = content.replace(regex, newText);
    return escapeHtml(result);
  } catch {
    // Fallback to literal string replacement
    const lines = content.split('\n');
    
    const result = lines.map(line => {
      const compareLine = ignoreCase ? line.toLowerCase() : line;
      const searchPattern = ignoreCase ? oldPattern.toLowerCase() : oldPattern;
      
      if (global) {
        return line.split(oldPattern).join(newText);
      } else {
        const index = compareLine.indexOf(searchPattern);
        if (index !== -1) {
          return line.substring(0, index) + newText + line.substring(index + oldPattern.length);
        }
        return line;
      }
    }).join('\n');
    
    return escapeHtml(result);
  }
};

export const awk = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    return `awk: missing script
Usage: awk '<script>' <file>

Common scripts:
  '{print $1}'        Print first field
  '{print $NF}'       Print last field
  '{print $1, $3}'    Print fields 1 and 3
  '/pattern/'         Print lines matching pattern
  'NR > 1'           Skip first line
  'length($0) > 10'   Lines longer than 10 chars

Examples:
  awk '{print $1}' file.txt
  awk '{print $1, $3}' data.txt
  awk '/error/' log.txt`;
  }

  if (args.length < 2) {
    return 'awk: missing file operand';
  }

  const script = args[0];
  const fileName = args[1];

  const fs = getFileSystem();
  const targetPath = normalizePath(fileName);
  
  if (!pathExists(fs, targetPath)) {
    return `awk: ${fileName}: No such file or directory`;
  }

  if (isDirectory(fs, targetPath)) {
    return `awk: ${fileName}: Is a directory`;
  }

  const content = fs[targetPath].content || '';
  const lines = content.split('\n');
  const results: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fields = line.split(/\s+/).filter(field => field.length > 0);
    const NR = i + 1; // Line number (1-indexed)

    // Simple awk interpreter (supports basic functionality)
    try {
      let shouldPrint = false;
      let printContent = line;

      // Handle different script patterns
      if (script.startsWith('/') && script.endsWith('/')) {
        // Pattern matching: /pattern/
        const pattern = script.slice(1, -1);
        shouldPrint = line.includes(pattern);
      } else if (script.includes('print')) {
        // Print statements
        shouldPrint = true;
        
        // Extract what to print
        const printMatch = script.match(/print\s*(.+)?/);
        if (printMatch) {
          const printExpr = printMatch[1]?.trim();
          if (printExpr) {
            // Handle field references like $1, $2, $NF
            let result = printExpr;
            
            // Replace $NF with last field
            result = result.replace(/\$NF/g, fields[fields.length - 1] || '');
            
            // Replace $N with field N
            result = result.replace(/\$(\d+)/g, (match, num) => {
              const fieldIndex = parseInt(num) - 1; // Convert to 0-indexed
              return fieldIndex >= 0 ? (fields[fieldIndex] || '') : '';
            });
            
            // Handle $0 (whole line)
            result = result.replace(/\$0/g, line);
            
            // Remove quotes if present
            result = result.replace(/['"]/g, '');
            
            // Handle comma-separated fields
            result = result.replace(/,\s*/g, ' ');
            
            printContent = result.trim();
          }
        }
      } else if (script.includes('NR')) {
        // Line number conditions
        if (script.includes('NR > ')) {
          const match = script.match(/NR\s*>\s*(\d+)/);
          if (match) {
            shouldPrint = NR > parseInt(match[1]);
          }
        } else if (script.includes('NR == ')) {
          const match = script.match(/NR\s*==\s*(\d+)/);
          if (match) {
            shouldPrint = NR === parseInt(match[1]);
          }
        }
        
        if (shouldPrint && script.includes('print')) {
          const printMatch = script.match(/print\s*(.+)?/);
          if (printMatch && printMatch[1]) {
            let result = printMatch[1].trim();
            result = result.replace(/\$(\d+)/g, (match, num) => {
              const fieldIndex = parseInt(num) - 1;
              return fieldIndex >= 0 ? (fields[fieldIndex] || '') : '';
            });
            printContent = result.replace(/['"]/g, '');
          }
        }
      } else if (script.includes('length')) {
        // Length conditions
        const match = script.match(/length\(\$0\)\s*>\s*(\d+)/);
        if (match) {
          shouldPrint = line.length > parseInt(match[1]);
        }
      } else {
        // Default: treat as print statement
        shouldPrint = true;
        let result = script;
        result = result.replace(/\$(\d+)/g, (match, num) => {
          const fieldIndex = parseInt(num) - 1;
          return fieldIndex >= 0 ? (fields[fieldIndex] || '') : '';
        });
        result = result.replace(/\$0/g, line);
        result = result.replace(/[{}]/g, '').trim();
        printContent = result;
      }

      if (shouldPrint) {
        results.push(escapeHtml(printContent));
      }
    } catch (error) {
      return `awk: syntax error in script: ${script}`;
    }
  }

  return results.join('\n');
};

export const diff = async (args: string[]): Promise<string> => {
  if (args.length < 2) {
    return `diff: missing file operand
Usage: diff [options] <file1> <file2>

Options:
  -u    Unified diff format
  -b    Ignore whitespace changes
  -i    Ignore case
  -w    Ignore all whitespace

Examples:
  diff file1.txt file2.txt
  diff -u old.txt new.txt`;
  }

  const fs = getFileSystem();
  let unified = false;
  let ignoreWhitespace = false;
  let ignoreCase = false;
  let ignoreAllWhitespace = false;
  const files: string[] = [];

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('-')) {
      for (const flag of arg.slice(1)) {
        switch (flag) {
          case 'u': unified = true; break;
          case 'b': ignoreWhitespace = true; break;
          case 'i': ignoreCase = true; break;
          case 'w': ignoreAllWhitespace = true; break;
        }
      }
    } else {
      files.push(arg);
    }
  }

  if (files.length < 2) {
    return 'diff: missing file operand';
  }

  const [file1, file2] = files;
  const path1 = normalizePath(file1);
  const path2 = normalizePath(file2);

  if (!pathExists(fs, path1)) {
    return `diff: ${file1}: No such file or directory`;
  }

  if (!pathExists(fs, path2)) {
    return `diff: ${file2}: No such file or directory`;
  }

  if (isDirectory(fs, path1) || isDirectory(fs, path2)) {
    return 'diff: directory comparison not supported';
  }

  const content1 = fs[path1].content || '';
  const content2 = fs[path2].content || '';

  let lines1 = content1.split('\n');
  let lines2 = content2.split('\n');

  // Apply preprocessing based on options
  if (ignoreCase) {
    lines1 = lines1.map(line => line.toLowerCase());
    lines2 = lines2.map(line => line.toLowerCase());
  }

  if (ignoreAllWhitespace) {
    lines1 = lines1.map(line => line.replace(/\s+/g, ''));
    lines2 = lines2.map(line => line.replace(/\s+/g, ''));
  } else if (ignoreWhitespace) {
    lines1 = lines1.map(line => line.replace(/\s+/g, ' ').trim());
    lines2 = lines2.map(line => line.replace(/\s+/g, ' ').trim());
  }

  // Simple diff algorithm (not optimal but functional)
  const results: string[] = [];
  
  if (unified) {
    results.push(`--- ${file1}`);
    results.push(`+++ ${file2}`);
  }

  let i = 0, j = 0;
  while (i < lines1.length || j < lines2.length) {
    if (i >= lines1.length) {
      // Only lines2 remaining
      if (unified) {
        results.push(`<span style="color: #98FB98">+${escapeHtml(content2.split('\n')[j] || '')}</span>`);
      } else {
        results.push(`> ${escapeHtml(content2.split('\n')[j] || '')}`);
      }
      j++;
    } else if (j >= lines2.length) {
      // Only lines1 remaining
      if (unified) {
        results.push(`<span style="color: #FFB6C1">-${escapeHtml(content1.split('\n')[i] || '')}</span>`);
      } else {
        results.push(`< ${escapeHtml(content1.split('\n')[i] || '')}`);
      }
      i++;
    } else if (lines1[i] === lines2[j]) {
      // Lines match
      if (unified) {
        results.push(` ${escapeHtml(content1.split('\n')[i] || '')}`);
      }
      i++;
      j++;
    } else {
      // Lines differ
      if (unified) {
        results.push(`<span style="color: #FFB6C1">-${escapeHtml(content1.split('\n')[i] || '')}</span>`);
        results.push(`<span style="color: #98FB98">+${escapeHtml(content2.split('\n')[j] || '')}</span>`);
      } else {
        results.push(`${i + 1}c${j + 1}`);
        results.push(`< ${escapeHtml(content1.split('\n')[i] || '')}`);
        results.push('---');
        results.push(`> ${escapeHtml(content2.split('\n')[j] || '')}`);
      }
      i++;
      j++;
    }
  }

  if (results.length === 0 || (unified && results.length <= 2)) {
    return 'Files are identical';
  }

  return results.join('\n');
};