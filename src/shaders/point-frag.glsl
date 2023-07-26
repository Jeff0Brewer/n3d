precision highp float;

varying vec3 vColor;
varying float vVisibility;

void main() {
    if (vVisibility == 0.0) {
        gl_FragColor = vec4(0.3, 0.3, 0.3, 1.0);
    } else {
        gl_FragColor = vec4(vColor, 1.0);
    }
}
