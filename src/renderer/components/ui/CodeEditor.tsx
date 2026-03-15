import React, { useState } from 'react';

interface CodeEditorProps {
    initialValue?: string;
    language?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    initialValue = "",
    onChange,
    placeholder = "Enter your code here...",
    className = ""
}) => {
    const [code, setCode] = useState(initialValue);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setCode(newValue);
        if (onChange) onChange(newValue);
    };

    return (
        <div
            className={`relative rounded-2xl overflow-hidden glass h-full flex flex-col ${className}`}
            style={{
                background: 'rgba(8, 11, 22, 0.95)',
                border: '1px solid rgba(6,182,212,0.15)',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
            }}
        >
            {/* Editor Header */}
            <div
                className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5"
            >
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#eab308]/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]/50" />
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">
                    bash_script.sh
                </div>
            </div>

            <div className="relative flex-1 flex">
                {/* Simulated Line Numbers */}
                <div
                    className="w-10 bg-black/20 border-r border-white/5 py-4 flex flex-col items-center gap-1 select-none"
                >
                    {[...Array(20)].map((_, i) => (
                        <span key={i} className="text-[10px] font-mono text-white/10">{i + 1}</span>
                    ))}
                </div>

                {/* Text Area */}
                <textarea
                    value={code}
                    onChange={handleChange}
                    placeholder={placeholder}
                    spellCheck={false}
                    className="flex-1 bg-transparent p-4 text-sm font-mono text-[#e2e8f0] outline-none resize-none placeholder:text-white/10"
                    style={{
                        lineHeight: '1.6',
                        caretColor: '#06b6d4'
                    }}
                />

                {/* Cyberpunk corner accent */}
                <div
                    className="absolute bottom-1 right-1 w-10 h-10 pointer-events-none opacity-20"
                    style={{
                        background: 'linear-gradient(135deg, transparent 70%, #06b6d4 100%)'
                    }}
                />
            </div>
        </div>
    );
};

export default CodeEditor;
