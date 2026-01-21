import { type ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import EnterChannelModal from "./modals/EnterChannelModal";
import "../pages/auth/Auth.css";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const nav = useNavigate();
    const [showChannelModal, setShowChannelModal] = useState(false);

    return (
        <div className="auth-layout">
            {/* Background FX Layers */}


            <Header onEnterChannel={() => setShowChannelModal(true)} />

            <main className="auth-content">
                {children}
            </main>

            <EnterChannelModal
                isOpen={showChannelModal}
                onCancel={() => setShowChannelModal(false)}
                onJoin={(channel) => {
                    nav(`/live/${channel}`);
                    setShowChannelModal(false);
                }}
            />
        </div>
    );
}
