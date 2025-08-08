'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, MessageSquare, Users, Clock, Activity, FileText, Database, Zap, Download, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useApi } from '@/lib/api';
import { AnalyticsData } from '@/types';



export default function Analytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'knowledge'>('overview');

    useEffect(() => {
        loadAnalytics();
    }, []);

    const api = useApi();

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const analyticsResponse = await api.getAnalytics();
            setData(analyticsResponse);

        } catch (error) {
            console.error('Failed to load analytics:', error);
            setError(error instanceof Error ? error.message : 'Failed to load analytics');
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const exportAnalytics = async () => {
        try {
            const blob = await api.getAnalyticExport();

            if (!blob) {
                toast.error('No data to export.');
                return;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Analytics exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export analytics');
        }
    };

    const formatTooltip = (value: any, name: string) => {
        if (name === 'avg_response_time' || name === 'time') return [`${value}ms`, 'Response Time'];
        if (name === 'target') return [`${value}ms`, 'Target'];
        if (name === 'messages') return [value, 'Messages'];
        if (name === 'sessions') return [value, 'Sessions'];
        return [value, name];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getStatusColor = (responseTime: number) => {
        if (responseTime < 200) return 'text-green-600 bg-green-100';
        if (responseTime < 500) return 'text-amber-600 bg-amber-100';
        return 'text-red-600 bg-red-100';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-64 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="text-red-500">
                    <Activity className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-semibold">Failed to load analytics</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button onClick={loadAnalytics} variant="outline">
                    Retry
                </Button>
            </div>
        );
    }

    const chartData = data.daily_activity?.map(item => ({
        name: formatDate(item.date),
        messages: item.messages,
        sessions: Math.floor(item.messages * 0.3)
    })) || [];

    const responseTimeData = data.response_time_trend?.map(item => ({
        name: formatDate(item.date),
        time: item.avg_response_time,
        target: item.target
    })) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                    {/* <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2> */}
                    <p className="text-muted-foreground">
                        Last updated: {new Date(data.last_updated).toLocaleString()}
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={loadAnalytics} variant="outline" size="sm">
                        <Activity className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={exportAnalytics} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-muted rounded-lg p-1 flex-wrap">
                {[
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'sessions', label: 'Sessions', icon: Users },
                    { id: 'knowledge', label: 'Knowledge Base', icon: Database }
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === id
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <div className="flex items-center space-x-2">
                                        <MessageSquare className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Messages</p>
                                            <p className="text-2xl font-bold">{data.total_messages.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            Active
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <div className="flex items-center space-x-2">
                                        <Users className="h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Unique Sessions</p>
                                            <p className="text-2xl font-bold">{data.unique_sessions.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                            {data.avg_messages_per_session.toFixed(1)} avg
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-amber-500">
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Avg Response Time</p>
                                            <p className="text-2xl font-bold">{data.avg_response_time}ms</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <Badge variant="secondary" className={
                                            data.avg_response_time < 200
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }>
                                            <Zap className="h-3 w-3 mr-1" />
                                            {data.cache_efficiency}% cached
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <div className="flex items-center space-x-2">
                                        <Activity className="h-5 w-5 text-purple-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Last 24h</p>
                                            <p className="text-2xl font-bold">{data.last_24h_messages.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                            <FileText className="h-3 w-3 mr-1" />
                                            {data.total_files} files
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Insights Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Activity className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Peak Activity</p>
                                        <p className="text-xs text-muted-foreground">
                                            {data.peak_activity_day || 'No data yet'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <Clock className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Busiest Hour</p>
                                        <p className="text-xs text-muted-foreground">
                                            {data.busiest_hour || 'No data yet'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                        <Users className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Avg Session Duration</p>
                                        <p className="text-xs text-muted-foreground">
                                            {data.avg_session_duration} minutes
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily Activity Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart className="h-5 w-5" />
                                    Daily Activity
                                </CardTitle>
                                <CardDescription>Messages over time ({chartData.length} days)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <defs>
                                                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                />
                                                <Tooltip
                                                    formatter={formatTooltip}
                                                    contentStyle={{
                                                        backgroundColor: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="messages"
                                                    stroke="#3b82f6"
                                                    fillOpacity={1}
                                                    fill="url(#colorMessages)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            No data available
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Response Time Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Response Time Trend
                                </CardTitle>
                                <CardDescription>Average response time vs target (200ms)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    {responseTimeData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={responseTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                />
                                                <Tooltip
                                                    formatter={formatTooltip}
                                                    contentStyle={{
                                                        backgroundColor: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="target"
                                                    stroke="#ef4444"
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="time"
                                                    stroke="#10b981"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            No data available
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Sessions</p>
                                        <p className="text-2xl font-bold">{data.unique_sessions}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <MessageSquare className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Messages/Session</p>
                                        <p className="text-2xl font-bold">{data.avg_messages_per_session.toFixed(1)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Response Time</p>
                                        <p className="text-2xl font-bold">{data.avg_response_time_per_session}ms</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Activity className="h-5 w-5 text-purple-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Duration</p>
                                        <p className="text-2xl font-bold">{data.avg_session_duration}m</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Sessions</CardTitle>
                            <CardDescription>Latest chat sessions with performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.recent_activity.length > 0 ? (
                                    data.recent_activity.slice(0, 10).map((session, index) => (
                                        <div key={index} className="flex items-center justify-between flex-wrap gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-blue-600">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Session {session.session_id}</p>
                                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                        <span>{session.message_count} messages</span>
                                                        <span>{session.duration_minutes}m duration</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:text-right">
                                                <Badge variant="secondary" className={getStatusColor(session.avg_response_time)}>
                                                    {session.avg_response_time}ms avg
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(session.last_activity).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No sessions yet</p>
                                        <p className="text-sm">Start chatting to see session analytics</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Knowledge Base Tab */}
            {activeTab === 'knowledge' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Files</p>
                                        <p className="text-2xl font-bold">{data.total_files}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Database className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Chunks</p>
                                        <p className="text-2xl font-bold">{data.total_chunks}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Activity className="h-5 w-5 text-amber-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Chunks/File</p>
                                        <p className="text-2xl font-bold">
                                            {data.total_files > 0 ? (data.total_chunks / data.total_files).toFixed(1) : 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-2">
                                    <Database className="h-5 w-5 text-purple-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Knowledge Base Size</p>
                                        <p className="text-2xl font-bold">{formatBytes(data.knowledge_base_size)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Knowledge Base Files</CardTitle>
                            <CardDescription>Uploaded files and their processing details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.files_list.length > 0 ? (
                                    data.files_list.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border flex-wrap gap-2 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <FileText className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{file.filename}</p>
                                                    <div className="flex items-center flex-wrap gap-1 space-x-4 text-sm text-muted-foreground">
                                                        <span>{file.num_pages} pages</span>
                                                        <span>{formatBytes(file.size)}</span>
                                                        <span>{file.chunk_count} chunks</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:text-right">
                                                <Badge variant="secondary" className="mb-2 bg-green-100 text-green-700">
                                                    Processed
                                                </Badge>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(file.uploaded_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No files uploaded yet</p>
                                        <p className="text-sm">Upload PDF files to build your knowledge base</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Recent Activity Timeline (shown on all tabs) */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest chatbot interactions and system events</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.recent_activity?.length > 0 ? (
                            data.recent_activity.slice(0, 5).map((session, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg  border bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                                    <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900">
                                            Session {session.session_id} completed with {session.message_count} messages
                                        </p>
                                        <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                                            <p className="text-xs text-slate-500">
                                                {session.duration_minutes}m duration • {session.avg_response_time}ms avg response
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                    {session.message_count} messages
                                                </Badge>
                                                <Badge variant="secondary" className={`text-xs ${getStatusColor(session.avg_response_time)}`}>
                                                    {session.avg_response_time < 200 ? 'Fast' : session.avg_response_time < 500 ? 'Good' : 'Slow'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(session.last_activity).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="flex items-start space-x-3 p-3 rounded-lg border bg-slate-50/50">
                                    <div className="w-2 h-2 rounded-full mt-2 bg-green-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900">
                                            Analytics system initialized
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-slate-500">System ready to track interactions</p>
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                                active
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-3 rounded-lg border bg-slate-50/50">
                                    <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900">
                                            Client configuration loaded
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-slate-500">Ready to receive messages</p>
                                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                configured
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{data.total_interactions}</div>
                        <div className="text-sm text-muted-foreground">Total Interactions</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Database className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">{formatBytes(data.knowledge_base_size)}</div>
                        <div className="text-sm text-muted-foreground">Knowledge Base Size</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Zap className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold text-amber-600">{data.cache_efficiency}%</div>
                        <div className="text-sm text-muted-foreground">Cache Efficiency</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageSquare className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-600">{data.avg_messages_per_session.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Avg Messages/Session</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}