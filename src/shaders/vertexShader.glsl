uniform float uTime;
uniform float offsetZ;

varying vec2 vUv;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    float frenquencyX = sin(modelPosition.x * 8.0 + uTime) * 0.1;
    float frenquencyY = sin(modelPosition.y * 3.0 + uTime) * 0.1;
    modelPosition.z += frenquencyX + frenquencyY;
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    vUv = uv;
}