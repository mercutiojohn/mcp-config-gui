import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileUp } from "lucide-react";

interface ImportConfigDialogProps {
  importConfig: string;
  setImportConfig: (value: string) => void;
  handleImportConfig: () => void;
  children: React.ReactNode;
}

export const ImportConfigDialog: React.FC<ImportConfigDialogProps> = ({
  importConfig,
  setImportConfig,
  handleImportConfig,
  children,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialog.importConfig')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Textarea
              placeholder={t('dialog.importPlaceholder')}
              value={importConfig}
              onChange={(e) => setImportConfig(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <Button onClick={handleImportConfig}>
            {t('buttons.import')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};