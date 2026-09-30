import React from 'react';
import { useBusinessInfo } from '../hooks/useBusinessInfo';
import { useSupportContact } from '../hooks/useSupportContact';

/**
 * Operator identity and Grievance Officer contact for the legal pages, from
 * Admin > Settings > Business & Legal. Fields left blank there are omitted
 * rather than filled with a placeholder.
 */
const LegalEntityInfo: React.FC = () => {
    const { info, error } = useBusinessInfo();
    const { support_email, support_phone } = useSupportContact();

    if (!info) {
        return <p className="text-sm text-gray-500">{error ? 'Company details could not be loaded. Please refresh the page.' : 'Loading company details…'}</p>;
    }

    const officer = [info.grievance_officer_name, info.grievance_officer_designation].filter(Boolean).join(', ');
    return (
        <address className="not-italic rounded-lg border border-gray-200 bg-gray-50 p-4 text-base space-y-1">
            <div className="font-semibold text-gray-900">{info.company_legal_name}</div>
            <div>Registered office: {info.company_registered_address}</div>
            {info.company_gstin && <div>GSTIN: {info.company_gstin}</div>}
            <div className="pt-2">
                Grievance Officer{officer ? `: ${officer}` : ''}
            </div>
            <div>Email: {support_email}{support_phone ? ` · Phone: ${support_phone}` : ''}</div>
        </address>
    );
};

export default LegalEntityInfo;
