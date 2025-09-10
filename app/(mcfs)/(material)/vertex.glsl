uniform float near;
uniform float far;
uniform float pixelRatio;
uniform float blur;
uniform float minOpacity;
uniform float maxOpacity;
uniform float referenceParticleSize;

attribute float time;

varying float varyingOpacity;
varying vec3 varyingColor;

vec3 hueToRGB(float h) {
    // Ensure hue is in the range [0, 1]
    h = mod(h, 1.0);

    // Chroma is the difference between the maximum and minimum RGB components
    float c = 1.0; // Full saturation (can be changed for different saturation)
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0)); // X component, depends on hue

    float m = -0.2; // Lightness offset (can be changed for different lightness)

    // Define RGB based on hue
    if (h < 1.0 / 6.0) {
        return vec3(c, x, 0.0) + m; // Red to yellow
    } else if (h < 2.0 / 6.0) {
        return vec3(x, c, 0.0) + m; // Yellow to green
    } else if (h < 3.0 / 6.0) {
        return vec3(0.0, c, x) + m; // Green to cyan
    } else if (h < 4.0 / 6.0) {
        return vec3(0.0, x, c) + m; // Cyan to blue
    } else if (h < 5.0 / 6.0) {
        return vec3(x, 0.0, c) + m; // Blue to magenta
    } else {
        return vec3(c, 0.0, x) + m; // Magenta to red
    }
}

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * worldPosition;

    varyingOpacity = 1.0 - smoothstep(0.5, 1.0, time);
    float blurScale = smoothstep(0.0, 1.0, time);

    varyingColor = hueToRGB(0.9 - time / 3.);

    gl_PointSize = pixelRatio * (referenceParticleSize + blurScale * blur);
    gl_Position = projectionMatrix * viewPosition;
}
