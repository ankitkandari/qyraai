import dynamic from 'next/dynamic';

export const Icons = {
    spinner: dynamic(() =>
        import('lucide-react').then((mod) => mod.Loader2)
    ),
    copy: dynamic(() =>
        import('lucide-react').then((mod) => mod.Copy)
    ),
    check: dynamic(() =>
        import('lucide-react').then((mod) => mod.Check)
    ),
    settings: dynamic(() =>
        import('lucide-react').then((mod) => mod.Settings)
    ),
    upload: dynamic(() =>
        import('lucide-react').then((mod) => mod.Upload)
    ),
    analytics: dynamic(() =>
        import('lucide-react').then((mod) => mod.BarChart)
    ),
    code: dynamic(() =>
        import('lucide-react').then((mod) => mod.Code)
    ),
    download: dynamic(() =>
        import('lucide-react').then((mod) => mod.Download)
    ),
    bot: dynamic(() =>
        import('lucide-react').then((mod) => mod.Bot)
    )
};