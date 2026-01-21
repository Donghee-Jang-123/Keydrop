import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "./auth/Auth.css";

export default function OnboardingPage() {
    const nav = useNavigate();

    return (
        <Layout>
            <div className="onboarding-hero">
                <h1 className="hero-title">
                    Turn your <span className="highlight-green">keyboard</span><br />
                    into a <span className="highlight-blue">stage</span>.
                </h1>

                <div className="hero-actions">
                    <button className="hero-btn hero-btn-secondary" onClick={() => nav("/tutorial")}>
                        Tutorial Mode
                    </button>

                    <button className="hero-btn hero-btn-primary" onClick={() => nav("/dj")}>
                        DJ Play Mode
                    </button>

                    <button className="hero-btn hero-btn-secondary" onClick={() => {
                        const channel = window.prompt("Enter channel name to join:");
                        if (channel && channel.trim()) {
                            nav(`/live/${channel.trim()}`);
                        }
                    }}>
                        Enter a Channel
                    </button>
                </div>
            </div>
        </Layout>
    );
}
