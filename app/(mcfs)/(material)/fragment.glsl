uniform float minOpacity;
uniform float maxOpacity;

varying float varyingOpacity;
varying vec3 varyingColor;

float circleMask() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist < 0.4) {
        return 1.0;
    }
    if (dist > 0.5) {
        discard;
    }
    // 0.5 -> 0 opacity
    return smoothstep(0.5, 0.4, dist);
}

void main() {
    float opacity = circleMask() * clamp(varyingOpacity, minOpacity, maxOpacity);
    gl_FragColor = vec4(varyingColor, opacity);
}
