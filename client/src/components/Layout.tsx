import type { ReactNode } from "react";
import Header from "./Header";
import "../pages/auth/Auth.css";

interface LayoutProps {
    children: ReactNode;
    showWave?: boolean;
}

export default function Layout({ children, showWave = true }: LayoutProps) {
    return (
        <div className="auth-layout">
            {/* Background FX Layers */}


            <Header />

            <main className="auth-content">
                {children}
            </main>
        </div>
    );
}
