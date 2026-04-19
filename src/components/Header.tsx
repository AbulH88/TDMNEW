import { Database, LogOut, Settings, User } from "lucide-react";
import { NavLink } from "./NavLink";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";

// navigation header for the top of the app
function Header() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-lg font-bold">Test Data Management</span>
        </div>

        <nav className="flex items-center gap-8">
          <NavLink
            to="/generator"
            className="text-gray-500 hover:text-black transition-all"
            activeClassName="text-black font-bold"
          >
            Generator
          </NavLink>
          <NavLink
            to="/service-call"
            className="text-gray-500 hover:text-black transition-all"
            activeClassName="text-black font-bold"
          >
            Services
          </NavLink>
          <NavLink
            to="/tests"
            className="text-gray-500 hover:text-black transition-all"
            activeClassName="text-black font-bold"
          >
            Health Check
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className="text-gray-500 hover:text-black transition-all"
              activeClassName="text-black font-bold"
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-slate-100">
                  <User className="h-5 w-5 text-slate-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>User Management</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
