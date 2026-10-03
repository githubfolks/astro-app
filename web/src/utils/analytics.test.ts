import { beforeEach, describe, expect, it } from 'vitest';
import { trackGenerateLead, trackSignUp, trackWalletPurchase } from './analytics';

describe('analytics dataLayer events', () => {
    beforeEach(() => {
        window.dataLayer = [];
    });

    it('pushes sign_up with the method', () => {
        trackSignUp('google');
        expect(window.dataLayer).toEqual([{ event: 'sign_up', method: 'google' }]);
    });

    it('pushes generate_lead with a source and no invented monetary value', () => {
        trackGenerateLead('ai_astrologer_callback');
        expect(window.dataLayer).toEqual([{ event: 'generate_lead', lead_source: 'ai_astrologer_callback' }]);
    });

    it('clears the ecommerce object, then pushes purchase with server amounts', () => {
        trackWalletPurchase({ transactionId: 'order_ABC', value: 500, tax: 90, currency: 'INR' });

        expect(window.dataLayer).toEqual([
            { ecommerce: null },
            {
                event: 'purchase',
                ecommerce: {
                    transaction_id: 'order_ABC',
                    value: 500,
                    tax: 90,
                    currency: 'INR',
                    items: [{ item_id: 'wallet_recharge', item_name: 'Wallet Recharge', price: 500, quantity: 1 }],
                },
            },
        ]);
    });

    it('creates the dataLayer if GTM has not loaded yet', () => {
        delete window.dataLayer;
        trackSignUp('email');
        expect(window.dataLayer).toEqual([{ event: 'sign_up', method: 'email' }]);
    });
});
