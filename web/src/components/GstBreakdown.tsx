import React from 'react';

/**
 * Preview of what a wallet recharge costs: GST is charged on top of the
 * recharge amount. Display only — the server computes the authoritative amount
 * (same half-up rounding to paise) and Razorpay checkout shows exactly that.
 */
export function computeRechargeTotal(amount: number, gstRatePercent: number) {
    const basePaise = Math.round(amount * 100);
    const gstPaise = Math.round((basePaise * gstRatePercent) / 100);
    return { base: basePaise / 100, gst: gstPaise / 100, total: (basePaise + gstPaise) / 100 };
}

const inr = (n: number) => `₹${n.toFixed(2)}`;

interface Props {
    amount: number;
    gstRatePercent: number | null | undefined;
    bonusAmount?: number;
    loadFailed?: boolean;
    className?: string;
}

const GstBreakdown: React.FC<Props> = ({ amount, gstRatePercent, bonusAmount = 0, loadFailed, className = '' }) => {
    if (!(amount > 0)) return null;
    if (gstRatePercent == null) {
        return (
            <p className={`text-xs text-gray-600 ${className}`}>
                {loadFailed ? 'GST (charged on top of the recharge amount) will be shown at checkout.' : 'Calculating GST…'}
            </p>
        );
    }
    const { base, gst, total } = computeRechargeTotal(amount, gstRatePercent);
    return (
        <div className={`text-sm rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1 ${className}`}>
            <div className="flex justify-between text-gray-700"><span>Recharge amount (added to wallet)</span><span>{inr(base)}</span></div>
            <div className="flex justify-between text-gray-700"><span>GST @ {gstRatePercent}%</span><span>{inr(gst)}</span></div>
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1"><span>Total payable</span><span>{inr(total)}</span></div>
            {bonusAmount > 0 && (
                <p className="text-xs text-green-700">+ {inr(bonusAmount)} bonus credit (no GST)</p>
            )}
        </div>
    );
};

export default GstBreakdown;
