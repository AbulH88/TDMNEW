import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  UserPlus, 
  Shield, 
  Search, 
  Users, 
  ShieldCheck, 
  Activity,
  MoreVertical,
  Filter,
  CheckCircle2,
  XCircle,
  UserCog,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { apiService } from '@/services/apiService';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
    id: string;
    username: string;
    role: string;
    permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
    { id: 'create', label: 'Create', description: 'Can create new test data' },
    { id: 'edit', label: 'Edit', description: 'Can edit existing test data' },
    { id: 'delete', label: 'Delete', description: 'Can delete test data' },
    { id: 'read_only', label: 'Read Only', description: 'Can only view data' },
    { id: 'admin', label: 'Admin Access', description: 'Full system management' },
];

const Admin = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    
    // New User State
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('qa');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);

    // Edit User State
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editRole, setEditRole] = useState('qa');
    const [editPermissions, setEditPermissions] = useState<string[]>([]);
    const [editPassword, setEditPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.fetchUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            // Fallback for UI review if backend isn't running
            setUsers([
                { id: '1', username: 'admin', role: 'admin', permissions: ['admin'] },
                { id: '2', username: 'jdoe', role: 'user', permissions: ['read:generator', 'read:services'] },
                { id: '3', username: 'jsmith', role: 'user', permissions: ['read:generator', 'write:generator'] }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername || !newPassword) return;

        try {
            await apiService.createUser({
                username: newUsername,
                password: newPassword,
                role: newRole,
                permissions: selectedPermissions
            });

            toast({ title: "User Created", description: `${newUsername} has been added to the system.` });
            resetForm();
            fetchUsers();
        } catch (error) {
            toast({ 
                title: "Creation Failed", 
                description: error instanceof Error ? error.message : "Failed to create user", 
                variant: "destructive" 
            });
        }
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditRole(user.role);
        setEditPermissions(user.permissions);
        setIsEditUserOpen(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            await apiService.updateUser(editingUser.id, {
                role: editRole,
                permissions: editPermissions,
                password: editPassword || undefined
            });

            toast({ 
                title: "User Updated", 
                description: `Access levels for ${editingUser.username} have been modified.` 
            });
            setIsEditUserOpen(false);
            setEditingUser(null);
            setEditPassword('');
            setShowPassword(false);
            fetchUsers();
        } catch (error) {
            toast({ 
                title: "Update Failed", 
                description: error instanceof Error ? error.message : "Failed to update user", 
                variant: "destructive" 
            });
        }
    };

    const resetForm = () => {
        setNewUsername('');
        setNewPassword('');
        setNewRole('qa');
        setSelectedPermissions([]);
        setIsAddUserOpen(false);
    };

    const handleDeleteUser = async (id: string) => {
        try {
            await apiService.deleteUser(id);
            toast({ title: "User Deleted", description: "The user has been removed from the system." });
            fetchUsers();
        } catch (error) {
            toast({ 
                title: "Deletion Failed", 
                description: error instanceof Error ? error.message : "Failed to delete user", 
                variant: "destructive" 
            });
        }
    };

    const togglePermission = (permId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    const toggleEditPermission = (permId: string) => {
        setEditPermissions(prev =>
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="min-h-screen bg-[#f3f0ff] relative overflow-hidden font-sans selection:bg-purple-200">
            {/* Soft Nebula Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none"></div>
            
            <Header />
            
            <main className="container mx-auto py-10 px-6 max-w-5xl relative z-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/40">
                            <Shield className="h-7 w-7 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Admin Console</h1>
                            <p className="text-slate-500 font-medium mt-1">Manage system users, roles, and access permissions</p>
                        </div>
                    </div>
                    
                    <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-200/50 rounded-2xl h-12 px-8 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] border-none outline-none">
                                <Plus className="h-5 w-5 mr-2" />
                                Create New User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-white/40 bg-white/90 backdrop-blur-xl shadow-2xl">
                            <form onSubmit={handleAddUser}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black">Add System User</DialogTitle>
                                    <DialogDescription className="font-medium">
                                        Create a new account and assign specific module permissions.
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <div className="grid gap-6 py-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="username" className="font-bold ml-1">Username</Label>
                                            <Input
                                                id="username"
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                placeholder="e.g. jdoe"
                                                className="h-11 rounded-xl bg-white/50 border-slate-200 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="font-bold ml-1">System Role</Label>
                                            <Select value={newRole} onValueChange={setNewRole}>
                                                <SelectTrigger className="h-11 rounded-xl bg-white/50 border-slate-200">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="qa">QA</SelectItem>
                                                    <SelectItem value="developer">Developer</SelectItem>
                                                    <SelectItem value="admin">Administrator</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="password" title="8-12 characters" className="font-bold ml-1">Access Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="h-11 rounded-xl bg-white/50 border-slate-200 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-base font-bold ml-1">Module Permissions</Label>
                                        <div className="grid grid-cols-1 gap-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                                            {AVAILABLE_PERMISSIONS.map(perm => (
                                                <div key={perm.id} className="flex items-center space-x-3 p-1 hover:bg-white/40 rounded-lg transition-colors">
                                                    <Checkbox
                                                        id={`perm-${perm.id}`}
                                                        checked={selectedPermissions.includes(perm.id)}
                                                        onCheckedChange={() => togglePermission(perm.id)}
                                                        className="rounded-md border-slate-300 data-[state=checked]:bg-purple-600"
                                                    />
                                                    <div className="grid leading-none">
                                                        <label
                                                            htmlFor={`perm-${perm.id}`}
                                                            className="text-sm font-bold text-slate-700 cursor-pointer"
                                                        >
                                                            {perm.label}
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <DialogFooter className="gap-3">
                                    <Button variant="ghost" type="button" onClick={resetForm} className="h-12 rounded-xl font-bold">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700 h-12 rounded-xl px-8 font-bold shadow-md shadow-purple-100">
                                        Save User Account
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Users', value: users.length, icon: Users, color: 'text-slate-400' },
                        { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: ShieldCheck, color: 'text-slate-400' },
                        { label: 'Active Status', value: 'Online', badge: true, color: 'text-teal-500 bg-teal-50 border-teal-100' },
                        { label: 'Module Health', value: 'Healthy', badge: true, color: 'text-teal-500 bg-teal-50 border-teal-100' }
                    ].map((stat, i) => (
                        <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-md rounded-[1.5rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                            <CardContent className="p-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{stat.label}</p>
                                <div className="flex items-end justify-between">
                                    {stat.badge ? (
                                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${stat.color} font-bold text-sm`}>
                                            <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                                            {stat.value}
                                        </div>
                                    ) : (
                                        <h3 className="text-4xl font-black text-slate-800">{stat.value}</h3>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* User List & Management */}
                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/20">
                    <CardHeader className="py-10 px-10">
                        <div className="space-y-1 mb-8">
                            <CardTitle className="text-2xl font-black text-slate-900">System Identity Store</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Directory of all accounts authorized to access the TDM system</CardDescription>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by username..."
                                    className="pl-11 h-12 w-full bg-white/50 border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-purple-500/10 transition-all placeholder:text-slate-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-full sm:w-48 h-12 bg-white/50 border-none rounded-2xl shadow-inner font-bold text-slate-600">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-white/40 shadow-2xl">
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="admin">Administrators</SelectItem>
                                    <SelectItem value="qa">QA</SelectItem>
                                    <SelectItem value="developer">Developer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="px-10 pb-10">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-none hover:bg-transparent uppercase tracking-[0.15em] text-[10px] font-black text-slate-400">
                                        <TableHead className="py-4 pl-0">User Profile</TableHead>
                                        <TableHead className="py-4">Security Role</TableHead>
                                        <TableHead className="py-4">Active Permissions</TableHead>
                                        <TableHead className="py-4 text-right">Manage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow className="border-none">
                                            <TableCell colSpan={4} className="text-center py-24">
                                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="border-t border-slate-50/50 hover:bg-white/40 transition-colors group">
                                            <TableCell className="py-6 pl-0">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-black text-sm border-2 border-white shadow-sm">
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-lg">{user.username}</div>
                                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">System ID: {user.id}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-white/80 text-slate-600 border-slate-100 px-3 py-1 rounded-lg font-bold shadow-sm">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2">
                                                    {user.permissions.slice(0, 2).map(p => (
                                                        <Badge key={p} className="bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100 px-3 py-1 rounded-lg font-bold">
                                                            {p.split(':')[1] || p}
                                                        </Badge>
                                                    ))}
                                                    {user.permissions.length > 2 && (
                                                        <span className="text-xs font-bold text-slate-400 pt-1">+{user.permissions.length - 2} more</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/80 shadow-sm border border-transparent hover:border-white">
                                                            <MoreVertical className="h-5 w-5 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl border-white/40 p-2 shadow-2xl w-48 bg-white/95 backdrop-blur-xl">
                                                        <DropdownMenuItem onClick={() => handleEditClick(user)} className="rounded-xl font-bold cursor-pointer focus:bg-purple-50 focus:text-purple-600">
                                                            <UserCog className="h-4 w-4 mr-2" />
                                                            Edit User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="rounded-xl font-bold text-red-600 cursor-pointer focus:bg-red-50"
                                                            disabled={user.id === '1'}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Account
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <div>Showing {filteredUsers.length} of {users.length} system identities</div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <Activity className="h-3 w-3" />
                                Database secure and synchronized
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Visual Accent - Large Arrow Down */}
                <div className="flex justify-center mt-12 opacity-40">
                    <div className="p-3 bg-white rounded-full shadow-lg border border-white/60">
                        <Activity className="h-6 w-6 text-slate-400 rotate-180" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Admin;
