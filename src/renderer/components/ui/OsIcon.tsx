import React from 'react';

export type OsType = 'ubuntu' | 'debian' | 'centos' | 'arch' | 'fedora' | 'linux' | 'windows' | 'macos' | 'alpine' | 'suse' | string | undefined;

interface OsIconProps {
    os: OsType;
    className?: string;
}

const OsIcon: React.FC<OsIconProps> = ({ os, className = "w-6 h-6" }) => {
    const osLower = os?.toLowerCase() || 'linux';

    if (osLower === 'ubuntu') {
        return (
            <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="50" fill="#E95420" />
                <path d="M50 21C66 21 79 34 79 50C79 66 66 79 50 79C34 79 21 66 21 50C21 34 34 21 50 21ZM50 28C37.85 28 28 37.85 28 50C28 62.15 37.85 72 50 72C62.15 72 72 62.15 72 50C72 37.85 62.15 28 50 28Z" fill="white" />
                <circle cx="21" cy="50" r="8" fill="white" />
                <circle cx="71" cy="29" r="8" fill="white" />
                <circle cx="71" cy="71" r="8" fill="white" />
            </svg>
        );
    }
    if (osLower === 'debian') {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 17.2467 6.75329 21.5 12 21.5Z" stroke="#D70A53" strokeWidth="2" />
                <path d="M16 8C14.8954 6.89543 13.4477 6.5 12 6.5C8.96243 6.5 6.5 8.96243 6.5 12C6.5 15.0376 8.96243 17.5 12 17.5C13.5 17.5 15 16.5 16 15L14 13C13.5 14 12.5 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5C13 9.5 14 10 14 11V14H16V8Z" fill="#D70A53" />
            </svg>
        );
    }
    if (osLower === 'centos') {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" className="text-purple-600" />
                <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M4.9 19.1l14.2-14.2" className="text-yellow-500" />
            </svg>
        );
    }
    if (osLower === 'windows') {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="#00a4ef" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 3.449L9.75 2.1v9.261H0V3.449zM10.749 1.961L24 0v11.139H10.749V1.961zM0 12.339h9.75v9.111l-9.75-1.349v-7.762zM10.749 12.339H24v11.231l-13.251-1.89v-9.341z" />
            </svg>
        );
    }
    if (osLower === 'macos') {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.735 4.312C15.424 3.473 15.892 2.308 15.766 1.131C14.755 1.171 13.528 1.803 12.822 2.643C12.188 3.393 11.642 4.588 11.807 5.727C12.937 5.815 14.047 5.15 14.735 4.312ZM16.822 17.521c-.754 1.144-1.542 2.305-2.834 2.327-1.267.022-1.68-.748-3.132-.748-1.45 0-1.921.73-3.111.776-1.25.044-2.155-1.252-2.91-2.351-1.542-2.227-2.73-6.289-1.933-9.06c.394-1.373 1.347-2.31 2.383-2.748 1.229-.533 2.508-.34 3.255-.34.787 0 1.636-.217 2.809-.217 1.455 0 2.595.666 3.284 1.139l.21.144-1.442 1.391c-1.339.814-1.782 2.305-1.072 3.633.725 1.365 2.126 1.838 3.018 1.957-.087.697-.282 1.583-.755 2.298h-.02z" />
            </svg>
        );
    }

    // Generic Linux penguin-ish stand-in
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2H8a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h8a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5h-4z"></path>
            <circle cx="9" cy="9" r="2"></circle>
            <circle cx="15" cy="9" r="2"></circle>
            <path d="M12 16c-2 0-3-1-3-1s1 3 3 3 3-3 3-3-1 1-3 1z"></path>
        </svg>
    );
};

export default OsIcon;
