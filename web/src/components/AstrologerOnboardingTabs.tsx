import React, { useState } from 'react';
import type { AstrologerProfile } from '../types';
import { PersonalDetailsCard } from './PersonalDetailsCard';
import { ContractSignCard } from './ContractSignCard';
import { ProfilePhotoCard } from './ProfilePhotoCard';
import { KycDocumentsCard } from './KycDocumentsCard';
import { CertificatesCard } from './CertificatesCard';
import { User, FileSignature, Camera, CreditCard, Award } from 'lucide-react';

interface Props {
    astrologerProfile: AstrologerProfile | null;
    onProfileSaved: (updated: AstrologerProfile) => void;
}

const TABS = [
    { key: 'personal', label: 'Personal Details', icon: User },
    { key: 'contract', label: 'Sign the Contract', icon: FileSignature },
    { key: 'photo', label: 'Profile Photo', icon: Camera },
    { key: 'kyc', label: 'Document Upload (KYC)', icon: CreditCard },
    { key: 'certificates', label: 'Certificates', icon: Award },
] as const;

type TabKey = typeof TABS[number]['key'];

export const AstrologerOnboardingTabs: React.FC<Props> = ({
    astrologerProfile,
    onProfileSaved,
}) => {
    const [activeTab, setActiveTab] = useState<TabKey>('personal');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${activeTab === key
                            ? 'bg-[#E91E63] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            <div className="p-1">
                {activeTab === 'personal' && (
                    <Bare>
                        {astrologerProfile ? (
                            <PersonalDetailsCard profile={astrologerProfile} onSaved={onProfileSaved} />
                        ) : (
                            <LoadingPlaceholder />
                        )}
                    </Bare>
                )}
                {activeTab === 'contract' && (
                    <Bare><ContractSignCard /></Bare>
                )}
                {activeTab === 'photo' && (
                    <Bare>
                        {astrologerProfile ? (
                            <ProfilePhotoCard profile={astrologerProfile} onSaved={onProfileSaved} />
                        ) : (
                            <LoadingPlaceholder />
                        )}
                    </Bare>
                )}
                {activeTab === 'kyc' && (
                    <Bare>
                        {astrologerProfile ? (
                            <KycDocumentsCard profile={astrologerProfile} onSaved={onProfileSaved} />
                        ) : (
                            <LoadingPlaceholder />
                        )}
                    </Bare>
                )}
                {activeTab === 'certificates' && (
                    <Bare>
                        {astrologerProfile ? (
                            <CertificatesCard profile={astrologerProfile} onSaved={onProfileSaved} />
                        ) : (
                            <LoadingPlaceholder />
                        )}
                    </Bare>
                )}
            </div>
        </div>
    );
};

// Each card component ships its own bg-white/border/shadow chrome (they're also
// used standalone elsewhere), which would double up inside this tab panel — this
// strips that outer chrome down to plain padding so only one card boundary shows.
const Bare: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="[&>div]:shadow-none [&>div]:border-0 [&>div]:rounded-none">{children}</div>
);

const LoadingPlaceholder: React.FC = () => (
    <div className="p-6 text-sm text-gray-400">Loading…</div>
);

export default AstrologerOnboardingTabs;
