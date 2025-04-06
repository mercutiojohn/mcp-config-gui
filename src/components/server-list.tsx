import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { cn } from '@/lib/utils'
import { getServerType, serverTypeMap } from '@/types/mcp-config'
import { ConfigFieldRenderer } from './config-field-renderer'
import { ServerSettingsDialog } from './dialogs/server-settings-dialog'
import { useServerOperations } from '@/hooks/use-server-operations'
import { useArrayOperations } from '@/hooks/use-array-operations'
import { useEnvOperations } from '@/hooks/use-env-operations'
// import { useSnapshot } from 'valtio'
import { useFileOperations } from '@/hooks/use-file-operations'
import { useWindowControls } from '@/hooks/use-window-controls'

export const ServerList: React.FC<{
  className?: string
}> = ({
  className
}) => {
    const { t } = useTranslation()
    // const state = useSnapshot(fileState)
    // const { config, error } = state

    const {
      config,
      error,
      setConfig,
      loading,
    } = useFileOperations();


    const { isMac } = useWindowControls();

    // 使用新的服务器操作 hook
    const {
      updateServerConfig,
      deleteServer
    } = useServerOperations(config, setConfig);

    // 使用自定义 hooks
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

    return (
      <div className={cn(
        "py-6 px-4 overflow-y-auto",
        className
      )}>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4",
        )}>
          {Object.entries(config && config.mcpServers ? config.mcpServers : {})?.map(([serverName, serverConfig]) => (
            <Card key={serverName}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 !pt-1">
                <CardTitle className="text-lg font-bold truncate">
                  {serverName}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {serverTypeMap[getServerType(serverConfig)]}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!Boolean(serverConfig.disabled)}
                      onCheckedChange={(checked) => {
                        updateServerConfig(serverName, {
                          ...serverConfig,
                          disabled: !checked
                        })
                      }}
                    />
                  </div>
                  <div className="">
                    {/* 使用提取的服务器设置对话框 */}
                    <ServerSettingsDialog
                      serverName={serverName}
                      serverConfig={serverConfig}
                      updateServerConfig={updateServerConfig}
                      deleteServer={deleteServer}
                      handleArrayItemChange={handleArrayItemChange}
                      handleArrayItemMove={handleArrayItemMove}
                      handleArrayItemDelete={handleArrayItemDelete}
                      handleArrayItemAdd={handleArrayItemAdd}
                      handleEnvChange={handleEnvChange}
                      handleEnvDelete={handleEnvDelete}
                      handleEnvAdd={handleEnvAdd}
                      handleEnvKeyChange={handleEnvKeyChange}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className=''>
                <div className="flex flex-col gap-2">
                  {Object.entries(serverConfig).map(([key, value]) => {
                    if (key === 'disabled') return null;
                    return (
                      <div key={key} className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          {t(`fields.${key}`) || key}
                        </label>
                        <ConfigFieldRenderer
                          serverName={serverName}
                          serverConfig={serverConfig}
                          fieldKey={key}
                          value={value}
                          isEditing={false}
                          onUpdateServerConfig={updateServerConfig}
                          onArrayItemChange={handleArrayItemChange}
                          onArrayItemMove={handleArrayItemMove}
                          onArrayItemDelete={handleArrayItemDelete}
                          onArrayItemAdd={handleArrayItemAdd}
                          onEnvChange={handleEnvChange}
                          onEnvDelete={handleEnvDelete}
                          onEnvAdd={handleEnvAdd}
                          onEnvKeyChange={handleEnvKeyChange}
                          renderDisabled={false}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }