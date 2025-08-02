// src/utils/bin/utils.ts
import packageJson from '../../../package.json';
import * as bin from './index';

// Define user-facing commands (excluding intermediate/internal commands)
const USER_COMMANDS = [
  'help', 'man', 'whoami', 'date', 'clear',
  'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'echo', 'rm', 'tree', 'find', 'wc', 'head', 'tail', 'cp', 'mv',
  'curl', 'fetch_api', 'wget', 'ping', 'whois', 'nslookup',
  'theme', 'neofetch', 'cowsay', 'weather', 'about',
  'vi', 'vim', 'emacs', 'sudo', 'banner'
];

// Command categories for man command
const COMMAND_CATEGORIES = {
  'File System': {
    commands: ['ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'echo', 'rm', 'tree', 'find', 'wc', 'head', 'tail', 'cp', 'mv'],
    description: 'Commands for navigating and manipulating files and directories'
  },
  'Network': {
    commands: ['curl', 'fetch_api', 'wget', 'ping', 'whois', 'nslookup'],
    description: 'Commands for network operations and web requests'
  },
  'System': {
    commands: ['whoami', 'date', 'clear', 'neofetch', 'theme'],
    description: 'System information and configuration commands'
  },
  'Information': {
    commands: ['help', 'man', 'about', 'weather'],
    description: 'Commands for getting help and information'
  },
  'Fun': {
    commands: ['cowsay', 'banner', 'vi', 'vim', 'emacs', 'sudo'],
    description: 'Entertainment and easter egg commands'
  }
};

// Command descriptions for man command
const COMMAND_DESCRIPTIONS = {
  'help': 'Display available commands or help for a specific command',
  'man': 'Show manual pages and command categories',
  'whoami': 'Display current username',
  'date': 'Display current date and time',
  'clear': 'Clear the terminal screen',
  'ls': 'List directory contents',
  'cd': 'Change current directory',
  'pwd': 'Print working directory path',
  'mkdir': 'Create directories',
  'touch': 'Create files or update timestamps',
  'cat': 'Display file contents or create files interactively',
  'echo': 'Display text or write to files',
  'rm': 'Remove files and directories',
  'tree': 'Display directory structure as a tree',
  'find': 'Search for files and directories',
  'wc': 'Count lines, words, and characters in files',
  'head': 'Display first lines of a file',
  'tail': 'Display last lines of a file',
  'cp': 'Copy files',
  'mv': 'Move or rename files',
  'curl': 'Transfer data from servers with various protocols',
  'fetch_api': 'Make HTTP requests with JSON response formatting',
  'wget': 'Download files from web servers',
  'ping': 'Send network ping requests to test connectivity',
  'whois': 'Look up domain registration information',
  'nslookup': 'Query DNS records for domains',
  'theme': 'Change terminal color theme',
  'neofetch': 'Display system information with ASCII art',
  'cowsay': 'Generate ASCII art of a cow saying something',
  'weather': 'Get weather information for a city',
  'about': 'Display information about this terminal',
  'vi': 'Easter egg - suggests using emacs instead',
  'vim': 'Easter egg - suggests using emacs instead', 
  'emacs': 'Easter egg - suggests using vim instead',
  'sudo': 'Easter egg - permission denied with surprise',
  'banner': 'Display terminal banner and version information'
};

// Command usage information
const COMMAND_USAGE = {
  'help': 'Usage: help [command]\nExamples:\n  help          # Show all commands\n  help ls       # Show help for ls command',
  'man': 'Usage: man [category|command]\nExamples:\n  man           # Show all categories\n  man System    # Show system commands\n  man ls        # Show manual for ls',
  'ls': 'Usage: ls [directory]\nExamples:\n  ls            # List current directory\n  ls /home      # List /home directory',
  'cd': 'Usage: cd [directory]\nExamples:\n  cd            # Go to home directory\n  cd /home      # Change to /home\n  cd ..         # Go up one directory',
  'mkdir': 'Usage: mkdir <directory...>\nExamples:\n  mkdir newdir  # Create directory\n  mkdir dir1 dir2  # Create multiple directories',
  'touch': 'Usage: touch <file...>\nExamples:\n  touch file.txt    # Create file\n  touch file1 file2 # Create multiple files',
  'cat': 'Usage: cat [file...] or cat > file or cat >> file\nExamples:\n  cat file.txt      # Display file\n  cat > newfile     # Create file interactively\n  cat >> file       # Append to file',
  'echo': 'Usage: echo <text> [> file]\nExamples:\n  echo "hello"      # Display text\n  echo "text" > file # Write to file',
  'rm': 'Usage: rm [-r] <file...>\nExamples:\n  rm file.txt       # Remove file\n  rm -r directory   # Remove directory recursively',
  'tree': 'Usage: tree [directory]\nExamples:\n  tree          # Show current directory tree\n  tree /home    # Show /home directory tree',
  'find': 'Usage: find <search_term>\nExamples:\n  find .txt     # Find files containing ".txt"',
  'wc': 'Usage: wc <file...>\nExamples:\n  wc file.txt   # Count lines, words, chars',
  'head': 'Usage: head [-n lines] <file>\nExamples:\n  head file.txt     # Show first 10 lines\n  head -n 5 file    # Show first 5 lines',
  'tail': 'Usage: tail [-n lines] <file>\nExamples:\n  tail file.txt     # Show last 10 lines\n  tail -n 5 file    # Show last 5 lines',
  'cp': 'Usage: cp <source> <destination>\nExamples:\n  cp file1 file2    # Copy file\n  cp file dir/      # Copy to directory',
  'mv': 'Usage: mv <source> <destination>\nExamples:\n  mv file1 file2    # Rename file\n  mv file dir/      # Move to directory',
  'curl': 'Usage: curl [options] <url>\nOptions:\n  -H "Header: Value"  # Add header\n  -X POST            # HTTP method\n  -d "data"          # POST data\n  -i                 # Include headers\nExamples:\n  curl https://api.github.com/users/octocat',
  'fetch_api': 'Usage: fetch <url> [options]\nOptions:\n  --method GET|POST|PUT|DELETE\n  --headers \'{"key":"value"}\'\n  --data \'{"key":"value"}\'\nExamples:\n  fetch https://api.github.com/users/octocat',
  'wget': 'Usage: wget <url> [options]\nOptions:\n  -O <filename>     # Save as filename\n  -q                # Quiet mode\nExamples:\n  wget https://example.com/file.txt',
  'ping': 'Usage: ping <hostname>\nExamples:\n  ping google.com   # Ping Google',
  'whois': 'Usage: whois <domain>\nExamples:\n  whois google.com  # Domain info',
  'nslookup': 'Usage: nslookup <domain>\nExamples:\n  nslookup google.com # DNS lookup',
  'theme': 'Usage: theme [ls|set] [theme_name]\nExamples:\n  theme ls          # List themes\n  theme set gruvbox # Set theme',
  'weather': 'Usage: weather <city>\nExamples:\n  weather london    # Get London weather\n  weather new york  # Get New York weather',
  'cowsay': 'Usage: cowsay [text]\nExamples:\n  cowsay            # Random quote\n  cowsay hello      # Cow says "hello"',
  'neofetch': 'Usage: neofetch\nDisplays system information with ASCII art',
  'about': 'Usage: about\nDisplays information about this terminal application',
  'whoami': 'Usage: whoami\nDisplays current username (guest)',
  'date': 'Usage: date\nDisplays current date and time',
  'pwd': 'Usage: pwd\nPrints current working directory path',
  'banner': 'Usage: banner\nDisplays terminal banner with version info',
  'vi': 'Usage: vi\nEaster egg command',
  'vim': 'Usage: vim\nEaster egg command', 
  'emacs': 'Usage: emacs\nEaster egg command',
  'sudo': 'Usage: sudo <command>\nEaster egg command',
  'clear': 'Usage: clear\nClears the terminal screen'
};

export const help = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    const commands = USER_COMMANDS.sort().join(', ');
    return `Available commands:\n${commands}\n\n[tab]\t trigger completion.\n[ctrl+l] clear terminal.\n[ctrl+c] cancel command.\n\nFor detailed help: help [command]\nFor categorized commands: man`;
  }

  const command = args[0];
  if (COMMAND_USAGE[command]) {
    return `${COMMAND_DESCRIPTIONS[command]}\n\n${COMMAND_USAGE[command]}`;
  }

  if (USER_COMMANDS.includes(command)) {
    return `${COMMAND_DESCRIPTIONS[command]}\n\nFor detailed usage: help ${command}`;
  }

  return `Command '${command}' not found. Type 'help' to see available commands.`;
};

