import type { ReactNode } from "react";
import Header from "./Header";
import "../pages/auth/Auth.css";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
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
