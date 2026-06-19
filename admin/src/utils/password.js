// Strong password policy — kept in sync with the backend (`StrongPassword` in
// api/app/schemas.py): at least 8 characters with one lowercase letter, one
// uppercase letter, one number and one special character.
export const PASSWORD_REQUIREMENTS =
    'Min 8 characters with an uppercase letter, a lowercase letter, a number and a special character.';

export function getPasswordError(password) {
    const missing = [];
    if (!password || password.length < 8) missing.push('at least 8 characters');
    if (!/[a-z]/.test(password)) missing.push('one lowercase letter');
    if (!/[A-Z]/.test(password)) missing.push('one uppercase letter');
    if (!/\d/.test(password)) missing.push('one number');
    if (!/[^A-Za-z0-9]/.test(password)) missing.push('one special character');
    if (missing.length === 0) return null;
    return 'Password must contain ' + missing.join(', ') + '.';
}
