import { useMyClubSelection } from './my-clubs-data.js';

export function decodeWorkspaceClubCode(value) {
    try {
        return decodeURIComponent(value || '');
    } catch {
        return '';
    }
}

const normalizedClubCode = (value) => String(value || '').trim().toUpperCase();

export function resolveWorkspace(selection, routeClubCode) {
    const clubCode = decodeWorkspaceClubCode(routeClubCode);
    if (selection.status !== 'populated') return { ...selection, workspace: null, clubCode, clubId: null };
    const workspace = selection.data.find((club) => normalizedClubCode(club.clubCode) === normalizedClubCode(clubCode)) || null;
    return workspace
        ? { ...selection, workspace, clubCode: workspace.clubCode, clubId: workspace.clubId }
        : { ...selection, status: 'not-found', workspace: null, clubCode, clubId: null };
}

export function useClubWorkspace(api, sessionKey, routeClubCode) {
    return resolveWorkspace(useMyClubSelection(api, sessionKey), routeClubCode);
}
