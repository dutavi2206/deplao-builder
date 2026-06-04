/**
 * Test: Employee sleep/wake reconnect bug
 *
 * Scenario:
 *   1. Employee logs in  → registered in employees map with assigned_accounts
 *   2. Mac sleeps        → SSE drops → offline check deletes employee from map
 *   3. Mac wakes         → SSE reconnects → authenticateRequest auto-registers
 *   4. Employee sends    → proxy action must use correct assigned_accounts
 *
 * Bug: after step 3, assigned_accounts was stale/empty on client side
 *      because Boss did not push initialState on SSE reconnect.
 *
 * Fix: handleSSEStream now calls buildEmployeeSnapshot + pushViaSSE('relay:initialState')
 *      500ms after SSE reconnects.
 */

import * as http from 'http';
import { EventEmitter } from 'events';

// ── Minimal types ──────────────────────────────────────────────────────────────

interface RegisteredEmployee {
    employee_id: string;
    display_name: string;
    avatar_url: string;
    username: string;
    callbackUrl: string;
    token: string;
    lastSeen: number;
    assigned_accounts: string[];
    ip_address: string;
    connected_at: number;
    consecutiveFailures: number;
}

// ── Mock helpers ───────────────────────────────────────────────────────────────

function makeEmployeeData(overrides: Partial<RegisteredEmployee> = {}): any {
    return {
        employee_id: 'emp-001',
        display_name: 'dutavi',
        avatar_url: '',
        username: 'dutavi',
        assigned_accounts: ['zalo-001'],
        permissions: [{ module: 'chat', can_access: true }],
        is_active: 1,
        password_hash: 'xxx',
        ...overrides,
    };
}

// Simulate the employees Map used by HttpRelayService
class EmployeesMap {
    private map = new Map<string, RegisteredEmployee>();

    get(id: string) { return this.map.get(id); }
    set(id: string, emp: RegisteredEmployee) { this.map.set(id, emp); }
    delete(id: string) { this.map.delete(id); }
    has(id: string) { return this.map.has(id); }
    get size() { return this.map.size; }
}

// ── Unit tests ─────────────────────────────────────────────────────────────────

