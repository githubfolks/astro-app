import React, { useState, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Code } from 'lucide-react';
import clsx from 'clsx';
// Actually I don't have uuid installed I assume. I'll use a simple generator.

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
];

const CustomToolbar = ({ id, onToggleSource }) => (
    <div id={id} className="border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <span className="ql-formats">
            <select className="ql-header" defaultValue="">
                <option value="1"></option>
                <option value="2"></option>
                <option value="3"></option>
                <option value=""></option>
            </select>
        </span>
        <span className="ql-formats">
            <button className="ql-bold"></button>
            <button className="ql-italic"></button>
            <button className="ql-underline"></button>
            <button className="ql-strike"></button>
            <button className="ql-blockquote"></button>
        </span>
        <span className="ql-formats">
            <button className="ql-list" value="ordered"></button>
            <button className="ql-list" value="bullet"></button>
            <button className="ql-indent" value="-1"></button>
            <button className="ql-indent" value="+1"></button>
        </span>
        <span className="ql-formats">
            <button className="ql-link"></button>
            <button className="ql-image"></button>
        </span>
        <span className="ql-formats">
            <button className="ql-clean"></button>
        </span>
        <span className="ql-formats">
            <button type="button" onClick={onToggleSource} style={{ width: 'auto' }} className="flex items-center justify-center">
                <Code size={16} />
            </button>
        </span>
    </div>
);

export const RichTextEditor = ({ value, onChange, placeholder, style, className }) => {
    const [showSource, setShowSource] = useState(false);

    // Generate a stable unique ID for the toolbar
    const toolbarId = useMemo(() => `toolbar-${Math.random().toString(36).substr(2, 9)}`, []);

    const modules = useMemo(() => ({
        toolbar: {
            container: `#${toolbarId}`,
        }
    }), [toolbarId]);

    return (
        <div className={clsx("flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white", className)} style={style}>
            <CustomToolbar id={toolbarId} onToggleSource={() => setShowSource(!showSource)} />

            {showSource ? (
                <textarea
                    className="w-full flex-1 p-4 font-mono text-sm focus:outline-none resize-none"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <ReactQuill
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                    className="flex-1 overflow-hidden flex flex-col [&_.ql-container]:flex-1 [&_.ql-container]:border-none [&_.ql-editor]:h-full"
                />
            )}
        </div>
    );
};
