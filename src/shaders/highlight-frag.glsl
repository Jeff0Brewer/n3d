precision highp float;

void main() {
    vec2 cxy = gl_PointCoord * 2.0 - 1.0;
    float ringInner = 0.7;
    if (abs(cxy.x) < ringInner && abs(cxy.y) < ringInner) {
        discard;
    }
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
