import { useMyClubSelection } from './my-clubs-data.js';

export function decodeWorkspaceClubId(value) {
    try {
        return decodeURIComponent(value || '');
    } catch {
        return '';
    }
}

export function resolveWorkspace(selection, routeClubId) {
    const clubId = decodeWorkspaceClubId(routeClubId);
    if (selection.status !== 'populated') return { ...selection, workspace: null, clubId };
    const workspace = selection.data.find((club) => club.clubId === clubId) || null;
    return workspace
        ? { ...selection, workspace, clubId }
        : { ...selection, status: 'not-found', workspace: null, clubId };
}

export function useClubWorkspace(api, sessionKey, routeClubId) {
    return resolveWorkspace(useMyClubSelection(api, sessionKey), routeClubId);
}
