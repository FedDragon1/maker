import { Layer } from "@/app/(kaleido)/layers";
import { Matrix } from "@/app/(kaleido)/linalg";

export class Sequential {
    layers: Layer[]

    constructor(...layers: Layer[]) {
        this.layers = layers
    }

    forward(x: Matrix) {
        for (const layer of this.layers) {
            x = layer.forward(x)
        }
        return x
    }
}