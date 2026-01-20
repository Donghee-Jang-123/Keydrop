import { Link, useLocation } from "react-router-dom";

export default function Header() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path ? { fontWeight: 800 } : {};

    return (
        <header className="auth-header">
            <Link to="/" className="auth-logo">
                Key<span>DROP</span>
            </Link>
            <nav className="auth-nav">
                <Link to="/login" className="auth-link" style={isActive("/login")}>
                    Login
                </Link>
                <Link to="/signup" className="auth-link" style={isActive("/signup")}>
                    Sign up
                </Link>
                <Link to="/live" className="auth-cta-btn">
                    Enter a Live Channel
                </Link>
            </nav>
        </header>
    );
}
