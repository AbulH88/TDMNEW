import { Database } from "lucide-react";
import { NavLink } from "./NavLink";

// navigation header for the top of the app
function Header() {
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
          {/* <NavLink
            to="/api-call"
            className="text-gray-500 hover:text-black transition-all"
            activeClassName="text-black font-bold"
          >
            API Calls
          </NavLink> */}
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
        </nav>

        <div className="w-10" />
      </div>
    </header>
  );
}

export default Header;