import React, { useState, useCallback } from 'react';
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
import { ServerConfig } from '@/types/mcp-config';
import { ServerCardNode } from './custom-nodes/server-card-node';

interface ServerRelationshipViewProps {
  serverNames: string[];
  serverConfigs: Record<string, ServerConfig>;
  updateServerConfig: (serverName: string, newConfig: ServerConfig) => void;
  deleteServer: (serverName: string) => void;
  handleArrayItemChange: (serverName: string, key: string, index: number, value: string) => void;
  handleArrayItemMove: (serverName: string, key: string, index: number, direction: 'up' | 'down') => void;
  handleArrayItemDelete: (serverName: string, key: string, index: number) => void;
  handleArrayItemAdd: (serverName: string, key: string, value: string) => void;
  handleEnvChange: (serverName: string, key: string, value: string) => void;
  handleEnvDelete: (serverName: string, key: string) => void;
  handleEnvAdd: (serverName: string, key: string, value: string) => void;
  handleEnvKeyChange: (serverName: string, oldKey: string, newKey: string) => void;
}

// 注册自定义节点类型
const nodeTypes: NodeTypes = {
  serverCard: ServerCardNode,
};

export const ServerRelationshipView: React.FC<ServerRelationshipViewProps> = ({
  serverNames,
  serverConfigs,
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
}) => {
  // 创建初始节点，使用自定义节点类型
  const initialNodes: Node[] = serverNames.map((name, index) => ({
    id: name,
    type: 'serverCard', // 使用自定义节点类型
    data: {
      label: name,
      serverConfig: serverConfigs[name],
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
      y: Math.floor(index / 3) * 300
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, [setEdges]);

  // 重置布局
  const resetLayout = () => {
    setNodes((nodes) =>
      nodes.map((node, index) => ({
        ...node,
        position: {
          x: (index % 3) * 400,
          y: Math.floor(index / 3) * 300
        },
      }))
    );
  };

  // 分析依赖关系并自动创建连接
  const analyzeDependencies = () => {
    // 清除现有连接
    setEdges([]);

    // 创建新连接 - 基于依赖分析
    const newEdges: Edge[] = [];

    serverNames.forEach(sourceName => {
      const sourceConfig = serverConfigs[sourceName];

      // 检查 waitFor 依赖
      if (sourceConfig.waitFor && Array.isArray(sourceConfig.waitFor)) {
        sourceConfig.waitFor.forEach((targetName: string) => {
          if (serverNames.includes(targetName)) {
            newEdges.push({
              id: `${sourceName}-${targetName}`,
              source: sourceName,
              target: targetName,
              label: '等待',
              animated: true,
            });
          }
        });
      }

      // 检查 readyWhen 中的 http 依赖
      if (sourceConfig.readyWhen && sourceConfig.readyWhen.http) {
        const httpUrl = sourceConfig.readyWhen.http.url;
        // 简单处理: 如果URL包含另一个服务名, 可能存在依赖
        serverNames.forEach(targetName => {
          if (sourceName !== targetName && httpUrl?.includes(targetName)) {
            newEdges.push({
              id: `${sourceName}-${targetName}-http`,
              source: sourceName,
              target: targetName,
              label: 'HTTP依赖',
            });
          }
        });
      }
    });

    setEdges(newEdges);
  };

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
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default ServerRelationshipView;