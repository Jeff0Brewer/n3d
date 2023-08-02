precision highp float;

varying vec3 vNormal;

void main() {
    vec3 lightDir = vec3(0.0, 0.0, 1.0);
    float directional = clamp(dot(vNormal, lightDir), 0.0, 1.0);
    float ambient = 0.2;
    float shade = clamp(directional + ambient, 0.0, 1.0);

    vec3 color = vec3(1.0, 1.0, 1.0);

    gl_FragColor = vec4(color*shade, 0.3);
}
