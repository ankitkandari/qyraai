'use client';
import { useState, useEffect } from 'react';
import { Copy, Check, Eye, Save, Palette, MessageSquare, Settings2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/lib/api';
import { ClientConfig } from '@/types';

interface ClientIDBoxProps {
    clientConfig: ClientConfig | {};
}

export default function ClientIDBox({ clientConfig }: ClientIDBoxProps) {
    const defaultConfig: ClientConfig = {
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
    };

    const [config, setConfig] = useState<ClientConfig>(defaultConfig);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const api = useApi();

    const mergeConfig = (newConfig: Partial<ClientConfig>): ClientConfig => {
        return {
            ...defaultConfig,
            ...newConfig,
            theme: {
                ...defaultConfig.theme,
                ...(newConfig.theme || {})
            }
        };
    };

    useEffect(() => {
        const loadConfig = async () => {
            setLoading(true);
            setError(null);

            try {
                if (clientConfig && Object.keys(clientConfig).length > 0) {
                    const mergedConfig = mergeConfig(clientConfig as ClientConfig);
                    setConfig(mergedConfig);
                    setLoading(false);
                    return;
                }
            } catch (err: any) {
                console.error('Failed to load config:', err);
                setError(err.message || 'Failed to load configuration');
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, [clientConfig]);

    const saveConfig = async () => {
        if (!config.client_id) {
            setError('Client ID is required');
            return;
        }

        setSaving(true);
        setSaveStatus('idle');
        setError(null);

        try {
            const response = await api.updateConfig(config);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error: any) {
            console.error('Save config error:', error);
            setError(error.message || 'Failed to save configuration');
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 5000);
        } finally {
            setSaving(false);
        }
    };

    const handleThemeChange = (key: string, value: string) => {
        setConfig(prev => {
            const newTheme = {
                ...prev.theme,
                [key]: value,
            };
            return {
                ...prev,
                theme: newTheme
            };
        });
    };

    const copyClientId = async () => {
        try {
            await navigator.clipboard.writeText(config.client_id || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy client ID:', error);
        }
    };

    const presetColors = [
        { name: 'Blue', color: '#3b82f6' },
        { name: 'Green', color: '#10b981' },
        { name: 'Purple', color: '#8b5cf6' },
        { name: 'Red', color: '#ef4444' },
        { name: 'Orange', color: '#f59e0b' },
        { name: 'Pink', color: '#ec4899' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600">Loading configuration...</p>
                </div>
            </div>
        );
    }

    if (error && !config.client_id) {
        return (
            <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                    <div className="flex items-center justify-between">
                        <span>Error loading configuration: {error}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-8">
            {/* Client ID Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Settings2 className="h-5 w-5" />
                        Client Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">
                            Your Client ID
                        </Label>
                        <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-slate-50 border rounded-lg p-3 font-mono text-sm text-slate-900">
                                {config.client_id || 'No client ID available'}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyClientId}
                                className="shrink-0"
                                disabled={!config.client_id}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Use this ID to identify your chatbot in API calls and widget integration
                        </p>
                    </div>

                    <Separator />

                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                            Chatbot Name
                        </Label>
                        <Input
                            value={config.name}
                            onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter your chatbot name"
                        />
                    </div>

                    <Separator />

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">Chatbot Status</Label>
                            <p className="text-xs text-slate-500">
                                Enable or disable your chatbot globally
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={config.enabled}
                                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                            />
                            <Badge variant={config.enabled ? "default" : "secondary"}>
                                {config.enabled ? "Active" : "Disabled"}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Theme Customization */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Palette className="h-5 w-5" />
                        Theme Customization
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Color Presets */}
                    <div>
                        <Label className="text-sm font-medium text-slate-700 mb-3 block">
                            Quick Color Presets
                        </Label>
                        <div className="grid grid-cols-6 gap-2">
                            {presetColors.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => handleThemeChange('primary_color', preset.color)}
                                    className={`w-full h-10 rounded-lg border-2 transition-all hover:scale-105 ${config.theme.primary_color === preset.color
                                            ? 'border-slate-400'
                                            : 'border-slate-200'
                                        }`}
                                    style={{ backgroundColor: preset.color }}
                                    title={preset.name}
                                />
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Custom Colors */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">
                                Primary Color
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="color"
                                    value={config.theme.primary_color}
                                    onChange={(e) => handleThemeChange('primary_color', e.target.value)}
                                    className="w-12 h-10 p-1 rounded-lg"
                                />
                                <Input
                                    type="text"
                                    value={config.theme.primary_color}
                                    onChange={(e) => handleThemeChange('primary_color', e.target.value)}
                                    className="flex-1 font-mono text-sm"
                                    placeholder="#3b82f6"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">
                                Background Color
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="color"
                                    value={config.theme.background_color}
                                    onChange={(e) => handleThemeChange('background_color', e.target.value)}
                                    className="w-12 h-10 p-1 rounded-lg"
                                />
                                <Input
                                    type="text"
                                    value={config.theme.background_color}
                                    onChange={(e) => handleThemeChange('background_color', e.target.value)}
                                    className="flex-1 font-mono text-sm"
                                    placeholder="#ffffff"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">
                                Text Color
                            </Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="color"
                                    value={config.theme.text_color}
                                    onChange={(e) => handleThemeChange('text_color', e.target.value)}
                                    className="w-12 h-10 p-1 rounded-lg"
                                />
                                <Input
                                    type="text"
                                    value={config.theme.text_color}
                                    onChange={(e) => handleThemeChange('text_color', e.target.value)}
                                    className="flex-1 font-mono text-sm"
                                    placeholder="#1f2937"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Messages & Behavior */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <MessageSquare className="h-5 w-5" />
                        Messages & Behavior
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Welcome Message */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                            Welcome Message
                        </Label>
                        <Textarea
                            value={config.welcome_message}
                            onChange={(e) => setConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
                            className="min-h-[80px] resize-none"
                            placeholder="Enter the greeting message for your chatbot..."
                        />
                        <p className="text-xs text-slate-500">
                            This message will be shown when users first interact with your chatbot
                        </p>
                    </div>

                    <Separator />

                    {/* Rate Limiting */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Rate Limit
                        </Label>
                        <div className="flex items-center space-x-4">
                            <Input
                                type="number"
                                min="1"
                                max="100"
                                value={config.rate_limit}
                                onChange={(e) => setConfig(prev => ({ ...prev, rate_limit: parseInt(e.target.value) || 1 }))}
                                className="w-24"
                            />
                            <span className="text-sm text-slate-600">messages per minute</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Limit the number of messages each user can send per minute
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Eye className="h-5 w-5" />
                        Live Preview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div
                            className="border-2 border-dashed border-slate-200 rounded-lg p-6 transition-all"
                            style={{ backgroundColor: config.theme.background_color }}
                        >
                            <div className="max-w-sm">
                                {/* Chat Header */}
                                <div
                                    className="rounded-t-lg p-3 text-white text-sm font-medium"
                                    style={{ backgroundColor: config.theme.primary_color }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-white/80 rounded-full"></div>
                                        <span>{config.name || 'AI Assistant'}</span>
                                    </div>
                                </div>

                                {/* Chat Body */}
                                <div className="border-x border-b border-slate-200 p-4 bg-white rounded-b-lg">
                                    <div className="space-y-3">
                                        <div
                                            className="inline-block max-w-[80%] p-3 rounded-lg text-sm"
                                            style={{
                                                backgroundColor: (config.theme?.primary_color || '#3b82f6') + '15',
                                                color: config.theme?.text_color || '#1f2937',
                                                borderColor: (config.theme?.primary_color || '#3b82f6') + '30'
                                            }}
                                        >
                                            {config.welcome_message || 'Hello! How can I help you today?'}
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Input
                                                placeholder="Type a message..."
                                                className="text-xs h-8"
                                                disabled
                                            />
                                            <Button
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                style={{ backgroundColor: config.theme?.primary_color || '#3b82f6' }}
                                            >
                                                →
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                            This is how your chatbot widget will appear to users
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Save Section */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-medium">Save Changes</h3>
                            <p className="text-sm text-slate-500">
                                Apply your configuration changes to the live chatbot
                            </p>
                        </div>
                        <Button
                            onClick={saveConfig}
                            disabled={saving}
                            className="min-w-[120px]"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Status Messages */}
                    {saveStatus === 'success' && (
                        <Alert className="mt-4 border-green-200 bg-green-50">
                            <Check className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Configuration saved successfully! Changes are now live.
                            </AlertDescription>
                        </Alert>
                    )}

                    {saveStatus === 'error' && (
                        <Alert className="mt-4 border-red-200 bg-red-50">
                            <AlertDescription className="text-red-800">
                                Failed to save configuration. Please try again.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}