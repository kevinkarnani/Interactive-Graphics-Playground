#version 300 es
precision mediump float;

in vec4 color;
in vec2 texCoord;
uniform sampler2D textureUnit;
out vec4 fColor;

void main() {
    fColor = color * texture(textureUnit, texCoord);
}