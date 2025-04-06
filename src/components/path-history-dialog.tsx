import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Trash, X } from "lucide-react";
import { cn } from '@/lib/utils';

interface PathHistoryDialogProps {
  pathHistory: string[];
  currentPath: string;
  onSelectPath: (path: string) => void;
  onRemovePath: (path: string) => void;
  onClearHistory: () => void;
}

export const PathHistoryDialog: React.FC<PathHistoryDialogProps> = ({
  pathHistory,
  currentPath,
  onSelectPath,
  onRemovePath,
  onClearHistory
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <History className="h-4 w-4 mr-2" />
          {t('buttons.pathHistory')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialog.pathHistoryTitle')}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {pathHistory.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {t('dialog.noPathHistory')}
            </div>
          ) : (
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-2">
                {pathHistory.map((path, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between border rounded-md p-2 group",
                      path === currentPath && "border-primary bg-primary/5"
                    )}
                  >
                    <div
                      className="flex-1 cursor-pointer truncate py-1 px-2 hover:bg-secondary/20 rounded"
                      onClick={() => {
                        onSelectPath(path);
                        setOpen(false);
                      }}
                      title={path}
                    >
                      {path}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemovePath(path)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={onClearHistory}
            disabled={pathHistory.length === 0}
          >
            <Trash className="h-4 w-4 mr-2" />
            {t('buttons.clearHistory')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};