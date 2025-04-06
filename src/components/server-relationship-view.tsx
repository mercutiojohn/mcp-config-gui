import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from './ui/button';
import { ServerConfig, MCPConfig } from '@/types/mcp-config';
import { ServerCardNode } from './custom-nodes/server-card-node';
import { FileNode } from './custom-nodes/file-node';
import { useFileOperations } from '@/hooks/use-file-operations';
import { useArrayOperations } from '@/hooks/use-array-operations';
import { useEnvOperations } from '@/hooks/use-env-operations';
import { on } from 'events';

interface ServerRelationshipViewProps {
  generateConfigId?: (config: MCPConfig) => string;
}

const nodeTypes: NodeTypes = {
  serverCard: ServerCardNode,
  fileNode: FileNode,
};

export const ServerRelationshipView: React.FC<ServerRelationshipViewProps> = ({
  generateConfigId,
}) => {
  const {
    config,
    setConfig,
    pathHistory,
    selectSavePath,
  } = useFileOperations();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showFiles, setShowFiles] = useState(true);

  const updateServerConfig = useCallback((serverName: string, newConfig: ServerConfig) => {
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        mcpServers: {
          ...prev.mcpServers,
          [serverName]: newConfig
        }
      };
    });
  }, [setConfig]);

  const deleteServer = useCallback((serverName: string) => {
    setConfig(prev => {
      if (!prev) return prev;
      const newConfig = { ...prev };
      delete newConfig.mcpServers[serverName];
      return newConfig;
    });
  }, [setConfig]);

  const {
    handleArrayItemChange,
    handleArrayItemDelete,
    handleArrayItemAdd,
    handleArrayItemMove
  } = useArrayOperations(updateServerConfig);

  const {
    handleEnvChange,
    handleEnvDelete,
    handleEnvAdd,
    handleEnvKeyChange
  } = useEnvOperations(updateServerConfig);

  const createServerNodes = useCallback((safeServerConfigs: Record<string, ServerConfig>) => {
    return Object.entries(safeServerConfigs).map(([name, serverConfig], index) => ({
      id: `server-${name}`,
      type: 'serverCard',
      data: {
        label: name,
        serverConfig,
        updateServerConfig,
        deleteServer,
        handleArrayItemChange,
        handleArrayItemMove,
        handleArrayItemDelete,
        handleArrayItemAdd,
        handleEnvChange,
        handleEnvDelete,
        handleEnvAdd,
        handleEnvKeyChange,
      },
      position: {
        x: (index % 3) * 400,
        y: Math.floor(index / 3) * 300,
      },
    }));
  }, [
    updateServerConfig,
    deleteServer,
    handleArrayItemChange,
    handleArrayItemMove,
    handleArrayItemDelete,
    handleArrayItemAdd,
    handleEnvChange,
    handleEnvDelete,
    handleEnvAdd,
    handleEnvKeyChange,
  ]);

  const createFileNodes = useCallback((safePathHistory: string[], startIndex: number) => {
    return safePathHistory.map((path, index) => ({
      id: `file-${path}`,
      type: 'fileNode',
      data: {
        label: path.split('/').pop() || path,
        path,
        onSelect: () => selectSavePath(path),
      },
      position: {
        x: ((startIndex + index) % 3) * 400,
        y: Math.floor((startIndex + index) / 3) * 300,
      },
    }));
  }, [selectSavePath]);

  useEffect(() => {
    if (config) {
      const safeServerConfigs = config.mcpServers || {};
      const safePathHistory = Array.isArray(pathHistory) ? pathHistory : [];

      // 创建服务器节点
      const serverNodes = createServerNodes(safeServerConfigs);

      // 创建文件节点
      const fileNodes = createFileNodes(safePathHistory, Object.keys(safeServerConfigs).length);

      // 设置文件节点的隐藏状态
      const visibleFileNodes = fileNodes.map(node => ({
        ...node,
        hidden: !showFiles
      }));

      // 合并节点并更新
      setNodes([...serverNodes, ...visibleFileNodes]);
    }
  }, [config, pathHistory, showFiles]);

  const toggleFiles = useCallback(() => {
    setNodes(currentNodes => {
      return currentNodes.map(node => {
        // 只修改文件节点的隐藏状态
        if (node.id.startsWith('file-')) {
          return { ...node, hidden: showFiles };
        }
        return node;
      });
    });

    setShowFiles(prev => !prev);
  }, [showFiles]);

  const resetLayout = useCallback(() => {
    const safeServerConfigs = config?.mcpServers || {};

    setNodes(currentNodes => {
      return currentNodes.map(node => {
        const serverCount = Object.keys(safeServerConfigs).length;
        const isServerNode = node.id.startsWith('server-');

        // 根据节点类型确定索引
        let index = 0;
        if (isServerNode) {
          // 对于服务器节点，从服务器名称获取索引
          const serverName = node.id.replace('server-', '');
          index = Object.keys(safeServerConfigs).indexOf(serverName);
        } else {
          // 对于文件节点，从当前节点列表中确定索引
          const fileIndex = currentNodes
            .filter(n => n.id.startsWith('file-'))
            .findIndex(n => n.id === node.id);
          index = serverCount + (fileIndex !== -1 ? fileIndex : 0);
        }

        return {
          ...node,
          position: {
            x: (index % 3) * 400,
            y: Math.floor(index / 3) * 300,
          }
        };
      });
    });
  }, [config]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const pathMappings = {};

  const analyzeDependencies = useCallback(() => {
    const safeServerConfigs = config?.mcpServers || {};
    const safePathHistory = Array.isArray(pathHistory) ? pathHistory : [];
    const safeMappings = pathMappings || {};

    const newEdges: Edge[] = [];

    Object.keys(safeServerConfigs).forEach((sourceName) => {
      const sourceConfig = safeServerConfigs[sourceName] || {};
      const sourceNodeId = `server-${sourceName}`;

      if (sourceConfig.waitFor && Array.isArray(sourceConfig.waitFor)) {
        sourceConfig.waitFor.forEach((targetName: string) => {
          if (Object.keys(safeServerConfigs).includes(targetName)) {
            newEdges.push({
              id: `${sourceNodeId}-server-${targetName}`,
              source: sourceNodeId,
              target: `server-${targetName}`,
              label: '等待',
              animated: true,
              style: { stroke: '#00bcd4' },
            });
          }
        });
      }

      if (sourceConfig.readyWhen && sourceConfig.readyWhen.http) {
        const httpUrl = sourceConfig.readyWhen.http.url;
        Object.keys(safeServerConfigs).forEach((targetName) => {
          if (sourceName !== targetName && httpUrl?.includes(targetName)) {
            newEdges.push({
              id: `${sourceNodeId}-server-${targetName}-http`,
              source: sourceNodeId,
              target: `server-${targetName}`,
              label: 'HTTP依赖',
              style: { stroke: '#ff9800' },
            });
          }
        });
      }
    });

    if (config && generateConfigId) {
      const currentConfigId = generateConfigId(config);

      Object.entries(safeMappings).forEach(([configId, path]) => {
        if (safePathHistory.includes(path)) {
          if (configId === currentConfigId) {
            if (Object.keys(safeServerConfigs).length > 0) {
              Object.keys(safeServerConfigs).forEach((serverName) => {
                newEdges.push({
                  id: `file-${path}-server-${serverName}`,
                  source: `file-${path}`,
                  target: `server-${serverName}`,
                  label: '配置',
                  style: { stroke: '#4caf50' },
                });
              });
            }
          } else {
            const serverNamesFromId = configId
              .split('|')
              .filter((name) => name !== 'empty-config');

            serverNamesFromId.forEach((serverName) => {
              if (Object.keys(safeServerConfigs).includes(serverName)) {
                newEdges.push({
                  id: `file-${path}-server-${serverName}`,
                  source: `file-${path}`,
                  target: `server-${serverName}`,
                  label: '历史配置',
                  style: { stroke: '#9e9e9e' },
                });
              }
            });
          }
        }
      });
    }

    setEdges(newEdges);
  }, [
    config,
    pathHistory,
    pathMappings,
    generateConfigId,
    setEdges,
  ]);

  if (!config) {
    return null;
  }

  try {
    return (
      <div style={{ width: '100%', height: '70vh', border: '1px solid #ddd' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-right">
            <div className="flex gap-2">
              <Button onClick={resetLayout} variant="outline" size="sm">
                重置布局
              </Button>
              <Button onClick={analyzeDependencies} variant="outline" size="sm">
                分析依赖关系
              </Button>
              <Button onClick={toggleFiles} variant="outline" size="sm">
                {showFiles ? '隐藏文件' : '显示文件'}
              </Button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    );
  } catch (error) {
    console.error('Error in ServerRelationshipView:', error);
    return null;
  }


};

export default ServerRelationshipView;