'use client';

import { useState } from 'react';
import { Button } from './button';
import { Icons } from '@/components/icons';

export function CopyButton({
    text,
    size = 'default',
}: {
    text: string;
    size?: 'default' | 'sm' | 'lg';
}) {
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size={size}
            onClick={copyToClipboard}
            className="hover:bg-muted"
        >
            {isCopied ? (
                <Icons.check className="h-4 w-4" />
            ) : (
                <Icons.copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy</span>
        </Button>
    );
}