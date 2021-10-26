#version 300 es

precision mediump float;
flat in vec4 uColor;
out vec4 fColor;

void main()
{
    fColor = uColor;
}