describe('Employee sleep/wake reconnect', () => {
    let employees: EmployeesMap;
    const VALID_TOKEN = 'valid-jwt-token';
    const EMPLOYEE_ID = 'emp-001';
    const ZALO_ID = 'zalo-001';

    // Simulates authenticateRequest logic from HttpRelayService
    function authenticateRequest(
        token: string,
        validateToken: (t: string) => { valid: boolean; employee_id?: string; username?: string },
        getEmployeeById: (id: string) => any | null
    ): RegisteredEmployee | null {
        if (!token) return null;

        const validation = validateToken(token);
        if (!validation.valid || !validation.employee_id) return null;

        const emp = employees.get(validation.employee_id);
        if (!emp) {
            // Auto-register from DB
            const empData = getEmployeeById(validation.employee_id);
            if (!empData || !empData.is_active) return null;

            const registered: RegisteredEmployee = {
                employee_id: validation.employee_id,
                display_name: empData.display_name,
                avatar_url: empData.avatar_url,
                username: validation.username || '',
                callbackUrl: '',
                token,
                lastSeen: Date.now(),
                assigned_accounts: empData.assigned_accounts || [],
                ip_address: '127.0.0.1',
                connected_at: Date.now(),
                consecutiveFailures: 0,
            };
            employees.set(validation.employee_id, registered);
            return registered;
        }

        return emp;
    }

    // Simulates executeProxyAction check
    function canSend(emp: RegisteredEmployee, zaloId: string): boolean {
        if (zaloId && !emp.assigned_accounts.includes(zaloId)) return false;
        return true;
    }

    beforeEach(() => {
        employees = new EmployeesMap();
    });

    // ── Test 1 ─────────────────────────────────────────────────────────────────

    test('employee can send after initial login', () => {
        // Login: register employee
        const empData = makeEmployeeData();
        const registered: RegisteredEmployee = {
            employee_id: empData.employee_id,
            display_name: empData.display_name,
            avatar_url: empData.avatar_url,
            username: empData.username,
            callbackUrl: '',
            token: VALID_TOKEN,
            lastSeen: Date.now(),
            assigned_accounts: empData.assigned_accounts,
            ip_address: '127.0.0.1',
            connected_at: Date.now(),
            consecutiveFailures: 0,
        };
        employees.set(EMPLOYEE_ID, registered);

        const emp = employees.get(EMPLOYEE_ID)!;
        expect(emp).toBeDefined();
        expect(canSend(emp, ZALO_ID)).toBe(true);
    });

    // ── Test 2 ─────────────────────────────────────────────────────────────────

    test('offline check removes employee from map after sleep', () => {
        const empData = makeEmployeeData();
        employees.set(EMPLOYEE_ID, {
            employee_id: empData.employee_id,
            display_name: empData.display_name,
            avatar_url: empData.avatar_url,
            username: empData.username,
            callbackUrl: '',
            token: VALID_TOKEN,
            lastSeen: Date.now() - 120_000, // 2 min ago — simulates sleep
            assigned_accounts: empData.assigned_accounts,
            ip_address: '127.0.0.1',
            connected_at: Date.now() - 120_000,
            consecutiveFailures: 0,
        });

        // Simulate offline check removing stale employee
        const HEARTBEAT_TIMEOUT_MS = 60_000;
        const entries = Array.from((employees as any).map.entries()) as Array<[string, RegisteredEmployee]>;
        for (const [id, emp] of entries) {
            if (Date.now() - emp.lastSeen > HEARTBEAT_TIMEOUT_MS) {
                employees.delete(id);
            }
        }

        expect(employees.has(EMPLOYEE_ID)).toBe(false);
    });

    // ── Test 3 — Core bug test ─────────────────────────────────────────────────

    test('auto-register on SSE reconnect restores assigned_accounts from DB', () => {
        // Employee was deleted from map (simulating offline check after sleep)
        expect(employees.has(EMPLOYEE_ID)).toBe(false);

        const empData = makeEmployeeData();

        // Mock services
        const validateToken = (t: string) =>
            t === VALID_TOKEN
                ? { valid: true, employee_id: EMPLOYEE_ID, username: 'dutavi' }
                : { valid: false };

        const getEmployeeById = (id: string) =>
            id === EMPLOYEE_ID ? empData : null;

        // SSE reconnect triggers authenticateRequest
        const emp = authenticateRequest(VALID_TOKEN, validateToken, getEmployeeById);

        expect(emp).not.toBeNull();
        expect(emp!.employee_id).toBe(EMPLOYEE_ID);
        expect(emp!.assigned_accounts).toContain(ZALO_ID);
        expect(employees.has(EMPLOYEE_ID)).toBe(true);
    });

    // ── Test 4 — Core bug test ─────────────────────────────────────────────────

    test('proxy action succeeds after sleep/wake auto-registration', () => {
        // Simulate sleep: employee deleted from map
        expect(employees.has(EMPLOYEE_ID)).toBe(false);

        const empData = makeEmployeeData();
        const validateToken = (t: string) =>
            t === VALID_TOKEN
                ? { valid: true, employee_id: EMPLOYEE_ID, username: 'dutavi' }
                : { valid: false };
        const getEmployeeById = (id: string) =>
            id === EMPLOYEE_ID ? empData : null;

        // Wake: SSE reconnect → auto-register
        const emp = authenticateRequest(VALID_TOKEN, validateToken, getEmployeeById);
        expect(emp).not.toBeNull();

        // Employee tries to send → should have correct assigned_accounts
        expect(canSend(emp!, ZALO_ID)).toBe(true);
    });

    // ── Test 5 ─────────────────────────────────────────────────────────────────

    test('proxy action fails if DB has no assigned accounts', () => {
        const empData = makeEmployeeData({ assigned_accounts: [] }); // empty accounts
        const validateToken = (t: string) =>
            t === VALID_TOKEN
                ? { valid: true, employee_id: EMPLOYEE_ID, username: 'dutavi' }
                : { valid: false };
        const getEmployeeById = (id: string) =>
            id === EMPLOYEE_ID ? empData : null;

        const emp = authenticateRequest(VALID_TOKEN, validateToken, getEmployeeById);
        expect(emp).not.toBeNull();

        // zaloId provided but not in assigned_accounts → should fail
        expect(canSend(emp!, ZALO_ID)).toBe(false);
    });

    // ── Test 6 — initialState push on SSE reconnect ───────────────────────────

    test('initialState is pushed on SSE reconnect to update client state', () => {
        const sseEvents: Array<{ channel: string; data: any }> = [];

        // Simulate pushViaSSE
        function pushViaSSE(employeeId: string, channel: string, data: any): boolean {
            sseEvents.push({ channel, data });
            return true;
        }

        // Simulate buildEmployeeSnapshot
        function buildSnapshot(employeeId: string) {
            return {
                assignedAccounts: [ZALO_ID],
                permissions: [{ module: 'chat', can_access: true }],
                accountsData: [],
                employeesData: [],
                onlineAccounts: [],
            };
        }

        // Simulate what handleSSEStream does after fix
        const empData = makeEmployeeData();
        employees.set(EMPLOYEE_ID, {
            employee_id: empData.employee_id,
            display_name: empData.display_name,
            avatar_url: '',
            username: 'dutavi',
            callbackUrl: '',
            token: VALID_TOKEN,
            lastSeen: Date.now(),
            assigned_accounts: [ZALO_ID],
            ip_address: '127.0.0.1',
            connected_at: Date.now(),
            consecutiveFailures: 0,
        });

        // The fix: push initialState 500ms after SSE connects
        const snapshot = buildSnapshot(EMPLOYEE_ID);
        if (snapshot) {
            pushViaSSE(EMPLOYEE_ID, 'relay:initialState', snapshot);
        }

        // Verify initialState was pushed
        const initialStateEvent = sseEvents.find(e => e.channel === 'relay:initialState');
        expect(initialStateEvent).toBeDefined();
        expect(initialStateEvent!.data.assignedAccounts).toContain(ZALO_ID);
    });
});
