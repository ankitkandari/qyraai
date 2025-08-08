'use client';
import { useUser, UserButton } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import { Settings, Upload, BarChart, Code, Copy, Loader2, Bot, Download, Package, AlertCircle, RefreshCw, MessageCircle } from 'lucide-react';
import PDFUpload from '@/components/PDFUpload';
import ClientIDBox from '@/components/ClientIDBox';
import Analytics from '@/components/Analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClientConfig } from '@/types';
import { useApi } from '@/lib/api';
import Loader from '@/components/Loader';
import Link from 'next/link';

export default function Dashboard() {
    const { user, isLoaded } = useUser();
    const [activeTab, setActiveTab] = useState('config');
    const [config, setConfig] = useState<ClientConfig>({
        client_id: '',
        name: '',
        enabled: false,
        welcome_message: '',
        rate_limit: 10,
        theme: {
            primary_color: '#3b82f6',
            background_color: '#ffffff',
            text_color: '#1f2937'
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const api = useApi();

    const loadConfig = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError(null);

            const response = await api.getConfig();
            if (response) {
                setConfig(response);

            }
        } catch (error: any) {
            console.error('Failed to load config:', error);
            setError(error.message || 'Failed to load dashboard configuration');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleRetry = () => {
        loadConfig(true);
    };

    useEffect(() => {
        if (isLoaded) {
            loadConfig();
        }
    }, [isLoaded]);

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error(`Failed to copy ${type}:`, error);
        }
    };

    const downloadFile = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!isLoaded || loading) {
        return <Loader />;
    }

    const scriptEmbed = `<script
  src="https://cdn.freecity.tech/scripts/widget.js"
  data-client-id="${config.client_id}"
></script>`;

    const npmInstall = 'npm install chatbot-widget';
    const yarnInstall = 'yarn add chatbot-widget';

    return (
        <TooltipProvider>

            <div className=" bg-gray-50">
                <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <Link href={"/"} className="flex items-center gap-3">
                                <div className="sm:w-10 sm:h-10 w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 sm:rounded-xl rounded-lg flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Qyra
                                </span>
                            </Link>

                            <div className="flex items-center space-x-4">
                                <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-600">
                                    <span>Welcome, {user?.firstName || 'User'}</span>
                                </div>
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "h-10 w-10"
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </header>


                {error && !loading && (
                    <div className=" mx-auto px-4 pt-4">
                        <Alert className="border-amber-200 bg-amber-50">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                                <div className="flex items-center justify-between">
                                    <span>{error}</span>
                                    <Button variant="outline" size="sm" onClick={handleRetry}>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Retry
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}


                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
                        </h2>
                        <p className="text-slate-600">
                            Manage your chatbot configuration and analytics.
                        </p>
                    </div>

                    {config.client_id && (
                        <div className="my-8 animate-fade-in">
                            <Card className="border-0 shadow-sm bg-white rounded-xl overflow-hidden transition-all">
                                <CardContent className="flex flex-col items-center text-center p-4">
                                    <div className="max-w-md space-y-5">
                                        <div className="inline-flex bg-indigo-100 rounded-full p-3 mb-3">
                                            <MessageCircle className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            Experience Your AI Assistant
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            Upload relevant documents and let your AI assistant answer questions based on them.
                                            <br />
                                            <span className="text-indigo-600 font-medium">Live Preview</span> allows you to test your chatbot instantly.
                                        </p>
                                        <Button
                                            asChild
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                        >
                                            <a
                                                href={`https://test.freecity.tech/?client_id=${config.client_id}&preview=true`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Launch Live Preview
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}




                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

                        <TabsList className="flex w-full flex-wrap bg-white border h-full">
                            <TabsTrigger
                                value="config"
                                className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                            >
                                <Settings className="h-4 w-4" />
                                Configuration
                            </TabsTrigger>
                            <TabsTrigger
                                value="upload"
                                className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                            >
                                <Upload className="h-4 w-4" />
                                Upload
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                            >
                                <BarChart className="h-4 w-4" />
                                Analytics
                            </TabsTrigger>
                            <TabsTrigger
                                value="embed"
                                className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                            >
                                <Code className="h-4 w-4" />
                                Embed
                            </TabsTrigger>
                        </TabsList>


                        <TabsContent value="config">
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='px-2 sm:px-6'>
                                    <ClientIDBox
                                        clientConfig={config}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="upload">
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Upload className="w-5 h-5" />
                                        Upload Content
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='px-2 sm:px-6'>
                                    <PDFUpload clientId={config.client_id} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics">
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart className="w-5 h-5" />
                                        Analytics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='px-2 sm:px-6'>
                                    <Analytics />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="embed">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Code className="w-5 h-5 text-blue-600" />
                                        <span>Embed Your Chatbot</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 px-2 sm:px-6">
                                    <div className="space-y-6">

                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-medium text-gray-700">Script Embed</h3>
                                                <div className="flex gap-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-2"
                                                                onClick={() => copyToClipboard(scriptEmbed, 'script')}
                                                                disabled={!config.client_id}
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                                <span>Copy</span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Copy script to clipboard</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-2"
                                                                onClick={() => downloadFile(scriptEmbed, `chatbot-embed-${config.client_id}.html`)}
                                                                disabled={!config.client_id}
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                <span>Download</span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Download embed script</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <pre className="p-4 pr-10 overflow-x-auto text-sm bg-gray-50 rounded-md border border-gray-200 font-mono">
                                                    {scriptEmbed}
                                                </pre>
                                                <div className="absolute right-3 top-3 flex gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => copyToClipboard(scriptEmbed, 'script')}
                                                                disabled={!config.client_id}
                                                            >
                                                                <Copy className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Copy to clipboard</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                <p className="text-xs text-gray-500">
                                                    Paste this script tag just before the closing &lt;/body&gt; tag of your website.
                                                </p>
                                                {!config.client_id && (
                                                    <p className="text-xs text-amber-600">
                                                        ⚠️ Complete your configuration first to get a valid client ID.
                                                    </p>
                                                )}
                                            </div>
                                        </div>




                                        <div className="pt-4 border-t">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">Usage Instructions</h3>
                                            <div className="space-y-4">
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                                                            <span className="text-xs font-medium">1</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700">Import the widget</h4>
                                                        <p className="text-xs text-gray-500">
                                                            Add the script tag
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                                                            <span className="text-xs font-medium">2</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700">Initialize</h4>
                                                        <p className="text-xs text-gray-500">
                                                            The widget will automatically initialize with your client ID
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                                                            <span className="text-xs font-medium">3</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700">Customize</h4>
                                                        <p className="text-xs text-gray-500">
                                                            Use the Configuration tab to customize colors, messages, and behavior
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                        {config.client_id && (
                                            <div className="pt-4 border-t bg-blue-50 p-4 rounded-lg">
                                                <h4 className="text-sm font-medium text-blue-900 mb-2">Your Configuration</h4>
                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                    <div>
                                                        <span className="text-blue-700 font-medium">Client ID:</span>
                                                        <br />
                                                        <code className="text-blue-600">{config.client_id}</code>
                                                    </div>
                                                    <div>
                                                        <span className="text-blue-700 font-medium">Status:</span>
                                                        <br />
                                                        <span className={`${config.enabled ? 'text-green-600' : 'text-red-600'}`}>
                                                            {config.enabled ? 'Active' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </TooltipProvider>
    );
}