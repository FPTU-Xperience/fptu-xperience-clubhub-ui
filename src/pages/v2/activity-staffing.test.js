import test from 'node:test';
import assert from 'node:assert/strict';
import {
    validateStaffing,
    getActivityStaffing,
    mutateActivityStaffing,
    recruitmentPayload,
    staffingError,
} from '../../services/activity-staffing.js';
const draft = () => ({
    title: '  Tuyển staff  ',
    description: 'Phần việc',
    visibility: 'PUBLIC',
    eligibility: 'SCHOOL_STUDENTS',
    positions: [{ actionRuleId: 2, selected: true, capacity: '3', assignmentKind: 'STAFF' }],
});
test('staffing response belongs to the requested activity and requires canonical version/lists', async () => {
    const value = { activityId: 15, version: 1, actions: [], assignments: [] };
    assert.equal(validateStaffing(value, '15'), value);
    for (const invalid of [{}, { ...value, activityId: 7 }, { ...value, version: 0 }, { ...value, assignments: null }])
        assert.throws(() => validateStaffing(invalid, 15));
    assert.equal(
        await getActivityStaffing(
            {
                request: async (path) => {
                    assert.equal(path, '/api/activities/15/staffing');
                    return value;
                },
            },
            15,
        ),
        value,
    );
});
test('recruitment positions reference approved actions and validate capacity, visibility and kind', () => {
    const data = draft();
    assert.deepEqual(recruitmentPayload(data, [{ id: 2 }]).positions, [
        { actionRuleId: 2, capacity: 3, assignmentKind: 'STAFF' },
    ]);
    assert.equal(recruitmentPayload(data, [{ id: 2 }]).title, 'Tuyển staff');
    assert.throws(() => recruitmentPayload(data, [{ id: 3 }]));
    for (const capacity of [-1, 0, 1.5, 'x', Infinity])
        assert.throws(() =>
            recruitmentPayload({ ...data, positions: [{ ...data.positions[0], capacity }] }, [{ id: 2 }]),
        );
    assert.throws(() => recruitmentPayload({ ...data, positions: [] }, [{ id: 2 }]));
    assert.throws(() => recruitmentPayload({ ...data, visibility: 'PRIVATE' }, [{ id: 2 }]));
    assert.doesNotThrow(() =>
        recruitmentPayload({ ...data, visibility: 'PRIVATE', eligibility: 'CLUB_MEMBERS' }, [{ id: 2 }]),
    );
});
test('staffing mutation preserves action identity, version and idempotency without any Xperience Point posting', async () => {
    const api = {
        request: async (path, options) => {
            assert.equal(path, '/api/activities/15/recruitment/positions/2/join');
            assert.equal(options.headers['Idempotency-Key'], 'join-stable');
            assert.deepEqual(JSON.parse(options.body), { expectedVersion: 1 });
            return { activityId: 15, version: 2 };
        },
    };
    assert.equal(
        (await mutateActivityStaffing(api, 15, 'recruitment/positions/2/join', { expectedVersion: 1 }, 'join-stable'))
            .version,
        2,
    );
    assert.match(staffingError({ status: 404 }), /chưa hỗ trợ/);
});
