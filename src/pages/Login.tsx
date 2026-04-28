import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, Lock, User, Info, Server, ShieldCheck, Zap, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENVIRONMENTS } from "@/constants";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [environment, setEnvironment] = useState('Q1');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const from = (location.state as any)?.from?.pathname || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const userData = await apiService.login(username, password, environment);
            login(userData);
            toast({
                title: "Authentication Successful",
                description: `Connected to ${environment} as ${username}`,
            });
            navigate(from, { replace: true });
        } catch (error) {
            toast({
                title: "Connection Error",
                description: error instanceof Error ? error.message : "Invalid SQL credentials or database unreachable",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden bg-slate-50">
            {/* Left Side: Brand & Info (Visible on large screens) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-blue-700 to-indigo-900 text-white relative">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Database className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">TDM Portal v2.0</span>
                    </div>

                    <div className="space-y-8 max-w-lg">
                        <h1 className="text-5xl font-extrabold leading-tight">
                            Streamline Your <br />
                            <span className="text-blue-200">Test Data Management</span>
                        </h1>
                        <p className="text-xl text-blue-100/80 leading-relaxed">
                            A unified platform to generate, retrieve, and manage enterprise test data with direct Oracle integration.
                        </p>

                        <div className="grid grid-cols-1 gap-6 pt-8">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                                <ShieldCheck className="h-6 w-6 text-blue-300 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg">Secure Auth</h3>
                                    <p className="text-blue-100/70">End-to-end encrypted sessions using your actual SQL credentials.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                                <Zap className="h-6 w-6 text-blue-300 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg">Instant Generation</h3>
                                    <p className="text-blue-100/70">Create complex patient and intake records in seconds across environments.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                                <Globe className="h-6 w-6 text-blue-300 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg">Multi-Environment</h3>
                                    <p className="text-blue-100/70">Seamlessly switch between Q1, Q2, Q3, and Production databases.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-blue-200/60 flex justify-between items-center">
                    <span>&copy; 2026 Enterprise TDM Systems</span>
                    <div className="flex gap-4">
                        <span>Status: Online</span>
                        <span>v2.4.0</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white lg:bg-transparent">
                <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                        <Database className="h-8 w-8 text-blue-600" />
                        <span className="text-2xl font-bold">TDM Portal</span>
                    </div>

                    <div className="text-left space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sign In</h2>
                        <p className="text-slate-500">Enter your database credentials to connect.</p>
                    </div>

                    <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-6 pt-8">
                                <div className="space-y-2">
                                    <Label htmlFor="environment" className="text-slate-700 font-medium">Target Environment</Label>
                                    <Select value={environment} onValueChange={setEnvironment}>
                                        <SelectTrigger id="environment" className="w-full h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all">
                                            <div className="flex items-center gap-3">
                                                <Server className="h-4 w-4 text-blue-500" />
                                                <SelectValue placeholder="Select Environment" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ENVIRONMENTS.map(e => (
                                                <SelectItem key={e} value={e} className="focus:bg-blue-50">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${e === 'PROD' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                        {e} {e === 'PROD' ? '(Production)' : '(QA)'}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-slate-700 font-medium">SQL Username</Label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="Database username"
                                            className="pl-12 h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-slate-700 font-medium">SQL Password</Label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-12 h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 rounded-lg p-4 flex gap-3 border border-blue-100/50">
                                    <Info className="h-5 w-5 text-blue-600 shrink-0" />
                                    <p className="text-xs text-blue-800 leading-relaxed">
                                        Password is encrypted and never stored in plain text. Your credentials are used exclusively to establish a secure database session.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="pb-8">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Connecting...
                                        </div>
                                    ) : "Establish Secure Connection"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                    
                    <div className="flex justify-center gap-8 text-sm text-slate-400 font-medium">
                        <button className="hover:text-blue-600 transition-colors">Documentation</button>
                        <button className="hover:text-blue-600 transition-colors">System Status</button>
                        <button className="hover:text-blue-600 transition-colors">IT Support</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
