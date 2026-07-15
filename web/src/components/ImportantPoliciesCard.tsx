import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const ImportantPoliciesCard: React.FC = () => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-[#E91E63]" />
                Important Policies
            </h3>
            <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
                <li>No earning for consultations that are less than 1 minute.</li>
                <li>Do not share your personal details such as contact number, email, or social media username with any seeker.</li>
                <li>Never ask for or accept personal details from a seeker.</li>
                <li>You need to be available for a minimum of 6 hours every day.</li>
                <li>Always accept calls or chats while you are online. A missed call or chat may result in a &#8377;5 deduction.</li>
                <li>Greet seekers with a warm welcome, e.g. &ldquo;Welcome to Aadikarta&rdquo; or &ldquo;Namaste, aapka swagat hai&rdquo;.</li>
                <li>Be respectful and polite to every seeker.</li>
                <li>Do not respond rudely to any seeker, even if they are being difficult &mdash; report the issue instead.</li>
                <li>Practices like black magic, vashikaran, and suggesting yantra-based poojas are strictly forbidden on Aadikarta.</li>
            </ol>
        </div>
    );
};

export default ImportantPoliciesCard;
