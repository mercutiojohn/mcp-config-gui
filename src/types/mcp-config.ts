// Server Types
export enum ServerType {
    SSE = 'sse',
    NPX = 'npx',
    UVX = 'uvx',
    NODE = 'node'
}

export const serverTypeMap = {
    [ServerType.SSE]: 'SSE',
    [ServerType.NPX]: 'npx',
    [ServerType.UVX]: 'uvx',
    [ServerType.NODE]: 'node'
}

export const serverTypeMapReverse = {
    'SSE': ServerType.SSE,
    'npx': ServerType.NPX,
    'uvx': ServerType.UVX,
    'node': ServerType.NODE
}

export interface MCPConfig {
    mcpServers: Record<string, ServerConfig>;
    [key: string]: any;
}

// Base interface for all server configurations
interface BaseServerConfig {
    disabled?: boolean;
    autoApprove?: string[];
}

// SSE server configuration
export interface SSEServerConfig extends BaseServerConfig {
    url: string;
}

// Command-based server configuration
interface BaseCommandServerConfig extends BaseServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}

// NPX specific server configuration
export interface NPXServerConfig extends BaseCommandServerConfig {
    command: 'npx';
}

// UVX specific server configuration
export interface UVXServerConfig extends BaseCommandServerConfig {
    command: 'uvx';
}

// Node specific server configuration
export interface NodeServerConfig extends BaseCommandServerConfig {
    command: 'node';
}

// Union type for all possible server configurations
export type ServerConfig = 
    | SSEServerConfig 
    | NPXServerConfig 
    | UVXServerConfig 
    | NodeServerConfig;

// Main configuration type
export interface MCPConfig {
    mcpServers: Record<string, ServerConfig>;
}

// Helper function to determine server type
export function getServerType(config: ServerConfig): ServerType {
    if ('url' in config) {
        return ServerType.SSE;
    }
    if ('command' in config) {
        switch (config.command) {
            case 'npx':
                return ServerType.NPX;
            case 'uvx':
                return ServerType.UVX;
            case 'node':
                return ServerType.NODE;
            default:
                throw new Error(`Unknown command type: ${config.command}`);
        }
    }
    throw new Error('Invalid server configuration');
}