export const man = async (args: string[]): Promise<string> => {
  if (args.length === 0) {
    let result = 'Command Categories:\n\n';
    Object.entries(COMMAND_CATEGORIES).forEach(([category, info]) => {
      result += `<span style="color: #87CEEB">${category}</span>: ${info.description}\n`;
      result += `  Commands: ${info.commands.join(', ')}\n\n`;
    });
    result += 'Usage:\n';
    result += '  man [category]  # Show commands in category\n';
    result += '  man [command]   # Show manual for specific command\n\n';
    result += 'Examples:\n';
    result += '  man System      # Show system commands\n';
    result += '  man ls          # Show manual for ls command';
    return result;
  }

  const arg = args[0];
  
  // Check if it's a category
  if (COMMAND_CATEGORIES[arg]) {
    const category = COMMAND_CATEGORIES[arg];
    let result = `<span style="color: #87CEEB">${arg} Commands</span>\n\n`;
    result += `${category.description}\n\n`;
    category.commands.forEach(cmd => {
      result += `<span style="color: #98FB98">${cmd}</span> - ${COMMAND_DESCRIPTIONS[cmd]}\n`;
    });
    return result;
  }

  // Check if it's a command
  if (COMMAND_DESCRIPTIONS[arg]) {
    let result = `<span style="color: #87CEEB">Manual for: ${arg}</span>\n\n`;
    result += `${COMMAND_DESCRIPTIONS[arg]}\n\n`;
    if (COMMAND_USAGE[arg]) {
      result += `${COMMAND_USAGE[arg]}`;
    }
    return result;
  }

  return `No manual entry for '${arg}'. Type 'man' to see available categories and commands.`;
};

