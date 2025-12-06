import React from "react";
import { BiLoaderAlt } from "react-icons/bi";

const Loader = () => {
  return (
    <div className="fixed bg-black bg-opacity-60 backdrop-blur-[2px] inset-0 w-full h-full z-50 flex flex-col justify-center items-center">
      <div className="animate-spin">
        <BiLoaderAlt className="text-white text-8xl sm:text-9xl" />
      </div>
    </div>
  );
};

export default Loader;
