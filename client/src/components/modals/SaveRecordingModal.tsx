
import { useState } from 'react';

interface SaveRecordingModalProps {
    onSave: (filename: string) => void;
    onCancel: () => void;
    isOpen: boolean;
}

export default function SaveRecordingModal({ onSave, onCancel, isOpen }: SaveRecordingModalProps) {
    const [filename, setFilename] = useState('');

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
                    fontWeight: 700
                }}>
                    Save Recording
                </h2>

                <div style={{ marginBottom: 24 }}>
                    <label style={{
                        display: 'block',
                        marginBottom: 8,
                        color: '#AAAAAA',
                        fontSize: '14px'
                    }}>
                        Filename
                    </label>
                    <input
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="My Awesome Mix"
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'white',
                            fontSize: '16px',
                            outline: 'none'
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && filename.trim()) {
                                onSave(filename);
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
                            border: 'none',
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
                            if (filename.trim()) onSave(filename);
                        }}
                        disabled={!filename.trim()}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            background: filename.trim() ? '#4ADE80' : 'rgba(74, 222, 128, 0.2)',
                            color: filename.trim() ? 'black' : 'rgba(255,255,255,0.3)',
                            cursor: filename.trim() ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: 700
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
