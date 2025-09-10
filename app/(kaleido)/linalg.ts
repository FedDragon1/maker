// Why the fuck javascript doesn't have a good, easy-to-use linear algebra library???

type NotArray = (object | string | bigint | number | boolean) & { length?: never; };

/**
 * Check if all sub arrays in a 2d array are equal length
 *
 * @param lst
 */
export function rectangleList<T extends NotArray>(lst: T[][]): boolean {
    return lst.every(v => v.length === lst[0].length)
}

/**
 * Magic generating boilerplate for arithmetic operations
 *
 * @param self this reference to Matrix
 * @param fn
 */
function matOpMaker(self: Matrix, fn: (self: number, other: number) => number) {
    return (other: Matrix) => {
        if (!self.shapeMatches(other)) {
            throw TypeError(`Shape mismatch between ${self.data} and ${other.data}`)
        }
        const newData = self.data.map(
            (thisRow, rowIndex) => thisRow.map(
                (thisElement, colIndex) => fn(thisElement, other.data[rowIndex][colIndex])
            )
        )
        return new Matrix(newData)
    }
}

/**
 * Magic generating boilerplate for arithmetic operations (scalars)
 *
 * @param self this reference to Matrix
 * @param fn
 */
function matScalarOpMaker(self: Matrix, fn: (self: number, other: number) => number) {
    return (other: number) => {
        const newData = self.data.map(
            (thisRow) => thisRow.map(
                (thisElement) => fn(thisElement, other)
            )
        )
        return new Matrix(newData)
    }
}

/**
 * Helper function to create a column vector.
 * Simply wraps every element with a length-1 array and returns a matrix
 *
 * @param data
 */
export function vectorOf(data: number[]) {
    const matrixData = data.map(e => [e])
    return new Matrix(matrixData)
}

/**
 * Helper function to create a matrix, to avoid
 * ugly api difference between vector and matrix
 *
 * @param data
 */
export function matrixOf(data: number[][]) {
    return new Matrix(data)
}

export function randomMatrix(rows: number, cols: number) {
    const ret: number[][] = []
    for (let i = 0; i < rows; i++) {
        const temp = []
        for (let j = 0; j < cols; j++) {
            temp.push(Math.random())
        }
        ret.push(temp)
    }
    return matrixOf(ret)
}

export function zeroVector(count: number) {
    return vectorOf(Array(count).fill(0))
}

/**
 * A matrix object
 */
class Matrix {
    data: number[][]
    rows: number
    cols: number

    constructor(data: number[][]) {
        if (!rectangleList(data)) {
            throw TypeError(`data ${data} is not a rectangle array`)
        }
        this.data = data
        this.rows = data.length
        this.cols = data[0].length
    }

    /**
     * Check if other matrix has the same rows and columns
     *
     * @param other
     */
    shapeMatches(other: Matrix) {
        return other.rows === this.rows && other.cols === this.cols
    }

    /**
     * Check if the other matrix has a compatible shape for dot product
     *
     * @param other
     */
    dotable(other: Matrix) {
        return this.cols === other.rows
    }

    /**
     * If a matrix has only one column, assume it is a vector
     */
    isVector() {
        return this.cols === 1
    }

    /**
     * Checks whether this matrix is square
     */
    isSquareMatrix() {
        return this.cols === this.rows
    }

    max() {
        return Math.max(...this.data.flat())
    }

    min() {
        return Math.min(...this.data.flat())
    }

    sum() {
        return this.data.flat().reduce((a, b) => a + b, 0)
    }

    // matrix operations
    add = matOpMaker(this, (x, y) => x + y)
    sub = matOpMaker(this, (x, y) => x - y)
    mul = matOpMaker(this, (x, y) => x * y)
    div = matOpMaker(this, (x, y) => x / y)

    // scalar operations
    adds = matScalarOpMaker(this, (x, y) => x + y)
    subs = matScalarOpMaker(this, (x, y) => x - y)
    muls = matScalarOpMaker(this, (x, y) => x * y)
    divs = matScalarOpMaker(this, (x, y) => x / y)
    pows = matScalarOpMaker(this, (x, y) => x ** y)

    /**
     * Dot product of two column vectors
     * The dot product returns a number instead of 1x1 matrix
     *
     * @param other the other column vector
     */
    dot(other: Matrix) {
        if (this.isVector() && other.isVector() && this.rows === other.rows) {
            return this.data.flat()
                .map((thisElem, elemIndex) => thisElem * other.data[elemIndex][0])
                .reduce((x, y) => x + y)
        }

        throw TypeError("Not implemented. For matrices use `apply` instead")
    }

