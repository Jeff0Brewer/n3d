precision highp float;

uniform sampler2D text;

varying vec2 vTexCoord;

void main() {
    gl_FragColor = texture2D(text, vTexCoord);
}