export const whoami = async (_args: string[]): Promise<string> => {
  return 'guest';
};

export const date = async (_args: string[]): Promise<string> => {
  return new Date().toString();
};

export const vi = async (_args: string[]): Promise<string> => {
  return `why use vi? try 'emacs'.`;
};

export const vim = async (_args: string[]): Promise<string> => {
  return `why use vim? try 'emacs'.`;
};

export const emacs = async (_args?: string[]): Promise<string> => {
  return `really? emacs? you should be using 'vim'`;
};

export const sudo = async (args?: string[]): Promise<string> => {
  setTimeout(function () {
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  }, 1000);

  return `Permission denied: unable to run the command '${args?.[0] || ''}' as root.`;
};

export const banner = (_args?: string[]): string => {
  return `
████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     ██╗  ██╗
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     ╚██╗██╔╝
   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║      ╚███╔╝ 
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║      ██╔██╗ 
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗██╔╝ ██╗
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
                                                               v${packageJson.version}

🚀 Enhanced Web Terminal by Chaitanya Jambhulkar
📧 chaitanyajambhulkar768@gmail.com | 🔗 github.com/ChaitanyaJx

Type 'help' to see list of available commands.
Type 'man' to see commands organized by category.

--
A powerful web-based terminal with enhanced filesystem and network capabilities.
--
`;
};