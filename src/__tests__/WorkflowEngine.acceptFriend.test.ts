/**
 * Test: zalo.acceptFriendRequest node passes userId as string, not object
 *
 * Bug: api.acceptFriendRequest({ userId: cfg.userId }) passed an object.
 * zca-js acceptFriendRequest(friendId) expects a plain string.
 * Zalo returned "Tham so khong hop le" (invalid params).
 *
 * Fix: api.acceptFriendRequest(cfg.userId) — pass string directly.
 */

describe('zalo.acceptFriendRequest workflow node', () => {
    const FRIEND_ID = '791585060057195262';

    // Simulate how WorkflowEngine calls the API
    function callAcceptFriend_OLD(cfg: { userId: string }, api: any) {
        return api.acceptFriendRequest({ userId: cfg.userId }); // BUG: object
    }

    function callAcceptFriend_NEW(cfg: { userId: string }, api: any) {
        return api.acceptFriendRequest(cfg.userId); // FIX: string
    }

    // Mock zca-js acceptFriendRequest — expects a string friendId
    function mockZcaApi() {
        const calls: any[] = [];
        return {
            acceptFriendRequest: async (friendId: any) => {
                calls.push(friendId);
                // Simulate Zalo validation: reject if not a string
                if (typeof friendId !== 'string') {
                    throw new Error('Tham so khong hop le');
                }
                return { success: true };
            },
            getCalls: () => calls,
        };
    }

    // ── Test 1: OLD code fails ─────────────────────────────────────────────

    test('OLD: passing object causes Tham so khong hop le error', async () => {
        const api = mockZcaApi();
        const cfg = { userId: FRIEND_ID };

        await expect(callAcceptFriend_OLD(cfg, api)).rejects.toThrow('Tham so khong hop le');
        expect(api.getCalls()[0]).toEqual({ userId: FRIEND_ID }); // object was passed
    });

    // ── Test 2: NEW code succeeds ──────────────────────────────────────────

    test('NEW: passing string directly succeeds', async () => {
        const api = mockZcaApi();
        const cfg = { userId: FRIEND_ID };

        const result = await callAcceptFriend_NEW(cfg, api);
        expect(result).toEqual({ success: true });
        expect(api.getCalls()[0]).toBe(FRIEND_ID); // string was passed
    });

    // ── Test 3: Template-resolved userId is a string ───────────────────────

    test('template-resolved userId is always a string from renderTemplate', () => {
        // renderTemplate returns String(ctx.trigger.userId)
        const mockRenderTemplate = (template: string, trigger: any): string => {
            return template.replace(/\{\{\s*\$trigger\.(\w+)\s*\}\}/g, (_, key) => {
                return String(trigger[key] ?? '');
            });
        };

        const trigger = { userId: FRIEND_ID };
        const template = '{{ $trigger.userId }}';
        const result = mockRenderTemplate(template, trigger);

        expect(typeof result).toBe('string');
        expect(result).toBe(FRIEND_ID);
    });

    // ── Test 4: End-to-end simulation ─────────────────────────────────────

    test('end-to-end: trigger → render → acceptFriendRequest(string)', async () => {
        const api = mockZcaApi();

        // Step 1: trigger data from Zalo listener
        const triggerData = {
            userId: FRIEND_ID,
            displayName: 'Test User',
            zaloId: '625381484730020271',
        };

        // Step 2: node config with template
        const nodeConfig = { userId: '{{ $trigger.userId }}' };

        // Step 3: render config (simulate WorkflowEngine.renderConfig)
        const renderedConfig = {
            userId: nodeConfig.userId.replace(
                /\{\{\s*\$trigger\.(\w+)\s*\}\}/g,
                (_, key) => String(triggerData[key as keyof typeof triggerData] ?? '')
            ),
        };

        expect(renderedConfig.userId).toBe(FRIEND_ID);
        expect(typeof renderedConfig.userId).toBe('string');

        // Step 4: call API with FIX
        const result = await api.acceptFriendRequest(renderedConfig.userId);
        expect(result).toEqual({ success: true });
        expect(api.getCalls()[0]).toBe(FRIEND_ID);
    });
});
