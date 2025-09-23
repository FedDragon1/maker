import type { Config } from 'tailwindcss'

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // Ensure this includes TSX files
    ],
    theme: {
        extend: {},
    },
    plugins: [],
} satisfies Config