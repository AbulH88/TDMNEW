import { NavLink as RouterNavLink } from "react-router-dom";

// custom NavLink wrapper to handle active classes manually
function NavLink(props: any) {
  const { to, children, className, activeClassName } = props;
  
  return (
    <RouterNavLink
      to={to}
      className={function({ isActive }) {
        // combine classes based on active state
        let fullClass = className || "";
        if (isActive && activeClassName) {
            fullClass += " " + activeClassName;
        }
        return fullClass;
      }}
    >
      {children}
    </RouterNavLink>
  );
}

export { NavLink };
