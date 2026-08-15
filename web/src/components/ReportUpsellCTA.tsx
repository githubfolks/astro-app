import React, { useState } from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { ReportPurchaseModal, REPORT_INFO } from './ReportPurchaseModal';

interface ReportUpsellCTAProps {
    reportType: 'FULL_KUNDLI' | 'GUN_MILAN' | 'CAREER_FINANCE';
    description: string;
}

// Cross-sell from a free tool's result screen into the paid AI PDF report
// flow (see ReportPurchaseModal) — the free tools previously only linked to
// live-astrologer consultation, leaving this built revenue surface unused.
const ReportUpsellCTA: React.FC<ReportUpsellCTAProps> = ({ reportType, description }) => {
    const [isOpen, setIsOpen] = useState(false);
    const info = REPORT_INFO[reportType];

    return (
        <>
            <div className="service-glass-panel p-6 md:p-8 border-l-4 border-l-amber-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <FileText size={22} />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">{info.title}</span>
                        <p className="text-gray-300 text-sm mt-1 leading-relaxed max-w-xl">{description}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="shrink-0 w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-indigo-950 font-bold px-6 py-3 rounded-full text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:scale-105 active:scale-95 transition-all"
                >
                    Get Full Report ({info.price}) <ArrowRight size={16} />
                </button>
            </div>

            <ReportPurchaseModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                initialReportType={reportType}
            />
        </>
    );
};

export default ReportUpsellCTA;
