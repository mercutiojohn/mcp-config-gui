import i18next from 'i18next';
import '../i18n/i18n';

// Server Types
export enum ServerType {
    SSE = 'sse',
    NPX = 'npx',
    UVX = 'uvx',
    NODE = 'node'
}

export const serverTypeMap = {
    [ServerType.SSE]: i18next.t('serverType.sse'),
    [ServerType.NPX]: i18next.t('serverType.npx'),
    [ServerType.UVX]: i18next.t('serverType.uvx'),
    [ServerType.NODE]: i18next.t('serverType.node')
}

export const serverTypeMapReverse = {
    'SSE': ServerType.SSE,
    'npx': ServerType.NPX,
    'uvx': ServerType.UVX,
    'node': ServerType.NODE
}

// 字段名称的映射
export const fieldNameMap: Record<string, string> = {
    'command': i18next.t('fields.command'),
    'args': i18next.t('fields.args'),
    'env': i18next.t('fields.env'),
    'autoApprove': i18next.t('fields.autoApprove'),
    'disabled': i18next.t('fields.disabled'),
    'url': i18next.t('fields.url')
}

export const fieldNameMapReverse: Record<string, string> = {
    [i18next.t('fields.command')]: 'command',
    [i18next.t('fields.args')]: 'args',
    [i18next.t('fields.env')]: 'env',
    [i18next.t('fields.autoApprove')]: 'autoApprove',
    [i18next.t('fields.disabled')]: 'disabled',
    [i18next.t('fields.url')]: 'url'
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
        const cmd = config.command;
        switch (cmd) {
            case 'npx':
                return ServerType.NPX;
            case 'uvx':
                return ServerType.UVX;
            case 'node':
                return ServerType.NODE;
            default:
                // throw new Error(i18next.t('errors.unknownCommandType', { cmd }));
                return cmd;
        }
    }
    throw new Error(i18next.t('errors.invalidServerConfig'));
}

