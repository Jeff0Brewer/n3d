precision highp float;

varying vec3 vColor;
varying float vVisibility;

void main() {
    if (vVisibility == 0.0) {
        discard;
    }
    gl_FragColor = vec4(vColor, 1.0);
}
