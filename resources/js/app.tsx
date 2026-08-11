import '../css/app.css';
import './bootstrap';

import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ChatProvider } from './Contexts/ChatContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

let appBrandName = appName;

router.on('navigate', (event) => {
    const page = (event.detail as { page?: { props?: { footerSettings?: { brand_name?: string } | null } } })?.page;
    const brand = page?.props?.footerSettings?.brand_name;
    if (brand) appBrandName = brand;
});

createInertiaApp({
    title: (title) => `${title} - ${appBrandName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const initialBrand = (props.initialPage.props as any)?.footerSettings?.brand_name;
        if (initialBrand) appBrandName = initialBrand;

        const root = createRoot(el);
        root.render(
            <ChatProvider>
                <App {...props} />
            </ChatProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