    /**
     * Dot product between two matrices (m, n), (n, p) -> (m, p)
     * See `dot` for 2 column vectors
     *
     * @param other the other matrix
     */
    apply(other: Matrix) {
        if (!this.dotable(other)) {
            throw TypeError(`Shape mismatch between ${this.data} and ${other.data}`)
        }

        const newData: number[][] = []
        for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
            newData[rowIndex] = []
            for (let colIndex = 0; colIndex < other.cols; colIndex++) {
                newData[rowIndex][colIndex] = this.data[rowIndex]
                    .map((thisElem, elemIndex) => thisElem * other.data[elemIndex][colIndex])
                    .reduce((a, b) => a + b)
            }
        }
        return new Matrix(newData)
    }

    /**
     * Cross product of two vectors
     * For 3d vectors, the return value is a 3d vector
     *
     * @param other
     */
    cross(other: Matrix) {
        if (!this.isVector() || !other.isVector()) {
            throw TypeError(`Cross product can only be possible between two vectors`)
        }
        if (this.rows !== other.rows) {
            throw TypeError(`Cross product can only be possible between two vectors with same dimension`)
        }
        if (this.rows === 3) {
            const newData = [
                this.data[1][0] * other.data[2][0] - this.data[2][0] * other.data[1][0],
                this.data[2][0] * other.data[0][0] - this.data[0][0] * other.data[2][0],
                this.data[0][0] * other.data[1][0] - this.data[1][0] * other.data[0][0]
            ]
            return vectorOf(newData)
        }
        throw TypeError(`Not implemented`)
    }

    /**
     * For 2d vectors, the return value is a number indicating magnitude
     *
     * @param other
     */
    cross2d(other: Matrix) {
        if (!this.isVector() || !other.isVector()) {
            throw TypeError(`Cross product can only be possible between two vectors`)
        }
        if (this.rows !== other.rows) {
            throw TypeError(`Cross product can only be possible between two vectors with same dimension`)
        }
        if (this.rows === 2) {
            return this.magnitude() * other.magnitude() * Math.sin(this.angle(other))
        }
        throw TypeError("Not implemented")
    }

    /**
     * Find the magnitude ||v|| of a vector
     */
    magnitude() {
        if (!this.isVector()) {
            throw TypeError(`Can only evaluate magnitude of a vector`)
        }
        return Math.sqrt(this.data.flat().map(x => x ** 2).reduce((x, y) => x + y))
    }

    /**
     * Find the angle between two vectors
     *
     * @param other
     */
    angle(other: Matrix) {
        if (!this.isVector() || !other.isVector()) {
            throw TypeError(`Can only evaluate angle between two vectors`)
        }
        if (this.rows !== other.rows) {
            throw TypeError(`Can only evaluate angle between two vectors with same dimension`)
        }
        return Math.acos(this.dot(other) as number / (this.magnitude() * other.magnitude()))
    }

    /**
     * Transpose of this matrix
     */
    transpose() {
        const newData: number[][] = []
        for (let col = 0; col < this.cols; col++) {
            // row for new data
            newData[col] = []
            for (let row = 0; row < this.rows; row++) {
                newData[col][row] = this.data[row][col]
            }
        }
        return new Matrix(newData)
    }

    /**
     * Returns a list of intermediary terms used when computing
     * determinant of 3x3 matrices
     *
     * Check current matrix is 3x3 before using this method
     *
     * https://en.wikipedia.org/wiki/Invertible_matrix
     */
    determinantIntermediaryTerms() {
        const [
            [a, b, c],
            [d, e, f],
            [g, h, i]
        ] = this.data
        const A = e * i - f * h,
            B = f * g - d * i,
            C = d * h - e * g,
            D = c * h - b * i,
            E = a * i - c * g,
            F = b * g - a * h,
            G = b * f - c * e,
            H = c * d - a * f,
            I = a * e - b * d
        return[A, B, C, D, E, F, G, H, I]
    }

    /**
     * Returns the determinant of this matrix.
     * Must be 2x2 or 3x3 matrix
     */
    determinant() {
        if (!this.isSquareMatrix()) {
            return 0;
        }
        if (this.rows === 2) {
            // 2x2 matrix -> ad - bc
            return this.data[0][0] * this.data[1][1] - this.data[0][1] * this.data[1][0]
        }
        if (this.rows === 3) {
            // 3x3 matrix -> aei + bfg + cdh - ceg - adi - afh
            return this.data[0][0] * this.data[1][1] * this.data[2][2]
                + this.data[0][1] * this.data[1][2] * this.data[2][0]
                + this.data[0][2] * this.data[1][0] * this.data[2][1]
                - this.data[0][2] * this.data[1][1] * this.data[2][0]
                - this.data[0][1] * this.data[1][0] * this.data[2][2]
                - this.data[0][0] * this.data[1][2] * this.data[2][1]
        }
        throw TypeError("Not Implemented")
    }

    inverse() {
        if (!this.isSquareMatrix()) {
            throw TypeError("Matrix must be square to have an inverse")
        }

        // put det in each branch to prevent overhead in 3x3
        if (this.rows === 2) {
            const det = this.determinant()
            if (det === 0) {
                throw TypeError("The matrix is singular")
            }
            // 2x2 -> 1/det * [[d, -b], [-c, a]]
            const newData = [
                [this.data[1][1], -this.data[0][1]],
                [-this.data[1][0], this.data[0][0]]
            ]
            return new Matrix(newData).muls(1 / det)
        }
        if (this.rows === 3) {
            // 3x3 -> 1/det * [[A D G], [B E H], [G H I]]
            const [A, B, C, D, E, F, G, H, I]
                = this.determinantIntermediaryTerms()

            // rule of Sarrus: det = aA + bB + cC
            const [a, b, c] = this.data[0]
            const det = a * A + b * B + c * C
            if (det === 0) {
                throw TypeError("The matrix is singular")
            }

            const newData = [[A, D, G], [B, E, H], [C, F, I]]
            return new Matrix(newData).muls(1 / det)
        }

        throw TypeError("Not implemented")
    }

    map(func: (entry: number) => number) {
        return matrixOf(this.data.map(row => row.map(func)))
    }

    toString() {
        return this.data
    }

    get [Symbol.toStringTag]() {
        return this.data;
    }
}

type Vector = Matrix
export type { Matrix, Vector };
