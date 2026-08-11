interface GenerateInvoicePdfOptions {
    filename: string;
}

const LETTER_WIDTH_MM = 215.9;
const LETTER_HEIGHT_MM = 279.4;
const MARGIN_MM = 10;
const PAGE_WIDTH_PX = 740;
const PAGE_HEIGHT_PX = 980;
const CONTENT_WIDTH_MM = LETTER_WIDTH_MM - MARGIN_MM * 2;
const CONTENT_HEIGHT_MM = LETTER_HEIGHT_MM - MARGIN_MM * 2;

const BLOCK_SELECTORS = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'ul', 'ol', 'blockquote', 'tr'];

interface ApplyPrintStylesOptions {
    keepPrintHidden?: boolean;
}

export function applyPrintStyles(options: ApplyPrintStylesOptions = {}): () => void {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    const style = document.createElement('style');

    const printBlocks: string[] = [];

    for (const sheet of Array.from(document.styleSheets)) {
        try {
            for (const rule of Array.from(sheet.cssRules)) {
                if (rule instanceof CSSMediaRule && /print/i.test(rule.media.mediaText)) {
                    if (!options.keepPrintHidden) {
                        printBlocks.push(rule.cssText.replace(/^@media\s+print([^{]*)/i, '@media screen, print$1'));
                        continue;
                    }

                    const innerBlocks: string[] = [];
                    for (const inner of Array.from(rule.cssRules)) {
                        if (inner instanceof CSSStyleRule && inner.selectorText.includes('print\\:hidden')) {
                            continue;
                        }
                        innerBlocks.push(inner.cssText);
                    }

                    if (innerBlocks.length > 0) {
                        printBlocks.push(`@media screen, print {\n${innerBlocks.join('\n')}\n}`);
                    }
                }
            }
        } catch {
            // Ignore cross-origin / inaccessible stylesheets.
        }
    }

    if (printBlocks.length > 0) {
        style.textContent = printBlocks.join('\n');
        document.head.appendChild(style);
    }

    html.classList.remove('dark');

    return () => {
        style.remove();
        if (hadDark) {
            html.classList.add('dark');
        }
    };
}

function paginate(root: HTMLElement): HTMLElement[] {
    const blocks = Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SELECTORS.join(',')));
    const spacers: HTMLElement[] = [];
    const rootTop = root.getBoundingClientRect().top;

    const terms = root.querySelector<HTMLElement>('#invoice-terms');

    if (terms && terms.parentNode) {
        const top = terms.getBoundingClientRect().top - rootTop;
        const needed = PAGE_HEIGHT_PX - (top % PAGE_HEIGHT_PX);

        if (needed < PAGE_HEIGHT_PX) {
            const spacer = document.createElement('div');
            spacer.style.display = 'block';
            spacer.style.height = `${needed}px`;
            terms.parentNode.insertBefore(spacer, terms);
            spacers.push(spacer);
        }
    }

    let guard = 0;

    while (guard++ < 5000) {
        let target: HTMLElement | null = null;

        for (const el of blocks) {
            const rect = el.getBoundingClientRect();
            const top = rect.top - rootTop;
            const bottom = top + rect.height;
            const startPage = Math.floor(top / PAGE_HEIGHT_PX);
            const endPage = Math.floor(bottom / PAGE_HEIGHT_PX);

            if (endPage > startPage && bottom - top <= PAGE_HEIGHT_PX) {
                target = el;
                break;
            }
        }

        if (!target) {
            break;
        }

        const rect = target.getBoundingClientRect();
        const top = rect.top - rootTop;
        const needed = PAGE_HEIGHT_PX - (top % PAGE_HEIGHT_PX);
        const spacer = document.createElement('div');

        spacer.style.display = 'block';
        spacer.style.height = `${needed}px`;

        target.parentNode?.insertBefore(spacer, target);
        spacers.push(spacer);
    }

    return spacers;
}

export async function generateInvoicePdf(element: HTMLElement, { filename }: GenerateInvoicePdfOptions): Promise<void> {
    const restore = applyPrintStyles();
    const spacers = paginate(element);

    try {
        const { default: html2canvas } = await import('html2canvas');
        const { jsPDF } = await import('jspdf');

        await document.fonts.ready;

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: PAGE_WIDTH_PX,
            windowWidth: PAGE_WIDTH_PX,
        });

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const sliceHeight = PAGE_HEIGHT_PX * 2;
        const pxToMm = CONTENT_WIDTH_MM / imgWidth;

        let y = 0;
        let page = 0;

        while (y < imgHeight) {
            const height = Math.min(sliceHeight, imgHeight - y);

            if (page > 0) {
                pdf.addPage();
            }

            const slice = document.createElement('canvas');
            slice.width = imgWidth;
            slice.height = height;

            const ctx = slice.getContext('2d');
            if (ctx) {
                ctx.drawImage(canvas, 0, y, imgWidth, height, 0, 0, imgWidth, height);
            }

            pdf.addImage(
                slice.toDataURL('image/jpeg', 0.95),
                'JPEG',
                MARGIN_MM,
                MARGIN_MM,
                CONTENT_WIDTH_MM,
                height * pxToMm,
                undefined,
                'FAST',
            );

            y += sliceHeight;
            page++;
        }

        pdf.save(filename);
    } finally {
        spacers.forEach(spacer => spacer.remove());
        restore();
    }
}
