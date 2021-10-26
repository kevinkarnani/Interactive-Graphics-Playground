#version 300 es

in vec3 aPosition;
in vec4 aColor;
uniform mat4 modelMatrix;
uniform mat4 projMatrix;
uniform mat4 camMatrix;
flat out vec4 uColor;

void main() {
    gl_Position = projMatrix * camMatrix * modelMatrix * vec4(aPosition, 1);
    uColor = aColor;
}
