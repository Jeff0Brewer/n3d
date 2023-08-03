attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;

varying vec3 vNormal;

void main() {
    gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    vec4 rotatedNorm = modelMatrix * vec4(normal, 1.0);
    vNormal = rotatedNorm.xyz;
}
