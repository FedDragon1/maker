import { Matrix, randomMatrix, zeroVector } from "@/app/(kaleido)/linalg";

export abstract class Layer {
    built: boolean
    inputShape?: number
    outputShape?: number
    nParams: number

    input?: Matrix
    output?: Matrix

    protected constructor(outputShape?: number, inputShape?: number) {
        this.built = false
        this.outputShape = outputShape
        this.inputShape = inputShape
        this.nParams = 0
    }

    forward(neurons: Matrix): Matrix {
        this.input = neurons
        if (!this.built) {
            this.buildParameters(neurons)
        }
        this.output = this.getOutput(neurons)
        return this.output
    }

    abstract buildParameters(neurons: Matrix): void;

    abstract getOutput(neurons: Matrix): Matrix;
}

export class Dense extends Layer{
    weights?: Matrix
    biases?: Matrix

    constructor(outputShape: number) {
        super(outputShape)
    }

    buildParameters(neurons: Matrix) {
        this.inputShape = neurons.rows
        this.weights = randomMatrix(this.outputShape!, this.inputShape).subs(0.5)
        this.biases = zeroVector(this.outputShape!)

        this.nParams = this.outputShape! * this.inputShape + this.outputShape!
        this.built = true
    }

    getOutput(neurons: Matrix): Matrix {
        if (!this.weights || !this.biases) {
            throw Error("Not built")
        }
        return this.weights.apply(neurons).add(this.biases)
    }
}

abstract class Activation extends Layer {
    buildParameters(neurons: Matrix) {
        this.inputShape = this.outputShape = neurons.rows
    }
}

export class LeakyRelu extends Activation {
    leak: number

    constructor(leak: number = 0.01) {
        super();
        this.leak = leak
    }

    getOutput(neurons: Matrix): Matrix {
        return neurons.map(x => x >= 0 ? x : this.leak * x)
    }
}

export class SoftMax extends Activation {
    constructor() {
        super();
    }

    getOutput(neurons: Matrix): Matrix {
        neurons = neurons.subs(neurons.max())
        const expNeurons = neurons.map(n => Math.exp(n))
        return expNeurons.divs(expNeurons.sum())
    }
}
