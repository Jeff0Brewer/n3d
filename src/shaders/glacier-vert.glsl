attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 scaleMatrix;
uniform vec2 dimensions;

varying vec3 vNormal;
varying vec2 vTexCoord;

void main() {
    gl_Position = projMatrix * viewMatrix * modelMatrix * scaleMatrix * vec4(position, 1.0);
    vNormal = normal;
    vTexCoord = position.xy / dimensions;
}
