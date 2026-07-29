import { ReactNode } from 'react';
import GuestNavbar from '@/Components/GuestNavbar';
import Footer from '@/Components/Footer';
import ChatWidget from '@/Components/ChatWidget';

interface GuestLayoutProps {
    children: ReactNode;
    canLogin?: boolean;
    canRegister?: boolean;
}

export default function GuestLayout({ children, canLogin, canRegister }: GuestLayoutProps) {
    return (
        <div className="min-h-screen bg-white">
            <GuestNavbar canLogin={canLogin} canRegister={canRegister} />
            <main className="pt-[72px] lg:pt-[80px]">{children}</main>
            <Footer />
            <ChatWidget />
        </div>
    );
}
