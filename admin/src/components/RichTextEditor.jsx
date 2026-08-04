import React, { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Quote,
    List, ListOrdered, IndentIncrease, IndentDecrease, Link as LinkIcon,
    Image as ImageIcon, RemoveFormatting, Code2, Undo2, Redo2,
} from 'lucide-react';
import clsx from 'clsx';
import { cms } from '../services/api';

// The API returns relative /static/... paths for uploaded images. Blog
// content is rendered on the public site (a different origin than the API),
// so a relative path baked into the stored HTML would 404 there -- resolve
// to an absolute URL before it ever lands in the document.
const toAbsoluteUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const uploadPastedImage = async (view, event) => {
    const item = Array.from(event.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
    if (!item) return false;

    event.preventDefault();
    const file = item.getAsFile();
    if (!file) return true;

    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await cms.upload(formData);
        const node = view.state.schema.nodes.image.create({ src: toAbsoluteUrl(res.data.url) });
        view.dispatch(view.state.tr.replaceSelectionWith(node));
    } catch (e) {
        alert(e.message || 'Failed to upload pasted image.');
    }
    return true;
};

// Image extension with a drag-to-resize handle. Stores the chosen width as an
// inline style on the <img> (renderHTML/parseHTML below) so it round-trips
// through the stored post HTML and renders at the same size on the public site.
const ResizableImage = ImageExtension.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                renderHTML: (attributes) => (attributes.width ? { style: `width: ${attributes.width}px` } : {}),
                parseHTML: (element) => {
                    const width = element.style.width || element.getAttribute('width');
                    const parsed = width ? parseInt(width, 10) : null;
                    return Number.isFinite(parsed) ? parsed : null;
                },
            },
        };
    },

    addNodeView() {
        return ({ node, getPos, editor }) => {
            const container = document.createElement('div');
            container.contentEditable = 'false';
            container.style.position = 'relative';
            container.style.display = 'inline-block';
            container.style.maxWidth = '100%';
            container.style.lineHeight = '0';

            const img = document.createElement('img');
            img.src = node.attrs.src;
            if (node.attrs.alt) img.alt = node.attrs.alt;
            if (node.attrs.title) img.title = node.attrs.title;
            img.style.display = 'block';
            img.style.width = node.attrs.width ? `${node.attrs.width}px` : '100%';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.draggable = false;

            const handle = document.createElement('div');
            handle.title = 'Drag to resize';
            Object.assign(handle.style, {
                position: 'absolute',
                right: '-4px',
                bottom: '-4px',
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: '#4f46e5',
                border: '2px solid white',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                cursor: 'nwse-resize',
                display: 'none',
            });

            container.appendChild(img);
            container.appendChild(handle);

            const setSelected = (selected) => {
                handle.style.display = selected ? 'block' : 'none';
                img.style.outline = selected ? '2px solid #4f46e5' : 'none';
                img.style.outlineOffset = selected ? '2px' : '0';
            };

            let startX = 0;
            let startWidth = 0;

            const onMouseMove = (e) => {
                const delta = e.clientX - startX;
                const newWidth = Math.max(50, Math.round(startWidth + delta));
                img.style.width = `${newWidth}px`;
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                const width = parseInt(img.style.width, 10);
                if (typeof getPos === 'function') {
                    const pos = getPos();
                    editor.view.dispatch(editor.view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, width }));
                }
            };

            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                startX = e.clientX;
                startWidth = img.getBoundingClientRect().width;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            return {
                dom: container,
                selectNode: () => setSelected(true),
                deselectNode: () => setSelected(false),
                stopEvent: (event) => event.target === handle,
                ignoreMutation: () => true,
                update: (updatedNode) => {
                    if (updatedNode.type !== node.type) return false;
                    node = updatedNode;
                    img.src = node.attrs.src;
                    img.style.width = node.attrs.width ? `${node.attrs.width}px` : '100%';
                    return true;
                },
            };
        };
    },
});

// Content pasted from Word/Google Docs/Notion/most contenteditable-based
// apps encodes every word-separating space as U+00A0 (non-breaking space)
// in its clipboard HTML/text, not a plain space — invisible to the eye but
// preserved verbatim by any spec-correct HTML parser (browsers collapse
// runs of *regular* whitespace, but U+00A0 is explicitly exempt from that
// collapsing, which is the whole point of the character). Normalize it
// before ProseMirror ever parses the paste, on both the HTML and
// plain-text paste paths.
const stripNbsp = (str) => str.replace(/\u00a0/g, ' ');

// Quill emitted its HTML as one unbroken string with no whitespace between
// tags, which made the raw-source view unreadable. Re-indent it into one
// element per line, purely for display in the source textarea — block-level
// elements each get their own line, inline content (text, <a>, <b>, <img>,
// etc.) stays inline so we don't inject stray whitespace into rendered
// paragraphs/list items.
const BLOCK_TAGS = new Set(['P', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'DIV']);

const serializeAttrs = (el) =>
    Array.from(el.attributes).map((a) => ` ${a.name}="${a.value}"`).join('');

const formatHtml = (html) => {
    if (!html) return html;
    const container = document.createElement('div');
    container.innerHTML = html;
    const lines = [];

    const walk = (node, depth) => {
        const indent = '  '.repeat(depth);
        node.childNodes.forEach((child) => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.tagName.toLowerCase();
                const attrs = serializeAttrs(child);
                if (BLOCK_TAGS.has(child.tagName)) {
                    const hasBlockChild = Array.from(child.childNodes).some(
                        (c) => c.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(c.tagName)
                    );
                    if (hasBlockChild) {
                        lines.push(`${indent}<${tag}${attrs}>`);
                        walk(child, depth + 1);
                        lines.push(`${indent}</${tag}>`);
                    } else {
                        lines.push(`${indent}<${tag}${attrs}>${child.innerHTML.trim()}</${tag}>`);
                    }
                } else {
                    lines.push(`${indent}${child.outerHTML}`);
                }
            } else if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent.trim();
                if (text) lines.push(`${indent}${text}`);
            }
        });
    };

    walk(container, 0);
    return lines.join('\n');
};

