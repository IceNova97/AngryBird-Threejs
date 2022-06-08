precision mediump float;
varying vec2 vUv;

uniform sampler2D flagTexture;

void main() {
    vec4 flagColor = texture2D(flagTexture, vUv);
    gl_FragColor = flagColor;
}