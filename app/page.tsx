"use client"

import React, { FC } from "react";
import Kaleido from "@/app/(homepage)/(projects)/Kaleido"
import MCFS from "@/app/(homepage)/(projects)/MCFS"
import DemoFrame from "@/app/(components)/DemoFrame";
import Flower from "@/app/(webgl)/Flower";
import BambooPage from "@/app/bamboo/page";

interface Props {
}

const Home: FC<Props> = () => {
  return (
      <>

          {/*<div className={"relative"}>*/}
          {/*    <BambooPage/>*/}
          {/*</div>*/}
          <Flower className={"flex-grow max-w-[100vh] anim-show bg-stone-300"}></Flower>
          <MCFS/>
          <Kaleido/>
      </>
  )
}

export default Home
