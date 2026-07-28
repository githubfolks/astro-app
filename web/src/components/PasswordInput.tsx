import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './PasswordInput.css';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

const PasswordInput: React.FC<Props> = ({ style, ...props }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className="password-input-wrapper">
            <input
                {...props}
                type={visible ? 'text' : 'password'}
                style={{ ...style, paddingRight: '2.75rem' }}
            />
            <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setVisible(v => !v)}
                tabIndex={-1}
                aria-label={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
};

export default PasswordInput;
