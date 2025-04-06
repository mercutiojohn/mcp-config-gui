import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileIcon } from 'lucide-react';

interface FileNodeData {
  label: string;
  path: string;
  onSelect?: (path: string) => void;
}

export const FileNode: React.FC<NodeProps<FileNodeData>> = ({ data }) => {
  const handleSelect = () => {
    data.onSelect?.(data.path);
  };

  return (
    <div className="file-node">
      <Handle type="source" position={Position.Top} />
      <Card className="w-[280px] shadow-md bg-card/60 backdrop-blur-sm">
        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileIcon size={16} />
            <span className="truncate max-w-[200px]" title={data.label}>{data.label}</span>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1 text-xs">
          <p className="text-muted-foreground truncate mb-2" title={data.path}>
            {data.path}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleSelect}
          >
            加载此配置
          </Button>
        </CardContent>
      </Card>
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
};