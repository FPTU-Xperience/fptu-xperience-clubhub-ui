import assert from 'node:assert/strict';
import {
  createInitialState,
  transition,
  personById,
  clubById,
  membership,
  resetRealEntities,
  PEOPLE,
} from '../src/core/model.js';

console.log('--- STARTING INTERACTION & STATE REDUCER TESTS ---');

// Test 1: Initial state structure
const state0 = createInitialState();
assert.ok(Array.isArray(state0.memberships), 'Initial state must contain memberships array');
assert.ok(Array.isArray(state0.applications), 'Initial state must contain applications array');
assert.ok(Array.isArray(state0.activities), 'Initial state must contain activities array');
assert.ok(Array.isArray(state0.quests), 'Initial state must contain quests array');
assert.ok(Array.isArray(state0.submissions), 'Initial state must contain submissions array');
assert.ok(Array.isArray(state0.ledger), 'Initial state must contain ledger array');
console.log('✓ Test 1 Passed: Initial state integrity verified.');

// Test 2: Invalid user error handling
const failUser = transition(state0, { type: 'profile', userId: 'non-existent-user-id' });
assert.ok(failUser.error, 'Should fail when user is not found');
assert.equal(failUser.state, state0, 'State must remain unmutated on error');
console.log('✓ Test 2 Passed: Invalid user cleanly rejected with error message.');

// Test 3: Unauthorized manager action
// 'an' is not a manager of 'fcode'
const unauthorized = transition(state0, {
  type: 'reviewApplication',
  userId: 'an',
  clubId: 'fcode',
  payload: { id: 'app-1', status: 'approved' },
});
assert.ok(unauthorized.error, 'Regular member must not be allowed to execute manager action');
assert.ok(unauthorized.error.includes('không có quyền quản lý'), 'Error message must reflect permission check');
console.log('✓ Test 3 Passed: Role-based manager authorization enforced.');

// Test 4: Apply for a club
const anApply = transition(state0, {
  type: 'apply',
  userId: 'an',
  clubId: 'fcode',
  payload: { reason: 'Muốn học lập trình cùng F-Code.' },
});
assert.equal(anApply.error, undefined, 'Apply should succeed');
assert.ok(Array.isArray(anApply.state.memberships), 'Mutated state must retain memberships array');
assert.ok(anApply.state.applications.some((a) => a.userId === 'an' && a.clubId === 'fcode' && a.status === 'pending'), 'New pending application must exist');
console.log('✓ Test 4 Passed: Club application creation and state preservation verified.');

// Test 5: Review application by Manager
// 'linh' is manager of 'fcode'
const pendingApp = anApply.state.applications.find((a) => a.userId === 'an' && a.clubId === 'fcode');
const approveApp = transition(anApply.state, {
  type: 'reviewApplication',
  userId: 'linh',
  clubId: 'fcode',
  payload: { id: pendingApp.id, status: 'approved' },
});
assert.equal(approveApp.error, undefined, 'Approve application should succeed');
assert.ok(approveApp.state.memberships.some((m) => m.userId === 'an' && m.clubId === 'fcode' && m.status === 'approved'), 'User An must now be approved member in memberships');
console.log('✓ Test 5 Passed: Manager application approval updates memberships properly.');

// Test 6: Aliases for Quests (submitQuest -> contribute, reviewSubmission -> reviewContribution)
// 'an' is now an approved member of 'fcode' from Test 5
const quest1 = approveApp.state.quests.find((q) => q.clubId === 'fcode');
const submitQuest = transition(approveApp.state, {
  type: 'submitQuest', // UI alias
  userId: 'an',
  clubId: 'fcode',
  payload: { id: quest1.id, evidence: 'https://github.com/an/pull-request-1' },
});
assert.equal(submitQuest.error, undefined, 'submitQuest alias must succeed');
const newSub = submitQuest.state.submissions.find((s) => s.userId === 'an' && s.questId === quest1.id);
assert.ok(newSub, 'Submission must be recorded');

const reviewSub = transition(submitQuest.state, {
  type: 'reviewSubmission', // UI alias
  userId: 'linh', // Manager of F-Code
  clubId: 'fcode',
  payload: { id: newSub.id, status: 'approved', note: 'Đóng góp xuất sắc!' },
});
assert.equal(reviewSub.error, undefined, 'reviewSubmission alias must succeed');
assert.ok(reviewSub.state.ledger.some((l) => l.userId === 'an' && l.amount === quest1.points), 'Ledger points must be rewarded to An');
console.log('✓ Test 6 Passed: Quest contribution and review aliases correctly routed and verified.');

// Test 7: Profile update alias (updateProfile -> profile)
const updateProfile = transition(reviewSub.state, {
  type: 'updateProfile', // UI alias
  userId: 'linh',
  payload: {
    headline: 'Chủ nhiệm F-Code 2026',
    about: 'Yêu thích phần mềm và cộng đồng FPTU.',
    skills: 'React, Node.js, Go',
  },
});
assert.equal(updateProfile.error, undefined, 'updateProfile alias must succeed');
assert.equal(updateProfile.state.profiles['linh']?.headline, 'Chủ nhiệm F-Code 2026');
console.log('✓ Test 7 Passed: Profile alias update verified.');

// Test 8: Report draft and submit
const reportAction = transition(updateProfile.state, {
  type: 'report',
  userId: 'linh',
  clubId: 'fcode',
  payload: {
    title: 'Báo cáo hoạt động Tháng 9/2026',
    content: 'Đã tổ chức thành công 2 buổi workshop chuyên môn.',
    submit: true,
  },
});
assert.equal(reportAction.error, undefined, 'Report creation and submission must succeed');
assert.ok(reportAction.state.reports.some((r) => r.clubId === 'fcode' && r.status === 'submitted'), 'Report must be in submitted state');
console.log('✓ Test 8 Passed: Periodic report state mutation verified.');

// Test 9: Real Entities Cleanup
const initialLen = PEOPLE.length;
PEOPLE.push({ id: 'temp-user-99', name: 'Temporary User' });
assert.equal(PEOPLE.length, initialLen + 1);
resetRealEntities();
assert.equal(PEOPLE.length, initialLen, 'resetRealEntities must remove dynamic user records on session end');
console.log('✓ Test 9 Passed: Session isolation and entity reset verified.');

console.log('--- ALL 9 INTERACTION & STATE REDUCER TESTS PASSED CLEANLY! ---');
