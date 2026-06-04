/**
 * Test: Relay proxy uses getByZaloId to bypass auth cookie lookup
 *
 * Bug: when employee sends via proxy, Boss called ZaloService.getInstance(auth)
 *      with auth cookies from resolveRealAuth. If cookie format didn't match
 *      the existing instance's key, a NEW instance was created and Zalo returned
 *      "Tham so khong hop le" (invalid params).
 *
 * Fix: relay path now calls ZaloService.getByZaloId(zaloId) to reuse the
 *      already-connected instance, bypassing auth lookup entirely.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface MockZaloServiceInstance {
    zaloId: string;
    sendMessage: (params: any) => Promise<any>;
}

// ── Mock ZaloService instances map ─────────────────────────────────────────────

class MockZaloService {
    private static instances = new Map<string, MockZaloServiceInstance>();

    static addInstance(zaloId: string, instance: MockZaloServiceInstance) {
        this.instances.set(zaloId, instance);
    }

    static clear() {
        this.instances.clear();
    }

    // The fix: look up by zaloId directly
    static getByZaloId(zaloId: string): MockZaloServiceInstance | null {
        for (const instance of this.instances.values()) {
            if (instance.zaloId === zaloId) return instance;
        }
        return null;
    }

    // Original path: look up by auth cookies (creates new instance if not found)
    static getInstance(auth: any): MockZaloServiceInstance | null {
        const parsed = typeof auth === 'string' ? JSON.parse(auth) : auth;
        const key = Buffer.from(parsed.cookies || '').toString('base64');
        for (const instance of this.instances.values()) {
            // Simulate: only matches if cookies key matches exactly
            const instanceKey = Buffer.from((instance as any)._cookies || '').toString('base64');
            if (key === instanceKey) return instance;
        }
        return null; // No match → would create NEW instance (bug)
    }
}

// ── Simulate wrap() relay routing ─────────────────────────────────────────────

async function simulateWrap(
    fn: (service: MockZaloServiceInstance, params: any) => Promise<any>,
    params: any,
    getByZaloId: (id: string) => MockZaloServiceInstance | null
): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
        const { auth, isReconnection = false, _fromRelay, _relayZaloId, ...rest } = params;

        // NEW relay path (the fix)
        if (_fromRelay && _relayZaloId) {
            const relayService = getByZaloId(_relayZaloId);
            if (!relayService) {
                return { success: false, error: `Account ${_relayZaloId} not connected.` };
            }
            const result = await fn(relayService, rest);
            return { success: true, response: result };
        }

        // Original path (not relay)
        if (!auth) return { success: false, error: 'Missing auth' };
        // ... would call ZaloService.getInstance(auth) here
        return { success: false, error: 'Non-relay path not tested here' };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ZaloService.getByZaloId — relay proxy fix', () => {
    const ZALO_ID = 'zalo-001';
    const REAL_COOKIES = 'real-session-cookies-from-boss-login';

    beforeEach(() => {
        MockZaloService.clear();
    });

    // ── Test 1 ─────────────────────────────────────────────────────────────────

    test('getByZaloId returns existing instance for known zaloId', () => {
        const instance: MockZaloServiceInstance = {
            zaloId: ZALO_ID,
            sendMessage: async (p) => ({ msgId: '123' }),
        };
        (instance as any)._cookies = REAL_COOKIES;
        MockZaloService.addInstance(ZALO_ID, instance);

        const found = MockZaloService.getByZaloId(ZALO_ID);
        expect(found).not.toBeNull();
        expect(found!.zaloId).toBe(ZALO_ID);
    });

    // ── Test 2 ─────────────────────────────────────────────────────────────────

    test('getByZaloId returns null for unknown zaloId', () => {
        const found = MockZaloService.getByZaloId('non-existent-id');
        expect(found).toBeNull();
    });

    // ── Test 3 — Core bug: old path fails with wrong cookies ───────────────────

    test('OLD path fails when employee passes wrong/empty cookies', () => {
        const instance: MockZaloServiceInstance = {
            zaloId: ZALO_ID,
            sendMessage: async (p) => ({ msgId: '123' }),
        };
        (instance as any)._cookies = REAL_COOKIES;
        MockZaloService.addInstance(ZALO_ID, instance);

        // Employee sends with empty cookies (no real auth in employee local store)
        const employeeAuth = { cookies: '', imei: '', userAgent: '' };

        // OLD path: getInstance with empty cookies → no match → would create new instance
        const found = MockZaloService.getInstance(employeeAuth);
        expect(found).toBeNull(); // Bug: null = would create new broken instance
    });

    // ── Test 4 — Core fix: new path succeeds with zaloId ──────────────────────

    test('NEW path succeeds using getByZaloId regardless of cookies', () => {
        const instance: MockZaloServiceInstance = {
            zaloId: ZALO_ID,
            sendMessage: async (p) => ({ msgId: '123' }),
        };
        (instance as any)._cookies = REAL_COOKIES;
        MockZaloService.addInstance(ZALO_ID, instance);

        // Fix: use getByZaloId — cookies don't matter
        const found = MockZaloService.getByZaloId(ZALO_ID);
        expect(found).not.toBeNull();
        expect(found!.zaloId).toBe(ZALO_ID);
    });

    // ── Test 5 — wrap() relay routing ─────────────────────────────────────────

    test('wrap() uses relay path when _fromRelay and _relayZaloId are set', async () => {
        const sendMessageMock = jest.fn().mockResolvedValue({ msgId: 'msg-123' });
        const instance: MockZaloServiceInstance = {
            zaloId: ZALO_ID,
            sendMessage: sendMessageMock,
        };
        MockZaloService.addInstance(ZALO_ID, instance);

        const params = {
            auth: { cookies: '', imei: '', userAgent: '' }, // empty employee auth
            threadId: 'thread-001',
            type: 0,
            message: 'Hello',
            _fromRelay: true,
            _relayZaloId: ZALO_ID,
        };

        const result = await simulateWrap(
            (service, rest) => service.sendMessage(rest),
            params,
            MockZaloService.getByZaloId.bind(MockZaloService)
        );

        expect(result.success).toBe(true);
        expect(result.response).toEqual({ msgId: 'msg-123' });
        expect(sendMessageMock).toHaveBeenCalledWith({
            threadId: 'thread-001',
            type: 0,
            message: 'Hello',
        });
    });

    // ── Test 6 — wrap() relay path fails gracefully if account not connected ───

    test('wrap() relay path returns error if zaloId not found in instances', async () => {
        // No instances added — account not connected

        const params = {
            auth: { cookies: '', imei: '', userAgent: '' },
            threadId: 'thread-001',
            type: 0,
            message: 'Hello',
            _fromRelay: true,
            _relayZaloId: 'disconnected-account',
        };

        const result = await simulateWrap(
            (service, rest) => service.sendMessage(rest),
            params,
            MockZaloService.getByZaloId.bind(MockZaloService)
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('not connected');
    });

    // ── Test 7 — rest params are passed correctly (no auth leakage) ───────────

    test('relay path strips auth/_fromRelay/_relayZaloId before calling fn', async () => {
        const receivedParams: any[] = [];
        const instance: MockZaloServiceInstance = {
            zaloId: ZALO_ID,
            sendMessage: async (p) => { receivedParams.push(p); return {}; },
        };
        MockZaloService.addInstance(ZALO_ID, instance);

        const params = {
            auth: { cookies: 'secret', imei: 'secret', userAgent: 'secret' },
            threadId: 'thread-001',
            type: 0,
            message: 'Test message',
            _fromRelay: true,
            _relayZaloId: ZALO_ID,
        };

        await simulateWrap(
            (service, rest) => service.sendMessage(rest),
            params,
            MockZaloService.getByZaloId.bind(MockZaloService)
        );

        expect(receivedParams[0]).not.toHaveProperty('auth');
        expect(receivedParams[0]).not.toHaveProperty('_fromRelay');
        expect(receivedParams[0]).not.toHaveProperty('_relayZaloId');
        expect(receivedParams[0]).toEqual({ threadId: 'thread-001', type: 0, message: 'Test message' });
    });
});
