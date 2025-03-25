# MCP Config GUI

A graphical user interface tool for managing and editing MCP (Model Context Protocol) configurations.

![MCP Config GUI](./screenshots/app-screenshot.png)

## Project Overview

MCP Config GUI is a desktop application based on Electron and React, designed to simplify the creation and management of MCP configuration files. Through an intuitive user interface, you can easily add, edit, and delete server configurations without manually editing JSON files.

## Features

- 📂 Open and save MCP configuration files
- ➕ Add and manage multiple server configurations
- 🔄 Import existing configurations
- 🖊️ Intuitively edit configuration parameters
- 🌐 Support for various server types (npx, uvx, node, SSE)
- 🔍 Clear configuration preview
- 🌍 Multi-language interface support

## Installation and Usage

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installing Dependencies

```bash
# Using pnpm
pnpm install
```

### Development Mode

```bash
# Using pnpm
pnpm run electron:dev
```

### Building the Application

```bash
# Using pnpm
pnpm run electron:build
```

The built application will be located in the `release` directory.

## User Guide

1. **Launch the Application**: Run the installed application or start it in development mode
2. **Open Configuration File**: Click the "Open" button to select an existing MCP configuration file, or create one from scratch
3. **Add Server**: Enter a server name and click the "Add" button
4. **Edit Configuration**: Click the "Edit Details" button on each server card to modify detailed configurations
5. **Save Configuration**: After completing your edits, click the "Save" button to save the configuration to a file

## Configuration Parameter Description

MCP configuration supports multiple server types, each with different configuration options:

- **Command Line Servers** (npx, uvx, node)
  - `command`: The type of command to execute
  - `args`: Command line arguments
  - `env`: Environment variables
  - `autoApprove`: List of automatically approved commands

- **SSE Servers**
  - `url`: Server URL
  - `autoApprove`: List of automatically approved commands

## Tech Stack

- [Electron](https://www.electronjs.org/) - Desktop application framework
- [React](https://reactjs.org/) - User interface library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [i18next](https://www.i18next.com/) - Internationalization framework

## Contributing

Issue reports and pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

*For Chinese documentation, please see [README-zh.md](README-zh.md)*
