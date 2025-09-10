import { Dense, LeakyRelu, SoftMax } from "@/app/(kaleido)/layers";
import { matrixOf, vectorOf } from "@/app/(kaleido)/linalg";
import { Sequential } from "@/app/(kaleido)/sequential";

interface LayerDescriptor {
    layer: string,
    inputShape: number,
    outputShape: number
}

interface DenseDescriptor extends LayerDescriptor {
    layer: "dense",
    weights: number[][],
    biases: number[]
}

let model: Sequential | undefined = undefined

export async function loadModel() {
    if (model) {
        return model
    }

    const response = await fetch("/mnist/model.json")
    const modelDescriptor = await response.json() as LayerDescriptor[]

    const layers = modelDescriptor.map(descriptor => {
        switch (descriptor.layer) {
            case "dense":
                const dense = new Dense(descriptor.outputShape);
                dense.built = true
                dense.inputShape = descriptor.inputShape
                dense.weights = matrixOf((descriptor as DenseDescriptor).weights)
                dense.biases = vectorOf((descriptor as DenseDescriptor).biases)
                return dense
            case "leakyrelu":
                const leakyRelu = new LeakyRelu();
                leakyRelu.built = true
                leakyRelu.inputShape = descriptor.inputShape
                leakyRelu.outputShape = descriptor.outputShape
                return leakyRelu
            case "softmax":
                const softmax = new SoftMax()
                softmax.built = true
                softmax.inputShape = descriptor.inputShape
                softmax.outputShape = descriptor.outputShape
                return softmax
            default:
                throw Error(`Unknown layer type ${descriptor.layer}`)

        }
    })

    model = new Sequential(...layers)
    return model
}