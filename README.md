# TerminalX - Enhanced Web Terminal

![TerminalX Banner](https://img.shields.io/badge/TerminalX-Enhanced%20Web%20Terminal-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)

🚀 **An enhanced web-based terminal emulator with advanced filesystem and network capabilities**


--
## 🌟 About This Project

This is a **fork** of [m4tt72/terminal](https://github.com/m4tt72/terminal) with new features. What started as a simple web terminal has been transformed into a powerful, feature-rich terminal emulator that provides a genuine Linux-like experience in your browser.

## ✨ Key Enhancements Over Original

### 🔧 **Enhanced Help System**
- **Categorized Manual Pages**: New `man` command with organized categories (File System, Network, System, Information, Fun)
- **Detailed Command Help**: `help [command]` now provides comprehensive usage examples and syntax
- **User-Friendly Command List**: Filtered out intermediate commands to show only user-facing functionality

### 📁 **Advanced File System Operations**
- **Complete CRUD Operations**: Full create, read, update, delete functionality for files and directories
- **Interactive File Editing**: Enhanced `cat` command with write (`cat > file`) and append (`cat >> file`) modes
- **Advanced File Utilities**: Added `tree`, `find`, `wc`, `head`, `tail`, `cp`, `mv` commands
- **Persistent Storage**: All files and directory structure preserved between sessions

### 🌐 **Comprehensive Network Commands**
- **HTTP Client Tools**: `curl`, `fetch_api`, `wget` with full header and data support
- **Network Diagnostics**: `ping`, `whois`, `nslookup` for network troubleshooting
- **Progress Indicators**: Real-time progress updates for network operations
- **JSON Formatting**: Beautiful syntax highlighting for API responses

### 🎨 **Improved User Experience**
- **Real-time Execution State**: Visual indicators when commands are running
- **Enhanced PS1 Prompt**: Dynamic path display with proper navigation feedback
- **Better Error Handling**: Comprehensive error messages and validation
- **Smooth Animations**: Progress tracking for long-running operations

## 🚀 Features

### Core Terminal Features
- **Full Linux-like Command Set**: 30+ commands with authentic behavior
- **Persistent File System**: Your files and directories persist between sessions
- **Tab Completion**: Smart command completion as you type
- **Command History**: Navigate through previous commands with arrow keys
- **Theme Support**: Multiple beautiful terminal themes
- **Responsive Design**: Works perfectly on desktop and mobile devices

### File System Commands
```bash
ls          # List directory contents with colors
cd          # Change directories (supports .., ~, absolute/relative paths)
pwd         # Print working directory
mkdir       # Create directories
touch       # Create files or update timestamps
cat         # Display files, create files interactively (>, >>)
echo        # Display text or write to files
rm          # Remove files and directories (-r for recursive)
tree        # Display directory structure as a tree
find        # Search for files and directories
wc          # Count lines, words, and characters
head/tail   # Display first/last lines of files
cp/mv       # Copy and move files
```

### Network Commands
```bash
curl        # Make HTTP requests with full header/data support
fetch_api   # JSON-focused API client with formatting
wget        # Download files from web servers
ping        # Test network connectivity
whois       # Domain registration lookup
nslookup    # DNS record queries
```

### System Commands
```bash
whoami      # Display current user
date        # Show current date and time
neofetch    # System information with ASCII art
theme       # Change terminal themes
clear       # Clear terminal screen
help        # Comprehensive help system
man         # Categorized manual pages
```

### Fun Commands
```bash
cowsay      # ASCII cow with messages
banner      # Display application banner
vi/vim      # Easter eggs
emacs       # More easter eggs
sudo        # Special surprise 😉
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Modern web browser with localStorage support

### Quick Start
```bash
# Clone the repository
git clone https://github.com/ChaitanyaJx/terminal.git
cd terminal

# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev

# Build for production
npm run build
npm start
```

### Environment Variables (Optional)
```env
NEXT_PUBLIC_ENABLE_TRACKING=true
NEXT_PUBLIC_TRACKING_URL=your_analytics_url
NEXT_PUBLIC_TRACKING_SITE_ID=your_site_id
```

## 🎯 Usage Examples

### File Operations
```bash
# Create and navigate directories
mkdir projects
cd projects
mkdir web-app
cd web-app

# Create and edit files
touch README.md
cat > README.md
# Type your content, then Ctrl+C or Ctrl+D to save

echo "Hello World" > hello.txt
cat hello.txt

# Copy and organize files
cp hello.txt backup.txt
mkdir backup
mv backup.txt backup/
```

### Network Operations
```bash
# Fetch data from APIs
curl https://api.github.com/users/ChaitanyaJx
fetch_api https://jsonplaceholder.typicode.com/posts/1

# Download files
wget https://raw.githubusercontent.com/ChaitanyaJx/terminal/main/README.md

# Network diagnostics
ping google.com
whois github.com
nslookup stackoverflow.com
```

### Getting Help
```bash
# See all commands
help

# Get help for specific command
help ls
help curl

# Browse categorized commands
man
man Network
man "File System"
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 12, React 18, TypeScript
- **Styling**: Tailwind CSS with custom terminal themes
- **Storage**: Browser localStorage for persistence
- **Build**: Next.js with optimized production builds

### Key Components
- **Shell Provider**: Context-based state management for terminal session
- **Command Processor**: Modular command system with async execution
- **File System**: Virtual filesystem with localStorage persistence
- **Theme System**: Customizable color schemes and terminal appearance
- **Network Layer**: HTTP client utilities with progress tracking

## 🤝 Contributing

Contributions are welcome! This project has significantly diverged from the original with many enhancements, so there's always room for more improvements.

### Areas for Contribution
- Additional network utilities
- More file system commands
- Enhanced theme system
- Mobile experience improvements
- Performance optimizations
- Documentation improvements

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request


## 🙏 Acknowledgments

- **Original Project**: [m4tt72/terminal](https://github.com/m4tt72/terminal) - Thank you for the excellent foundation!
- **Inspiration**: Classic Unix/Linux terminals and modern terminal emulators
- **Community**: Thanks to all contributors and users who make this project better

