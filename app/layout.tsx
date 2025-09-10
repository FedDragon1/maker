import "./globals.css";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    metadataBase: new URL("https://www.fedele.us"),
    title: "Fedele Wu | MIT Maker Portfolio",
    description: "Personal website of Fedele Wu, a high school web developer at Skyline High School",
    icons: [
        {
            rel: "icon",
            sizes: "32x32",
            url: "/favicon/favicon-32x32.png"
        },
        {
            rel: "icon",
            sizes: "16x16",
            url: "/favicon/favicon-16x16.png"
        },
        {
            rel: "apple-touch-icon",
            sizes: "180x180",
            url: "/favicon/apple-touch-icon.png"
        },
    ],
    manifest: "/favicon/site.webmanifest",
    openGraph: {
        type: "website",
        url: "https://www.fedele.us",
        title: "Fedele Wu",
        description: "Personal website of Fedele Wu, a high school web developer at Skyline High School",
        siteName: "Fedele Wu",
        images: [{ url: "/favicon/android-chrome-512x512.png", }],
    }
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body>
        <main className="bg-red-50">
            {children}
        </main>
        </body>
        </html>
    );
}
