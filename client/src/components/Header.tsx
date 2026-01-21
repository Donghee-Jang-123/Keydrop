import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
    onEnterChannel?: () => void;
}

export default function Header({ onEnterChannel }: HeaderProps) {
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
                <div className="nav-tooltip-container">
                    <Link
                        to="/signup"
                        className="auth-link"
                        style={isActive("/signup")}
                    >
                        Sign up
                    </Link>
                    {location.pathname !== '/signup' && (
                        <span className="nav-tooltip-text">
                            Sign up and unlock{"\n"}the <span style={{ fontWeight: 900 }}>full experience</span>!
                        </span>
                    )}
                </div>
                {onEnterChannel ? (
                    <button className="auth-cta-btn" onClick={onEnterChannel} style={{ cursor: "pointer", border: "none", fontSize: "inherit", fontFamily: "inherit" }}>
                        Enter a Live Channel
                    </button>
                ) : (
                    <Link to="/live" className="auth-cta-btn">
                        Enter a Live Channel
                    </Link>
                )}
            </nav>
        </header>
    );
}
