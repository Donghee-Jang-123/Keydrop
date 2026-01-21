import { useState } from 'react';

interface EnterChannelModalProps {
    onJoin: (channelName: string) => void;
    onCancel: () => void;
    isOpen: boolean;
}

export default function EnterChannelModal({ onJoin, onCancel, isOpen }: EnterChannelModalProps) {
    const [channelName, setChannelName] = useState('');

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#1E1E1E',
                padding: '24px',
                borderRadius: '12px',
                width: '400px',
                maxWidth: '90%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <h2 style={{
                    marginTop: 0,
                    marginBottom: 20,
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 700,
                    textAlign: 'center'
                }}>
                    Join Live Channel
                </h2>

                <div style={{ marginBottom: 24 }}>
                    <label style={{
                        display: 'block',
                        marginBottom: 8,
                        color: '#AAAAAA',
                        fontSize: '16px',
                        fontWeight: 500
                    }}>
                        Channel Name
                    </label>
                    <input
                        type="text"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="e.g. dj-cool-mix"
                        autoFocus
                        style={{
                            padding: '12px',
                            width: '90%',
                            maxWidth: '420px',
                            margin: '0 auto',
                            display: 'block',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'white',
                            fontSize: '16px',
                            outline: 'none'
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && channelName.trim()) {
                                onJoin(channelName);
                            }
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.25)',
                            background: 'transparent',
                            color: '#AAAAAA',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (channelName.trim()) onJoin(channelName);
                        }}
                        disabled={!channelName.trim()}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            background: channelName.trim() ? '#4ADE80' : 'rgba(74, 222, 128, 0.2)',
                            color: channelName.trim() ? 'black' : 'rgba(255,255,255,0.3)',
                            cursor: channelName.trim() ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: 700
                        }}
                    >
                        Join
                    </button>
                </div>
            </div>
        </div>
    );
}
