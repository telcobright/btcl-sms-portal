import '@/app/globals.css'

export const metadata = {
    title: 'Payment Status - BTCL SMS',
    description: 'Payment status for BTCL SMS Service',
}

export default function PgLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" type="image/png" href="/btcl_globe_favicon.png" />
            </head>
            <body className="font-sans" suppressHydrationWarning>
                {children}
            </body>
        </html>
    )
}
