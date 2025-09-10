uniform float pixelRatio;
uniform float near;
uniform float far;
uniform float fadeDistance;
uniform float blur;
uniform float minOpacity;
uniform float maxOpacity;
uniform float referenceParticleSize;

attribute float size;

#ifdef withMesh
varying vec2 varyingUV;
//attribute vec2 uv;
#else
attribute vec3 color;
#endif

varying float varyingOpacity;
varying vec3 varyingColor;
varying float dist;

void main() {
    #ifdef withMesh
    varyingUV = uv;
    #else
    varyingColor = color;
    #endif

    varyingOpacity = 1.0;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * worldPosition;

    dist = length(viewPosition.xyz);
    float blurScale;

    if (dist > far || dist < near) {
        varyingOpacity = 0.;
    } else if (dist < near + fadeDistance) {
        // near + faseDistance -> opacity 0
        // near -> opacity 1
        varyingOpacity = smoothstep(near, near + fadeDistance, dist);
    } else if (dist > far - fadeDistance) {
        varyingOpacity = smoothstep(far, far - fadeDistance, dist);
    }

    float nearness = smoothstep(far, near, dist) * 0.5 + 0.5;

    blurScale = 1.0 - varyingOpacity;   // [0, 1]
    blurScale *= 2.0;    // [0, 2] -> 2x size as opacity reaches 0

    gl_PointSize = pixelRatio * (size * referenceParticleSize + blurScale * blur) * nearness;
    gl_Position = projectionMatrix * viewPosition;

}
