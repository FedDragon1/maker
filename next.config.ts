import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    webpack: (config, context) => {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        })
        config.module.rules.push({
            test: /\.glsl/,
            use: [
                context.defaultLoaders.babel,
                {
                    loader: "raw-loader"
                }
            ]
        })
        return config;
    },
    turbopack: {
        root: "./",
        rules: {
            "*.svg": {
                loaders: ["@svgr/webpack"],
                as: "*.js"
            },
            "*.glsl": {
                loaders: ['raw-loader'],
                as: "*.js"
            }
        }
    }
};

export default nextConfig;
