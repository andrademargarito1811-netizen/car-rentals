import { ReactNode } from 'react';
import GuestNavbar from '@/Components/GuestNavbar';
import Footer from '@/Components/Footer';
import ChatWidget from '@/Components/ChatWidget';
import TopContactBar from '@/Components/TopContactBar';
import CookieConsent from '@/Components/CookieConsent';

interface GuestLayoutProps {
    children: ReactNode;
    canLogin?: boolean;
    canRegister?: boolean;
}

export default function GuestLayout({ children, canLogin, canRegister }: GuestLayoutProps) {
    return (
        <div className="min-h-screen bg-white">
            <GuestNavbar canLogin={canLogin} canRegister={canRegister} />
            <TopContactBar />
            <main className="pt-[100px] lg:pt-[108px]">{children}</main>
            <Footer />
            <ChatWidget />
            <CookieConsent />
        </div>
    );
}
