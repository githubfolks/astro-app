import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

// Renders the SEO Agent quality gate result ({ passed, issues, stats }).
export default function SeoQualityReport({ report }) {
    if (!report) return null;
    const { passed, issues = [], stats = {} } = report;
    return (
        <div className={`rounded-lg border p-3 text-sm ${passed ? 'border-green-200 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
            <div className="flex items-center gap-2 font-medium">
                {passed
                    ? <><CheckCircle2 size={16} className="text-green-700" /> <span className="text-green-800">Quality check passed</span></>
                    : <><AlertTriangle size={16} className="text-amber-700" /> <span className="text-amber-900">Quality check failed: {issues.length} issue{issues.length === 1 ? '' : 's'}. This post cannot be published until they are fixed.</span></>}
            </div>
            {Object.keys(stats).length > 0 && (
                <p className="mt-1 text-xs text-slate-600">
                    {stats.words ?? '–'} words · {stats.faqs ?? '–'} FAQs · {stats.internal_links ?? '–'} internal links
                </p>
            )}
            {issues.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-900">
                    {issues.map((issue, i) => <li key={`${issue.code}-${i}`}>{issue.message}</li>)}
                </ul>
            )}
        </div>
    );
}
