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
        <div className="min-h-screen bg-[#f8fafc]">
            <Header />
            
            {/* Page Header Area */}
            <div className="bg-white border-b border-slate-200">
                <div className="container mx-auto py-8 px-4 max-w-6xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Shield className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Console</h1>
                                <p className="text-slate-500 font-medium">Manage system users, roles, and access permissions</p>
                            </div>
                        </div>
                        
                        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200 gap-2 px-6 h-11">
                                    <UserPlus className="h-5 w-5" />
                                    <span>Create New User</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <form onSubmit={handleAddUser}>
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl">Add System User</DialogTitle>
                                        <DialogDescription>
                                            Create a new account and assign specific module permissions.
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="grid gap-6 py-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="username">Username</Label>
                                                <Input
                                                    id="username"
                                                    value={newUsername}
                                                    onChange={(e) => setNewUsername(e.target.value)}
                                                    placeholder="e.g. jdoe"
                                                    className="h-10"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="role">System Role</Label>
                                                <Select value={newRole} onValueChange={setNewRole}>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="qa">QA</SelectItem>
                                                        <SelectItem value="developer">Developer</SelectItem>
                                                        <SelectItem value="admin">Administrator</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Access Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="h-10"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold">Module Permissions</Label>
                                            <div className="grid grid-cols-1 gap-3 border rounded-xl p-4 bg-slate-50">
                                                {AVAILABLE_PERMISSIONS.map(perm => (
                                                    <div key={perm.id} className="flex items-start space-x-3">
                                                        <Checkbox
                                                            id={`perm-${perm.id}`}
                                                            className="mt-1"
                                                            checked={selectedPermissions.includes(perm.id)}
                                                            onCheckedChange={() => togglePermission(perm.id)}
                                                        />
                                                        <div className="grid gap-1.5 leading-none">
                                                            <label
                                                                htmlFor={`perm-${perm.id}`}
                                                                className="text-sm font-bold text-slate-900 cursor-pointer"
                                                            >
                                                                {perm.label}
                                                            </label>
                                                            <p className="text-xs text-slate-500">
                                                                {perm.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <DialogFooter className="gap-3">
                                        <Button variant="outline" type="button" onClick={resetForm} className="h-11 px-6">
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-11 px-8">
                                            Save User Account
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="container mx-auto py-10 px-4 max-w-6xl">
                
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
                                    <h3 className="text-3xl font-black mt-1 text-slate-900">{users.length}</h3>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Admins</p>
                                    <h3 className="text-3xl font-black mt-1 text-slate-900">
                                        {users.filter(u => u.role === 'admin').length}
                                    </h3>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <ShieldCheck className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Status</p>
                                    <h3 className="text-3xl font-black mt-1 text-slate-900">Online</h3>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <Activity className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Module Health</p>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        <span className="text-sm font-bold text-slate-700">Healthy</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-lg">
                                    <Activity className="h-6 w-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* User List & Management */}
                <Card className="border-none shadow-sm shadow-slate-200 overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 py-6 px-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900">System Identity Store</CardTitle>
                                <CardDescription className="text-slate-500 mt-1">Directory of all accounts authorized to access the TDM system.</CardDescription>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        placeholder="Search by username..."
                                        className="pl-10 h-10 w-full sm:w-64 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-full sm:w-40 h-10 bg-slate-50 border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-4 w-4 text-slate-400" />
                                            <SelectValue placeholder="All Roles" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="admin">Administrators</SelectItem>
                                        <SelectItem value="qa">QA</SelectItem>
                                        <SelectItem value="developer">Developer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-none hover:bg-transparent">
                                        <TableHead className="py-4 pl-8 text-slate-500 font-bold uppercase text-[11px] tracking-widest">User Profile</TableHead>
                                        <TableHead className="py-4 text-slate-500 font-bold uppercase text-[11px] tracking-widest text-center">Security Role</TableHead>
                                        <TableHead className="py-4 text-slate-500 font-bold uppercase text-[11px] tracking-widest">Active Permissions</TableHead>
                                        <TableHead className="py-4 pr-8 text-right text-slate-500 font-bold uppercase text-[11px] tracking-widest">Management</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-20">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                                                    <span className="text-slate-500 font-medium tracking-tight">Syncing user directory...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-20">
                                                <div className="flex flex-col items-center gap-2">
                                                    <XCircle className="h-10 w-10 text-slate-300" />
                                                    <span className="text-slate-500 font-semibold">No users match your criteria</span>
                                                    <Button variant="link" onClick={() => {setSearchTerm(''); setRoleFilter('all')}}>Clear all filters</Button>
                                                </div>
                                            </TableCell>  
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-slate-50/50 group transition-colors border-slate-100">
                                                <TableCell className="py-5 pl-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200">
                                                            {user.username.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 text-base">{user.username}</span>
                                                            <span className="text-xs text-slate-400 font-medium">System ID: {user.id}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge 
                                                        className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                            user.role === 'admin' 
                                                            ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100 shadow-sm shadow-purple-50' 
                                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                        }`}
                                                        variant="outline"
                                                    >       
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1.5 max-w-md">
                                                        {user.permissions.length === 0 ? (
                                                            <span className="text-xs italic text-slate-400">None assigned</span>
                                                        ) : (
                                                            user.permissions.map(p => (
                                                                <Badge key={p} variant="secondary" className="bg-white border-slate-200 text-slate-500 text-[10px] font-bold py-0 h-6 px-2 hover:bg-slate-50">  
                                                                    {p.split(':')[1] || p}
                                                                </Badge>
                                                            ))
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900">
                                                                <MoreVertical className="h-5 w-5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48 p-2">
                                                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 py-1.5">Manage Access</DropdownMenuLabel>
                                                            <DropdownMenuItem 
                                                                className="cursor-pointer gap-2 focus:bg-slate-50"
                                                                onClick={() => handleEditClick(user)}
                                                            >
                                                                <UserCog className="h-4 w-4" />
                                                                <span>Edit Role & Access</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-slate-50">
                                                                <Activity className="h-4 w-4" />
                                                                <span>View Usage Log</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                className={`cursor-pointer gap-2 ${user.id === '1' ? 'opacity-50 pointer-events-none' : 'text-red-600 focus:bg-red-50 focus:text-red-700'}`}
                                                                onClick={() => {
                                                                    if (confirm(`Revoke all access for "${user.username}"? This action cannot be undone.`)) {
                                                                        handleDeleteUser(user.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                <span>Delete Account</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="py-6 px-8 bg-slate-50/30 border-t border-slate-100">
                            <p className="text-xs text-slate-400 font-medium">
                                Showing {filteredUsers.length} of {users.length} system identities • Database secure and synchronized
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit User Dialog */}
                <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleUpdateUser}>
                            <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-2">
                                    <UserCog className="h-6 w-6 text-blue-600" />
                                    Edit User Access
                                </DialogTitle>
                                <DialogDescription>
                                    Modify system role and module permissions for <span className="font-bold text-slate-900">{editingUser?.username}</span>.
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid gap-6 py-6">
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                                    <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-900">Security Warning</p>
                                        <p className="text-xs text-amber-700">Changes to roles or permissions take effect on the user's next login or session refresh.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-role">System Role</Label>
                                    <Select value={editRole} onValueChange={setEditRole}>
                                        <SelectTrigger id="edit-role" className="h-10">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="qa">QA</SelectItem>
                                            <SelectItem value="developer">Developer</SelectItem>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-password">Reset Password (Leave blank to keep current)</Label>
                                    <div className="relative">
                                        <Input
                                            id="edit-password"
                                            type={showPassword ? "text" : "password"}
                                            value={editPassword}
                                            onChange={(e) => setEditPassword(e.target.value)}
                                            placeholder="Enter new password..."
                                            className="h-10 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Module Permissions</Label>
                                    <div className="grid grid-cols-1 gap-3 border rounded-xl p-4 bg-slate-50">
                                        {AVAILABLE_PERMISSIONS.map(perm => (
                                            <div key={perm.id} className="flex items-start space-x-3">
                                                <Checkbox
                                                    id={`edit-perm-${perm.id}`}
                                                    className="mt-1"
                                                    checked={editPermissions.includes(perm.id)}
                                                    onCheckedChange={() => toggleEditPermission(perm.id)}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor={`edit-perm-${perm.id}`}
                                                        className="text-sm font-bold text-slate-900 cursor-pointer"
                                                    >
                                                        {perm.label}
                                                    </label>
                                                    <p className="text-xs text-slate-500">
                                                        {perm.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <DialogFooter className="gap-3">
                                <Button variant="outline" type="button" onClick={() => setIsEditUserOpen(false)} className="h-11 px-6">
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-11 px-8">
                                    Update Permissions
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
};

export default Admin;
