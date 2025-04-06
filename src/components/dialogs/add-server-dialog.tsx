import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface AddServerDialogProps {
  onAddServer: (serverName: string) => void;
}

export function AddServerDialog({ onAddServer }: AddServerDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [newServerName, setNewServerName] = useState('');

  const handleAddServer = () => {
    if (newServerName.trim()) {
      onAddServer(newServerName);
      setNewServerName('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {t('buttons.add')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('dialog.addServer.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="serverName" className="text-right">
              {t('fields.serverName')}
            </Label>
            <Input
              id="serverName"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              className="col-span-3"
              placeholder={t('placeholders.newServerName')}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddServer();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleAddServer} disabled={!newServerName.trim()}>
            {t('buttons.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}