#version 300 es

in vec3 aPosition;
uniform mat4 modelMatrix;
uniform mat4 projMatrix;
uniform mat4 camMatrix;
out vec4 uColor;

void main() {
    gl_Position = projMatrix * camMatrix * modelMatrix * vec4(aPosition, 1);
    uColor = vec4(0, 0, 0, 1);
}