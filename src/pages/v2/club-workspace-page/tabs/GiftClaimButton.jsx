import { giftClaimState } from '../../profile-page/gift-presentation';
export default function GiftClaimButton({ reward, owned, balance, user, clubId, onClaim }) {
    const state = giftClaimState(reward, { owned, balance, authenticated: !!user, clubId });
    return (
        <button
            type="button"
            className="v2-button v2-button--primary"
            disabled={state.disabled}
            onClick={() => onClaim(reward)}
        >
            {state.label}
        </button>
    );
}
