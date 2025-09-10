import React, { forwardRef } from "react";

interface Props {
    children: React.ReactNode
}

const RefSvg = forwardRef<SVGSVGElement, Props>(({ children }, ref) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" ref={ref} className="hidden">
            {children}
        </svg>
    )
})

export default RefSvg