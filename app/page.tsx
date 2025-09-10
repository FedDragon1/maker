"use client"

import React, { FC } from "react";
import Kaleido from "@/app/(homepage)/(projects)/Kaleido"
import MCFS from "@/app/(homepage)/(projects)/MCFS"

interface Props {
}

const Home: FC<Props> = () => {
  return (
      <>
        <MCFS/>
        <Kaleido/>
      </>
  )
}

export default Home
