uniform float minOpacity;
uniform float maxOpacity;
uniform float far;
uniform float near;

varying float varyingOpacity;
varying float dist;

#ifdef withMesh
uniform sampler2D map;
varying vec2 varyingUV;
#else
varying vec3 varyingColor;
#endif

float circleMask() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist < 0.4) {
        return 1.0;
    }
    if (dist > 0.5) {
        return 0.0;
    }
    // 0.5 -> 0 opacity
    return smoothstep(0.5, 0.4, dist);
}

vec3 rgbToHsl(vec3 rgb) {
    // Normalize RGB values to the range [0, 1]
    float maxColor = max(rgb.r, max(rgb.g, rgb.b));
    float minColor = min(rgb.r, min(rgb.g, rgb.b));
    float delta = maxColor - minColor;

    // Calculate Lightness
    float lightness = (maxColor + minColor) * 0.5;

    // Calculate Saturation
    float saturation;
    if (delta == 0.0) {
        saturation = 0.0; // No saturation if delta is zero
    } else {
        saturation = delta / (lightness < 0.5 ? (maxColor + minColor) : (2.0 - maxColor - minColor));
    }

    // Calculate Hue
    float hue;
    if (delta == 0.0) {
        hue = 0.0; // Undefined hue if delta is zero
    } else if (maxColor == rgb.r) {
        hue = mod((rgb.g - rgb.b) / delta, 6.0);
    } else if (maxColor == rgb.g) {
        hue = (rgb.b - rgb.r) / delta + 2.0;
    } else {
        hue = (rgb.r - rgb.g) / delta + 4.0;
    }
    hue /= 6.0; // Normalize hue to the range [0, 1]
    if (hue < 0.0) hue += 1.0; // Ensure hue is non-negative

    return vec3(hue, saturation, lightness);
}

float clampHue(float hue) {
    if (0.0 < hue && hue <= 1.0) {
        return hue;
    }
    if (hue < 0.0) {
        return hue - floor(hue);
    }
    return hue - floor(hue);
}

vec3 hslToRgb(vec3 hsl) {
    float hue = hsl.x;          // Hue in the range [0, 1]
    float saturation = hsl.y;   // Saturation in the range [0, 1]
    float lightness = hsl.z;    // Lightness in the range [0, 1]

    float c = (1.0 - abs(2.0 * lightness - 1.0)) * saturation; // Chroma
    float x = c * (1.0 - abs(mod(hue * 6.0, 2.0) - 1.0));      // Intermediate value
    float m = lightness - c * 0.5;                             // Adjustment for lightness

    vec3 rgb;

    if (hue < 1.0 / 6.0) {
        rgb = vec3(c, x, 0.0);
    } else if (hue < 2.0 / 6.0) {
        rgb = vec3(x, c, 0.0);
    } else if (hue < 3.0 / 6.0) {
        rgb = vec3(0.0, c, x);
    } else if (hue < 4.0 / 6.0) {
        rgb = vec3(0.0, x, c);
    } else if (hue < 5.0 / 6.0) {
        rgb = vec3(x, 0.0, c);
    } else {
        rgb = vec3(c, 0.0, x);
    }

    // Add m to match lightness
    return rgb + vec3(m);
}

void main() {
    #ifdef depthTest
    // distance == 0.5 -> desired circle
    // 0.5 - distance -> if > 0 then inside, < 0 outside
    float dist = 0.5 - distance(gl_PointCoord, vec2(0.5));
    if (round < 0.1 || varyingOpacity < 0.1) {
        discard;
    }
    #endif

    float opacity = circleMask() * clamp(varyingOpacity, minOpacity, maxOpacity);

    #ifdef withMesh
    vec4 diffuse = texture(map, varyingUV);
    vec3 hsl = rgbToHsl(diffuse.rgb);
    vec3 modifiedHsl = vec3(clampHue(hsl.x + 0.6), smoothstep(far, near, dist) * 0.8, 1.0 - hsl.z);

    vec3 color = hslToRgb(modifiedHsl);

    gl_FragColor = vec4(color, opacity);
    #else
    gl_FragColor = vec4(varyingColor, opacity);
    #endif
}
