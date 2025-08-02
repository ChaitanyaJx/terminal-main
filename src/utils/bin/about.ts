// src/utils/bin/about.ts

export const about = async (_args: string[]): Promise<string> => {
  return `
<span style="color: #87CEEB">Terminal Web Application</span>

Created by: <span style="color: #98FB98">Chaitanya</span>

This is a web-based terminal emulator that simulates a Linux-like command line interface
in your browser. It includes:

• File system operations (ls, cd, mkdir, touch, cat, etc.)
• Network commands (curl, wget, ping, etc.) 
• System information (neofetch, whoami, date)
• Theme customization
• Interactive file editing with cat
• And much more!

The terminal maintains state in your browser's local storage, so your files and
current directory persist between sessions.

Type 'help' to see all available commands or 'man' for categorized help.
  `;
};