// Undo the formatting whitespace before it round-trips back into the
// editor — newlines/indentation between block tags are harmless in
// rendered HTML, but collapsing them back keeps the stored content clean.
const minifyHtml = (html) => html.replace(/>\s+</g, '><').trim();

const ToolbarButton = ({ onClick, active, disabled, title, children }) => (
    <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={clsx(
            'p-1.5 rounded-md transition-colors',
            active ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
            disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
        )}
    >
        {children}
    </button>
);

const ToolbarDivider = () => <span className="w-px h-6 bg-slate-200 mx-1" />;

const HeadingSelect = ({ editor }) => {
    const value = editor.isActive('heading', { level: 1 })
        ? '1'
        : editor.isActive('heading', { level: 2 })
            ? '2'
            : editor.isActive('heading', { level: 3 })
                ? '3'
                : '';

    return (
        <select
            value={value}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
                const level = e.target.value;
                if (!level) editor.chain().focus().setParagraph().run();
                else editor.chain().focus().toggleHeading({ level: Number(level) }).run();
            }}
            className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
            <option value="">Normal</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
        </select>
    );
};

const Toolbar = ({ editor, showSource, onToggleSource }) => {
    if (!editor) return null;

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl || 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const insertImage = () => {
        const url = window.prompt('Image URL');
        if (url) editor.chain().focus().setImage({ src: url }).run();
    };

    return (
        <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <HeadingSelect editor={editor} />
            <ToolbarDivider />
            <ToolbarButton title="Bold" active={editor.isActive('bold')} disabled={showSource} onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton title="Italic" active={editor.isActive('italic')} disabled={showSource} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic size={16} />
            </ToolbarButton>
            <ToolbarButton title="Underline" active={editor.isActive('underline')} disabled={showSource} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                <UnderlineIcon size={16} />
            </ToolbarButton>
            <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} disabled={showSource} onClick={() => editor.chain().focus().toggleStrike().run()}>
                <Strikethrough size={16} />
            </ToolbarButton>
            <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} disabled={showSource} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote size={16} />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} disabled={showSource} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered size={16} />
            </ToolbarButton>
            <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} disabled={showSource} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List size={16} />
            </ToolbarButton>
            <ToolbarButton title="Outdent" disabled={showSource || !editor.can().liftListItem('listItem')} onClick={() => editor.chain().focus().liftListItem('listItem').run()}>
                <IndentDecrease size={16} />
            </ToolbarButton>
            <ToolbarButton title="Indent" disabled={showSource || !editor.can().sinkListItem('listItem')} onClick={() => editor.chain().focus().sinkListItem('listItem').run()}>
                <IndentIncrease size={16} />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton title="Link" active={editor.isActive('link')} disabled={showSource} onClick={setLink}>
                <LinkIcon size={16} />
            </ToolbarButton>
            <ToolbarButton title="Image" disabled={showSource} onClick={insertImage}>
                <ImageIcon size={16} />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton title="Clear formatting" disabled={showSource} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
                <RemoveFormatting size={16} />
            </ToolbarButton>
            <ToolbarButton title="Undo" disabled={showSource || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
                <Undo2 size={16} />
            </ToolbarButton>
            <ToolbarButton title="Redo" disabled={showSource || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
                <Redo2 size={16} />
            </ToolbarButton>
            <div className="flex-1" />
            <ToolbarButton title="View HTML source" active={showSource} onClick={onToggleSource}>
                <Code2 size={16} />
            </ToolbarButton>
        </div>
    );
};

export const RichTextEditor = ({ value, onChange, placeholder, style, className }) => {
    const [showSource, setShowSource] = useState(false);
    const [sourceText, setSourceText] = useState('');

    const extensions = useMemo(() => [
        StarterKit.configure({
            heading: { levels: [1, 2, 3] },
        }),
        Underline,
        Link.configure({ openOnClick: false, autolink: true }),
        ResizableImage,
        Placeholder.configure({ placeholder: placeholder || 'Write your post…' }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []);

    const editor = useEditor({
        extensions,
        content: value || '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none px-4 py-3 min-h-[260px]',
            },
            transformPastedHTML: (html) => stripNbsp(html),
            transformPastedText: (text) => stripNbsp(text),
            handlePaste: uploadPastedImage,
        },
        onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    });

    // Keep the editor in sync when `value` changes from outside (e.g. the
    // post finishes loading async, or the source-view toggle writes back).
    useEffect(() => {
        if (!editor) return;
        const current = editor.getHTML();
        const incoming = value || '';
        if (incoming !== current && !showSource) {
            editor.commands.setContent(incoming, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, editor]);

    const toggleSource = () => {
        if (!editor) return;
        if (!showSource) {
            setSourceText(formatHtml(editor.getHTML()));
            setShowSource(true);
        } else {
            const minified = minifyHtml(sourceText);
            editor.commands.setContent(minified, false);
            onChange(minified);
            setShowSource(false);
        }
    };

    return (
        <div className={clsx('flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white', className)} style={style}>
            <Toolbar editor={editor} showSource={showSource} onToggleSource={toggleSource} />

            {showSource ? (
                <textarea
                    className="w-full flex-1 p-4 font-mono text-sm focus:outline-none resize-none"
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                />
            ) : (
                <div className="flex-1 overflow-auto">
                    <EditorContent editor={editor} />
                </div>
            )}
        </div>
    );
};
