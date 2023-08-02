attribute vec2 position;
attribute vec2 texCoord;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 rotation;
uniform vec3 center;
uniform vec2 size;

varying vec2 vTexCoord;

void main() {
    vec4 rotated = rotation * vec4(position * size, 0.0, 1.0);
    vec4 pos = vec4(rotated.xyz + center, 1.0);
    gl_Position = projMatrix * viewMatrix * modelMatrix * pos;
    vTexCoord = texCoord;
}
