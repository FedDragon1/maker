export function runOnLoadAndResize(fn: () => void) {
    if (document.readyState === "complete") {
        window.addEventListener("resize", fn)
        fn()
    } else {
        setTimeout(() => runOnLoadAndResize(fn), 100)
    }

    return () => {
        window.removeEventListener("resize", fn)
    }
}

export function getCenter(id: string, parentWidth: number, parentHeight: number) {
    const dom = document.getElementById(id)!,
        { width, height } = dom.getBoundingClientRect(),
        left = parentWidth / 2 - width / 2,
        top = parentHeight / 2 - height / 2

    return {
        dom,
        left,
        top,
        width,
        height
    }
}