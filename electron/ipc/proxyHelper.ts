import AppModeManager from '../../src/utils/AppModeManager';
import Logger from '../../src/utils/Logger';

/**
 * Fire-and-forget proxy: send a DB/CRM mutation to the Boss when running in Employee mode.
 * The Boss executes the same IPC handler on its own DB, then relays the resulting
 * event back to all connected employees via SSE.
 *
 * In Boss / standalone mode this is a no-op.
 */
export function proxyToBoss(channel: string, params: any): void {
    try {
        if (AppModeManager.getInstance().getMode() !== 'employee') return;

        const WsMgr = require('../../src/utils/WorkspaceManager').default;
        const activeWs = WsMgr.getInstance().getActiveWorkspace();
        if (!activeWs || activeWs.type !== 'remote') return;

        const HCM = require('../../src/services/http/HttpConnectionManager').default;
        if (!HCM.getInstance().isConnected(activeWs.id)) return;

        HCM.getInstance().proxyAction(activeWs.id, channel, params).catch((err: any) => {
            Logger.warn(`[proxyToBoss] ${channel} failed: ${err.message}`);
        });
    } catch {}
}
